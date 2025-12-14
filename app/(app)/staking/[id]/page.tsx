"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, ArrowLeft, TrendingUp, Wallet,
  ExternalLink, Coins, Lock, Shield, Clock, Percent
} from "lucide-react";
import { useAccount, useBalance } from "wagmi";
import Image from "next/image";
import Link from "next/link";
import { formatUnits, parseUnits } from "viem";
import { useAllVaults, useUserPositions, VaultData, BLOCK_EXPLORER_URL } from "@/lib/evm/hooks";
import { useStakeCVT, useUnstakeCVT, useClaimStakingRewards, useApproveToken } from "@/lib/evm/write-hooks.js";
import { STAKING_ADDRESS } from "@/lib/evm/constants";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useTranslations } from "@/components/providers/IntlProvider";
import { useToast } from "@/components/ui/toast-notification";
import { useReadContract } from "wagmi";
import { STAKING_ABI } from "@/lib/evm/abis";

const tokenLogos: Record<string, string> = {
  USDC: "/usc.png",
  USDT: "/usdt.jpg",
  ETH: "/eth white.png",
  WETH: "/eth white.png",
  WBTC: "/btc.png",
  BTC: "/btc.png",
};

function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
  return `$${num.toFixed(2)}`;
}

function formatNumber(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toFixed(4);
}

// Token Icon Component
function TokenIcon({ symbol, size = "md" }: { symbol: string; size?: "sm" | "md" | "lg" | "xl" }) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-14 h-14",
    xl: "w-20 h-20"
  };

  const logoPath = tokenLogos[symbol.toUpperCase()];

  if (logoPath) {
    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-secondary/50 flex items-center justify-center`}>
        <Image src={logoPath} alt={symbol} width={80} height={80} className="w-full h-full object-contain" />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary`}>
      {symbol.slice(0, 2)}
    </div>
  );
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
        <span className="text-xs text-muted-foreground">filled</span>
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

export default function StakingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const vaultId = params?.id;
  const { address, isConnected } = useAccount();
  const { vaults, isLoading: loadingVaults } = useAllVaults();
  const { positions } = useUserPositions(address);
  const stakingT = useTranslations("staking");
  const commonT = useTranslations("common");

  const [vault, setVault] = useState<VaultData | null>(null);

  // Fetch CVT token balance from wallet (for staking)
  const { data: cvtBalance } = useBalance({
    address: address,
    token: vault?.cvtTokenAddress,
    query: {
      enabled: isConnected && !!address && !!vault?.cvtTokenAddress,
    },
  });

  // CVT tokens always have 18 decimals (OpenZeppelin ERC20 default)
  const cvtWalletBalance = cvtBalance
    ? parseFloat(formatUnits(cvtBalance.value, 18))
    : 0;
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState<'stake' | 'unstake'>('stake');
  const [pendingApprove, setPendingApprove] = useState(false);
  const { showToast } = useToast();

  // Staking hooks
  const stakingAddress = STAKING_ADDRESS as `0x${string}`;
  const { stake, isPending: isStakePending, error: stakeError, isSuccess: stakeSuccess } = useStakeCVT(stakingAddress);
  const { unstake, isPending: isUnstakePending, error: unstakeError, isSuccess: unstakeSuccess } = useUnstakeCVT(stakingAddress);
  const { claimRewards, isPending: isClaimPending, error: claimError, isSuccess: claimSuccess } = useClaimStakingRewards(stakingAddress);
  const { approve, isPending: isApprovePending, error: approveError, isSuccess: approveSuccess } = useApproveToken(vault?.cvtTokenAddress);

  // Read staking position from contract
  const { data: stakePosition } = useReadContract({
    address: stakingAddress,
    abi: STAKING_ABI,
    functionName: 'getStakePosition',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Read pending rewards
  const { data: pendingRewardsData } = useReadContract({
    address: stakingAddress,
    abi: STAKING_ABI,
    functionName: 'getPendingRewards',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Read if lock expired
  const { data: lockExpired } = useReadContract({
    address: stakingAddress,
    abi: STAKING_ABI,
    functionName: 'isLockExpired',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  useEffect(() => {
    if (!vaultId || loadingVaults) return;

    const found = vaults.find(
      (v) => v.vaultId.toString() === vaultId || v.vaultAddress.toLowerCase() === vaultId.toLowerCase()
    );
    setVault(found || null);
  }, [vaults, loadingVaults, vaultId]);

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
        stake(amount, 0); // lockDuration = 0 pour l'instant
      }
      setPendingApprove(false);
    }
  }, [approveSuccess, pendingApprove, amount, stake]);

  const userPosition = positions.find(p => p.vaultId.toString() === vaultId);

  // Staking position réelle depuis le contrat
  const userStaked = stakePosition ? parseFloat(formatUnits(stakePosition.amount, 18)) : 0;
  const userRewards = pendingRewardsData ? parseFloat(formatUnits(pendingRewardsData, 18)) : 0;
  const canUnstake = lockExpired === true;

  if (loadingVaults) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{stakingT("loading") || "Loading pool..."}</p>
        </div>
      </div>
    );
  }

  if (!vault) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Coins className="w-12 h-12 mx-auto text-muted-foreground/30" />
          <p className="text-lg font-semibold">Pool not found</p>
          <p className="text-sm text-muted-foreground">
            Unable to find this staking pool. Return to see available pools.
          </p>
          <button onClick={() => router.push('/staking')} className="btn-primary">
            <ArrowLeft className="w-4 h-4" />
            Back to Staking
          </button>
        </div>
      </div>
    );
  }

  const totalStaked = parseFloat(vault.totalSupplied);
  const maxCapacity = parseFloat(vault.maxLiquidity);
  const fillPercent = maxCapacity > 0 ? (totalStaked / maxCapacity) * 100 : 0;
  const availableToStake = maxCapacity - totalStaked;

  // Check if user has sufficient balance for stake operations
  const numericAmount = parseFloat(amount) || 0;
  const hasInsufficientBalance = mode === 'stake' && numericAmount > cvtWalletBalance;
  const hasInsufficientStake = mode === 'unstake' && numericAmount > userStaked;
  const isActionDisabled = !amount || numericAmount <= 0 || hasInsufficientBalance || hasInsufficientStake;

  const handleMaxClick = () => {
    if (mode === 'stake') {
      // Set max from CVT wallet balance
      setAmount(cvtWalletBalance > 0 ? cvtWalletBalance.toFixed(2) : '0');
    } else {
      // Set max unstake (user's staked amount)
      setAmount(userStaked > 0 ? userStaked.toFixed(4) : '0');
    }
  };

  const actionLoading = isStakePending || isUnstakePending || isClaimPending || isApprovePending;

  const handleStakeAction = () => {
    if (!vault) return;
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
      // Approve puis stake
      const amountBN = parseUnits(amount, 18);
      setPendingApprove(true);
      approve(stakingAddress, amountBN);
    } else {
      // Unstake - pas besoin de montant, ça retire tout
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

  const estimatedYearlyRewards = amount ? (parseFloat(amount) || 0) * vault.supplyRate / 100 : 0;

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
            {stakingT("backToPools") || "Back to pools"}
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
            <TokenIcon symbol={vault.tokenSymbol} size="xl" />
          </div>
          <div className="flex items-center justify-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">
              {stakingT("stakeCVT") || "Stake CVT"} ({stakingT("earn") || "Earn"} {vault.tokenSymbol})
            </h1>
            <Link
              href={`${BLOCK_EXPLORER_URL}/address/${vault.vaultAddress}`}
              target="_blank"
              className="p-1.5 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </Link>
          </div>
          <p className="text-muted-foreground">
            {stakingT("poolDescription") || `Supply ${vault.tokenSymbol} to the vault, receive CVT tokens, then stake CVT to earn ${vault.tokenSymbol} rewards`}
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              vault.isActive
                ? 'bg-success/20 text-success'
                : 'bg-muted text-muted-foreground'
            }`}>
              {vault.isActive ? 'Active' : 'Paused'}
            </span>
            <span className="text-sm text-muted-foreground">Pool #{vault.vaultId}</span>
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
              <h3 className="text-lg font-semibold mb-4">{stakingT("poolStats") || "Pool Statistics"}</h3>

              <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
                <StakingProgress percent={fillPercent} />
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <StatCard
                    icon={<Coins className="w-4 h-4" />}
                    label={stakingT("totalStaked") || "Total Staked"}
                    value={formatCurrency(totalStaked)}
                    subValue={`${formatNumber(totalStaked)} ${vault.tokenSymbol}`}
                    color="text-primary"
                  />
                  <StatCard
                    icon={<Percent className="w-4 h-4" />}
                    label={stakingT("currentAPY") || "Current APY"}
                    value={`${vault.supplyRate.toFixed(2)}%`}
                    subValue={stakingT("variableRate") || "Variable rate"}
                    color="text-success"
                  />
                  <StatCard
                    icon={<TrendingUp className="w-4 h-4" />}
                    label={stakingT("utilization") || "Utilization"}
                    value={`${vault.utilizationRate.toFixed(1)}%`}
                    subValue={stakingT("ofCapacity") || "of capacity"}
                    color="text-accent"
                  />
                  <StatCard
                    icon={<Shield className="w-4 h-4" />}
                    label={stakingT("available") || "Available"}
                    value={formatCurrency(availableToStake)}
                    subValue={stakingT("toStake") || "to stake"}
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
                <InfoRow
                  icon={<Coins className="w-4 h-4" />}
                  label={stakingT("minStake") || "Min. Stake"}
                  value={`0.01 ${vault.tokenSymbol}`}
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

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-card/60 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">{stakingT("staked") || "Staked"}</p>
                    <p className="text-xl font-bold text-primary">{formatNumber(userStaked)}</p>
                    <p className="text-xs text-muted-foreground">{vault.tokenSymbol}</p>
                  </div>
                  <div className="bg-card/60 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">{stakingT("value") || "Value"}</p>
                    <p className="text-xl font-bold">{formatCurrency(userStaked)}</p>
                    <p className="text-xs text-muted-foreground">USD</p>
                  </div>
                  <div className="bg-card/60 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">{stakingT("pendingRewards") || "Rewards"}</p>
                    <p className="text-xl font-bold text-success">+{formatNumber(userRewards)}</p>
                    <p className="text-xs text-muted-foreground">{vault.tokenSymbol}</p>
                  </div>
                  <div className="bg-card/60 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">{stakingT("earning") || "Earning"}</p>
                    <p className="text-xl font-bold text-success">{vault.supplyRate.toFixed(2)}%</p>
                    <p className="text-xs text-muted-foreground">APY</p>
                  </div>
                </div>

                {userRewards > 0 && (
                  <button className="btn-primary w-full mt-4 bg-success hover:bg-success/90">
                    <Coins className="w-4 h-4" />
                    {stakingT("claimRewards") || "Claim"} {formatNumber(userRewards)} {vault.tokenSymbol}
                  </button>
                )}
              </div>
            )}

            {/* How it works */}
            <div className="card-vault p-6">
              <h3 className="text-lg font-semibold mb-4">{stakingT("howItWorks") || "How Staking Works"}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">{stakingT("step1Title") || "Deposit"}</h4>
                    <p className="text-sm text-muted-foreground">
                      {stakingT("step1Desc") || "Stake your tokens in the pool"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center text-success font-bold shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">{stakingT("step2Title") || "Earn"}</h4>
                    <p className="text-sm text-muted-foreground">
                      {stakingT("step2Desc") || "Accumulate rewards over time"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">{stakingT("step3Title") || "Withdraw"}</h4>
                    <p className="text-sm text-muted-foreground">
                      {stakingT("step3Desc") || "Unstake anytime with no fees"}
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
                          <TokenIcon symbol={vault.tokenSymbol} size="sm" />
                          <span className="font-medium">{vault.tokenSymbol}</span>
                        </div>
                        <span className="font-bold text-success">
                          {vault.supplyRate.toFixed(2)}% APY
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
                            {amount ? formatCurrency(parseFloat(amount) || 0) : '$0.00'}
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
                        {/* Insufficient balance warning */}
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
                            <span className="font-medium">{amount} {vault.tokenSymbol}</span>
                          </div>
                          {mode === 'stake' && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Est. yearly rewards</span>
                              <span className="font-medium text-success">
                                +{formatNumber(estimatedYearlyRewards)} {vault.tokenSymbol}
                              </span>
                            </div>
                          )}
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
                        disabled={isActionDisabled}
                        className={`w-full py-3 rounded-xl font-semibold transition-all cursor-pointer ${
                          !isActionDisabled
                            ? mode === 'stake'
                              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                              : 'bg-accent text-white hover:bg-accent/90'
                            : 'bg-secondary text-muted-foreground cursor-not-allowed'
                        }`}
                      >
                        {hasInsufficientBalance
                          ? 'Solde insuffisant'
                          : hasInsufficientStake
                            ? 'Stake insuffisant'
                            : mode === 'stake'
                              ? (stakingT("stakeTokens") || `Stake ${vault.tokenSymbol}`)
                              : (stakingT("unstakeTokens") || `Unstake ${vault.tokenSymbol}`)
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
                          {actionLoading ? 'Transaction...' : `Claim ${formatNumber(userRewards)} Rewards`}
                        </button>
                      )}

                      {/* Pool Info */}
                      <div className="mt-5 pt-5 border-t border-border/50 space-y-1">
                        <InfoRow
                          label={stakingT("yourStake") || "Your stake"}
                          value={`${formatNumber(userStaked)} ${vault.tokenSymbol}`}
                        />
                        <InfoRow
                          label={stakingT("pendingRewards") || "Pending rewards"}
                          value={`+${formatNumber(userRewards)} ${vault.tokenSymbol}`}
                          valueColor="text-success"
                        />
                        <InfoRow
                          label="APY"
                          value={`${vault.supplyRate.toFixed(2)}%`}
                          valueColor="text-success"
                        />
                        <InfoRow
                          label={stakingT("poolSize") || "Pool size"}
                          value={formatCurrency(totalStaked)}
                        />
                        <InfoRow
                          label={stakingT("capacity") || "Capacity"}
                          value={`${fillPercent.toFixed(1)}%`}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <Wallet className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">
                        {stakingT("connectToStake") || "Connect your wallet to stake tokens"}
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
                        <InfoRow label="APY" value={`${vault.supplyRate.toFixed(2)}%`} valueColor="text-success" />
                        <InfoRow label={stakingT("poolSize") || "Pool size"} value={formatCurrency(totalStaked)} />
                        <InfoRow label={stakingT("capacity") || "Capacity"} value={`${fillPercent.toFixed(1)}%`} />
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
