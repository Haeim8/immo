"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseUnits } from "viem"
import {
  IconBuildingBank,
  IconCheck,
  IconLoader2,
  IconArrowLeft,
  IconInfoCircle,
  IconCurrencyDollar,
  IconPercentage,
  IconWallet,
  IconShield,
} from "@tabler/icons-react"

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
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { CONTRACTS, FACTORY_ABI, POOL_CONFIG, type PoolType } from "@/lib/contracts"

// Token options for vault
const TOKEN_OPTIONS: { value: PoolType; label: string; description: string; address: string }[] = [
  {
    value: "usdc",
    label: "USDC",
    description: "USD Coin - Stablecoin pegged to USD",
    address: POOL_CONFIG.usdc.token
  },
  {
    value: "weth",
    label: "WETH",
    description: "Wrapped Ether",
    address: POOL_CONFIG.weth.token
  },
]

export default function CreateVaultPage() {
  const router = useRouter()
  const { isConnected } = useAccount()

  const [formData, setFormData] = useState({
    // Token selection
    tokenType: "usdc" as PoolType,

    // Financial - max liquidity (will be converted based on token decimals)
    maxLiquidity: "",

    // Interest rates (in %)
    borrowBaseRate: "2",
    borrowSlope: "10",
    maxBorrowRatio: "70", // LTV

    // Liquidation
    liquidationBonus: "5", // 5% bonus for liquidators
  })

  // Contract write
  const { writeContract, data: txHash, isPending, error } = useWriteContract()

  // Wait for transaction
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const selectedToken = TOKEN_OPTIONS.find(t => t.value === formData.tokenType)
  const tokenDecimals = POOL_CONFIG[formData.tokenType].decimals

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConnected) {
      alert("Please connect your wallet first")
      return
    }

    // Get token address
    const tokenAddress = POOL_CONFIG[formData.tokenType].token as `0x${string}`

    // Convert max liquidity to token decimals
    const maxLiquidity = parseUnits(formData.maxLiquidity || "0", tokenDecimals)

    // Convert percentages to basis points (1% = 100 bps)
    const borrowBaseRate = BigInt(Math.round(Number(formData.borrowBaseRate) * 100))
    const borrowSlope = BigInt(Math.round(Number(formData.borrowSlope) * 100))
    const maxBorrowRatio = BigInt(Math.round(Number(formData.maxBorrowRatio) * 100))
    const liquidationBonus = BigInt(Math.round(Number(formData.liquidationBonus) * 100))

    const params = {
      token: tokenAddress,
      maxLiquidity,
      borrowBaseRate,
      borrowSlope,
      maxBorrowRatio,
      liquidationBonus,
    } as const

    console.log("Creating vault with params:", params)

    writeContract({
      address: CONTRACTS.factory as `0x${string}`,
      abi: FACTORY_ABI,
      functionName: "createVault",
      args: [params],
    })
  }

  const isFormValid =
    formData.maxLiquidity &&
    Number(formData.maxLiquidity) > 0 &&
    isConnected

  if (isSuccess) {
    setTimeout(() => {
      router.push("/dashboard/vaults")
    }, 2000)
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <IconArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Create New Vault</h1>
          <p className="text-muted-foreground text-sm">
            Deploy a new lending vault on CantorFi
          </p>
        </div>
      </div>

      {!isConnected && (
        <Card className="border-amber-500/50 bg-amber-500/10">
          <CardContent className="py-4 flex items-center gap-3">
            <IconWallet className="h-5 w-5 text-amber-500" />
            <p className="text-sm">Please connect your wallet to create a vault</p>
          </CardContent>
        </Card>
      )}

      {isSuccess ? (
        <Card className="max-w-2xl">
          <CardContent className="py-12 flex flex-col items-center justify-center gap-4">
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <IconCheck className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold">Vault Created Successfully!</h2>
            <p className="text-muted-foreground text-center">
              Your new vault has been deployed.<br />Redirecting...
            </p>
            <Button onClick={() => router.push("/dashboard/vaults")}>View All Vaults</Button>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Token Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconWallet className="h-5 w-5" />
                  Token Selection
                </CardTitle>
                <CardDescription>Select which token this vault will use for supply/borrow</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {TOKEN_OPTIONS.map((token) => (
                    <div
                      key={token.value}
                      onClick={() => handleChange("tokenType", token.value)}
                      className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                        formData.tokenType === token.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <p className="font-medium">{token.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{token.description}</p>
                      <p className="text-xs font-mono text-muted-foreground mt-2 truncate">
                        {token.address}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Liquidity Cap */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconCurrencyDollar className="h-5 w-5" />
                  Liquidity Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="maxLiquidity">
                    Max Liquidity ({POOL_CONFIG[formData.tokenType].symbol}) *
                  </Label>
                  <Input
                    id="maxLiquidity"
                    type="number"
                    min="0"
                    step={formData.tokenType === "usdc" ? "1" : "0.01"}
                    placeholder={formData.tokenType === "usdc" ? "e.g., 100000" : "e.g., 50"}
                    value={formData.maxLiquidity}
                    onChange={(e) => handleChange("maxLiquidity", e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum amount of {POOL_CONFIG[formData.tokenType].symbol} that can be supplied to this vault
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Interest Rates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconPercentage className="h-5 w-5" />
                  Interest Rate Model
                </CardTitle>
                <CardDescription>
                  Configure the variable interest rate parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="borrowBaseRate">Base Rate (%)</Label>
                    <Input
                      id="borrowBaseRate"
                      type="number"
                      min="0"
                      max="50"
                      step="0.1"
                      value={formData.borrowBaseRate}
                      onChange={(e) => handleChange("borrowBaseRate", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum borrow rate at 0% utilization
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="borrowSlope">Rate Slope (%)</Label>
                    <Input
                      id="borrowSlope"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.borrowSlope}
                      onChange={(e) => handleChange("borrowSlope", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Rate increase per 100% utilization
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxBorrowRatio">Max LTV (%)</Label>
                    <Input
                      id="maxBorrowRatio"
                      type="number"
                      min="0"
                      max="90"
                      value={formData.maxBorrowRatio}
                      onChange={(e) => handleChange("maxBorrowRatio", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Max loan-to-value ratio (max 90%)
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                  <p className="text-sm font-medium">Interest Rate Formula</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    rate = {formData.borrowBaseRate}% + ({formData.borrowSlope}% × utilization)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    At 50% utilization: {(Number(formData.borrowBaseRate) + Number(formData.borrowSlope) * 0.5).toFixed(2)}% APY
                  </p>
                  <p className="text-xs text-muted-foreground">
                    At 100% utilization: {(Number(formData.borrowBaseRate) + Number(formData.borrowSlope)).toFixed(2)}% APY
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Liquidation Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconShield className="h-5 w-5" />
                  Liquidation Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="liquidationBonus">Liquidation Bonus (%)</Label>
                  <Input
                    id="liquidationBonus"
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    value={formData.liquidationBonus}
                    onChange={(e) => handleChange("liquidationBonus", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Bonus given to liquidators as incentive (max 20%)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Error */}
            {error && (
              <Card className="border-destructive">
                <CardContent className="py-4">
                  <p className="text-sm text-destructive">
                    {error.message.includes("User rejected")
                      ? "Transaction cancelled"
                      : error.message.slice(0, 300)}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Submit */}
            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={!isFormValid || isPending || isConfirming}>
                {isPending || isConfirming ? (
                  <>
                    <IconLoader2 className="h-4 w-4 animate-spin mr-2" />
                    {isPending ? "Confirm in wallet..." : "Creating..."}
                  </>
                ) : (
                  "Create Vault"
                )}
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">Token</p>
                  <Badge className="mt-1">{selectedToken?.label}</Badge>
                </div>
                <Separator />
                {formData.maxLiquidity && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Max Liquidity</span>
                    <span className="font-medium">
                      {Number(formData.maxLiquidity).toLocaleString()} {POOL_CONFIG[formData.tokenType].symbol}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Max LTV</span>
                  <span className="font-medium">{formData.maxBorrowRatio}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Base Rate</span>
                  <span className="font-medium">{formData.borrowBaseRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Liquidation Bonus</span>
                  <span className="font-medium">{formData.liquidationBonus}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <IconInfoCircle className="h-4 w-4" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">Token:</strong> Each vault uses a single token for both supply and borrow.
                </p>
                <p>
                  <strong className="text-foreground">Interest Model:</strong> Variable rate based on utilization.
                </p>
                <p>
                  <strong className="text-foreground">LTV:</strong> Loan-to-value determines how much users can borrow against their collateral.
                </p>
                <p>
                  <strong className="text-foreground">Liquidation:</strong> Positions below health factor can be liquidated.
                </p>
              </CardContent>
            </Card>
          </div>
        </form>
      )}
    </div>
  )
}
