"use client"

import { useState } from "react"
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { IconSettings, IconPercentage, IconWallet, IconShield, IconExternalLink } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CONTRACTS, PROTOCOL_ABI } from "@/lib/contracts"

export default function SettingsPage() {
  const [newSetupFee, setNewSetupFee] = useState("")
  const [newPerformanceFee, setNewPerformanceFee] = useState("")

  // Read current settings from CantorFiProtocol.sol
  // setupFee - line 35
  const { data: setupFee, isLoading: isLoadingSetup } = useReadContract({
    address: CONTRACTS.protocol as `0x${string}`,
    abi: PROTOCOL_ABI,
    functionName: "setupFee",
  })

  // performanceFee - line 38
  const { data: performanceFee, isLoading: isLoadingPerf } = useReadContract({
    address: CONTRACTS.protocol as `0x${string}`,
    abi: PROTOCOL_ABI,
    functionName: "performanceFee",
  })

  // treasury - line 41
  const { data: treasury } = useReadContract({
    address: CONTRACTS.protocol as `0x${string}`,
    abi: PROTOCOL_ABI,
    functionName: "treasury",
  })

  // feeCollector - line 44
  const { data: feeCollector } = useReadContract({
    address: CONTRACTS.protocol as `0x${string}`,
    abi: PROTOCOL_ABI,
    functionName: "feeCollector",
  })

  // vaultCount - line 32
  const { data: vaultCount } = useReadContract({
    address: CONTRACTS.protocol as `0x${string}`,
    abi: PROTOCOL_ABI,
    functionName: "vaultCount",
  })

  // Write functions - setSetupFee (line 189), setPerformanceFee (line 201)
  const { writeContract: updateSetupFee, data: setupHash, isPending: isUpdatingSetup } = useWriteContract()
  const { isLoading: isSetupConfirming, isSuccess: setupSuccess } = useWaitForTransactionReceipt({ hash: setupHash })

  const { writeContract: updatePerformanceFee, data: perfHash, isPending: isUpdatingPerf } = useWriteContract()
  const { isLoading: isPerfConfirming, isSuccess: perfSuccess } = useWaitForTransactionReceipt({ hash: perfHash })

  const handleUpdateSetupFee = () => {
    if (!newSetupFee) return
    // Convert percentage to basis points (1% = 100)
    updateSetupFee({
      address: CONTRACTS.protocol as `0x${string}`,
      abi: PROTOCOL_ABI,
      functionName: "setSetupFee",
      args: [BigInt(Math.round(Number(newSetupFee) * 100))],
    })
  }

  const handleUpdatePerformanceFee = () => {
    if (!newPerformanceFee) return
    // Convert percentage to basis points (1% = 100)
    updatePerformanceFee({
      address: CONTRACTS.protocol as `0x${string}`,
      abi: PROTOCOL_ABI,
      functionName: "setPerformanceFee",
      args: [BigInt(Math.round(Number(newPerformanceFee) * 100))],
    })
  }

  const isLoading = isLoadingSetup || isLoadingPerf

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        {/* Header */}
        <div className="flex items-center justify-between px-4 lg:px-6">
          <div>
            <h1 className="text-2xl font-semibold">Protocol Settings</h1>
            <p className="text-muted-foreground text-sm">
              Configure protocol parameters and fees
            </p>
          </div>
          <Badge variant="outline" className="gap-1">
            <IconSettings className="size-3" />
            Admin Only
          </Badge>
        </div>

        {/* Current Settings Cards */}
        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
          {/* Setup Fee Card - CantorFiProtocol.sol:35 */}
          <Card className="@container/card">
            <CardHeader>
              <CardDescription>Setup Fee</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {isLoading ? (
                  <Skeleton className="h-9 w-20" />
                ) : (
                  `${setupFee ? Number(setupFee) / 100 : 0}%`
                )}
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <IconPercentage className="size-3" />
                  Max 10%
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 font-medium">
                Fee on vault creation
              </div>
              <div className="text-muted-foreground">
                Charged when creating new vaults
              </div>
            </CardFooter>
          </Card>

          {/* Performance Fee Card - CantorFiProtocol.sol:38 */}
          <Card className="@container/card">
            <CardHeader>
              <CardDescription>Performance Fee</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {isLoading ? (
                  <Skeleton className="h-9 w-20" />
                ) : (
                  `${performanceFee ? Number(performanceFee) / 100 : 0}%`
                )}
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <IconPercentage className="size-3" />
                  Max 50%
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 font-medium">
                Fee on revenues
              </div>
              <div className="text-muted-foreground">
                Charged on RWA revenue distribution
              </div>
            </CardFooter>
          </Card>

          {/* Vault Count Card - CantorFiProtocol.sol:32 */}
          <Card className="@container/card">
            <CardHeader>
              <CardDescription>Total Vaults</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {isLoading ? (
                  <Skeleton className="h-9 w-16" />
                ) : (
                  vaultCount?.toString() || "0"
                )}
              </CardTitle>
              <CardAction>
                <Badge variant="outline" className="border-green-500/50 text-green-600 dark:text-green-400">
                  <IconShield className="size-3" />
                  On-chain
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 font-medium">
                Registered vaults
              </div>
              <div className="text-muted-foreground">
                Across all factories
              </div>
            </CardFooter>
          </Card>

          {/* Network Card */}
          <Card className="@container/card">
            <CardHeader>
              <CardDescription>Network</CardDescription>
              <CardTitle className="text-2xl font-semibold @[250px]/card:text-3xl">
                Base Sepolia
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <IconWallet className="size-3" />
                  Testnet
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 font-medium">
                Chain ID: {CONTRACTS.chainId}
              </div>
              <div className="text-muted-foreground font-mono text-xs">
                {CONTRACTS.deployer.slice(0, 10)}...
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Update Fees Section */}
        <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2">
          {/* Update Setup Fee Card */}
          <Card>
            <CardHeader>
              <CardTitle>Update Setup Fee</CardTitle>
              <CardDescription>
                Change the fee charged when creating new vaults (max 10%)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="setup-fee">New Setup Fee (%)</Label>
                <Input
                  id="setup-fee"
                  type="number"
                  step="0.1"
                  max="10"
                  placeholder="2.5"
                  value={newSetupFee}
                  onChange={(e) => setNewSetupFee(e.target.value)}
                />
                <p className="text-muted-foreground text-xs">
                  Current: {setupFee ? Number(setupFee) / 100 : 0}% | Max: 10%
                </p>
              </div>
              <Button
                onClick={handleUpdateSetupFee}
                disabled={!newSetupFee || isUpdatingSetup || isSetupConfirming || Number(newSetupFee) > 10}
                className="w-full"
              >
                {isUpdatingSetup ? "Confirming..." : isSetupConfirming ? "Updating..." : "Update Setup Fee"}
              </Button>
              {setupSuccess && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  Setup fee updated successfully!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Update Performance Fee Card */}
          <Card>
            <CardHeader>
              <CardTitle>Update Performance Fee</CardTitle>
              <CardDescription>
                Change the fee charged on revenue distributions (max 50%)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="perf-fee">New Performance Fee (%)</Label>
                <Input
                  id="perf-fee"
                  type="number"
                  step="0.1"
                  max="50"
                  placeholder="10"
                  value={newPerformanceFee}
                  onChange={(e) => setNewPerformanceFee(e.target.value)}
                />
                <p className="text-muted-foreground text-xs">
                  Current: {performanceFee ? Number(performanceFee) / 100 : 0}% | Max: 50%
                </p>
              </div>
              <Button
                onClick={handleUpdatePerformanceFee}
                disabled={!newPerformanceFee || isUpdatingPerf || isPerfConfirming || Number(newPerformanceFee) > 50}
                className="w-full"
              >
                {isUpdatingPerf ? "Confirming..." : isPerfConfirming ? "Updating..." : "Update Performance Fee"}
              </Button>
              {perfSuccess && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  Performance fee updated successfully!
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Protocol Addresses Table */}
        <div className="px-4 lg:px-6">
          <Card>
            <CardHeader>
              <CardTitle>Protocol Addresses</CardTitle>
              <CardDescription>
                Smart contract addresses configured in the protocol
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader className="bg-muted">
                    <TableRow>
                      <TableHead>Contract</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead className="text-right">Explorer</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Protocol Registry</TableCell>
                      <TableCell className="font-mono text-sm">{CONTRACTS.protocol}</TableCell>
                      <TableCell className="text-right">
                        <a
                          href={`https://sepolia.basescan.org/address/${CONTRACTS.protocol}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary"
                        >
                          <IconExternalLink className="size-4 inline" />
                        </a>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Treasury</TableCell>
                      <TableCell className="font-mono text-sm">{treasury || "Loading..."}</TableCell>
                      <TableCell className="text-right">
                        {treasury && (
                          <a
                            href={`https://sepolia.basescan.org/address/${treasury}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary"
                          >
                            <IconExternalLink className="size-4 inline" />
                          </a>
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Fee Collector</TableCell>
                      <TableCell className="font-mono text-sm">{feeCollector || CONTRACTS.feeCollector}</TableCell>
                      <TableCell className="text-right">
                        <a
                          href={`https://sepolia.basescan.org/address/${feeCollector || CONTRACTS.feeCollector}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary"
                        >
                          <IconExternalLink className="size-4 inline" />
                        </a>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Factory</TableCell>
                      <TableCell className="font-mono text-sm">{CONTRACTS.factory}</TableCell>
                      <TableCell className="text-right">
                        <a
                          href={`https://sepolia.basescan.org/address/${CONTRACTS.factory}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary"
                        >
                          <IconExternalLink className="size-4 inline" />
                        </a>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">USDC Token</TableCell>
                      <TableCell className="font-mono text-sm">{CONTRACTS.usdc}</TableCell>
                      <TableCell className="text-right">
                        <a
                          href={`https://sepolia.basescan.org/address/${CONTRACTS.usdc}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary"
                        >
                          <IconExternalLink className="size-4 inline" />
                        </a>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
