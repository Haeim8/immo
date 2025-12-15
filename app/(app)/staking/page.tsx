"use client";

import { motion } from "framer-motion";
import { Coins, Lock, TrendingUp, Wallet, ArrowUpRight, Loader2, Shield, Percent } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import Link from "next/link";
import { formatUnits } from "viem";
import { READER_ADDRESS } from "@/lib/evm/constants";
import { STAKING_ABI, VAULT_ABI, ERC20_ABI, READER_ABI } from "@/lib/evm/abis";
import { useTranslations } from "@/components/providers/IntlProvider";

function formatNumber(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toFixed(4);
}

export default function StakingPage() {
  const { address, isConnected } = useAccount();
  const stakingT = useTranslations("staking");
  const commonT = useTranslations("common");

  // Get all vaults from reader
  const { data: vaultsData, isLoading: loadingVaults } = useReadContract({
    address: READER_ADDRESS as `0x${string}`,
    abi: READER_ABI,
    functionName: 'getVaults',
    args: [BigInt(0), BigInt(100)],
  });

  const vaultList = (vaultsData as any[]) || [];

  // Fetch stakingContract for each vault to trouver le premier pool dispo
  const stakingContracts = useReadContracts({
    contracts: vaultList.map((v: any) => ({
      address: v.vaultAddress as `0x${string}`,
      abi: VAULT_ABI,
      functionName: "stakingContract" as const,
    })) as any,
    query: { enabled: vaultList.length > 0 },
  } as any) as { data?: any[]; isLoading: boolean };

  const firstStakingIndex = (stakingContracts.data || []).findIndex(
    (entry: any) => entry?.result && entry.result !== '0x0000000000000000000000000000000000000000'
  );
  const firstVault = firstStakingIndex >= 0 ? vaultList[firstStakingIndex] : undefined;
  const firstVaultAddress = firstVault?.vaultAddress as `0x${string}` | undefined;

  // Read staking address from first vault
  const { data: stakingAddress } = useReadContract({
    address: firstVaultAddress,
    abi: VAULT_ABI,
    functionName: 'stakingContract',
    query: { enabled: !!firstVaultAddress },
  });

  const hasStaking = stakingAddress && stakingAddress !== '0x0000000000000000000000000000000000000000';

  // Read staking contract data (only if staking exists)
  const { data: totalStaked, isLoading: loadingTotalStaked } = useReadContract({
    address: stakingAddress as `0x${string}`,
    abi: STAKING_ABI,
    functionName: 'totalStaked',
    query: { enabled: !!hasStaking },
  });

  // Read underlying token from vault
  const { data: underlyingToken } = useReadContract({
    address: firstVaultAddress,
    abi: VAULT_ABI,
    functionName: 'token',
    query: { enabled: !!firstVaultAddress },
  });

  // Read underlying token symbol
  const { data: tokenSymbol } = useReadContract({
    address: underlyingToken as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'symbol',
    query: { enabled: !!underlyingToken },
  });

  // Read user's stake position
  const { data: stakePosition } = useReadContract({
    address: stakingAddress as `0x${string}`,
    abi: STAKING_ABI,
    functionName: 'getStakePosition',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!hasStaking },
  });

  // Read user's pending rewards
  const { data: pendingRewards } = useReadContract({
    address: stakingAddress as `0x${string}`,
    abi: STAKING_ABI,
    functionName: 'getPendingRewards',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!hasStaking },
  });

  // Parse values
  const totalStakedAmount = totalStaked ? parseFloat(formatUnits(totalStaked as bigint, 18)) : 0;
  const userStakedAmount = stakePosition ? parseFloat(formatUnits((stakePosition as any).amount, 18)) : 0;
  const userPendingRewards = pendingRewards ? parseFloat(formatUnits(pendingRewards as bigint, 18)) : 0;
  const hasPosition = userStakedAmount > 0;
  const symbol = (tokenSymbol as string) || 'USDC';

  const isLoading = loadingVaults || loadingTotalStaked || stakingContracts.isLoading;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{stakingT("loading") || "Loading staking..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 py-6 md:py-8">
      <div className="container-app space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 bg-success/10 text-success border border-success/20">
            <TrendingUp className="w-3 h-3" />
            {stakingT("liveEarning") || "EARNING REWARDS"}
          </div>

          <h1 className="mb-3">
            Stake CVT & <span className="text-primary">{stakingT("earn") || "Earn"}</span>
          </h1>

          <p className="text-muted-foreground max-w-xl mx-auto">
            Stake your CVT tokens to earn {symbol} rewards from protocol fees.
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"
        >
          <div className="card-position has-position p-4 md:p-5">
            <div className="flex items-center gap-2 text-primary mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">{stakingT("totalStaked") || "Total Staked"}</span>
            </div>
            <div className="stat-value">{formatNumber(totalStakedAmount)} CVT</div>
            <p className="text-xs text-muted-foreground mt-1">{hasStaking ? "1 pool" : "0 pools"}</p>
          </div>

          <div className="card-vault p-4 md:p-5">
            <div className="flex items-center gap-2 text-success mb-2">
              <Percent className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Reward Token</span>
            </div>
            <div className="stat-value">{symbol}</div>
            <p className="text-xs text-muted-foreground mt-1">From protocol fees</p>
          </div>

          {isConnected ? (
            <>
              <div className="card-vault p-4 md:p-5">
                <div className="flex items-center gap-2 text-accent mb-2">
                  <Wallet className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">{stakingT("yourStake") || "Your Stake"}</span>
                </div>
                <div className="stat-value">{formatNumber(userStakedAmount)} CVT</div>
                <p className="text-xs text-muted-foreground mt-1">{hasPosition ? "Active" : "No position"}</p>
              </div>

              <div className="card-vault p-4 md:p-5 border-success/20 bg-success/5">
                <div className="flex items-center gap-2 text-success mb-2">
                  <Coins className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">{stakingT("pendingRewards") || "Pending"}</span>
                </div>
                <div className="stat-value text-success">+{formatNumber(userPendingRewards)} {symbol}</div>
                <p className="text-xs text-muted-foreground mt-1">{stakingT("claimable") || "Claimable"}</p>
              </div>
            </>
          ) : (
            <>
              <div className="card-vault p-4 md:p-5">
                <div className="flex items-center gap-2 text-accent mb-2">
                  <Lock className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">{stakingT("noLock") || "No Lock"}</span>
                </div>
                <div className="stat-value">{stakingT("flexible") || "Flexible"}</div>
                <p className="text-xs text-muted-foreground mt-1">{stakingT("withdrawAnytime") || "Withdraw anytime"}</p>
              </div>

              <div className="card-vault p-4 md:p-5">
                <div className="flex items-center gap-2 text-warning mb-2">
                  <Shield className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">{stakingT("secured") || "Secured"}</span>
                </div>
                <div className="stat-value">{stakingT("audited") || "Audited"}</div>
                <p className="text-xs text-muted-foreground mt-1">{stakingT("verified") || "Contracts verified"}</p>
              </div>
            </>
          )}
        </motion.div>

        {/* Connect Wallet CTA if not connected */}
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-vault p-8 flex flex-col items-center justify-center border-primary/20 relative z-10"
          >
            <Wallet className="w-10 h-10 mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2 text-center">{stakingT("connectTitle") || "Connect Wallet"}</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-sm">
              {stakingT("connectDescription") || "Connect your wallet to stake CVT and earn rewards."}
            </p>
            <ConnectButton.Custom>
              {({ account, chain, openConnectModal, mounted }) => {
                const ready = mounted;
                const connected = ready && account && chain;
                return (
                  <div className={!ready ? 'opacity-0 pointer-events-none' : 'relative z-20'}>
                    {!connected && (
                      <button
                        onClick={openConnectModal}
                        className="btn-primary text-sm relative z-30"
                      >
                        <Wallet className="w-4 h-4" />
                        {commonT("connectWallet") || "Connect Wallet"}
                      </button>
                    )}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </motion.div>
        )}

        {/* Single Staking Pool Card - only show if staking exists */}
        {hasStaking ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2>{stakingT("availablePools") || "CVT Staking Pool"}</h2>
              <span className="text-sm text-muted-foreground">1 {stakingT("active") || "active"}</span>
            </div>

            <Link href="/staking/cvt">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`card-vault group ${hasPosition ? 'border-primary/30' : ''}`}
              >
                <div className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="token-icon-lg bg-primary/20 text-primary font-bold">
                        CVT
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            Stake CVT → Earn {symbol}
                          </h3>
                          {hasPosition && (
                            <span className="badge-success text-[10px]">{stakingT("active") || "Active"}</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Earn {symbol} rewards from protocol fees
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 text-center md:text-right">
                      <div>
                        <div className="text-xs text-muted-foreground uppercase mb-1">Total Staked</div>
                        <div className="text-lg font-bold text-foreground">{formatNumber(totalStakedAmount)} CVT</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase mb-1">Reward Token</div>
                        <div className="text-lg font-bold text-success">{symbol}</div>
                      </div>
                      {hasPosition && (
                        <div className="hidden md:block">
                          <div className="text-xs text-muted-foreground uppercase mb-1">{stakingT("yourStake") || "Your Stake"}</div>
                          <div className="text-lg font-bold text-primary">{formatNumber(userStakedAmount)} CVT</div>
                        </div>
                      )}
                    </div>

                    <button className="btn-primary whitespace-nowrap">
                      <ArrowUpRight className="w-4 h-4" />
                      {hasPosition ? (stakingT("manage") || 'Manage') : (stakingT("stake") || 'Stake')}
                    </button>
                  </div>
                </div>
              </motion.div>
            </Link>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card-vault p-8 text-center"
          >
            <Coins className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">{stakingT("noPoolAvailable") || "No Staking Pool Available"}</h3>
            <p className="text-muted-foreground text-sm">
              {stakingT("noPoolDescription") || "No vaults with staking are available yet."}
            </p>
          </motion.div>
        )}

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="card-vault p-5">
            <TrendingUp className="w-6 h-6 text-primary mb-3" />
            <h4 className="font-semibold mb-2">Earn Protocol Fees</h4>
            <p className="text-sm text-muted-foreground">
              Stake CVT tokens to receive a share of protocol borrowing fees.
            </p>
          </div>

          <div className="card-vault p-5">
            <Shield className="w-6 h-6 text-accent mb-3" />
            <h4 className="font-semibold mb-2">{stakingT("collateralized") || "Collateralized"}</h4>
            <p className="text-sm text-muted-foreground">
              {stakingT("collateralizedDesc") || "Your staked CVT backs protocol liquidity."}
            </p>
          </div>

          <div className="card-vault p-5">
            <Lock className="w-6 h-6 text-success mb-3" />
            <h4 className="font-semibold mb-2">{stakingT("flexible") || "Flexible"}</h4>
            <p className="text-sm text-muted-foreground">
              {stakingT("flexibleDesc") || "No lock-up periods. Withdraw anytime subject to liquidity."}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
