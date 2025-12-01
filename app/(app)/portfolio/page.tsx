"use client";

import { useMemo } from "react";
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


// Generate mock historical data for charts
function generateHistoricalData(currentValue: number, days: number = 30, trend: 'up' | 'down' | 'stable' = 'up') {
  const data: { date: string; value: number }[] = [];
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Create realistic progression
    const progress = (days - i) / days;
    const noise = (Math.random() - 0.5) * 0.1;
    let multiplier = 1;

    if (trend === 'up') {
      multiplier = 0.3 + progress * 0.7 + noise;
    } else if (trend === 'down') {
      multiplier = 1 - progress * 0.3 + noise;
    } else {
      multiplier = 0.85 + Math.random() * 0.3;
    }

    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.max(0, currentValue * multiplier)
    });
  }

  return data;
}

// Mini Line Chart Component
function MiniChart({
  data,
  color,
  height = 60,
  showArea = true
}: {
  data: { date: string; value: number }[];
  color: string;
  height?: number;
  showArea?: boolean;
}) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d.value - minValue) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,100 ${points} 100,100`;

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ height, width: '100%' }}>
      {showArea && (
        <polygon
          points={areaPoints}
          fill={`url(#gradient-${color})`}
          opacity="0.3"
        />
      )}
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Combined Chart with multiple lines
function CombinedChart({
  supplyData,
  borrowData,
  stakingData,
  height = 200
}: {
  supplyData: { date: string; value: number }[];
  borrowData: { date: string; value: number }[];
  stakingData: { date: string; value: number }[];
  height?: number;
}) {
  const allValues = [
    ...supplyData.map(d => d.value),
    ...borrowData.map(d => d.value),
    ...stakingData.map(d => d.value)
  ];

  const maxValue = Math.max(...allValues, 1);
  const minValue = 0;
  const range = maxValue - minValue || 1;

  const getPoints = (data: { date: string; value: number }[]) => {
    if (data.length === 0) return '';
    return data.map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((d.value - minValue) / range) * 100;
      return `${x},${y}`;
    }).join(' ');
  };

  const supplyPoints = getPoints(supplyData);
  const borrowPoints = getPoints(borrowData);
  const stakingPoints = getPoints(stakingData);

  // Generate Y-axis labels
  const yLabels = [0, 0.25, 0.5, 0.75, 1].map(pct => ({
    value: minValue + range * (1 - pct),
    y: pct * 100
  }));

  // Generate X-axis labels (dates)
  const xLabels = supplyData.length > 0 ? [
    supplyData[0],
    supplyData[Math.floor(supplyData.length / 2)],
    supplyData[supplyData.length - 1]
  ] : [];

  return (
    <div className="relative" style={{ height }}>
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-6 w-12 flex flex-col justify-between text-[10px] text-muted-foreground">
        {yLabels.map((label, i) => (
          <span key={i}>{formatCurrency(label.value)}</span>
        ))}
      </div>

      {/* Chart area */}
      <div className="absolute left-14 right-0 top-0 bottom-6">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(y => (
            <line
              key={y}
              x1="0" y1={y} x2="100" y2={y}
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-border/30"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {/* Areas */}
          {supplyPoints && (
            <polygon
              points={`0,100 ${supplyPoints} 100,100`}
              fill="url(#supply-gradient)"
              opacity="0.2"
            />
          )}
          {stakingPoints && (
            <polygon
              points={`0,100 ${stakingPoints} 100,100`}
              fill="url(#staking-gradient)"
              opacity="0.2"
            />
          )}

          {/* Lines */}
          {supplyPoints && (
            <polyline
              points={supplyPoints}
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {borrowPoints && (
            <polyline
              points={borrowPoints}
              fill="none"
              stroke="#f97316"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {stakingPoints && (
            <polyline
              points={stakingPoints}
              fill="none"
              stroke="#00d4aa"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )}

          <defs>
            <linearGradient id="supply-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="staking-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00d4aa" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#00d4aa" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* X-axis labels */}
      <div className="absolute left-14 right-0 bottom-0 h-6 flex justify-between text-[10px] text-muted-foreground">
        {xLabels.map((label, i) => (
          <span key={i}>{new Date(label.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
        ))}
      </div>
    </div>
  );
}

// Chart Card Component
function ChartCard({
  title,
  value,
  change,
  data,
  color,
  icon
}: {
  title: string;
  value: string;
  change?: string;
  data: { date: string; value: number }[];
  color: string;
  icon: React.ReactNode;
}) {
  const isPositive = change && !change.startsWith('-');

  return (
    <div className="card-vault p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center`} style={{ backgroundColor: `${color}20` }}>
            <span style={{ color }}>{icon}</span>
          </div>
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
        </div>
        {change && (
          <span className={`text-xs font-medium ${isPositive ? 'text-success' : 'text-destructive'}`}>
            {change}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold mb-3" style={{ color }}>{value}</div>
      <MiniChart data={data} color={color} height={50} />
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

  // Generate historical data based on current positions
  const chartData = useMemo(() => {
    const supplyData = generateHistoricalData(totals.totalSupplied, 30, 'up');
    const borrowData = generateHistoricalData(totals.totalBorrowed, 30, totals.totalBorrowed > 0 ? 'stable' : 'up');

    // Calculate staking total
    const positionsWithVault = positions.map(pos => {
      const vault = vaults.find(v => v.vaultId === pos.vaultId);
      return { ...pos, vault };
    });
    const stakingTotal = positionsWithVault
      .filter(pos => parseFloat(pos.borrowed) === 0 && parseFloat(pos.supplied) > 0)
      .reduce((sum, pos) => sum + parseFloat(pos.supplied), 0);

    const stakingData = generateHistoricalData(stakingTotal, 30, 'up');

    return { supplyData, borrowData, stakingData };
  }, [totals, positions, vaults]);

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

            {/* Right Column - Charts (3/5) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="lg:col-span-3 space-y-4"
            >
              {/* Supply & Borrow Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ChartCard
                  title={portfolioT("supplied") || "Supply"}
                  value={formatCurrency(totals.totalSupplied)}
                  change={totals.totalSupplied > 0 ? "+12.5%" : undefined}
                  data={chartData.supplyData}
                  color="#10b981"
                  icon={<ArrowUpRight className="w-4 h-4" />}
                />
                <ChartCard
                  title={portfolioT("borrowed") || "Borrow"}
                  value={formatCurrency(totals.totalBorrowed)}
                  change={totals.totalBorrowed > 0 ? "-3.2%" : undefined}
                  data={chartData.borrowData}
                  color="#f97316"
                  icon={<ArrowDownRight className="w-4 h-4" />}
                />
              </div>

              {/* Combined Portfolio Chart */}
              <div className="card-vault p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">{portfolioT("portfolioOverview") || "Portfolio Overview"}</h3>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-success" />
                      <span className="text-muted-foreground">Supply</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-accent" />
                      <span className="text-muted-foreground">Borrow</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                      <span className="text-muted-foreground">Staking</span>
                    </div>
                  </div>
                </div>

                <CombinedChart
                  supplyData={chartData.supplyData}
                  borrowData={chartData.borrowData}
                  stakingData={chartData.stakingData}
                  height={220}
                />

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Total Supply</p>
                    <p className="font-bold text-success">{formatCurrency(totals.totalSupplied)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Total Borrow</p>
                    <p className="font-bold text-accent">{formatCurrency(totals.totalBorrowed)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Staking</p>
                    <p className="font-bold text-primary">{formatCurrency(stakingTotal)}</p>
                  </div>
                </div>
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
