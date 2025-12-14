"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, ArrowLeft, Wallet,
  ExternalLink, Coins, Lock, Shield, Clock, Percent
} from "lucide-react";
import { useAccount, useBalance, useReadContract } from "wagmi";
import Link from "next/link";
import { formatUnits, parseUnits } from "viem";
import { BLOCK_EXPLORER_URL } from "@/lib/evm/hooks";
import { useStakeCVT, useUnstakeCVT, useClaimStakingRewards, useApproveToken } from "@/lib/evm/write-hooks.js";
import { CVT_TOKEN_ADDRESS, READER_ADDRESS } from "@/lib/evm/constants";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useTranslations } from "@/components/providers/IntlProvider";
import { useToast } from "@/components/ui/toast-notification";
import { STAKING_ABI, VAULT_ABI, ERC20_ABI, READER_ABI } from "@/lib/evm/abis";

function formatNumber(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toFixed(4);
}

// Circular Progress for staking
function StakingProgress({ percent, size = 120 }: { percent: number; size?: number }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${(percent / 100) * circumference} ${circumference}`;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" style={{ width: size, height: size }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-secondary"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          className="text-primary"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{percent.toFixed(0)}%</span>
        <span className="text-xs text-muted-foreground">staked</span>
      </div>
    </div>
  );
}

// Info Row Component
function InfoRow({ label, value, valueColor, icon }: { label: string; value: string; valueColor?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/30 last:border-b-0">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <span className={`text-sm font-medium ${valueColor || 'text-foreground'}`}>{value}</span>
    </div>
  );
}

// Stat Card
function StatCard({ icon, label, value, subValue, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  color?: string;
}) {
  return (
    <div className="bg-secondary/30 rounded-xl p-4">
      <div className={`flex items-center gap-2 mb-2 ${color || 'text-muted-foreground'}`}>
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-xl font-bold">{value}</div>
      {subValue && <p className="text-xs text-muted-foreground mt-1">{subValue}</p>}
    </div>
  );
}

export default function CVTStakingPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const stakingT = useTranslations("staking");
  const commonT = useTranslations("common");
  const { showToast } = useToast();

  // Get all vaults from reader
  const { data: vaultsData, isLoading: loadingVaults } = useReadContract({
    address: READER_ADDRESS as `0x${string}`,
    abi: READER_ABI,
    functionName: 'getVaults',
    args: [BigInt(0), BigInt(100)],
  });

  // Get first vault's staking contract
  const firstVault = (vaultsData as any[])?.[0];
  const vaultAddress = firstVault?.vaultAddress as `0x${string}` | undefined;

  // Read staking address from vault
  const { data: stakingAddressData } = useReadContract({
    address: vaultAddress,
    abi: VAULT_ABI,
    functionName: 'stakingContract',
    query: { enabled: !!vaultAddress },
  });

  const stakingAddress = stakingAddressData as `0x${string}` | undefined;
  const hasStaking = stakingAddress && stakingAddress !== '0x0000000000000000000000000000000000000000';

  // Read staking contract data
  const { data: totalStaked, isLoading: loadingTotalStaked } = useReadContract({
    address: stakingAddress,
    abi: STAKING_ABI,
    functionName: 'totalStaked',
    query: { enabled: !!hasStaking },
  });

  const { data: cvtTokenAddress } = useReadContract({
    address: stakingAddress,
    abi: STAKING_ABI,
    functionName: 'cvtToken',
    query: { enabled: !!hasStaking },
  });

  // Read vault info (to get underlying token)
  const { data: underlyingToken } = useReadContract({
    address: vaultAddress,
    abi: VAULT_ABI,
    functionName: 'token',
    query: { enabled: !!vaultAddress },
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
    address: stakingAddress,
    abi: STAKING_ABI,
    functionName: 'getStakePosition',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!hasStaking },
  });

  // Read user's pending rewards
  const { data: pendingRewardsData } = useReadContract({
    address: stakingAddress,
    abi: STAKING_ABI,
    functionName: 'getPendingRewards',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!hasStaking },
  });

  // Read if lock expired
  const { data: lockExpired } = useReadContract({
    address: stakingAddress,
    abi: STAKING_ABI,
    functionName: 'isLockExpired',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!hasStaking },
  });

  // Fetch CVT token balance from wallet
  const { data: cvtBalance } = useBalance({
    address: address,
    token: (cvtTokenAddress as `0x${string}`) || CVT_TOKEN_ADDRESS,
    query: {
      enabled: isConnected && !!address,
    },
  });

  // Staking hooks (use stakingAddress if available, otherwise empty address)
  const safeStakingAddress = (hasStaking ? stakingAddress : '0x0000000000000000000000000000000000000000') as `0x${string}`;
  const { stake, isPending: isStakePending, error: stakeError, isSuccess: stakeSuccess } = useStakeCVT(safeStakingAddress);
  const { unstake, isPending: isUnstakePending, error: unstakeError, isSuccess: unstakeSuccess } = useUnstakeCVT(safeStakingAddress);
  const { claimRewards, isPending: isClaimPending, error: claimError, isSuccess: claimSuccess } = useClaimStakingRewards(safeStakingAddress);
  const { approve, isPending: isApprovePending, error: approveError, isSuccess: approveSuccess } = useApproveToken((cvtTokenAddress as `0x${string}`) || CVT_TOKEN_ADDRESS);

  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState<'stake' | 'unstake'>('stake');
  const [pendingApprove, setPendingApprove] = useState(false);

  // Parse values
  const totalStakedAmount = totalStaked ? parseFloat(formatUnits(totalStaked as bigint, 18)) : 0;
  const cvtWalletBalance = cvtBalance ? parseFloat(formatUnits(cvtBalance.value, 18)) : 0;
  const userStaked = stakePosition ? parseFloat(formatUnits((stakePosition as any).amount, 18)) : 0;
  const userRewards = pendingRewardsData ? parseFloat(formatUnits(pendingRewardsData as bigint, 18)) : 0;
  const canUnstake = lockExpired === true;
  const rewardSymbol = (tokenSymbol as string) || 'USDC';

  // Toast pour erreurs
  useEffect(() => {
    if (stakeError) showToast({ type: 'error', title: 'Erreur Stake', message: stakeError.message?.slice(0, 100) });
    if (unstakeError) showToast({ type: 'error', title: 'Erreur Unstake', message: unstakeError.message?.slice(0, 100) });
    if (claimError) showToast({ type: 'error', title: 'Erreur Claim', message: claimError.message?.slice(0, 100) });
    if (approveError) showToast({ type: 'error', title: 'Erreur Approve', message: approveError.message?.slice(0, 100) });
  }, [stakeError, unstakeError, claimError, approveError, showToast]);

  // Toast pour succès
  useEffect(() => {
    if (stakeSuccess) showToast({ type: 'success', title: 'Stake réussi!' });
    if (unstakeSuccess) showToast({ type: 'success', title: 'Unstake réussi!' });
    if (claimSuccess) showToast({ type: 'success', title: 'Rewards réclamés!' });
  }, [stakeSuccess, unstakeSuccess, claimSuccess, showToast]);

  // Quand approve réussit, lancer le stake
  useEffect(() => {
    if (approveSuccess && pendingApprove) {
      const numericAmount = parseFloat(amount);
      if (numericAmount > 0) {
        stake(amount, 0);
      }
      setPendingApprove(false);
    }
  }, [approveSuccess, pendingApprove, amount, stake]);

  const isLoading = loadingVaults || loadingTotalStaked;

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

  // No staking contract deployed yet
  if (!hasStaking) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Coins className="w-12 h-12 mx-auto text-muted-foreground/30" />
          <p className="text-lg font-semibold">No Staking Pool Available</p>
          <p className="text-sm text-muted-foreground">
            {vaultAddress ? "No staking contract deployed for this vault yet." : "No vaults found."}
          </p>
          <button onClick={() => router.push('/vaults')} className="btn-primary">
            <ArrowLeft className="w-4 h-4" />
            Back to Vaults
          </button>
        </div>
      </div>
    );
  }

  // Check if user has sufficient balance for stake operations
  const numericAmount = parseFloat(amount) || 0;
  const hasInsufficientBalance = mode === 'stake' && numericAmount > cvtWalletBalance;
  const hasInsufficientStake = mode === 'unstake' && numericAmount > userStaked;
  const isActionDisabled = !amount || numericAmount <= 0 || hasInsufficientBalance || hasInsufficientStake;
  const actionLoading = isStakePending || isUnstakePending || isClaimPending || isApprovePending;

  const handleMaxClick = () => {
    if (mode === 'stake') {
      setAmount(cvtWalletBalance > 0 ? cvtWalletBalance.toFixed(4) : '0');
    } else {
      setAmount(userStaked > 0 ? userStaked.toFixed(4) : '0');
    }
  };

  const handleStakeAction = () => {
    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      showToast({ type: 'error', title: 'Montant invalide' });
      return;
    }

    if (mode === 'stake') {
      if (numericAmount > cvtWalletBalance) {
        showToast({ type: 'error', title: 'Solde CVT insuffisant', message: `Vous avez ${formatNumber(cvtWalletBalance)} CVT` });
        return;
      }
      const amountBN = parseUnits(amount, 18);
      setPendingApprove(true);
      approve(stakingAddress, amountBN);
    } else {
      if (!canUnstake) {
        showToast({ type: 'error', title: 'Lock non expiré', message: 'Attendez la fin du lock pour unstake' });
        return;
      }
      unstake();
    }
  };

  const handleClaimRewards = () => {
    if (userRewards <= 0) {
      showToast({ type: 'error', title: 'Pas de rewards', message: 'Aucun reward à réclamer' });
      return;
    }
    claimRewards();
  };

  return (
    <div className="flex-1 py-6">
      <div className="container-app">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => router.push('/staking')}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border/50 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {stakingT("backToPools") || "Back to staking"}
          </button>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-center mb-8"
        >
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-2xl">
              CVT
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">
              Stake CVT → Earn {rewardSymbol}
            </h1>
            <Link
              href={`${BLOCK_EXPLORER_URL}/address/${stakingAddress}`}
              target="_blank"
              className="p-1.5 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </Link>
          </div>
          <p className="text-muted-foreground">
            Stake your CVT tokens to earn {rewardSymbol} rewards from protocol fees
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-success/20 text-success">
              Active
            </span>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Pool Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Pool Stats */}
            <div className="card-vault p-6">
              <h3 className="text-lg font-semibold mb-4">{stakingT("poolStats") || "Staking Statistics"}</h3>

              <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
                <StakingProgress percent={userStaked > 0 ? (userStaked / totalStakedAmount) * 100 : 0} />
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <StatCard
                    icon={<Coins className="w-4 h-4" />}
                    label="Total Staked"
                    value={`${formatNumber(totalStakedAmount)} CVT`}
                    color="text-primary"
                  />
                  <StatCard
                    icon={<Percent className="w-4 h-4" />}
                    label="Reward Token"
                    value={rewardSymbol}
                    subValue="From protocol fees"
                    color="text-success"
                  />
                  <StatCard
                    icon={<Wallet className="w-4 h-4" />}
                    label="Your CVT Balance"
                    value={`${formatNumber(cvtWalletBalance)} CVT`}
                    subValue="Available to stake"
                    color="text-accent"
                  />
                  <StatCard
                    icon={<Shield className="w-4 h-4" />}
                    label="Your Staked"
                    value={`${formatNumber(userStaked)} CVT`}
                    subValue={userStaked > 0 ? "Active" : "No position"}
                    color="text-muted-foreground"
                  />
                </div>
              </div>

              {/* Pool Details */}
              <div className="border-t border-border/50 pt-4">
                <InfoRow
                  icon={<Lock className="w-4 h-4" />}
                  label={stakingT("lockPeriod") || "Lock Period"}
                  value={stakingT("none") || "None"}
                  valueColor="text-success"
                />
                <InfoRow
                  icon={<Clock className="w-4 h-4" />}
                  label={stakingT("withdrawalTime") || "Withdrawal Time"}
                  value={stakingT("instant") || "Instant"}
                  valueColor="text-success"
                />
                <InfoRow
                  icon={<Percent className="w-4 h-4" />}
                  label={stakingT("stakingFee") || "Staking Fee"}
                  value="0%"
                />
              </div>
            </div>

            {/* Your Position (if connected and has position) */}
            {isConnected && userStaked > 0 && (
              <div className="card-vault p-6 border-primary/30 bg-primary/5">
                <div className="flex items-center gap-2 mb-4">
                  <Wallet className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">{stakingT("yourPosition") || "Your Position"}</h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-card/60 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">{stakingT("staked") || "Staked"}</p>
                    <p className="text-xl font-bold text-primary">{formatNumber(userStaked)}</p>
                    <p className="text-xs text-muted-foreground">CVT</p>
                  </div>
                  <div className="bg-card/60 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">{stakingT("pendingRewards") || "Rewards"}</p>
                    <p className="text-xl font-bold text-success">+{formatNumber(userRewards)}</p>
                    <p className="text-xs text-muted-foreground">{rewardSymbol}</p>
                  </div>
                  <div className="bg-card/60 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Can Unstake</p>
                    <p className={`text-xl font-bold ${canUnstake ? 'text-success' : 'text-warning'}`}>
                      {canUnstake ? 'Yes' : 'Locked'}
                    </p>
                    <p className="text-xs text-muted-foreground">{canUnstake ? 'Ready' : 'Wait for unlock'}</p>
                  </div>
                </div>

                {userRewards > 0 && (
                  <button
                    onClick={handleClaimRewards}
                    disabled={actionLoading}
                    className="btn-primary w-full mt-4 bg-success hover:bg-success/90"
                  >
                    <Coins className="w-4 h-4" />
                    {actionLoading ? 'Transaction...' : `Claim ${formatNumber(userRewards)} ${rewardSymbol}`}
                  </button>
                )}
              </div>
            )}

            {/* How it works */}
            <div className="card-vault p-6">
              <h3 className="text-lg font-semibold mb-4">{stakingT("howItWorks") || "How CVT Staking Works"}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Get CVT</h4>
                    <p className="text-sm text-muted-foreground">
                      Supply tokens to a vault to receive CVT tokens
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center text-success font-bold shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Stake CVT</h4>
                    <p className="text-sm text-muted-foreground">
                      Stake your CVT tokens in this pool
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Earn Rewards</h4>
                    <p className="text-sm text-muted-foreground">
                      Earn {rewardSymbol} from protocol borrowing fees
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Action Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="card-vault p-5 sticky top-24">
              {/* Mode Toggle */}
              <div className="flex items-center p-1 rounded-lg bg-secondary/50 border border-border/50 w-full mb-5">
                <button
                  type="button"
                  onClick={() => setMode('stake')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    mode === 'stake'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {stakingT("stake") || "Stake"}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('unstake')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    mode === 'unstake'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {stakingT("unstake") || "Unstake"}
                </button>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {isConnected ? (
                    <>
                      {/* Token Display */}
                      <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs">
                            CVT
                          </div>
                          <span className="font-medium">CVT Token</span>
                        </div>
                        <span className="font-bold text-success">
                          Earn {rewardSymbol}
                        </span>
                      </div>

                      {/* Amount Input */}
                      <div className="bg-secondary/30 border border-border/50 rounded-xl p-4 mb-4">
                        <div className="mb-2">
                          <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0"
                            className="bg-transparent text-2xl font-bold text-foreground w-full outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            CVT
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={`text-muted-foreground ${(hasInsufficientBalance || hasInsufficientStake) ? 'text-destructive' : ''}`}>
                              {mode === 'stake' ? 'Balance:' : 'Staked:'} {mode === 'stake' ? formatNumber(cvtWalletBalance) : formatNumber(userStaked)}
                            </span>
                            <button
                              type="button"
                              onClick={handleMaxClick}
                              className="text-primary font-medium hover:underline cursor-pointer"
                            >
                              MAX
                            </button>
                          </div>
                        </div>
                        {hasInsufficientBalance && (
                          <p className="text-xs text-destructive mt-2">
                            Solde insuffisant ({formatNumber(cvtWalletBalance)} CVT disponible)
                          </p>
                        )}
                        {hasInsufficientStake && (
                          <p className="text-xs text-destructive mt-2">
                            Stake insuffisant ({formatNumber(userStaked)} CVT en stake)
                          </p>
                        )}
                      </div>

                      {/* Transaction Preview */}
                      {amount && parseFloat(amount) > 0 && (
                        <div className="bg-secondary/20 rounded-lg p-3 mb-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              You will {mode === 'stake' ? 'stake' : 'unstake'}
                            </span>
                            <span className="font-medium">{amount} CVT</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Fee</span>
                            <span className="font-medium text-success">Free</span>
                          </div>
                        </div>
                      )}

                      {/* Action Button */}
                      <button
                        type="button"
                        onClick={handleStakeAction}
                        disabled={isActionDisabled || actionLoading}
                        className={`w-full py-3 rounded-xl font-semibold transition-all cursor-pointer ${
                          !isActionDisabled && !actionLoading
                            ? mode === 'stake'
                              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                              : 'bg-accent text-white hover:bg-accent/90'
                            : 'bg-secondary text-muted-foreground cursor-not-allowed'
                        }`}
                      >
                        {actionLoading
                          ? 'Transaction...'
                          : hasInsufficientBalance
                            ? 'Solde insuffisant'
                            : hasInsufficientStake
                              ? 'Stake insuffisant'
                              : mode === 'stake'
                                ? 'Stake CVT'
                                : 'Unstake CVT'
                        }
                      </button>

                      {/* Claim Rewards Button */}
                      {userRewards > 0 && (
                        <button
                          type="button"
                          onClick={handleClaimRewards}
                          disabled={actionLoading}
                          className={`w-full py-3 rounded-xl font-semibold transition-all cursor-pointer mt-2 ${
                            actionLoading
                              ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                              : 'bg-success text-white hover:bg-success/90'
                          }`}
                        >
                          {actionLoading ? 'Transaction...' : `Claim ${formatNumber(userRewards)} ${rewardSymbol}`}
                        </button>
                      )}

                      {/* Pool Info */}
                      <div className="mt-5 pt-5 border-t border-border/50 space-y-1">
                        <InfoRow
                          label={stakingT("yourStake") || "Your stake"}
                          value={`${formatNumber(userStaked)} CVT`}
                        />
                        <InfoRow
                          label={stakingT("pendingRewards") || "Pending rewards"}
                          value={`+${formatNumber(userRewards)} ${rewardSymbol}`}
                          valueColor="text-success"
                        />
                        <InfoRow
                          label="Total Staked"
                          value={`${formatNumber(totalStakedAmount)} CVT`}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <Wallet className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">
                        {stakingT("connectToStake") || "Connect your wallet to stake CVT"}
                      </p>
                      <ConnectButton.Custom>
                        {({ openConnectModal, mounted }) => {
                          const ready = mounted;
                          return (
                            <div className={!ready ? 'opacity-0 pointer-events-none' : ''}>
                              <button
                                type="button"
                                onClick={openConnectModal}
                                className="btn-primary w-full cursor-pointer"
                              >
                                <Wallet className="w-4 h-4" />
                                {commonT("connectWallet") || "Connect Wallet"}
                              </button>
                            </div>
                          );
                        }}
                      </ConnectButton.Custom>

                      {/* Info when not connected */}
                      <div className="mt-6 pt-5 border-t border-border/50 space-y-1 text-left">
                        <InfoRow label="Total Staked" value={`${formatNumber(totalStakedAmount)} CVT`} />
                        <InfoRow label="Reward Token" value={rewardSymbol} valueColor="text-success" />
                        <InfoRow label={stakingT("lockPeriod") || "Lock period"} value={stakingT("none") || "None"} valueColor="text-success" />
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
