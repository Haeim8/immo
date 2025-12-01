"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Vault } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAllVaults, VaultData } from "@/lib/evm/hooks";
import { useTranslations } from "@/components/providers/IntlProvider";

function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
  return `$${num.toFixed(2)}`;
}

// Token icon component with fallback to initials
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
      <div className="w-8 h-8 rounded-full overflow-hidden bg-secondary/50 flex items-center justify-center">
        <Image src={logoPath} alt={symbol} width={32} height={32} className="w-full h-full object-contain" />
      </div>
    );
  }

  return (
    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
      {symbol.slice(0, 2).toUpperCase()}
    </div>
  );
}

// Toggle Switch pour Lend/Borrow
function ModeToggle({ mode, setMode }: { mode: 'lend' | 'borrow'; setMode: (m: 'lend' | 'borrow') => void }) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-full bg-secondary/50 border border-border/50">
      <button
        onClick={() => setMode('lend')}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
          mode === 'lend'
            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        Lend
      </button>
      <button
        onClick={() => setMode('borrow')}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
          mode === 'borrow'
            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        Borrow
      </button>
    </div>
  );
}

// Vault Row - style tableau
function VaultRow({ vault, index, mode }: { vault: VaultData; index: number; mode: 'lend' | 'borrow' }) {
  // Calcul du pourcentage de remplissage
  const maxLiq = parseFloat(vault.maxLiquidity) || 1;
  const totalSupplied = parseFloat(vault.totalSupplied) || 0;
  const fillPercent = Math.min((totalSupplied / maxLiq) * 100, 100);

  return (
    <Link href={`/vault/${vault.vaultId}`}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15, delay: index * 0.02 }}
        className="group grid grid-cols-12 gap-3 items-center px-4 py-3 hover:bg-secondary/30 transition-colors border-b border-border/30 last:border-b-0"
      >
        {/* Asset - 2 cols */}
        <div className="col-span-2 flex items-center gap-2">
          <TokenIcon symbol={vault.tokenSymbol} />
          <span className="font-medium text-foreground group-hover:text-primary transition-colors">
            {vault.tokenSymbol}
          </span>
        </div>

        {/* Reserve gauge - 2 cols */}
        <div className="col-span-2">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
            <span>{formatCurrency(totalSupplied)}</span>
            <span>{fillPercent.toFixed(0)}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        </div>

        {/* APY - 1 col */}
        <div className="col-span-1 text-right">
          <span className={`font-bold ${mode === 'lend' ? 'text-success' : 'text-accent'}`}>
            {mode === 'lend' ? vault.supplyRate.toFixed(2) : vault.borrowRate.toFixed(2)}%
          </span>
        </div>

        {/* Deposits/Borrows - 2 cols */}
        <div className="col-span-2 text-right">
          <p className="font-medium text-foreground">
            {formatCurrency(mode === 'lend' ? vault.totalSupplied : vault.totalBorrowed)}
          </p>
        </div>

        {/* Available/Limit - 2 cols */}
        <div className="col-span-2 text-right">
          <p className="font-medium text-foreground">
            {formatCurrency(mode === 'lend' ? vault.maxLiquidity : vault.availableLiquidity)}
          </p>
        </div>

        {/* Utilization - 1 col */}
        <div className="col-span-1 text-right">
          <span className="text-sm text-muted-foreground">{vault.utilizationRate.toFixed(0)}%</span>
        </div>

        {/* Action Button - 2 cols */}
        <div className="col-span-2 flex justify-end">
          <span className="btn-primary text-xs px-4 py-1.5 cursor-pointer">
            {mode === 'lend' ? 'Supply' : 'Borrow'}
          </span>
        </div>
      </motion.div>
    </Link>
  );
}

// Mobile Vault Card
function VaultCardMobile({ vault, index, mode }: { vault: VaultData; index: number; mode: 'lend' | 'borrow' }) {
  return (
    <Link href={`/vault/${vault.vaultId}`}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15, delay: index * 0.02 }}
        className="group p-4 hover:bg-secondary/30 transition-colors border-b border-border/30 last:border-b-0"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <TokenIcon symbol={vault.tokenSymbol} />
            <span className="font-medium text-foreground">{vault.tokenSymbol}</span>
          </div>
          <span className={`font-bold text-lg ${mode === 'lend' ? 'text-success' : 'text-accent'}`}>
            {mode === 'lend' ? vault.supplyRate.toFixed(2) : vault.borrowRate.toFixed(2)}%
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-sm mb-3">
          <div>
            <p className="text-muted-foreground text-xs">{mode === 'lend' ? 'Deposits' : 'Borrows'}</p>
            <p className="font-medium">{formatCurrency(mode === 'lend' ? vault.totalSupplied : vault.totalBorrowed)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">{mode === 'lend' ? 'Limit' : 'Available'}</p>
            <p className="font-medium">{formatCurrency(mode === 'lend' ? vault.maxLiquidity : vault.availableLiquidity)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Utilization</p>
            <p className="font-medium">{vault.utilizationRate.toFixed(0)}%</p>
          </div>
        </div>
        <span className="btn-primary w-full text-sm py-2 block text-center cursor-pointer">
          {mode === 'lend' ? 'Supply' : 'Borrow'}
        </span>
      </motion.div>
    </Link>
  );
}

export default function PropertyContainer() {
  const [mode, setMode] = useState<'lend' | 'borrow'>('lend');
  const { vaults, isLoading, error } = useAllVaults();
  const vaultsT = useTranslations("vaults");

  if (isLoading) {
    return (
      <div className="w-full py-12 flex flex-col items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">{vaultsT("loading") || "Loading vaults..."}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-12 flex flex-col items-center justify-center">
        <p className="text-destructive text-sm">{error}</p>
      </div>
    );
  }

  if (vaults.length === 0) {
    return (
      <div className="w-full py-12 flex flex-col items-center justify-center">
        <Vault className="w-10 h-10 text-muted-foreground/30 mb-3" />
        <p className="font-medium text-foreground mb-1">
          {vaultsT("noVaults") || "No vaults available"}
        </p>
        <p className="text-sm text-muted-foreground">
          {vaultsT("noVaultsDesc") || "New lending vaults coming soon."}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header with Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{vaultsT("title") || "Lending Markets"}</h2>
          <p className="text-sm text-muted-foreground">{vaultsT("subtitle") || "Supply or borrow assets"}</p>
        </div>
        <ModeToggle mode={mode} setMode={setMode} />
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-border/60 bg-card/40 overflow-hidden">
        {/* Table Header - Desktop only */}
        <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-3 bg-secondary/30 border-b border-border/30 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          <div className="col-span-2">Asset</div>
          <div className="col-span-2">Reserve</div>
          <div className="col-span-1 text-right">APY</div>
          <div className="col-span-2 text-right">{mode === 'lend' ? 'Deposits' : 'Borrows'}</div>
          <div className="col-span-2 text-right">{mode === 'lend' ? 'Global limit' : 'Available'}</div>
          <div className="col-span-1 text-right">Util.</div>
          <div className="col-span-2"></div>
        </div>

        {/* Desktop Rows */}
        <div className="hidden md:block">
          {vaults.map((vault, index) => (
            <VaultRow key={vault.vaultAddress} vault={vault} index={index} mode={mode} />
          ))}
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden">
          {vaults.map((vault, index) => (
            <VaultCardMobile key={vault.vaultAddress} vault={vault} index={index} mode={mode} />
          ))}
        </div>
      </div>

    </div>
  );
}
