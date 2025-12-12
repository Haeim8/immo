"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, ArrowLeft, Wallet, Info,
  ExternalLink, Settings, ChevronDown, X, Check
} from "lucide-react";
import { useAccount, useBalance } from "wagmi";
import Image from "next/image";
import Link from "next/link";
import { parseUnits, formatUnits } from "viem";
import { useAllVaults, useUserPositions, VaultData, BLOCK_EXPLORER_URL } from "@/lib/evm/hooks";
import { useSupply, useBorrow, useRepayBorrow, useApproveToken } from "@/lib/evm/write-hooks.js";
import { USDC_ADDRESS, USDC_DECIMALS } from "@/lib/evm/constants";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { BuyCryptoButton } from "@/components/buy-crypto-button";

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
  return num.toFixed(2);
}

// Stat Card Component
function StatCard({ label, value, subValue }: {
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <div className="bg-card/60 border border-border/50 rounded-xl p-4 min-w-[140px]">
      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
        {label}
        <Info className="w-3 h-3 cursor-help" />
      </div>
      <div className="text-xl md:text-2xl font-bold text-foreground">{value}</div>
      {subValue && <div className="text-xs text-muted-foreground mt-1">{subValue}</div>}
    </div>
  );
}

// Token Icon Component
function TokenIcon({ symbol, size = "md" }: { symbol: string; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-14 h-14"
  };

  const logoPath = tokenLogos[symbol.toUpperCase()];

  if (logoPath) {
    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-secondary/50 flex items-center justify-center`}>
        <Image src={logoPath} alt={symbol} width={56} height={56} className="w-full h-full object-contain" />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary`}>
      {symbol.slice(0, 2)}
    </div>
  );
}

// Circular Progress Component
function CircularProgress({ percent, color }: { percent: number; color: string }) {
  const circumference = 2 * Math.PI * 36;
  const strokeDasharray = `${(percent / 100) * circumference} ${circumference}`;

  return (
    <div className="relative w-20 h-20">
      <svg className="w-20 h-20 transform -rotate-90">
        <circle
          cx="40" cy="40" r="36"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-secondary"
        />
        <circle
          cx="40" cy="40" r="36"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          className={color}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
        {percent.toFixed(0)}%
      </span>
    </div>
  );
}

// Mode Toggle for Lend/Borrow
function ModeToggle({ mode, setMode }: { mode: 'lend' | 'borrow'; setMode: (m: 'lend' | 'borrow') => void }) {
  return (
    <div className="flex items-center p-1 rounded-lg bg-secondary/50 border border-border/50 w-full">
      <button
        onClick={() => setMode('lend')}
        className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
          mode === 'lend'
            ? 'bg-card text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        Lend
      </button>
      <button
        onClick={() => setMode('borrow')}
        className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
          mode === 'borrow'
            ? 'bg-card text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        Borrow
      </button>
    </div>
  );
}

// Token Selector Modal
function TokenSelectorModal({
  isOpen,
  onClose,
  tokens,
  selectedToken,
  onSelect
}: {
  isOpen: boolean;
  onClose: () => void;
  tokens: { symbol: string; balance: string }[];
  selectedToken: string;
  onSelect: (symbol: string) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-card border border-border rounded-2xl p-5 w-full max-w-sm mx-4 shadow-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Select Token</h3>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {tokens.map((token) => (
            <button
              key={token.symbol}
              onClick={() => {
                onSelect(token.symbol);
                onClose();
              }}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                selectedToken === token.symbol
                  ? 'bg-primary/10 border border-primary/30'
                  : 'hover:bg-secondary/50 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <TokenIcon symbol={token.symbol} size="sm" />
                <span className="font-medium">{token.symbol}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{token.balance}</span>
                {selectedToken === token.symbol && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// Settings Modal
function SettingsModal({
  isOpen,
  onClose,
  slippage,
  setSlippage,
  deadline,
  setDeadline
}: {
  isOpen: boolean;
  onClose: () => void;
  slippage: string;
  setSlippage: (v: string) => void;
  deadline: string;
  setDeadline: (v: string) => void;
}) {
  const slippageOptions = ['0.1', '0.5', '1.0'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-card border border-border rounded-2xl p-5 w-full max-w-sm mx-4 shadow-xl"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold">Transaction Settings</h3>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slippage Tolerance */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium">Slippage Tolerance</span>
            <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
          </div>
          <div className="flex items-center gap-2">
            {slippageOptions.map((option) => (
              <button
                key={option}
                onClick={() => setSlippage(option)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  slippage === option
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {option}%
              </button>
            ))}
            <div className="flex-1 relative">
              <input
                type="number"
                value={slippage}
                onChange={(e) => setSlippage(e.target.value)}
                placeholder="Custom"
                className="w-full bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
            </div>
          </div>
          {parseFloat(slippage) > 5 && (
            <p className="text-xs text-warning mt-2">High slippage may result in unfavorable trades</p>
          )}
        </div>

        {/* Transaction Deadline */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium">Transaction Deadline</span>
            <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-20 bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
            />
            <span className="text-sm text-muted-foreground">minutes</span>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={onClose}
          className="btn-primary w-full mt-5"
        >
          Save Settings
        </button>
      </motion.div>
    </div>
  );
}

// Info Row Component
function InfoRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${valueColor || 'text-foreground'}`}>{value}</span>
    </div>
  );
}

export default function VaultPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const vaultId = params?.id;
  const { address, isConnected } = useAccount();
  const { vaults, isLoading: loadingVaults } = useAllVaults();
  const { positions } = useUserPositions(address);

  // Fetch USDC balance from wallet
  const { data: usdcBalance, refetch: refetchBalance } = useBalance({
    address: address,
    token: USDC_ADDRESS as `0x${string}`,
    query: {
      enabled: isConnected && !!address,
    },
  });

  const walletBalance = usdcBalance
    ? parseFloat(formatUnits(usdcBalance.value, USDC_DECIMALS))
    : 0;

  const [vault, setVault] = useState<VaultData | null>(null);
  const [mode, setMode] = useState<'lend' | 'borrow'>('lend');
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('');
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [slippage, setSlippage] = useState('0.5');
  const [deadline, setDeadline] = useState('30');
  const [txError, setTxError] = useState<string | null>(null);

  const vaultAddress = (vault?.vaultAddress || '0x0000000000000000000000000000000000000000') as `0x${string}`;
  const { supply, isPending: isSupplyPending, error: supplyError } = useSupply(vaultAddress);
  const { borrow, isPending: isBorrowPending, error: borrowError } = useBorrow(vaultAddress);
  const { repayBorrow, isPending: isRepayPending, error: repayError } = useRepayBorrow(vaultAddress);
  const { approve, isPending: isApprovePending, error: approveError } = useApproveToken(USDC_ADDRESS);

  useEffect(() => {
    if (!vaultId || loadingVaults) return;

    const found = vaults.find(
      (v) => v.vaultId.toString() === vaultId || v.vaultAddress.toLowerCase() === vaultId.toLowerCase()
    );
    setVault(found || null);
    if (found) {
      setSelectedToken(found.tokenSymbol);
    }
  }, [vaults, loadingVaults, vaultId]);

  const userPosition = positions.find(p => p.vaultId.toString() === vaultId);

  // Build available tokens list
  const availableTokens = vaults.map(v => ({
    symbol: v.tokenSymbol,
    balance: '0.00' // Would come from wallet balance
  }));

  useEffect(() => {
    const firstError = supplyError || borrowError || repayError || approveError;
    if (firstError) {
      setTxError(firstError.message);
    }
  }, [supplyError, borrowError, repayError, approveError]);

  if (loadingVaults) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading vault...</p>
        </div>
      </div>
    );
  }

  if (!vault) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg font-semibold">Vault not found</p>
          <p className="text-sm text-muted-foreground">
            Unable to find this vault. Return to home to see available vaults.
          </p>
          <button onClick={() => router.push('/home')} className="btn-primary">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const totalDeposits = parseFloat(vault.totalSupplied);
  const totalBorrows = parseFloat(vault.totalBorrowed);
  const maxCapacity = parseFloat(vault.maxLiquidity);
  const availableLiquidity = parseFloat(vault.availableLiquidity);
  const supplyPercent = maxCapacity > 0 ? (totalDeposits / maxCapacity) * 100 : 0;
  const borrowPercent = totalDeposits > 0 ? (totalBorrows / totalDeposits) * 100 : 0;

  const actionLoading = isSupplyPending || isBorrowPending || isRepayPending || isApprovePending;
  const isAmountValid = amount && parseFloat(amount) > 0;

  // Check if user has sufficient balance for lend/repay operations
  const numericAmount = parseFloat(amount) || 0;
  const hasInsufficientBalance = mode === 'lend' && numericAmount > walletBalance;
  const isActionDisabled = !vault || !isAmountValid || actionLoading || hasInsufficientBalance;

  const handleAction = () => {
    if (!vault) return;
    setTxError(null);
    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      setTxError("Montant invalide");
      return;
    }

    // Check wallet balance for lend mode
    if (mode === 'lend' && numericAmount > walletBalance) {
      setTxError(`Solde insuffisant. Vous avez ${formatNumber(walletBalance)} USDC`);
      return;
    }

    const amountString = numericAmount.toString();

    if (mode === 'lend') {
      const amountBN = parseUnits(amountString, USDC_DECIMALS);
      approve(vaultAddress, amountBN);
      supply(amountString, USDC_DECIMALS);
    } else {
      borrow(amountString, USDC_DECIMALS);
    }
  };

  const handleRepay = () => {
    if (!vault) return;
    setTxError(null);
    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      setTxError("Montant invalide");
      return;
    }

    // Check wallet balance for repay
    if (numericAmount > walletBalance) {
      setTxError(`Solde insuffisant. Vous avez ${formatNumber(walletBalance)} USDC`);
      return;
    }

    const amountString = numericAmount.toString();
    const amountBN = parseUnits(amountString, USDC_DECIMALS);
    approve(vaultAddress, amountBN);
    repayBorrow(amountString, USDC_DECIMALS);
  };

  const handleMaxClick = () => {
    if (mode === 'lend') {
      // Set max from wallet balance
      setAmount(walletBalance > 0 ? walletBalance.toFixed(2) : '0');
    } else {
      // Set max borrowable (limited by available liquidity and user's max borrow capacity)
      const maxBorrowable = userPosition ? parseFloat(userPosition.maxBorrow) : 0;
      const maxAmount = Math.min(availableLiquidity, maxBorrowable > 0 ? maxBorrowable : availableLiquidity);
      setAmount(formatNumber(maxAmount));
    }
  };

  return (
    <div className="flex-1 py-6">
      <div className="container-app">
        {/* Back Button + Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border/50 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to banks
          </button>

          {/* Token Header */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            {/* Left: Token Info */}
            <div className="flex items-center gap-4">
              <TokenIcon symbol={vault.tokenSymbol} size="lg" />
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-bold">{vault.tokenSymbol}</h1>
                  <Link
                    href={`${BLOCK_EXPLORER_URL}/address/${vault.vaultAddress}`}
                    target="_blank"
                    className="p-1.5 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </Link>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  <span>Vault #{vault.vaultId}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    vault.isActive
                      ? 'bg-success/20 text-success'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {vault.isActive ? 'Active' : 'Paused'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Key Stats */}
            <div className="flex flex-wrap gap-3">
              <StatCard
                label="Total Deposits"
                value={formatNumber(totalDeposits)}
                subValue={formatCurrency(totalDeposits)}
              />
              <StatCard
                label="Total Borrows"
                value={formatNumber(totalBorrows)}
                subValue={formatCurrency(totalBorrows)}
              />
              <StatCard
                label="Utilization"
                value={`${vault.utilizationRate.toFixed(2)}%`}
              />
              <div className="bg-card/60 border border-border/50 rounded-xl p-4 min-w-[160px]">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                  Interest Rates (APY)
                  <Info className="w-3 h-3 cursor-help" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-success">{vault.supplyRate.toFixed(2)}%</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-xl font-bold text-accent">{vault.borrowRate.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Vault Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Supply Info */}
            <div className="card-vault p-6">
              <h3 className="text-lg font-semibold mb-4">Supply Info</h3>
              <div className="flex items-center gap-6 mb-6">
                <CircularProgress percent={supplyPercent} color="text-primary" />
                <div className="flex-1">
                  <span className="text-sm text-muted-foreground">Total supplied</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold">{formatNumber(totalDeposits)}</span>
                    <span className="text-sm text-muted-foreground">of {formatNumber(maxCapacity)}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatCurrency(totalDeposits)}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm text-muted-foreground">APY</span>
                  <div className="text-xl font-bold text-success">{vault.supplyRate.toFixed(2)}%</div>
                </div>
              </div>

              {/* Collateral Usage */}
              <div className="border-t border-border/50 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium">Collateral Usage</span>
                  <span className="text-xs text-success">Can be collateral</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-secondary/30 rounded-lg p-3">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      Max LTV <Info className="w-3 h-3" />
                    </div>
                    <span className="font-bold">{vault.maxBorrowRatio.toFixed(0)}%</span>
                  </div>
                  <div className="bg-secondary/30 rounded-lg p-3">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      Liquidation Threshold <Info className="w-3 h-3" />
                    </div>
                    <span className="font-bold">{(vault.maxBorrowRatio + 5).toFixed(0)}%</span>
                  </div>
                  <div className="bg-secondary/30 rounded-lg p-3">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      Liquidation Penalty <Info className="w-3 h-3" />
                    </div>
                    <span className="font-bold">{vault.liquidationBonus.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Borrow Info */}
            <div className="card-vault p-6">
              <h3 className="text-lg font-semibold mb-4">Borrow Info</h3>
              <div className="flex items-center gap-6 mb-6">
                <CircularProgress percent={borrowPercent} color="text-accent" />
                <div className="flex-1">
                  <span className="text-sm text-muted-foreground">Total borrowed</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold">{formatNumber(totalBorrows)}</span>
                    <span className="text-sm text-muted-foreground">of {formatNumber(totalDeposits)}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatCurrency(totalBorrows)}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm text-muted-foreground">APY, variable</span>
                  <div className="text-xl font-bold text-accent">{vault.borrowRate.toFixed(2)}%</div>
                </div>
              </div>

              {/* Borrow Parameters - Same structure as Supply */}
              <div className="border-t border-border/50 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium">Borrow Parameters</span>
                  <span className="text-xs text-accent">Variable rate</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-secondary/30 rounded-lg p-3">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      Base Rate <Info className="w-3 h-3" />
                    </div>
                    <span className="font-bold">{vault.borrowBaseRate.toFixed(2)}%</span>
                  </div>
                  <div className="bg-secondary/30 rounded-lg p-3">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      Rate Slope <Info className="w-3 h-3" />
                    </div>
                    <span className="font-bold">{vault.borrowSlope.toFixed(2)}%</span>
                  </div>
                  <div className="bg-secondary/30 rounded-lg p-3">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      Available <Info className="w-3 h-3" />
                    </div>
                    <span className="font-bold">{formatCurrency(availableLiquidity)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interest Rate Model */}
            <div className="card-vault p-6">
              <h3 className="text-lg font-semibold mb-4">Interest Rate Model</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-secondary/30 rounded-lg p-3">
                  <span className="text-xs text-muted-foreground">Utilization Rate</span>
                  <div className="font-bold">{vault.utilizationRate.toFixed(2)}%</div>
                </div>
                <div className="bg-secondary/30 rounded-lg p-3">
                  <span className="text-xs text-muted-foreground">Base Rate</span>
                  <div className="font-bold">{vault.borrowBaseRate.toFixed(2)}%</div>
                </div>
                <div className="bg-secondary/30 rounded-lg p-3">
                  <span className="text-xs text-muted-foreground">Supply APY</span>
                  <div className="font-bold text-success">{vault.supplyRate.toFixed(2)}%</div>
                </div>
                <div className="bg-secondary/30 rounded-lg p-3">
                  <span className="text-xs text-muted-foreground">Borrow APY</span>
                  <div className="font-bold text-accent">{vault.borrowRate.toFixed(2)}%</div>
                </div>
              </div>

              {/* Interest Rate Curve Visual */}
              <div className="h-48 bg-secondary/20 rounded-lg border border-border/30 p-4 relative overflow-hidden">
                {/* Y-axis labels */}
                <div className="absolute left-2 top-2 bottom-8 flex flex-col justify-between text-[10px] text-muted-foreground">
                  <span>100%</span>
                  <span>75%</span>
                  <span>50%</span>
                  <span>25%</span>
                  <span>0%</span>
                </div>

                {/* Chart area */}
                <div className="ml-8 h-full relative">
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex flex-col justify-between">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div key={i} className="border-t border-border/20 w-full" />
                    ))}
                  </div>

                  {/* Curves (simplified representation) */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {/* Supply APY curve (green) */}
                    <path
                      d="M 0 95 Q 30 90 50 80 T 80 40 T 100 10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-success"
                    />
                    {/* Borrow APY curve (orange) */}
                    <path
                      d="M 0 98 Q 30 95 50 85 T 80 50 T 100 5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-accent"
                    />
                    {/* Current utilization marker */}
                    <line
                      x1={vault.utilizationRate}
                      y1="0"
                      x2={vault.utilizationRate}
                      y2="100"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeDasharray="4 2"
                      className="text-muted-foreground"
                    />
                  </svg>

                  {/* Current utilization label */}
                  <div
                    className="absolute top-0 text-[10px] text-muted-foreground whitespace-nowrap"
                    style={{ left: `${vault.utilizationRate}%`, transform: 'translateX(-50%)' }}
                  >
                    Current: {vault.utilizationRate.toFixed(1)}%
                  </div>
                </div>

                {/* X-axis labels */}
                <div className="absolute bottom-0 left-8 right-0 flex justify-between text-[10px] text-muted-foreground">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>

                {/* Legend */}
                <div className="absolute top-2 right-2 flex items-center gap-4 text-[10px]">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-0.5 bg-success" />
                    <span className="text-muted-foreground">Supply APY</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-0.5 bg-accent" />
                    <span className="text-muted-foreground">Borrow APY</span>
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
              <ModeToggle mode={mode} setMode={setMode} />

              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="mt-5"
                >
                  {isConnected ? (
                    <>
                      {/* Token Display with selector */}
                      <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg mb-4">
                        <button
                          type="button"
                          onClick={() => setShowTokenSelector(true)}
                          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                        >
                          <TokenIcon symbol={selectedToken || vault.tokenSymbol} size="sm" />
                          <span className="font-medium">{selectedToken || vault.tokenSymbol}</span>
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <span className={`font-bold ${mode === 'lend' ? 'text-success' : 'text-accent'}`}>
                          {mode === 'lend' ? vault.supplyRate.toFixed(2) : vault.borrowRate.toFixed(2)}% APY
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
                            <span className={`text-muted-foreground ${hasInsufficientBalance ? 'text-destructive' : ''}`}>
                              {mode === 'lend' ? 'Wallet:' : 'Max:'} {mode === 'lend' ? formatNumber(walletBalance) : (userPosition ? formatNumber(parseFloat(userPosition.maxBorrow)) : '0.00')}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleMaxClick();
                              }}
                              className="text-primary font-medium hover:underline cursor-pointer"
                            >
                              MAX
                            </button>
                          </div>
                        </div>
                        {/* Insufficient balance warning */}
                        {hasInsufficientBalance && (
                          <div className="mt-2">
                            <p className="text-xs text-destructive">
                              Solde insuffisant ({formatNumber(walletBalance)} USDC disponible)
                            </p>
                            <div className="mt-2">
                              <BuyCryptoButton />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Available Info */}
                      <div className="flex items-center justify-between mb-4 text-sm">
                        <span className="text-muted-foreground">
                          {mode === 'lend' ? 'Available to supply' : 'Available to borrow'}
                        </span>
                        <span className="font-medium">
                          {mode === 'lend' ? formatCurrency(walletBalance) : formatCurrency(availableLiquidity)}
                        </span>
                      </div>

                      {/* Transaction Preview */}
                      {amount && parseFloat(amount) > 0 && (
                        <div className="bg-secondary/20 rounded-lg p-3 mb-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">You will {mode === 'lend' ? 'supply' : 'borrow'}</span>
                            <span className="font-medium">{amount} {selectedToken || vault.tokenSymbol}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              {mode === 'lend' ? 'Est. yearly earnings' : 'Est. yearly cost'}
                            </span>
                            <span className={`font-medium ${mode === 'lend' ? 'text-success' : 'text-accent'}`}>
                              {mode === 'lend'
                                ? `+${formatCurrency((parseFloat(amount) || 0) * vault.supplyRate / 100)}`
                                : `-${formatCurrency((parseFloat(amount) || 0) * vault.borrowRate / 100)}`
                              }
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Slippage</span>
                            <span className="font-medium">{slippage}%</span>
                          </div>
                        </div>
                      )}

                      {/* Action Button */}
                      <button
                        type="button"
                        disabled={isActionDisabled}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleAction();
                        }}
                        className={`w-full py-3 rounded-xl font-semibold transition-all cursor-pointer relative z-10 ${
                          isActionDisabled
                            ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                            : mode === 'lend'
                              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                              : 'bg-accent text-white hover:bg-accent/90'
                        }`}
                      >
                        {actionLoading ? 'Transaction...' : mode === 'lend' ? 'Supply' : 'Borrow'}
                      </button>

                      {mode === 'borrow' && userPosition && parseFloat(userPosition.borrowed) > 0 && (
                        <button
                          type="button"
                          disabled={isActionDisabled}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRepay();
                          }}
                          className={`w-full py-3 rounded-xl font-semibold transition-all cursor-pointer relative z-10 mt-2 ${
                            isActionDisabled
                              ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                              : 'bg-primary text-primary-foreground hover:bg-primary/90'
                          }`}
                        >
                          {actionLoading ? 'Transaction...' : 'Repay borrow'}
                        </button>
                      )}

                      {txError && (
                        <p className="text-sm text-destructive mt-2">{txError}</p>
                      )}

                      {/* Settings Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowSettings(true);
                        }}
                        className="flex items-center justify-center gap-2 w-full mt-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer relative z-10"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>

                      {/* Position Info */}
                      <div className="mt-5 pt-5 border-t border-border/50 space-y-1">
                        <InfoRow
                          label="Your position"
                          value={userPosition ? `${formatNumber(userPosition.supplied)} ${vault.tokenSymbol}` : `0 ${vault.tokenSymbol}`}
                        />
                        <InfoRow
                          label="USD Value"
                          value={userPosition ? formatCurrency(userPosition.supplied) : '$0'}
                        />
                        <InfoRow
                          label={mode === 'lend' ? 'Supply Rate' : 'Borrow Rate'}
                          value={`${mode === 'lend' ? vault.supplyRate.toFixed(2) : vault.borrowRate.toFixed(2)}%`}
                          valueColor={mode === 'lend' ? 'text-success' : 'text-accent'}
                        />
                        {userPosition && parseFloat(userPosition.borrowed) > 0 && (
                          <InfoRow
                            label="Health Factor"
                            value={userPosition.healthFactor >= 1000 ? '∞' : `${userPosition.healthFactor.toFixed(0)}%`}
                            valueColor={userPosition.healthFactor >= 100 ? 'text-success' : 'text-warning'}
                          />
                        )}
                        <InfoRow label="Pool size" value={formatCurrency(totalDeposits)} />
                        <InfoRow label="Utilization" value={`${vault.utilizationRate.toFixed(1)}%`} />
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <Wallet className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">
                        Connect your wallet to {mode === 'lend' ? 'supply' : 'borrow'} assets
                      </p>

                      {/* Buy Crypto Option for new users */}
                      <div className="mb-4">
                        <p className="text-xs text-muted-foreground mb-2">New to crypto?</p>
                        <BuyCryptoButton />
                      </div>

                      <ConnectButton.Custom>
                        {({ openConnectModal, mounted }) => {
                          const ready = mounted;
                          return (
                            <div className={!ready ? 'opacity-0 pointer-events-none' : 'relative z-20'}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  openConnectModal();
                                }}
                                className="btn-secondary w-full cursor-pointer relative z-30"
                              >
                                Connect Wallet
                              </button>
                            </div>
                          );
                        }}
                      </ConnectButton.Custom>

                      {/* Info when not connected */}
                      <div className="mt-6 pt-5 border-t border-border/50 space-y-1 text-left">
                        <InfoRow label="Your position" value={`0 ${vault.tokenSymbol}`} />
                        <InfoRow label="USD Value" value="$0" />
                        <InfoRow
                          label={mode === 'lend' ? 'Supply Rate' : 'Borrow Rate'}
                          value={`${mode === 'lend' ? vault.supplyRate.toFixed(2) : vault.borrowRate.toFixed(2)}%`}
                          valueColor={mode === 'lend' ? 'text-success' : 'text-accent'}
                        />
                        <InfoRow label="Pool size" value={formatCurrency(totalDeposits)} />
                        <InfoRow label="Utilization" value={`${vault.utilizationRate.toFixed(1)}%`} />
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showTokenSelector && (
          <TokenSelectorModal
            isOpen={showTokenSelector}
            onClose={() => setShowTokenSelector(false)}
            tokens={availableTokens}
            selectedToken={selectedToken || vault.tokenSymbol}
            onSelect={setSelectedToken}
          />
        )}
        {showSettings && (
          <SettingsModal
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            slippage={slippage}
            setSlippage={setSlippage}
            deadline={deadline}
            setDeadline={setDeadline}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
