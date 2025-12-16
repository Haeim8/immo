"use client"

import { useState } from "react"
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseUnits } from "viem"
import {
  IconBuildingBank,
  IconExternalLink,
  IconPlayerPause,
  IconPlayerPlay,
  IconCheck,
  IconX,
  IconCurrencyDollar,
  IconPercentage,
  IconSettings,
  IconLoader2
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { VAULT_ABI } from "@/lib/contracts"
import { useVaults } from "@/hooks/use-protocol"

function formatAmount(value: string | number | undefined, symbol: string = ""): string {
  if (!value) return `0 ${symbol}`.trim()
  const num = typeof value === "string" ? parseFloat(value) : value
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M ${symbol}`.trim()
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(2)}K ${symbol}`.trim()
  }
  return `${num.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${symbol}`.trim()
}

interface VaultData {
  id: number
  vaultAddress: string
  tokenAddress: string
  tokenSymbol: string
  decimals: number
  maxLiquidity: string
  borrowBaseRate: string
  borrowSlope: string
  maxBorrowRatio: string
  liquidationBonus: string
  isActive: boolean
  createdAt: Date
  treasury: string
  totalSupplied: string
  totalBorrowed: string
  availableLiquidity: string
  utilizationRate: string
  totalInterestCollected: string
  lastInterestUpdate: Date | null
  totalBadDebt: string
  status: string
  fundingProgress: string
}

export default function VaultsPage() {
  const [selectedVault, setSelectedVault] = useState<VaultData | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [newMaxLiquidity, setNewMaxLiquidity] = useState("")
  const [newBorrowBaseRate, setNewBorrowBaseRate] = useState("")
  const [newBorrowSlope, setNewBorrowSlope] = useState("")
  const [newMaxBorrowRatio, setNewMaxBorrowRatio] = useState("")

  // Read vaults using the updated hook
  const { vaults, isLoading, refetch } = useVaults()

  // Write functions for pause/unpause
  const { writeContract: pauseVault, data: pauseHash, isPending: isPausing } = useWriteContract()
  const { isLoading: isPauseConfirming, isSuccess: pauseSuccess } = useWaitForTransactionReceipt({ hash: pauseHash })

  const { writeContract: unpauseVault, data: unpauseHash, isPending: isUnpausing } = useWriteContract()
  const { isLoading: isUnpauseConfirming, isSuccess: unpauseSuccess } = useWaitForTransactionReceipt({ hash: unpauseHash })

  // Write functions for config updates
  const { writeContract: setMaxLiquidityFn, data: maxLiqHash, isPending: isSettingMaxLiq } = useWriteContract()
  const { isLoading: isMaxLiqConfirming, isSuccess: maxLiqSuccess } = useWaitForTransactionReceipt({ hash: maxLiqHash })

  const { writeContract: setBorrowRatesFn, data: ratesHash, isPending: isSettingRates } = useWriteContract()
  const { isLoading: isRatesConfirming, isSuccess: ratesSuccess } = useWaitForTransactionReceipt({ hash: ratesHash })

  const { writeContract: setMaxBorrowRatioFn, data: ltvHash, isPending: isSettingLTV } = useWriteContract()
  const { isLoading: isLTVConfirming, isSuccess: ltvSuccess } = useWaitForTransactionReceipt({ hash: ltvHash })

  const handleSelectVault = (vault: VaultData) => {
    setSelectedVault(vault)
    setSheetOpen(true)
  }

  const handlePauseVault = () => {
    if (!selectedVault) return
    pauseVault({
      address: selectedVault.vaultAddress as `0x${string}`,
      abi: VAULT_ABI,
      functionName: "pause",
    })
  }

  const handleUnpauseVault = () => {
    if (!selectedVault) return
    unpauseVault({
      address: selectedVault.vaultAddress as `0x${string}`,
      abi: VAULT_ABI,
      functionName: "unpause",
    })
  }

  const handleSetMaxLiquidity = () => {
    if (!selectedVault || !newMaxLiquidity) return
    const amount = parseUnits(newMaxLiquidity, selectedVault.decimals)
    setMaxLiquidityFn({
      address: selectedVault.vaultAddress as `0x${string}`,
      abi: VAULT_ABI,
      functionName: "setMaxLiquidity",
      args: [amount],
    })
  }

  const handleSetBorrowRates = () => {
    if (!selectedVault || !newBorrowBaseRate || !newBorrowSlope) return
    // Rates are in basis points (e.g., 500 = 5%)
    const baseRate = BigInt(Math.round(parseFloat(newBorrowBaseRate) * 100))
    const slope = BigInt(Math.round(parseFloat(newBorrowSlope) * 100))
    setBorrowRatesFn({
      address: selectedVault.vaultAddress as `0x${string}`,
      abi: VAULT_ABI,
      functionName: "setBorrowRates",
      args: [baseRate, slope],
    })
  }

  const handleSetMaxBorrowRatio = () => {
    if (!selectedVault || !newMaxBorrowRatio) return
    // Ratio in basis points (e.g., 7000 = 70%)
    const ratio = BigInt(Math.round(parseFloat(newMaxBorrowRatio) * 100))
    setMaxBorrowRatioFn({
      address: selectedVault.vaultAddress as `0x${string}`,
      abi: VAULT_ABI,
      functionName: "setMaxBorrowRatio",
      args: [ratio],
    })
  }

  const vaultsList = vaults || []

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Vaults</h1>
          <p className="text-muted-foreground text-sm">
            Manage all protocol vaults and their configurations
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Vaults</CardDescription>
            <CardTitle className="text-2xl">{vaultsList.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-2xl text-emerald-600">
              {vaultsList.filter((v: VaultData) => v.isActive).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>USDC Vaults</CardDescription>
            <CardTitle className="text-2xl text-blue-600">
              {vaultsList.filter((v: VaultData) => v.tokenSymbol === "USDC").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>WETH Vaults</CardDescription>
            <CardTitle className="text-2xl text-purple-600">
              {vaultsList.filter((v: VaultData) => v.tokenSymbol === "WETH").length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Vaults Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[280px] w-full rounded-lg" />
          ))}
        </div>
      ) : vaultsList.length === 0 ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <IconBuildingBank className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No vaults yet</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Create your first vault to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {vaultsList.map((vault: VaultData) => {
            const fundingPercent = parseFloat(vault.fundingProgress)
            const utilizationPercent = parseFloat(vault.utilizationRate)

            return (
              <Card
                key={vault.vaultAddress}
                className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
                onClick={() => handleSelectVault(vault)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <IconBuildingBank className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Vault #{vault.id}</CardTitle>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <IconCurrencyDollar className="h-3 w-3" />
                          {vault.tokenSymbol}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{vault.tokenSymbol}</Badge>
                      <Badge
                        variant="outline"
                        className={vault.isActive
                          ? "border-emerald-500/50 text-emerald-600"
                          : "text-muted-foreground"
                        }
                      >
                        {vault.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">TVL</p>
                      <p className="text-sm font-semibold">{formatAmount(vault.totalSupplied, vault.tokenSymbol)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Borrowed</p>
                      <p className="text-sm font-semibold">{formatAmount(vault.totalBorrowed, vault.tokenSymbol)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Interest Collected</p>
                      <p className="text-sm font-semibold text-emerald-600">{formatAmount(vault.totalInterestCollected, vault.tokenSymbol)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Base Rate</p>
                      <p className="text-sm font-semibold">{vault.borrowBaseRate}%</p>
                    </div>
                  </div>

                  {/* Progress Bars */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Funding</span>
                        <span>{fundingPercent.toFixed(1)}%</span>
                      </div>
                      <Progress value={Math.min(fundingPercent, 100)} className="h-1.5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Utilization</span>
                        <span>{utilizationPercent.toFixed(1)}%</span>
                      </div>
                      <Progress value={Math.min(utilizationPercent, 100)} className="h-1.5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Vault Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedVault && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <IconBuildingBank className="h-5 w-5" />
                  Vault #{selectedVault.id}
                </SheetTitle>
                <SheetDescription className="flex items-center gap-2">
                  <Badge>{selectedVault.tokenSymbol}</Badge>
                  <span className="mx-2">•</span>
                  <a
                    href={`https://sepolia.basescan.org/address/${selectedVault.vaultAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    View on Explorer
                    <IconExternalLink className="h-3 w-3" />
                  </a>
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Status */}
                <div className="flex gap-2">
                  <Badge
                    variant="outline"
                    className={selectedVault.isActive
                      ? "border-emerald-500/50 text-emerald-600"
                      : "text-muted-foreground"
                    }
                  >
                    {selectedVault.status}
                  </Badge>
                  <Badge variant="outline">{selectedVault.tokenSymbol}</Badge>
                  <Badge variant="outline">Vault #{selectedVault.id}</Badge>
                </div>

                {/* Financial Summary */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Financial Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Supplied</p>
                      <p className="text-lg font-semibold">{formatAmount(selectedVault.totalSupplied, selectedVault.tokenSymbol)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Borrowed</p>
                      <p className="text-lg font-semibold">{formatAmount(selectedVault.totalBorrowed, selectedVault.tokenSymbol)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Available Liquidity</p>
                      <p className="text-lg font-semibold text-blue-600">{formatAmount(selectedVault.availableLiquidity, selectedVault.tokenSymbol)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Interest Collected</p>
                      <p className="text-lg font-semibold text-emerald-600">{formatAmount(selectedVault.totalInterestCollected, selectedVault.tokenSymbol)}</p>
                    </div>
                    {parseFloat(selectedVault.totalBadDebt) > 0 && (
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground">Bad Debt</p>
                        <p className="text-lg font-semibold text-red-600">{formatAmount(selectedVault.totalBadDebt, selectedVault.tokenSymbol)}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Vault Configuration */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <IconPercentage className="h-4 w-4" />
                      Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Token</span>
                      <span className="font-medium font-mono text-xs">{selectedVault.tokenAddress.slice(0,6)}...{selectedVault.tokenAddress.slice(-4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max Liquidity</span>
                      <span className="font-medium">{formatAmount(selectedVault.maxLiquidity, selectedVault.tokenSymbol)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Base Rate</span>
                      <span className="font-medium">{selectedVault.borrowBaseRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rate Slope</span>
                      <span className="font-medium">{selectedVault.borrowSlope}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max LTV</span>
                      <span className="font-medium">{selectedVault.maxBorrowRatio}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Liquidation Bonus</span>
                      <span className="font-medium">{selectedVault.liquidationBonus}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Utilization Rate</span>
                      <span className="font-medium">{selectedVault.utilizationRate}%</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Timeline */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created</span>
                      <span className="font-medium">
                        {selectedVault.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                    {selectedVault.lastInterestUpdate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Interest Update</span>
                        <span className="font-medium">
                          {selectedVault.lastInterestUpdate.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Treasury</span>
                      <span className="font-mono text-xs">
                        {selectedVault.treasury.slice(0,6)}...{selectedVault.treasury.slice(-4)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Vault Configuration */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <IconSettings className="h-4 w-4" />
                      Vault Configuration
                    </CardTitle>
                    <CardDescription>
                      Modify vault parameters
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Max Liquidity */}
                    <div className="space-y-2">
                      <Label htmlFor="maxLiquidity">Max Liquidity ({selectedVault.tokenSymbol})</Label>
                      <div className="flex gap-2">
                        <Input
                          id="maxLiquidity"
                          type="number"
                          placeholder={selectedVault.maxLiquidity}
                          value={newMaxLiquidity}
                          onChange={(e) => setNewMaxLiquidity(e.target.value)}
                        />
                        <Button
                          onClick={handleSetMaxLiquidity}
                          disabled={isSettingMaxLiq || isMaxLiqConfirming || !newMaxLiquidity}
                        >
                          {isSettingMaxLiq || isMaxLiqConfirming ? (
                            <IconLoader2 className="h-4 w-4 animate-spin" />
                          ) : "Set"}
                        </Button>
                      </div>
                      {maxLiqSuccess && (
                        <p className="text-xs text-emerald-600 flex items-center gap-1">
                          <IconCheck className="h-3 w-3" /> Max liquidity updated
                        </p>
                      )}
                    </div>

                    {/* Borrow Rates */}
                    <div className="space-y-2">
                      <Label>Borrow Rates (%)</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder={`Base: ${selectedVault.borrowBaseRate}`}
                          value={newBorrowBaseRate}
                          onChange={(e) => setNewBorrowBaseRate(e.target.value)}
                        />
                        <Input
                          type="number"
                          placeholder={`Slope: ${selectedVault.borrowSlope}`}
                          value={newBorrowSlope}
                          onChange={(e) => setNewBorrowSlope(e.target.value)}
                        />
                        <Button
                          onClick={handleSetBorrowRates}
                          disabled={isSettingRates || isRatesConfirming || !newBorrowBaseRate || !newBorrowSlope}
                        >
                          {isSettingRates || isRatesConfirming ? (
                            <IconLoader2 className="h-4 w-4 animate-spin" />
                          ) : "Set"}
                        </Button>
                      </div>
                      {ratesSuccess && (
                        <p className="text-xs text-emerald-600 flex items-center gap-1">
                          <IconCheck className="h-3 w-3" /> Borrow rates updated
                        </p>
                      )}
                    </div>

                    {/* Max LTV */}
                    <div className="space-y-2">
                      <Label htmlFor="maxLTV">Max LTV (%)</Label>
                      <div className="flex gap-2">
                        <Input
                          id="maxLTV"
                          type="number"
                          placeholder={selectedVault.maxBorrowRatio}
                          value={newMaxBorrowRatio}
                          onChange={(e) => setNewMaxBorrowRatio(e.target.value)}
                        />
                        <Button
                          onClick={handleSetMaxBorrowRatio}
                          disabled={isSettingLTV || isLTVConfirming || !newMaxBorrowRatio}
                        >
                          {isSettingLTV || isLTVConfirming ? (
                            <IconLoader2 className="h-4 w-4 animate-spin" />
                          ) : "Set"}
                        </Button>
                      </div>
                      {ltvSuccess && (
                        <p className="text-xs text-emerald-600 flex items-center gap-1">
                          <IconCheck className="h-3 w-3" /> Max LTV updated
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Vault Control */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <IconPlayerPause className="h-4 w-4" />
                      Vault Control
                    </CardTitle>
                    <CardDescription>
                      Pause or unpause the vault.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handlePauseVault}
                        disabled={isPausing || isPauseConfirming || !selectedVault.isActive}
                        className="flex-1 text-red-600 border-red-600/30 hover:bg-red-50"
                      >
                        <IconPlayerPause className="h-4 w-4 mr-2" />
                        {isPausing || isPauseConfirming ? "..." : "Pause"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleUnpauseVault}
                        disabled={isUnpausing || isUnpauseConfirming || selectedVault.isActive}
                        className="flex-1 text-emerald-600 border-emerald-600/30 hover:bg-emerald-50"
                      >
                        <IconPlayerPlay className="h-4 w-4 mr-2" />
                        {isUnpausing || isUnpauseConfirming ? "..." : "Unpause"}
                      </Button>
                    </div>
                    {pauseSuccess && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <IconX className="h-3 w-3" /> Vault paused
                      </p>
                    )}
                    {unpauseSuccess && (
                      <p className="text-xs text-emerald-600 flex items-center gap-1">
                        <IconCheck className="h-3 w-3" /> Vault unpaused
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
