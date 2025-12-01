"use client"

import * as React from "react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from "recharts"
import { IconTrendingUp, IconWallet, IconCoin, IconBuildingBank, IconArrowUpRight, IconArrowDownRight } from "@tabler/icons-react"

import { useGlobalStats, useFeeCollectorStats, useVaults } from "@/hooks/use-protocol"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"

function formatCurrency(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

function formatCompact(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
  return `$${value}`
}

// Chart configs
const tvlChartConfig = {
  tvl: {
    label: "TVL",
    color: "hsl(var(--primary))",
  },
  borrowed: {
    label: "Borrowed",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

const revenueChartConfig = {
  revenues: {
    label: "Revenues",
    color: "hsl(142, 76%, 36%)",
  },
  fees: {
    label: "Fees",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

const vaultDistributionConfig = {
  active: {
    label: "Active",
    color: "hsl(142, 76%, 36%)",
  },
  funding: {
    label: "Funding",
    color: "hsl(var(--chart-2))",
  },
  closed: {
    label: "Closed",
    color: "hsl(var(--muted-foreground))",
  },
} satisfies ChartConfig

export default function DashboardPage() {
  const { stats: globalStats, isLoading: isLoadingGlobal } = useGlobalStats()
  const { stats: feeStats, isLoading: isLoadingFees } = useFeeCollectorStats()
  const { vaults, isLoading: isLoadingVaults } = useVaults()

  const isLoading = isLoadingGlobal || isLoadingFees || isLoadingVaults

  // Calculate metrics
  const totalSupplied = parseFloat(globalStats?.totalSupplied || "0")
  const totalBorrowed = parseFloat(globalStats?.totalBorrowed || "0")
  const utilizationRate = totalSupplied > 0 ? Math.round((totalBorrowed / totalSupplied) * 100) : 0
  const availableLiquidity = totalSupplied - totalBorrowed
  const totalRevenues = parseFloat(globalStats?.totalRevenuesDistributed || "0")
  const totalFees = parseFloat(feeStats?.totalCollected || "0")

  // Vault distribution
  const activeVaults = vaults.filter(v => v.isActive).length
  const fundingVaults = vaults.filter(v => !v.isActive && parseFloat(v.fundingProgress) < 100).length
  const closedVaults = vaults.length - activeVaults - fundingVaults

  const vaultDistributionData = [
    { name: "Active", value: activeVaults, fill: "hsl(142, 76%, 36%)" },
    { name: "Funding", value: fundingVaults, fill: "hsl(var(--chart-2))" },
    { name: "Closed", value: closedVaults, fill: "hsl(var(--muted-foreground))" },
  ].filter(d => d.value > 0)

  // Generate mock historical data based on real current values (for demo - replace with real data later)
  const generateHistoricalData = () => {
    const data = []
    const now = new Date()
    const currentTVL = totalSupplied
    const currentBorrowed = totalBorrowed

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const factor = 0.7 + (0.3 * (30 - i) / 30) + (Math.random() * 0.1 - 0.05)
      data.push({
        date: date.toISOString().split('T')[0],
        tvl: Math.round(currentTVL * factor),
        borrowed: Math.round(currentBorrowed * factor * 0.9),
      })
    }
    return data
  }

  const generateRevenueData = () => {
    const data = []
    const now = new Date()
    const totalRevenues = parseFloat(globalStats?.totalRevenuesDistributed || "0")
    const totalFees = parseFloat(feeStats?.totalCollected || "0")

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now)
      date.setMonth(date.getMonth() - i)
      const monthName = date.toLocaleDateString('en-US', { month: 'short' })
      const factor = 0.5 + (0.5 * (12 - i) / 12) + (Math.random() * 0.2 - 0.1)
      data.push({
        month: monthName,
        revenues: Math.round((totalRevenues / 12) * factor),
        fees: Math.round((totalFees / 12) * factor),
      })
    }
    return data
  }

  const tvlData = React.useMemo(() => generateHistoricalData(), [totalSupplied, totalBorrowed])
  const revenueData = React.useMemo(() => generateRevenueData(), [globalStats?.totalRevenuesDistributed, feeStats?.totalCollected])

  // Top vaults by TVL
  const topVaults = React.useMemo(() => {
    return [...vaults]
      .sort((a, b) => parseFloat(b.totalSupplied) - parseFloat(a.totalSupplied))
      .slice(0, 5)
  }, [vaults])

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Overview of your protocol performance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* TVL Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Value Locked</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {isLoading ? <Skeleton className="h-8 w-28" /> : formatCurrency(totalSupplied)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Across all active vaults</p>
          </CardContent>
        </Card>

        {/* Borrowed Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Borrowed</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {isLoading ? <Skeleton className="h-8 w-28" /> : formatCurrency(totalBorrowed)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Utilization:</span>
              <span className="font-medium">{utilizationRate}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Revenues Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Revenues</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {isLoading ? <Skeleton className="h-8 w-28" /> : formatCurrency(globalStats?.totalRevenuesDistributed || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Distributed to suppliers</p>
          </CardContent>
        </Card>

        {/* Fees Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Protocol Fees</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {isLoading ? <Skeleton className="h-8 w-28" /> : formatCurrency(feeStats?.totalCollected || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Available:</span>
              <span className="font-medium text-emerald-600">{formatCurrency(feeStats?.availableBalance || 0)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* TVL Chart */}
        <Card>
          <CardHeader>
            <CardTitle>TVL & Borrowed Over Time</CardTitle>
            <CardDescription>Projected trend based on current values</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : totalSupplied === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <p className="text-sm">No liquidity supplied yet</p>
              </div>
            ) : (
              <ChartContainer config={tvlChartConfig} className="h-[250px] w-full">
                <AreaChart data={tvlData} margin={{ left: 0, right: 0 }}>
                  <defs>
                    <linearGradient id="fillTvl" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="fillBorrowed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                    tickFormatter={(value) => {
                      const date = new Date(value)
                      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatCompact(value)}
                    width={60}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        formatter={(value, name) => [formatCurrency(value as number), name]}
                      />
                    }
                  />
                  <Area
                    dataKey="tvl"
                    type="monotone"
                    fill="url(#fillTvl)"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                  />
                  <Area
                    dataKey="borrowed"
                    type="monotone"
                    fill="url(#fillBorrowed)"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenues & Fees</CardTitle>
            <CardDescription>Projected breakdown based on totals</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : totalRevenues === 0 && totalFees === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <p className="text-sm">No revenues or fees collected yet</p>
              </div>
            ) : (
              <ChartContainer config={revenueChartConfig} className="h-[250px] w-full">
                <BarChart data={revenueData} margin={{ left: 0, right: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatCompact(value)}
                    width={60}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => [formatCurrency(value as number), name]}
                      />
                    }
                  />
                  <Bar dataKey="revenues" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="fees" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Vault Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Vault Distribution</CardTitle>
            <CardDescription>{vaults.length} total vaults</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {isLoading ? (
              <Skeleton className="h-[180px] w-[180px] rounded-full" />
            ) : vaultDistributionData.length > 0 ? (
              <>
                <ChartContainer config={vaultDistributionConfig} className="h-[180px] w-[180px]">
                  <PieChart>
                    <Pie
                      data={vaultDistributionData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {vaultDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
                <div className="flex flex-wrap justify-center gap-4">
                  {vaultDistributionData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span className="text-sm text-muted-foreground">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">No vaults yet</p>
            )}
          </CardContent>
        </Card>

        {/* Protocol Health */}
        <Card>
          <CardHeader>
            <CardTitle>Protocol Health</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Utilization */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Utilization Rate</span>
                <span className="font-medium">{utilizationRate}%</span>
              </div>
              <Progress value={utilizationRate} className="h-2" />
            </div>

            {/* Available Liquidity */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Available Liquidity</span>
              <span className="font-semibold text-emerald-600">
                {isLoading ? <Skeleton className="h-5 w-20" /> : formatCurrency(availableLiquidity)}
              </span>
            </div>

            {/* Active Vault Ratio */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Active Vault Ratio</span>
                <span className="font-medium">
                  {vaults.length > 0 ? Math.round((activeVaults / vaults.length) * 100) : 0}%
                </span>
              </div>
              <Progress value={vaults.length > 0 ? (activeVaults / vaults.length) * 100 : 0} className="h-2" />
            </div>

            {/* Average APY */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Average APY</span>
              <Badge variant="outline" className="text-emerald-600 border-emerald-600/30">
                {globalStats?.averageAPY || 0}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Top Vaults */}
        <Card>
          <CardHeader>
            <CardTitle>Top Vaults by TVL</CardTitle>
            <CardDescription>Highest funded vaults</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : topVaults.length > 0 ? (
              <div className="space-y-3">
                {topVaults.map((vault, index) => (
                  <div key={vault.vaultAddress} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-5">#{index + 1}</span>
                      <div>
                        <p className="text-sm font-medium truncate max-w-[120px]">Vault #{vault.id}</p>
                        <p className="text-xs text-muted-foreground">{vault.tokenSymbol}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(vault.totalSupplied)}</p>
                      <p className="text-xs text-muted-foreground">{vault.utilizationRate}% util.</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">No vaults yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
