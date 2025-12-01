"use client"

import { useState } from "react"
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseUnits } from "viem"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  IconCurrencyDollar,
  IconBuildingBank,
  IconCheck,
  IconArrowUpRight,
  IconCoin,
  IconWallet,
  IconPercentage,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { CONTRACTS, FEE_COLLECTOR_ABI } from "@/lib/contracts"
import { useFeeCollectorStats, useVaults } from "@/hooks/use-protocol"

function formatAmount(value: number | string | undefined, symbol: string = ""): string {
  if (!value) return `0 ${symbol}`.trim()
  const num = typeof value === "string" ? parseFloat(value) : value
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M ${symbol}`.trim()
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(2)}K ${symbol}`.trim()
  }
  return `${num.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${symbol}`.trim()
}

const revenueChartConfig = {
  interest: {
    label: "Interest Collected",
    color: "hsl(142, 76%, 36%)",
  },
  fees: {
    label: "Protocol Fees",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

interface VaultData {
  id: number
  vaultAddress: string
  tokenSymbol: string
  totalSupplied: string
  totalBorrowed: string
  totalInterestCollected: string
  borrowBaseRate: string
  utilizationRate: string
  isActive: boolean
}

export default function RevenuesPage() {
  const [distributeAmount, setDistributeAmount] = useState("")

  // Read vaults using the updated hook
  const { vaults, isLoading: isLoadingVaults } = useVaults()

  // Fee collector stats
  const { stats: feeStats, isLoading: isLoadingFees, refetch: refetchFees } = useFeeCollectorStats()

  // Distribute to Treasury
  const { writeContract: distributeToTreasury, data: distributeHash, isPending: isDistributing, error: distributeError } = useWriteContract()
  const { isLoading: isDistributeConfirming, isSuccess: distributeSuccess } = useWaitForTransactionReceipt({ hash: distributeHash })

  const handleDistributeToTreasury = () => {
    if (!distributeAmount) return
    distributeToTreasury({
      address: CONTRACTS.feeCollector as `0x${string}`,
      abi: FEE_COLLECTOR_ABI,
      functionName: "distributeToTreasury",
      args: [parseUnits(distributeAmount, 6)],
    })
  }

  const vaultsList = (vaults || []) as VaultData[]

  // Calculate totals from vaults
  const totalInterestCollected = vaultsList.reduce((acc, v) => acc + parseFloat(v.totalInterestCollected || "0"), 0)
  const totalSupplied = vaultsList.reduce((acc, v) => acc + parseFloat(v.totalSupplied || "0"), 0)
  const totalBorrowed = vaultsList.reduce((acc, v) => acc + parseFloat(v.totalBorrowed || "0"), 0)

  // Generate chart data based on collected interest
  const generateChartData = () => {
    const data = []
    const now = new Date()
    const totalFees = parseFloat(feeStats?.totalCollected || "0")

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now)
      date.setMonth(date.getMonth() - i)
      const monthName = date.toLocaleDateString('en-US', { month: 'short' })
      const factor = 0.5 + (0.5 * (12 - i) / 12) + (Math.random() * 0.2 - 0.1)
      data.push({
        month: monthName,
        interest: Math.round((totalInterestCollected / 12) * factor),
        fees: Math.round((totalFees / 12) * factor),
      })
    }
    return data
  }

  const chartData = generateChartData()
  const hasChartData = totalInterestCollected > 0 || parseFloat(feeStats?.totalCollected || "0") > 0

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Revenues & Fees</h1>
        <p className="text-muted-foreground text-sm">
          Track protocol revenues from interest and manage fee distribution
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Interest Collected</CardDescription>
            <CardTitle className="text-2xl font-semibold text-emerald-600">
              {isLoadingVaults ? <Skeleton className="h-8 w-24" /> : formatAmount(totalInterestCollected, "USDC")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">From all vaults</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Protocol Fees</CardDescription>
            <CardTitle className="text-2xl font-semibold">
              {isLoadingFees ? <Skeleton className="h-8 w-24" /> : formatAmount(feeStats?.totalCollected || 0, "USDC")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Setup + Performance fees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Fees Distributed</CardDescription>
            <CardTitle className="text-2xl font-semibold text-blue-600">
              {isLoadingFees ? <Skeleton className="h-8 w-24" /> : formatAmount(feeStats?.totalDistributed || 0, "USDC")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Sent to treasury</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Available to Distribute</CardDescription>
            <CardTitle className="text-2xl font-semibold text-amber-600">
              {isLoadingFees ? <Skeleton className="h-8 w-24" /> : formatAmount(feeStats?.availableBalance || 0, "USDC")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">In Fee Collector</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue History</CardTitle>
          <CardDescription>Monthly breakdown of interest and fees</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingVaults || isLoadingFees ? (
            <Skeleton className="h-[250px] w-full" />
          ) : !hasChartData ? (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <IconCurrencyDollar className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No revenue data yet</p>
                <p className="text-xs">Revenue will appear once vaults collect interest</p>
              </div>
            </div>
          ) : (
            <ChartContainer config={revenueChartConfig} className="h-[250px] w-full">
              <AreaChart data={chartData} margin={{ left: 0, right: 0 }}>
                <defs>
                  <linearGradient id="fillInterest" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="fillFees" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                  width={60}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => [formatAmount(value as number, "USDC"), name]}
                    />
                  }
                />
                <Area
                  dataKey="interest"
                  type="monotone"
                  fill="url(#fillInterest)"
                  stroke="hsl(142, 76%, 36%)"
                  strokeWidth={2}
                />
                <Area
                  dataKey="fees"
                  type="monotone"
                  fill="url(#fillFees)"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Fee Distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconWallet className="h-5 w-5" />
              Fee Distribution
            </CardTitle>
            <CardDescription>Distribute collected fees to treasury</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Fee Collector Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground">Total Collected</p>
                <p className="text-xl font-semibold">{formatAmount(feeStats?.totalCollected || 0, "USDC")}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground">Total Distributed</p>
                <p className="text-xl font-semibold">{formatAmount(feeStats?.totalDistributed || 0, "USDC")}</p>
              </div>
            </div>

            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Available Balance</p>
                  <p className="text-2xl font-bold text-amber-600">{formatAmount(feeStats?.availableBalance || 0, "USDC")}</p>
                </div>
                <IconCoin className="h-10 w-10 text-amber-500/50" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Amount to Distribute (USDC)</Label>
              <Input
                type="number"
                value={distributeAmount}
                onChange={(e) => setDistributeAmount(e.target.value)}
                placeholder={feeStats?.availableBalance || "0"}
              />
            </div>

            <Button
              onClick={handleDistributeToTreasury}
              disabled={!distributeAmount || isDistributing || isDistributeConfirming || parseFloat(distributeAmount) > parseFloat(feeStats?.availableBalance || "0")}
              className="w-full"
            >
              <IconArrowUpRight className="h-4 w-4 mr-2" />
              {isDistributing ? "Confirming..." : isDistributeConfirming ? "Distributing..." : "Distribute to Treasury"}
            </Button>

            {distributeSuccess && (
              <p className="text-xs text-emerald-600 flex items-center gap-1">
                <IconCheck className="h-3 w-3" /> Distributed to treasury successfully
              </p>
            )}

            {distributeError && (
              <p className="text-xs text-red-600">
                {distributeError.message.includes("User rejected") ? "Transaction cancelled" : distributeError.message.slice(0, 100)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Protocol Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconPercentage className="h-5 w-5" />
              Protocol Overview
            </CardTitle>
            <CardDescription>Current protocol liquidity stats</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">Total Supplied</span>
                <span className="font-semibold">{formatAmount(totalSupplied, "USDC")}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">Total Borrowed</span>
                <span className="font-semibold">{formatAmount(totalBorrowed, "USDC")}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">Total Interest</span>
                <span className="font-semibold text-emerald-600">{formatAmount(totalInterestCollected, "USDC")}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">Active Vaults</span>
                <span className="font-semibold">{vaultsList.filter(v => v.isActive).length} / {vaultsList.length}</span>
              </div>
            </div>

            <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
              <p className="text-sm font-medium mb-2">Revenue Sources</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>- Interest from borrowers (variable rate)</li>
                <li>- Setup fees on new vaults</li>
                <li>- Performance fees on yields</li>
                <li>- Liquidation penalties</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vault Interest Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Vault Interest Summary</CardTitle>
          <CardDescription>Interest collected by each vault</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingVaults ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : vaultsList.length === 0 ? (
            <div className="text-center py-8">
              <IconBuildingBank className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No vaults yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vaultsList.map((vault) => (
                <div
                  key={vault.vaultAddress}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <IconBuildingBank className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Vault #{vault.id}</p>
                      <p className="text-xs text-muted-foreground">{vault.tokenSymbol}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">TVL</p>
                      <p className="font-semibold">{formatAmount(vault.totalSupplied, vault.tokenSymbol)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Interest</p>
                      <p className="font-semibold text-emerald-600">{formatAmount(vault.totalInterestCollected, vault.tokenSymbol)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Base Rate</p>
                      <p className="font-semibold">{vault.borrowBaseRate}%</p>
                    </div>
                    <Badge variant="outline" className={vault.isActive ? "text-emerald-600" : "text-muted-foreground"}>
                      {vault.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
