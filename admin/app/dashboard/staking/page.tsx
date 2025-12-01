"use client"

import { useState } from "react"
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { formatUnits } from "viem"
import {
  IconCoins,
  IconUsers,
  IconTrendingUp,
  IconLock,
  IconSettings,
  IconRefresh,
  IconCheck,
  IconInfoCircle
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
import { CONTRACTS, STAKING_ABI } from "@/lib/contracts"

// Note: CVTStaking contract address should be added to CONTRACTS
// For now we'll use a placeholder - update when deployed
const STAKING_ADDRESS = process.env.NEXT_PUBLIC_STAKING_ADDRESS || ""

function formatAmount(value: string | number | undefined): string {
  if (!value) return "0"
  const num = typeof value === "string" ? parseFloat(value) : value
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(2)}K`
  }
  return num.toLocaleString(undefined, { maximumFractionDigits: 4 })
}

export default function StakingPage() {
  const { isConnected } = useAccount()
  const [newBorrowRatio, setNewBorrowRatio] = useState("")

  // Read staking stats
  const { data: totalStaked, isLoading: isLoadingStaked, refetch: refetchStaked } = useReadContract({
    address: STAKING_ADDRESS as `0x${string}`,
    abi: STAKING_ABI,
    functionName: "totalStaked",
    query: {
      enabled: isConnected && !!STAKING_ADDRESS,
    },
  })

  const { data: maxBorrowRatio, isLoading: isLoadingRatio, refetch: refetchRatio } = useReadContract({
    address: STAKING_ADDRESS as `0x${string}`,
    abi: STAKING_ABI,
    functionName: "maxProtocolBorrowRatio",
    query: {
      enabled: isConnected && !!STAKING_ADDRESS,
    },
  })

  const { data: maxProtocolBorrow, isLoading: isLoadingMaxBorrow, refetch: refetchMaxBorrow } = useReadContract({
    address: STAKING_ADDRESS as `0x${string}`,
    abi: STAKING_ABI,
    functionName: "getMaxProtocolBorrow",
    query: {
      enabled: isConnected && !!STAKING_ADDRESS,
    },
  })

  const { data: stakersCount, isLoading: isLoadingStakers, refetch: refetchStakers } = useReadContract({
    address: STAKING_ADDRESS as `0x${string}`,
    abi: STAKING_ABI,
    functionName: "getStakersCount",
    query: {
      enabled: isConnected && !!STAKING_ADDRESS,
    },
  })

  const { data: rewardIndex, isLoading: isLoadingRewards } = useReadContract({
    address: STAKING_ADDRESS as `0x${string}`,
    abi: STAKING_ABI,
    functionName: "rewardIndex",
    query: {
      enabled: isConnected && !!STAKING_ADDRESS,
    },
  })

  // Write function for updating borrow ratio
  const { writeContract, data: txHash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  const handleRefresh = () => {
    refetchStaked()
    refetchRatio()
    refetchMaxBorrow()
    refetchStakers()
  }

  const handleUpdateBorrowRatio = () => {
    if (!newBorrowRatio || !STAKING_ADDRESS) return
    // Convert percentage to basis points (1% = 100 bps)
    const bps = BigInt(Math.round(Number(newBorrowRatio) * 100))
    writeContract({
      address: STAKING_ADDRESS as `0x${string}`,
      abi: STAKING_ABI,
      functionName: "setMaxProtocolBorrowRatio",
      args: [bps],
    })
  }

  const isLoading = isLoadingStaked || isLoadingRatio || isLoadingMaxBorrow || isLoadingStakers

  // Format values
  const totalStakedFormatted = totalStaked ? formatUnits(totalStaked as bigint, 6) : "0"
  const maxBorrowFormatted = maxProtocolBorrow ? formatUnits(maxProtocolBorrow as bigint, 6) : "0"
  const currentRatioFormatted = maxBorrowRatio ? (Number(maxBorrowRatio) / 100).toFixed(2) : "0"
  const stakersCountNum = stakersCount ? Number(stakersCount) : 0
  const rewardIndexFormatted = rewardIndex ? formatUnits(rewardIndex as bigint, 18) : "0"

  if (!STAKING_ADDRESS) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Staking</h1>
            <p className="text-muted-foreground text-sm">
              Manage CVT staking and protocol borrow limits
            </p>
          </div>
        </div>

        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <IconInfoCircle className="h-12 w-12 text-amber-500 mb-4" />
            <h3 className="text-lg font-medium">Staking Contract Not Configured</h3>
            <p className="text-muted-foreground text-sm mt-1 max-w-md">
              The CVTStaking contract address is not set. Add <code className="bg-muted px-1 rounded">NEXT_PUBLIC_STAKING_ADDRESS</code> to your environment variables.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Staking</h1>
          <p className="text-muted-foreground text-sm">
            Manage CVT staking and protocol borrow limits
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
          <IconRefresh className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[100px] w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <IconCoins className="h-4 w-4" />
                Total Staked
              </CardDescription>
              <CardTitle className="text-2xl">
                {formatAmount(totalStakedFormatted)} <span className="text-sm font-normal text-muted-foreground">USDC</span>
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <IconUsers className="h-4 w-4" />
                Stakers
              </CardDescription>
              <CardTitle className="text-2xl">{stakersCountNum}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <IconLock className="h-4 w-4" />
                Max Protocol Borrow
              </CardDescription>
              <CardTitle className="text-2xl">
                {formatAmount(maxBorrowFormatted)} <span className="text-sm font-normal text-muted-foreground">USDC</span>
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <IconTrendingUp className="h-4 w-4" />
                Borrow Ratio
              </CardDescription>
              <CardTitle className="text-2xl">{currentRatioFormatted}%</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Configuration Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Update Borrow Ratio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconSettings className="h-5 w-5" />
              Protocol Borrow Ratio
            </CardTitle>
            <CardDescription>
              Set the maximum percentage of staked funds that the protocol can borrow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="borrowRatio">New Borrow Ratio (%)</Label>
              <div className="flex gap-2">
                <Input
                  id="borrowRatio"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  placeholder={`Current: ${currentRatioFormatted}%`}
                  value={newBorrowRatio}
                  onChange={(e) => setNewBorrowRatio(e.target.value)}
                />
                <Button
                  onClick={handleUpdateBorrowRatio}
                  disabled={!newBorrowRatio || isPending || isConfirming}
                >
                  {isPending || isConfirming ? "..." : "Update"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This determines how much of the staked liquidity the protocol can use for borrowing.
              </p>
            </div>

            {isSuccess && (
              <div className="flex items-center gap-2 text-emerald-600 text-sm">
                <IconCheck className="h-4 w-4" />
                Borrow ratio updated successfully
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive">
                {error.message.includes("User rejected")
                  ? "Transaction cancelled"
                  : error.message.slice(0, 200)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Staking Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconInfoCircle className="h-5 w-5" />
              Staking Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contract Address</span>
                <a
                  href={`https://sepolia.basescan.org/address/${STAKING_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-primary hover:underline"
                >
                  {STAKING_ADDRESS.slice(0, 6)}...{STAKING_ADDRESS.slice(-4)}
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Staked</span>
                <span className="font-medium">{formatAmount(totalStakedFormatted)} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Stakers</span>
                <span className="font-medium">{stakersCountNum}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Borrow Ratio</span>
                <span className="font-medium">{currentRatioFormatted}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max Protocol Borrow</span>
                <span className="font-medium">{formatAmount(maxBorrowFormatted)} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reward Index</span>
                <span className="font-medium">{parseFloat(rewardIndexFormatted).toFixed(6)}</span>
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <p className="text-sm font-medium">How Staking Works</p>
              <p className="text-xs text-muted-foreground">
                Users stake USDC to earn rewards from protocol fees. The protocol can borrow up to {currentRatioFormatted}% of staked funds for operations. Stakers receive proportional rewards based on their stake amount and duration.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Staking Activity</CardTitle>
          <CardDescription>Recent staking and unstaking events</CardDescription>
        </CardHeader>
        <CardContent>
          {stakersCountNum === 0 ? (
            <div className="py-8 text-center">
              <IconCoins className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No stakers yet</p>
              <p className="text-muted-foreground text-xs mt-1">Staking activity will appear here</p>
            </div>
          ) : (
            <div className="py-8 text-center">
              <Badge variant="outline" className="mb-3">{stakersCountNum} active stakers</Badge>
              <p className="text-muted-foreground text-xs">
                View detailed staking events on the block explorer
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
