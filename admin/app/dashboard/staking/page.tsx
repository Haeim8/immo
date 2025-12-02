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
  IconInfoCircle,
  IconPlayerPause,
  IconPlayerPlay,
  IconAlertTriangle
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

const STAKING_ADDRESS = CONTRACTS.staking

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

  const { data: isPaused, isLoading: isLoadingPaused, refetch: refetchPaused } = useReadContract({
    address: STAKING_ADDRESS as `0x${string}`,
    abi: STAKING_ABI,
    functionName: "paused",
    query: {
      enabled: isConnected && !!STAKING_ADDRESS,
    },
  })

  const { data: vaultAddress } = useReadContract({
    address: STAKING_ADDRESS as `0x${string}`,
    abi: STAKING_ABI,
    functionName: "vault",
    query: {
      enabled: isConnected && !!STAKING_ADDRESS,
    },
  })

  const { data: cvtTokenAddress } = useReadContract({
    address: STAKING_ADDRESS as `0x${string}`,
    abi: STAKING_ABI,
    functionName: "cvtToken",
    query: {
      enabled: isConnected && !!STAKING_ADDRESS,
    },
  })

  // Write function for updating borrow ratio
  const { writeContract, data: txHash, isPending, error, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  const handleRefresh = () => {
    refetchStaked()
    refetchRatio()
    refetchMaxBorrow()
    refetchStakers()
    refetchPaused()
  }

  const handlePause = () => {
    if (!STAKING_ADDRESS) return
    reset()
    writeContract({
      address: STAKING_ADDRESS as `0x${string}`,
      abi: STAKING_ABI,
      functionName: "pause",
    })
  }

  const handleUnpause = () => {
    if (!STAKING_ADDRESS) return
    reset()
    writeContract({
      address: STAKING_ADDRESS as `0x${string}`,
      abi: STAKING_ABI,
      functionName: "unpause",
    })
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

      {/* Pause Status Alert */}
      {isPaused && (
        <Card className="border-amber-500 bg-amber-500/10">
          <CardContent className="flex items-center gap-4 py-4">
            <IconAlertTriangle className="h-6 w-6 text-amber-500" />
            <div className="flex-1">
              <p className="font-medium text-amber-700 dark:text-amber-400">Staking is Paused</p>
              <p className="text-sm text-amber-600 dark:text-amber-500">Users cannot stake, unstake, or claim rewards while paused.</p>
            </div>
            <Button variant="outline" onClick={handleUnpause} disabled={isPending || isConfirming}>
              <IconPlayerPlay className="h-4 w-4 mr-2" />
              Resume
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Configuration Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Emergency Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconAlertTriangle className="h-5 w-5" />
              Emergency Controls
            </CardTitle>
            <CardDescription>
              Pause or resume staking operations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">Contract Status</p>
                <p className="text-sm text-muted-foreground">
                  {isPaused ? "Staking is currently paused" : "Staking is active"}
                </p>
              </div>
              <Badge variant={isPaused ? "destructive" : "default"}>
                {isPaused ? "Paused" : "Active"}
              </Badge>
            </div>

            <div className="flex gap-2">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handlePause}
                disabled={isPaused === true || isPending || isConfirming}
              >
                <IconPlayerPause className="h-4 w-4 mr-2" />
                Pause Staking
              </Button>
              <Button
                variant="default"
                className="flex-1"
                onClick={handleUnpause}
                disabled={isPaused === false || isPending || isConfirming}
              >
                <IconPlayerPlay className="h-4 w-4 mr-2" />
                Resume Staking
              </Button>
            </div>

            {isSuccess && (
              <div className="flex items-center gap-2 text-emerald-600 text-sm">
                <IconCheck className="h-4 w-4" />
                Operation completed successfully
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
                <span className="text-muted-foreground">Staking Contract</span>
                <a
                  href={`https://sepolia.basescan.org/address/${STAKING_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-primary hover:underline"
                >
                  {STAKING_ADDRESS.slice(0, 6)}...{STAKING_ADDRESS.slice(-4)}
                </a>
              </div>
              {vaultAddress && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Linked Vault</span>
                  <a
                    href={`https://sepolia.basescan.org/address/${vaultAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-primary hover:underline"
                  >
                    {(vaultAddress as string).slice(0, 6)}...{(vaultAddress as string).slice(-4)}
                  </a>
                </div>
              )}
              {cvtTokenAddress && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CVT Token</span>
                  <a
                    href={`https://sepolia.basescan.org/address/${cvtTokenAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-primary hover:underline"
                  >
                    {(cvtTokenAddress as string).slice(0, 6)}...{(cvtTokenAddress as string).slice(-4)}
                  </a>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={isPaused ? "destructive" : "default"} className="text-xs">
                  {isPaused ? "Paused" : "Active"}
                </Badge>
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
