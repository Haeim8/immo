"use client"

import { IconBuildingBank, IconCoin, IconPercentage, IconTrendingUp, IconUsers, IconWallet } from "@tabler/icons-react"
import { useGlobalStats, useFeeCollectorStats } from "@/hooks/use-protocol"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

function formatCurrency(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

export function SectionCards() {
  const { stats: globalStats, isLoading: isLoadingGlobal } = useGlobalStats()
  const { stats: feeStats, isLoading: isLoadingFees } = useFeeCollectorStats()

  const isLoading = isLoadingGlobal || isLoadingFees

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Value Locked (TVL)</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoading ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              formatCurrency(globalStats?.totalSupplied || 0)
            )}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconWallet className="size-3" />
              USDC
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Total supplied across all vaults <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {isLoading ? <Skeleton className="h-4 w-24" /> : `${globalStats?.activeVaults || 0} active vaults`}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Fees Collected</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoading ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              formatCurrency(feeStats?.totalCollected || 0)
            )}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconPercentage className="size-3" />
              Fees
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Setup + Performance fees <IconCoin className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {isLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              `${formatCurrency(feeStats?.availableBalance || 0)} available`
            )}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Borrowed</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoading ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              formatCurrency(globalStats?.totalBorrowed || 0)
            )}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconUsers className="size-3" />
              Loans
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Active loans across vaults <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {isLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              `${formatCurrency(globalStats?.totalRevenuesDistributed || 0)} revenues distributed`
            )}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Average APY</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoading ? (
              <Skeleton className="h-9 w-20" />
            ) : (
              `${globalStats?.averageAPY || 0}%`
            )}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp className="size-3" />
              APY
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Weighted average across vaults <IconBuildingBank className="size-4" />
          </div>
          <div className="text-muted-foreground">Based on utilization rate</div>
        </CardFooter>
      </Card>
    </div>
  )
}
