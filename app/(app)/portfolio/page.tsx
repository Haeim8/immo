"use client";

import { motion } from "framer-motion";
import { Wallet, TrendingUp, Activity, ArrowUpRight, ArrowDownRight, Loader2, ExternalLink, Coins, Landmark } from "lucide-react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import Image from "next/image";
import { useUserPositions, useAllVaults, BLOCK_EXPLORER_URL } from "@/lib/evm/hooks";
import { useTranslations } from "@/components/providers/IntlProvider";

export const dynamic = 'force-dynamic';

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



// Value Card Component (replaces ChartCard - no fake historical data)
function ValueCard({
  title,
  value,
  subtext,
  color,
  icon
}: {
  title: string;
  value: string;
  subtext?: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="card-vault p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
          <span style={{ color }}>{icon}</span>
        </div>
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
      </div>
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
      {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
    </div>
  );
}

export default function PortfolioPage() {
  const { address, isConnected } = useAccount();
  const { positions, totals, isLoading: loadingPositions } = useUserPositions(address);
  const { vaults, isLoading: loadingVaults } = useAllVaults();
  const portfolioT = useTranslations("portfolio");
  const stakingT = useTranslations("staking");
  const commonT = useTranslations("common");

  // Not connected
  if (!isConnected) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md text-center"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Wallet className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-3">{portfolioT("connectTitle") || "Connect Your Wallet"}</h1>
          <p className="text-muted-foreground mb-6">
            {portfolioT("connectDescription") || "Connect your wallet to view your portfolio, positions, and earnings across all vaults."}
          </p>
          <div className="flex justify-center">
            <ConnectButton.Custom>
              {({ openConnectModal, mounted }) => {
                const ready = mounted;
                return (
                  <div {...(!ready && { 'aria-hidden': true, style: { opacity: 0, pointerEvents: 'none' } })}>
                    <button onClick={openConnectModal} className="btn-primary">
                      <Wallet className="w-4 h-4" />
                      {commonT("connectWallet")}
                    </button>
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>
        </motion.div>
      </div>
    );
  }

  // Loading
  if (loadingPositions || loadingVaults) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{portfolioT("loading") || "Loading your portfolio..."}</p>
        </div>
      </div>
    );
  }

  // Get vault info for each position
  const positionsWithVault = positions.map(pos => {
    const vault = vaults.find(v => v.vaultId === pos.vaultId);
    return { ...pos, vault };
  });

  // Separate lending positions (those with borrowed > 0) from staking positions (supply only)
  const lendingPositions = positionsWithVault.filter(pos => parseFloat(pos.borrowed) > 0);
  const stakingPositions = positionsWithVault.filter(pos => parseFloat(pos.borrowed) === 0 && parseFloat(pos.supplied) > 0);

  // Calculate totals for staking
  const stakingTotal = stakingPositions.reduce((sum, pos) => sum + parseFloat(pos.supplied), 0);

  const netWorth = totals.totalSupplied - totals.totalBorrowed;
  const hasAnyPosition = positions.length > 0;

  return (
    <div className="flex-1 py-6 md:py-8">
      <div className="container-app space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-2">{portfolioT("title") || "Portfolio"}</h1>
          <p className="text-muted-foreground">
            {portfolioT("subtitle") || "Manage your positions across all CantorFi vaults"}
          </p>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"
        >
          <div className="card-position has-position p-4 md:p-5">
            <div className="flex items-center gap-2 text-primary mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">{portfolioT("netWorth") || "Net Worth"}</span>
            </div>
            <div className="stat-value">{formatCurrency(netWorth)}</div>
          </div>

          <div className="card-vault p-4 md:p-5">
            <div className="flex items-center gap-2 text-success mb-2">
              <ArrowUpRight className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">{portfolioT("supplied") || "Supplied"}</span>
            </div>
            <div className="stat-value">{formatCurrency(totals.totalSupplied)}</div>
          </div>

          <div className="card-vault p-4 md:p-5">
            <div className="flex items-center gap-2 text-accent mb-2">
              <ArrowDownRight className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">{portfolioT("borrowed") || "Borrowed"}</span>
            </div>
            <div className="stat-value">{formatCurrency(totals.totalBorrowed)}</div>
          </div>

          <div className="card-vault p-4 md:p-5">
            <div className="flex items-center gap-2 text-warning mb-2">
              <Activity className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">{portfolioT("pending") || "Pending"}</span>
            </div>
            <div className="stat-value text-success">+{formatCurrency(totals.totalInterestPending)}</div>
          </div>
        </motion.div>

        {/* No positions at all */}
        {!hasAnyPosition && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-vault"
          >
            <div className="p-12 text-center relative z-10">
              <Wallet className="w-10 h-10 mx-auto mb-4 text-muted-foreground/30" />
              <p className="font-medium mb-2">{portfolioT("noPositions") || "No active positions"}</p>
              <p className="text-sm text-muted-foreground mb-6">
                {portfolioT("noPositionsDesc") || "Start earning by supplying assets to a vault"}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/home" className="btn-primary relative z-20">
                  <Landmark className="w-4 h-4" />
                  {portfolioT("browseVaults") || "Browse Vaults"}
                </Link>
                <Link href="/staking" className="btn-secondary relative z-20">
                  <Coins className="w-4 h-4" />
                  {stakingT("stake") || "Stake"}
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Content: Positions + Charts */}
        {hasAnyPosition && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left Column - Positions (2/5) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2 space-y-4"
            >
              {/* Staking Positions */}
              {stakingPositions.length > 0 && (
                <div className="card-vault border-primary/20">
                  <div className="p-4 border-b border-border flex items-center justify-between bg-primary/5">
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-sm">{stakingT("stakingPositions") || "Staking"}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {stakingPositions.length} {portfolioT("active") || "active"}
                    </span>
                  </div>

                  <div className="divide-y divide-border max-h-[280px] overflow-y-auto custom-scrollbar">
                    {stakingPositions.map((position) => (
                      <Link key={position.vaultAddress} href={`/staking/${position.vaultId}`} className="block">
                        <div className="p-3 hover:bg-secondary/30 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {position.vault?.tokenSymbol && tokenLogos[position.vault.tokenSymbol.toUpperCase()] ? (
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-secondary/50">
                                  <Image
                                    src={tokenLogos[position.vault.tokenSymbol.toUpperCase()]}
                                    alt={position.vault.tokenSymbol}
                                    width={32}
                                    height={32}
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                  {position.vault?.tokenSymbol?.slice(0, 2) || '??'}
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-sm">{position.vault?.tokenSymbol || 'Unknown'}</p>
                                <p className="text-[10px] text-muted-foreground">Pool #{position.vaultId}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-sm text-primary">{formatCurrency(position.supplied)}</p>
                              <p className="text-[10px] text-success">+{formatCurrency(position.interestPending)}</p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Lending Positions */}
              {lendingPositions.length > 0 && (
                <div className="card-vault border-accent/20">
                  <div className="p-4 border-b border-border flex items-center justify-between bg-accent/5">
                    <div className="flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-accent" />
                      <span className="font-semibold text-sm">{portfolioT("lendingPositions") || "Lending"}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {lendingPositions.length} {portfolioT("active") || "active"}
                    </span>
                  </div>

                  <div className="divide-y divide-border max-h-[280px] overflow-y-auto custom-scrollbar">
                    {lendingPositions.map((position) => (
                      <Link key={position.vaultAddress} href={`/vault/${position.vaultId}`} className="block">
                        <div className="p-3 hover:bg-secondary/30 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {position.vault?.tokenSymbol && tokenLogos[position.vault.tokenSymbol.toUpperCase()] ? (
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-secondary/50">
                                  <Image
                                    src={tokenLogos[position.vault.tokenSymbol.toUpperCase()]}
                                    alt={position.vault.tokenSymbol}
                                    width={32}
                                    height={32}
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-xs font-bold text-accent">
                                  {position.vault?.tokenSymbol?.slice(0, 2) || '??'}
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-sm">{position.vault?.tokenSymbol || 'Unknown'}</p>
                                <p className="text-[10px] text-muted-foreground">Vault #{position.vaultId}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-sm text-success">{formatCurrency(position.supplied)}</p>
                              <p className="text-[10px] text-accent">-{formatCurrency(position.borrowed)}</p>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-[10px]">
                            <span className="text-muted-foreground">{portfolioT("health") || "Health"}</span>
                            <span className={`font-medium ${
                              position.healthFactor >= 100 ? 'text-success' :
                              position.healthFactor >= 50 ? 'text-warning' : 'text-destructive'
                            }`}>
                              {position.healthFactor >= 1000 ? '∞' : `${position.healthFactor.toFixed(0)}%`}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              {totals.totalInterestPending > 0 && (
                <div className="card-vault p-4 border-success/20 bg-success/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{portfolioT("claimRewards") || "Claim Rewards"}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(totals.totalInterestPending)} {portfolioT("available") || "available"}
                      </p>
                    </div>
                    <button className="btn-primary bg-success hover:bg-success/90 text-sm px-3 py-1.5">
                      {commonT("claim") || "Claim"}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Right Column - Summary (3/5) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="lg:col-span-3 space-y-4"
            >
              {/* Supply & Borrow Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ValueCard
                  title={portfolioT("supplied") || "Total Supply"}
                  value={formatCurrency(totals.totalSupplied)}
                  subtext={`${positions.filter(p => parseFloat(p.supplied) > 0).length} positions`}
                  color="#10b981"
                  icon={<ArrowUpRight className="w-4 h-4" />}
                />
                <ValueCard
                  title={portfolioT("borrowed") || "Total Borrow"}
                  value={formatCurrency(totals.totalBorrowed)}
                  subtext={`${lendingPositions.length} active loans`}
                  color="#f97316"
                  icon={<ArrowDownRight className="w-4 h-4" />}
                />
              </div>

              {/* Portfolio Overview */}
              <div className="card-vault p-5">
                <h3 className="font-semibold mb-4">{portfolioT("portfolioOverview") || "Portfolio Overview"}</h3>

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-success/5 border border-success/10">
                    <p className="text-xs text-muted-foreground mb-1">Total Supply</p>
                    <p className="text-xl font-bold text-success">{formatCurrency(totals.totalSupplied)}</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-accent/5 border border-accent/10">
                    <p className="text-xs text-muted-foreground mb-1">Total Borrow</p>
                    <p className="text-xl font-bold text-accent">{formatCurrency(totals.totalBorrowed)}</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/10">
                    <p className="text-xs text-muted-foreground mb-1">Staking</p>
                    <p className="text-xl font-bold text-primary">{formatCurrency(stakingTotal)}</p>
                  </div>
                </div>

                {/* Utilization */}
                {totals.totalSupplied > 0 && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Utilization</span>
                      <span className="font-medium">{((totals.totalBorrowed / totals.totalSupplied) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min((totals.totalBorrowed / totals.totalSupplied) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Explorer Link */}
              <div className="card-vault p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{portfolioT("viewExplorer") || "View on Explorer"}</p>
                    <p className="text-xs text-muted-foreground">{portfolioT("seeTransactions") || "See all transactions"}</p>
                  </div>
                  <a
                    href={`${BLOCK_EXPLORER_URL}/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-sm px-3 py-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Explorer
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
