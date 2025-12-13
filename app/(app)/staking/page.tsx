"use client";

import { motion } from "framer-motion";
import { Coins, Lock, TrendingUp, Wallet, ArrowUpRight, Loader2, Shield, Percent } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import Link from "next/link";
import Image from "next/image";
import { useAllVaults, useProtocolTotals, useUserPositions, VaultData } from "@/lib/evm/hooks";
import { useTranslations } from "@/components/providers/IntlProvider";

function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
  return `$${num.toFixed(2)}`;
}

// Token icon with fallback
function TokenIcon({ symbol }: { symbol: string }) {
  const tokenLogos: Record<string, string> = {
    USDC: "/usc.png",
    USDT: "/usdt.jpg",
    ETH: "/eth white.png",
    WETH: "/eth white.png",
    WBTC: "/btc.png",
    BTC: "/btc.png",
  };

  const logoPath = tokenLogos[symbol.toUpperCase()];

  if (logoPath) {
    return (
      <div className="token-icon-lg overflow-hidden">
        <Image src={logoPath} alt={symbol} width={40} height={40} className="w-full h-full object-contain" />
      </div>
    );
  }

  return (
    <div className="token-icon-lg">
      {symbol.slice(0, 2).toUpperCase()}
    </div>
  );
}

function StakingVaultCard({ vault, userSupplied, index }: { vault: VaultData; userSupplied: string; index: number }) {
  const hasPosition = parseFloat(userSupplied) > 0;
  const stakingT = useTranslations("staking");

  return (
    <Link href={`/staking/${vault.vaultId}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className={`card-vault group ${hasPosition ? 'border-primary/30' : ''}`}
      >
        <div className="p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <TokenIcon symbol={vault.tokenSymbol} />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {stakingT("stakeCVT") || "Stake CVT"} → {vault.tokenSymbol}
                  </h3>
                  {hasPosition && (
                    <span className="badge-success text-[10px]">{stakingT("active") || "Active"}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{stakingT("earnRewards") || "Earn"} {vault.tokenSymbol} • Vault #{vault.vaultId}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-4 gap-4 md:gap-6 text-center md:text-right">
              <div>
                <div className="text-xs text-muted-foreground uppercase mb-1">{stakingT("supplyAPY") || "Supply APY"}</div>
                <div className="text-lg font-bold text-success">{vault.supplyRate.toFixed(2)}%</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase mb-1">{stakingT("tvl") || "TVL"}</div>
                <div className="text-lg font-bold text-foreground">{formatCurrency(vault.totalSupplied)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase mb-1">{stakingT("utilization") || "Util."}</div>
                <div className="text-lg font-bold text-accent">{vault.utilizationRate.toFixed(1)}%</div>
              </div>
              {hasPosition && (
                <div className="hidden md:block">
                  <div className="text-xs text-muted-foreground uppercase mb-1">{stakingT("yourStake") || "Your Stake"}</div>
                  <div className="text-lg font-bold text-primary">{formatCurrency(userSupplied)}</div>
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
  );
}

export default function StakingPage() {
  const { address, isConnected } = useAccount();
  const { vaults, isLoading: loadingVaults } = useAllVaults();
  const { positions, totals } = useUserPositions(address);
  const { totalTVL, vaultCount } = useProtocolTotals();
  const stakingT = useTranslations("staking");
  const commonT = useTranslations("common");

  // Calculate average APY
  const avgApy = vaults.length > 0
    ? vaults.reduce((sum, v) => sum + v.supplyRate, 0) / vaults.length
    : 0;

  // Get user's supplied amount for each vault
  const getUserSupplied = (vaultId: number): string => {
    const position = positions.find(p => p.vaultId === vaultId);
    return position?.supplied || '0';
  };

  if (loadingVaults) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{stakingT("loading") || "Loading staking pools..."}</p>
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
            {stakingT("title") || "Stake"} & <span className="text-primary">{stakingT("earn") || "Earn"}</span>
          </h1>

          <p className="text-muted-foreground max-w-xl mx-auto">
            {stakingT("subtitle") || "Supply your assets to lending vaults and earn passive yield. Withdraw anytime."}
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
            <div className="stat-value">{formatCurrency(totalTVL)}</div>
            <p className="text-xs text-muted-foreground mt-1">{vaultCount} vaults</p>
          </div>

          <div className="card-vault p-4 md:p-5">
            <div className="flex items-center gap-2 text-success mb-2">
              <Percent className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">{stakingT("avgAPY") || "Avg. APY"}</span>
            </div>
            <div className="stat-value">{avgApy.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground mt-1">{stakingT("variableRate") || "Variable rate"}</p>
          </div>

          {isConnected ? (
            <>
              <div className="card-vault p-4 md:p-5">
                <div className="flex items-center gap-2 text-accent mb-2">
                  <Wallet className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">{stakingT("yourStake") || "Your Stake"}</span>
                </div>
                <div className="stat-value">{formatCurrency(totals.totalSupplied)}</div>
                <p className="text-xs text-muted-foreground mt-1">{positions.length} {stakingT("positions") || "positions"}</p>
              </div>

              <div className="card-vault p-4 md:p-5 border-success/20 bg-success/5">
                <div className="flex items-center gap-2 text-success mb-2">
                  <Coins className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">{stakingT("pendingRewards") || "Pending"}</span>
                </div>
                <div className="stat-value text-success">+{formatCurrency(totals.totalInterestPending)}</div>
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
            <h3 className="text-lg font-semibold mb-2 text-center">{stakingT("connectTitle")}</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-sm">
              {stakingT("connectDescription")}
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
                        {commonT("connectWallet")}
                      </button>
                    )}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </motion.div>
        )}

        {/* Staking Pools */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2>{stakingT("availablePools") || "Available Pools"}</h2>
            <span className="text-sm text-muted-foreground">
              {vaults.filter(v => v.isActive).length} {stakingT("active") || "active"}
            </span>
          </div>

          {vaults.length === 0 ? (
            <div className="card-vault p-12 text-center">
              <Coins className="w-10 h-10 mx-auto mb-4 text-muted-foreground/30" />
              <p className="font-medium mb-2">{stakingT("noPools") || "No pools available yet"}</p>
              <p className="text-sm text-muted-foreground">
                {stakingT("noPoolsDesc") || "New staking pools will be added soon."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {vaults
                .filter(v => v.isActive)
                .map((vault, index) => (
                  <StakingVaultCard
                    key={vault.vaultAddress}
                    vault={vault}
                    userSupplied={getUserSupplied(vault.vaultId)}
                    index={index}
                  />
                ))}
            </div>
          )}
        </motion.div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="card-vault p-5">
            <TrendingUp className="w-6 h-6 text-primary mb-3" />
            <h4 className="font-semibold mb-2">{stakingT("earnYield") || "Earn Yield"}</h4>
            <p className="text-sm text-muted-foreground">
              {stakingT("earnYieldDesc") || "Supply assets to earn interest from borrowers."}
            </p>
          </div>

          <div className="card-vault p-5">
            <Shield className="w-6 h-6 text-accent mb-3" />
            <h4 className="font-semibold mb-2">{stakingT("collateralized") || "Collateralized"}</h4>
            <p className="text-sm text-muted-foreground">
              {stakingT("collateralizedDesc") || "All loans are over-collateralized and liquidatable."}
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
