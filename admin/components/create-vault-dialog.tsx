"use client"

import { useState } from "react"
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseUnits } from "viem"
import {
  IconBuildingBank,
  IconCheck,
  IconLoader2,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CONTRACTS, FACTORY_ABI } from "@/lib/contracts"

interface CreateVaultDialogProps {
  children: React.ReactNode
  onSuccess?: () => void
}

const ASSET_TYPES = [
  "Commercial Real Estate",
  "Residential Real Estate",
  "Industrial Real Estate",
  "Mixed Use",
  "Land",
  "Other",
]

const FREQUENCIES = [
  { value: "1", label: "Monthly" },
  { value: "3", label: "Quarterly" },
  { value: "6", label: "Semi-Annual" },
  { value: "12", label: "Annual" },
]

export function CreateVaultDialog({ children, onSuccess }: CreateVaultDialogProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    assetName: "",
    assetType: "",
    location: "",
    assetPrice: "",
    maxLiquidity: "",
    creditAmount: "",
    creditDuration: "", // in months
    frequency: "1",
    borrowBaseRate: "", // in %
    borrowSlope: "", // in %
    maxBorrowRatio: "", // in %
  })

  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    // Convert values to proper format (USDC has 6 decimals, rates in basis points)
    const params = {
      assetName: formData.assetName,
      assetType: formData.assetType,
      location: formData.location,
      assetPrice: parseUnits(formData.assetPrice || "0", 6),
      maxLiquidity: parseUnits(formData.maxLiquidity || "0", 6),
      creditAmount: parseUnits(formData.creditAmount || "0", 6),
      creditDuration: BigInt(Number(formData.creditDuration || "0") * 30 * 24 * 60 * 60), // months to seconds
      frequency: Number(formData.frequency),
      borrowBaseRate: BigInt(Number(formData.borrowBaseRate || "0") * 100), // % to basis points
      borrowSlope: BigInt(Number(formData.borrowSlope || "0") * 100),
      maxBorrowRatio: BigInt(Number(formData.maxBorrowRatio || "0") * 100),
    }

    writeContract({
      address: CONTRACTS.factory as `0x${string}`,
      abi: FACTORY_ABI,
      functionName: "createVault",
      args: [params],
    })
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      // Reset form when closing
      setFormData({
        assetName: "",
        assetType: "",
        location: "",
        assetPrice: "",
        maxLiquidity: "",
        creditAmount: "",
        creditDuration: "",
        frequency: "1",
        borrowBaseRate: "",
        borrowSlope: "",
        maxBorrowRatio: "",
      })
    }
  }

  // Close dialog on success and call callback
  if (isSuccess && open) {
    setTimeout(() => {
      handleOpenChange(false)
      onSuccess?.()
    }, 1500)
  }

  const isFormValid =
    formData.assetName &&
    formData.assetType &&
    formData.location &&
    formData.assetPrice &&
    formData.maxLiquidity &&
    formData.creditAmount &&
    formData.creditDuration &&
    formData.borrowBaseRate

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconBuildingBank className="h-5 w-5" />
            Create New Vault
          </DialogTitle>
          <DialogDescription>
            Create a new RWA-backed vault for the protocol
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center gap-4">
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <IconCheck className="h-6 w-6 text-emerald-600" />
            </div>
            <p className="text-lg font-medium">Vault Created Successfully!</p>
            <p className="text-sm text-muted-foreground">
              The vault is now available in the protocol
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 py-4">
              {/* Asset Information */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">Asset Information</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="assetName">Asset Name *</Label>
                    <Input
                      id="assetName"
                      placeholder="123 Main Street Building"
                      value={formData.assetName}
                      onChange={(e) => handleChange("assetName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assetType">Asset Type *</Label>
                    <Select
                      value={formData.assetType}
                      onValueChange={(v) => handleChange("assetType", v)}
                    >
                      <SelectTrigger id="assetType">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSET_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      placeholder="New York, NY, USA"
                      value={formData.location}
                      onChange={(e) => handleChange("location", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assetPrice">Asset Price (USDC) *</Label>
                    <Input
                      id="assetPrice"
                      type="number"
                      placeholder="1000000"
                      value={formData.assetPrice}
                      onChange={(e) => handleChange("assetPrice", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxLiquidity">Max Liquidity (USDC) *</Label>
                    <Input
                      id="maxLiquidity"
                      type="number"
                      placeholder="500000"
                      value={formData.maxLiquidity}
                      onChange={(e) => handleChange("maxLiquidity", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Credit Configuration */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">Credit Configuration</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="creditAmount">Credit Amount (USDC) *</Label>
                    <Input
                      id="creditAmount"
                      type="number"
                      placeholder="400000"
                      value={formData.creditAmount}
                      onChange={(e) => handleChange("creditAmount", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="creditDuration">Duration (Months) *</Label>
                    <Input
                      id="creditDuration"
                      type="number"
                      placeholder="60"
                      value={formData.creditDuration}
                      onChange={(e) => handleChange("creditDuration", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Payment Frequency</Label>
                    <Select
                      value={formData.frequency}
                      onValueChange={(v) => handleChange("frequency", v)}
                    >
                      <SelectTrigger id="frequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQUENCIES.map((f) => (
                          <SelectItem key={f.value} value={f.value}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Interest Rate Configuration */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">Interest Rate Configuration</h4>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="borrowBaseRate">Base Rate (%) *</Label>
                    <Input
                      id="borrowBaseRate"
                      type="number"
                      step="0.1"
                      placeholder="5"
                      value={formData.borrowBaseRate}
                      onChange={(e) => handleChange("borrowBaseRate", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="borrowSlope">Slope (%)</Label>
                    <Input
                      id="borrowSlope"
                      type="number"
                      step="0.1"
                      placeholder="2"
                      value={formData.borrowSlope}
                      onChange={(e) => handleChange("borrowSlope", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxBorrowRatio">Max Borrow Ratio (%)</Label>
                    <Input
                      id="maxBorrowRatio"
                      type="number"
                      step="1"
                      placeholder="80"
                      value={formData.maxBorrowRatio}
                      onChange={(e) => handleChange("maxBorrowRatio", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {error.message.includes("User rejected")
                    ? "Transaction cancelled"
                    : error.message.slice(0, 200)}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isFormValid || isPending || isConfirming}
              >
                {isPending ? (
                  <>
                    <IconLoader2 className="h-4 w-4 animate-spin" />
                    Confirm in wallet...
                  </>
                ) : isConfirming ? (
                  <>
                    <IconLoader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Vault"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
