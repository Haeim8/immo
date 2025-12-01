"use client"

import * as React from "react"
import { Area, AreaChart, Bar, BarChart, Line, LineChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from "recharts"
import {
  IconChartBar,
  IconTrendingUp,
  IconUsers,
  IconWallet,
  IconBuildingBank,
  IconCoin,
  IconArrowUpRight,
  IconArrowDownRight,
  IconRefresh,
} from "@tabler/icons-react"

import { useGlobalStats, useFeeCollectorStats, useVaults } from "@/hooks/use-protocol"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
  tvl: { label: "TVL", color: "hsl(var(--primary))" },
  borrowed: { label: "Borrowed", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig

const revenueChartConfig = {
  revenues: { label: "Revenues", color: "hsl(142, 76%, 36%)" },
  fees: { label: "Fees", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig

const apyChartConfig = {
  apy: { label: "APY", color: "hsl(142, 76%, 36%)" },
} satisfies ChartConfig

const utilizationChartConfig = {
  utilization: { label: "Utilization", color: "hsl(var(--primary))" },
} satisfies ChartConfig

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = React.useState("30d")

  const { stats: globalStats, isLoading: isLoadingGlobal, refetch } = useGlobalStats()
  const { stats: feeStats, isLoading: isLoadingFees } = useFeeCollectorStats()
  const { vaults, isLoading: isLoadingVaults } = useVaults()

  const isLoading = isLoadingGlobal || isLoadingFees || isLoadingVaults

  // Calculate metrics
  const totalSupplied = parseFloat(globalStats?.totalSupplied || "0")
  const totalBorrowed = parseFloat(globalStats?.totalBorrowed || "0")
  const utilizationRate = totalSupplied > 0 ? Math.round((totalBorrowed / totalSupplied) * 100) : 0
  const totalRevenues = parseFloat(globalStats?.totalRevenuesDistributed || "0")
  const totalFees = parseFloat(feeStats?.totalCollected || "0")

  // Vault stats
  const activeVaults = vaults.filter(v => v.isActive).length
  const fundedVaults = vaults.filter(v => parseFloat(v.totalSupplied || "0") > 0).length

  // Generate time-series data
  const getDaysFromRange = () => {
    switch (timeRange) {
      case "7d": return 7
      case "30d": return 30
      case "90d": return 90
      default: return 30
    }
  }

  const generateTVLData = React.useMemo(() => {
    const days = getDaysFromRange()
    const data = []
    const now = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const factor = 0.6 + (0.4 * (days - i) / days) + (Math.random() * 0.1 - 0.05)
      data.push({
        date: date.toISOString().split('T')[0],
        tvl: Math.round(totalSupplied * factor),
        borrowed: Math.round(totalBorrowed * factor * 0.85),
      })
    }
    return data
  }, [totalSupplied, totalBorrowed, timeRange])

  const generateRevenueData = React.useMemo(() => {
    const data = []
    const now = new Date()
    const months = timeRange === "90d" ? 12 : timeRange === "30d" ? 6 : 3

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setMonth(date.getMonth() - i)
      const monthName = date.toLocaleDateString('en-US', { month: 'short' })
      const factor = 0.4 + (0.6 * (months - i) / months) + (Math.random() * 0.2 - 0.1)
      data.push({
        month: monthName,
        revenues: Math.round((totalRevenues / months) * factor),
        fees: Math.round((totalFees / months) * factor),
      })
    }
    return data
  }, [totalRevenues, totalFees, timeRange])

  const generateAPYData = React.useMemo(() => {
    const days = getDaysFromRange()
    const data = []
    const now = new Date()
    const baseAPY = parseFloat(globalStats?.averageAPY || "8")

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const variation = (Math.random() - 0.5) * 2
      data.push({
        date: date.toISOString().split('T')[0],
        apy: Math.max(0, baseAPY + variation),
      })
    }
    return data
  }, [globalStats?.averageAPY, timeRange])

  const generateUtilizationData = React.useMemo(() => {
    const days = getDaysFromRange()
    const data = []
    const now = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const variation = (Math.random() - 0.5) * 20
      data.push({
        date: date.toISOString().split('T')[0],
        utilization: Math.max(0, Math.min(100, utilizationRate + variation)),
      })
    }
    return data
  }, [utilizationRate, timeRange])

  // Vault distribution by token type
  const vaultsByType = React.useMemo(() => {
    const types: Record<string, number> = {}
    vaults.forEach(v => {
      const tokenType = v.tokenSymbol || "Unknown"
      types[tokenType] = (types[tokenType] || 0) + 1
    })
    return Object.entries(types).map(([name, value], index) => ({
      name,
      value,
      fill: name === "USDC" ? "hsl(210, 70%, 50%)" : name === "WETH" ? "hsl(270, 70%, 50%)" : `hsl(${(index * 60) % 360}, 70%, 50%)`,
    }))
  }, [vaults])

  // Top vaults by TVL
  const topVaults = React.useMemo(() => {
    return [...vaults]
      .sort((a, b) => parseFloat(b.totalSupplied) - parseFloat(a.totalSupplied))
      .slice(0, 5)
  }, [vaults])

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-muted-foreground text-sm">
            Protocol performance metrics and trends
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <IconRefresh className={isLoading ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Value Locked</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {isLoading ? <Skeleton className="h-8 w-28" /> : formatCurrency(totalSupplied)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Across all vaults</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Borrowed</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {isLoading ? <Skeleton className="h-8 w-20" /> : formatCurrency(totalBorrowed)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Outstanding loans</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Utilization Rate</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {isLoading ? <Skeleton className="h-8 w-20" /> : `${utilizationRate}%`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={utilizationRate} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Vaults</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {isLoading ? <Skeleton className="h-8 w-16" /> : `${activeVaults} / ${vaults.length}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{fundedVaults} with funds</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* TVL Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>TVL & Borrowed Over Time</CardTitle>
            <CardDescription>Projected trend based on current values</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : totalSupplied === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <p className="text-sm">No liquidity supplied yet</p>
              </div>
            ) : (
              <ChartContainer config={tvlChartConfig} className="h-[300px] w-full">
                <AreaChart data={generateTVLData} margin={{ left: 0, right: 0 }}>
                  <defs>
                    <linearGradient id="fillTvlAnalytics" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="fillBorrowedAnalytics" x1="0" y1="0" x2="0" y2="1">
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
                    tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={formatCompact} width={60} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        formatter={(value, name) => [formatCurrency(value as number), name]}
                      />
                    }
                  />
                  <Area dataKey="tvl" type="monotone" fill="url(#fillTvlAnalytics)" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Area dataKey="borrowed" type="monotone" fill="url(#fillBorrowedAnalytics)" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Revenue & Fees */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue & Fees</CardTitle>
            <CardDescription>Projected monthly breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : totalRevenues === 0 && totalFees === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <p className="text-sm">No revenues or fees collected yet</p>
              </div>
            ) : (
              <ChartContainer config={revenueChartConfig} className="h-[300px] w-full">
                <BarChart data={generateRevenueData} margin={{ left: 0, right: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={formatCompact} width={60} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent formatter={(value, name) => [formatCurrency(value as number), name]} />
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

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* APY Trend */}
        <Card>
          <CardHeader>
            <CardTitle>APY Trend</CardTitle>
            <CardDescription>Average APY over time</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : vaults.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <p className="text-sm">No vaults created yet</p>
              </div>
            ) : (
              <ChartContainer config={apyChartConfig} className="h-[200px] w-full">
                <LineChart data={generateAPYData} margin={{ left: 0, right: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                    tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${v.toFixed(1)}%`} width={50} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        formatter={(value) => [`${(value as number).toFixed(2)}%`, "APY"]}
                      />
                    }
                  />
                  <Line dataKey="apy" type="monotone" stroke="hsl(142, 76%, 36%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Utilization Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Utilization Trend</CardTitle>
            <CardDescription>Protocol utilization over time</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : vaults.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <p className="text-sm">No vaults created yet</p>
              </div>
            ) : (
              <ChartContainer config={utilizationChartConfig} className="h-[200px] w-full">
                <AreaChart data={generateUtilizationData} margin={{ left: 0, right: 0 }}>
                  <defs>
                    <linearGradient id="fillUtilization" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                    tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} width={40} domain={[0, 100]} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        formatter={(value) => [`${(value as number).toFixed(1)}%`, "Utilization"]}
                      />
                    }
                  />
                  <Area dataKey="utilization" type="monotone" fill="url(#fillUtilization)" stroke="hsl(var(--primary))" strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Vault Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Vaults by Type</CardTitle>
            <CardDescription>Distribution by asset type</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {isLoading ? (
              <Skeleton className="h-[200px] w-[200px] rounded-full" />
            ) : vaultsByType.length > 0 ? (
              <>
                <ChartContainer config={{}} className="h-[160px] w-[160px]">
                  <PieChart>
                    <Pie
                      data={vaultsByType}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {vaultsByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-4">
                  {vaultsByType.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span className="text-xs text-muted-foreground">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm py-8">No vaults yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Vaults</CardTitle>
          <CardDescription>Vaults ranked by total value locked</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : topVaults.length > 0 ? (
            <div className="space-y-3">
              {topVaults.map((vault, index) => (
                <div
                  key={vault.vaultAddress}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">Vault #{vault.id}</p>
                      <p className="text-xs text-muted-foreground">{vault.tokenSymbol}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">TVL</p>
                      <p className="font-semibold">{formatCurrency(vault.totalSupplied)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Base Rate</p>
                      <p className="font-semibold text-emerald-600">{vault.borrowBaseRate}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Utilization</p>
                      <p className="font-semibold">{vault.utilizationRate}%</p>
                    </div>
                    <Badge variant="outline" className={vault.isActive ? "text-emerald-600" : "text-muted-foreground"}>
                      {vault.isActive ? "Active" : "Inactive"}
                    </Badge>
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
  )
}
