"use client"

import { useState } from "react"
import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import {
  IconUsersGroup,
  IconUserPlus,
  IconUserMinus,
  IconShield,
  IconShieldCheck,
  IconCheck,
  IconExternalLink,
  IconCopy,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CONTRACTS, ACCESS_CONTROL_ABI, ROLES } from "@/lib/contracts"

// Role display configuration
const ROLE_CONFIG = {
  [ROLES.DEFAULT_ADMIN]: {
    name: "Default Admin",
    description: "Full control over all contracts",
    color: "text-red-600 border-red-600/30",
    icon: IconShieldCheck,
  },
  [ROLES.ADMIN_ROLE]: {
    name: "Admin",
    description: "Can manage protocol settings and fees",
    color: "text-orange-600 border-orange-600/30",
    icon: IconShield,
  },
  [ROLES.PAUSER_ROLE]: {
    name: "Pauser",
    description: "Can pause/unpause contracts in emergency",
    color: "text-yellow-600 border-yellow-600/30",
    icon: IconShield,
  },
  [ROLES.MANAGER_ROLE]: {
    name: "Manager",
    description: "Can add revenues and process repayments",
    color: "text-blue-600 border-blue-600/30",
    icon: IconShield,
  },
  [ROLES.FACTORY_ROLE]: {
    name: "Factory",
    description: "Can register new vaults",
    color: "text-purple-600 border-purple-600/30",
    icon: IconShield,
  },
  [ROLES.CREATOR_ROLE]: {
    name: "Creator",
    description: "Can create new vaults",
    color: "text-green-600 border-green-600/30",
    icon: IconShield,
  },
  [ROLES.DISTRIBUTOR_ROLE]: {
    name: "Distributor",
    description: "Can distribute fees",
    color: "text-cyan-600 border-cyan-600/30",
    icon: IconShield,
  },
}

// Contract configuration for role management
const MANAGED_CONTRACTS = [
  { name: "Protocol", address: CONTRACTS.protocol },
  { name: "Factory", address: CONTRACTS.factory },
  { name: "Fee Collector", address: CONTRACTS.feeCollector },
]

export default function TeamPage() {
  const { address: connectedAddress } = useAccount()
  const [newMemberAddress, setNewMemberAddress] = useState("")
  const [selectedRole, setSelectedRole] = useState<string>(ROLES.MANAGER_ROLE)
  const [selectedContract, setSelectedContract] = useState<string>(CONTRACTS.protocol)
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)

  // Check if connected user is admin
  const { data: isAdmin } = useReadContract({
    address: CONTRACTS.protocol as `0x${string}`,
    abi: ACCESS_CONTROL_ABI,
    functionName: "hasRole",
    args: [ROLES.DEFAULT_ADMIN as `0x${string}`, connectedAddress as `0x${string}`],
    query: { enabled: !!connectedAddress },
  })

  // Check roles for deployer on protocol
  const { data: deployerRoles, isLoading: isLoadingRoles } = useReadContracts({
    contracts: [
      {
        address: CONTRACTS.protocol as `0x${string}`,
        abi: ACCESS_CONTROL_ABI,
        functionName: "hasRole",
        args: [ROLES.DEFAULT_ADMIN as `0x${string}`, CONTRACTS.deployer as `0x${string}`],
      },
      {
        address: CONTRACTS.protocol as `0x${string}`,
        abi: ACCESS_CONTROL_ABI,
        functionName: "hasRole",
        args: [ROLES.ADMIN_ROLE as `0x${string}`, CONTRACTS.deployer as `0x${string}`],
      },
      {
        address: CONTRACTS.protocol as `0x${string}`,
        abi: ACCESS_CONTROL_ABI,
        functionName: "hasRole",
        args: [ROLES.PAUSER_ROLE as `0x${string}`, CONTRACTS.deployer as `0x${string}`],
      },
      {
        address: CONTRACTS.factory as `0x${string}`,
        abi: ACCESS_CONTROL_ABI,
        functionName: "hasRole",
        args: [ROLES.DEFAULT_ADMIN as `0x${string}`, CONTRACTS.deployer as `0x${string}`],
      },
      {
        address: CONTRACTS.factory as `0x${string}`,
        abi: ACCESS_CONTROL_ABI,
        functionName: "hasRole",
        args: [ROLES.CREATOR_ROLE as `0x${string}`, CONTRACTS.deployer as `0x${string}`],
      },
      {
        address: CONTRACTS.feeCollector as `0x${string}`,
        abi: ACCESS_CONTROL_ABI,
        functionName: "hasRole",
        args: [ROLES.DEFAULT_ADMIN as `0x${string}`, CONTRACTS.deployer as `0x${string}`],
      },
      {
        address: CONTRACTS.feeCollector as `0x${string}`,
        abi: ACCESS_CONTROL_ABI,
        functionName: "hasRole",
        args: [ROLES.DISTRIBUTOR_ROLE as `0x${string}`, CONTRACTS.deployer as `0x${string}`],
      },
    ],
  })

  // Grant role
  const { writeContract: grantRole, data: grantHash, isPending: isGranting } = useWriteContract()
  const { isLoading: isGrantConfirming, isSuccess: grantSuccess } = useWaitForTransactionReceipt({ hash: grantHash })

  // Revoke role
  const { writeContract: revokeRole, isPending: isRevoking } = useWriteContract()

  const handleGrantRole = () => {
    if (!newMemberAddress || !selectedRole || !selectedContract) return
    grantRole({
      address: selectedContract as `0x${string}`,
      abi: ACCESS_CONTROL_ABI,
      functionName: "grantRole",
      args: [selectedRole as `0x${string}`, newMemberAddress as `0x${string}`],
    })
  }

  const handleRevokeRole = (contractAddress: string, role: string, account: string) => {
    revokeRole({
      address: contractAddress as `0x${string}`,
      abi: ACCESS_CONTROL_ABI,
      functionName: "revokeRole",
      args: [role as `0x${string}`, account as `0x${string}`],
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedAddress(text)
    setTimeout(() => setCopiedAddress(null), 2000)
  }

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

  // Build team members data from role checks
  const buildTeamData = () => {
    if (!deployerRoles) return []

    const members = []

    // Deployer roles
    const deployerData = {
      address: CONTRACTS.deployer,
      name: "Deployer (Admin)",
      roles: [] as { contract: string; role: string; roleKey: string }[],
    }

    if (deployerRoles[0]?.result) deployerData.roles.push({ contract: "Protocol", role: "Default Admin", roleKey: ROLES.DEFAULT_ADMIN })
    if (deployerRoles[1]?.result) deployerData.roles.push({ contract: "Protocol", role: "Admin", roleKey: ROLES.ADMIN_ROLE })
    if (deployerRoles[2]?.result) deployerData.roles.push({ contract: "Protocol", role: "Pauser", roleKey: ROLES.PAUSER_ROLE })
    if (deployerRoles[3]?.result) deployerData.roles.push({ contract: "Factory", role: "Default Admin", roleKey: ROLES.DEFAULT_ADMIN })
    if (deployerRoles[4]?.result) deployerData.roles.push({ contract: "Factory", role: "Creator", roleKey: ROLES.CREATOR_ROLE })
    if (deployerRoles[5]?.result) deployerData.roles.push({ contract: "Fee Collector", role: "Default Admin", roleKey: ROLES.DEFAULT_ADMIN })
    if (deployerRoles[6]?.result) deployerData.roles.push({ contract: "Fee Collector", role: "Distributor", roleKey: ROLES.DISTRIBUTOR_ROLE })

    if (deployerData.roles.length > 0) {
      members.push(deployerData)
    }

    return members
  }

  const teamMembers = buildTeamData()

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Team Management</h1>
        <p className="text-muted-foreground text-sm">
          Manage team access and roles across protocol contracts
        </p>
      </div>

      {/* Admin Check */}
      {!isAdmin && connectedAddress && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="flex items-center gap-3 py-4">
            <IconShield className="h-5 w-5 text-amber-600" />
            <p className="text-sm text-amber-600">
              You need DEFAULT_ADMIN_ROLE to manage team members. Connect with an admin wallet.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Team Members</CardDescription>
            <CardTitle className="text-2xl">{teamMembers.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Managed Contracts</CardDescription>
            <CardTitle className="text-2xl">{MANAGED_CONTRACTS.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Available Roles</CardDescription>
            <CardTitle className="text-2xl">{Object.keys(ROLE_CONFIG).length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Add Team Member */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconUserPlus className="h-5 w-5" />
              Grant Role
            </CardTitle>
            <CardDescription>
              Add a new team member or grant additional roles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Wallet Address</Label>
              <Input
                value={newMemberAddress}
                onChange={(e) => setNewMemberAddress(e.target.value)}
                placeholder="0x..."
                disabled={!isAdmin}
              />
            </div>

            <div className="space-y-2">
              <Label>Contract</Label>
              <Select value={selectedContract} onValueChange={setSelectedContract} disabled={!isAdmin}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MANAGED_CONTRACTS.map((contract) => (
                    <SelectItem key={contract.address} value={contract.address}>
                      {contract.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole} disabled={!isAdmin}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_CONFIG).map(([roleKey, config]) => (
                    <SelectItem key={roleKey} value={roleKey}>
                      <div className="flex items-center gap-2">
                        <config.icon className="h-4 w-4" />
                        {config.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedRole && ROLE_CONFIG[selectedRole as keyof typeof ROLE_CONFIG] && (
                <p className="text-xs text-muted-foreground">
                  {ROLE_CONFIG[selectedRole as keyof typeof ROLE_CONFIG].description}
                </p>
              )}
            </div>

            <Button
              onClick={handleGrantRole}
              disabled={!newMemberAddress || !isAdmin || isGranting || isGrantConfirming}
              className="w-full"
            >
              <IconUserPlus className="h-4 w-4 mr-2" />
              {isGranting ? "Confirming..." : isGrantConfirming ? "Granting..." : "Grant Role"}
            </Button>

            {grantSuccess && (
              <p className="text-xs text-emerald-600 flex items-center gap-1">
                <IconCheck className="h-3 w-3" /> Role granted successfully
              </p>
            )}
          </CardContent>
        </Card>

        {/* Role Reference */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconShield className="h-5 w-5" />
              Role Reference
            </CardTitle>
            <CardDescription>
              Available roles and their permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(ROLE_CONFIG).map(([roleKey, config]) => (
                <div
                  key={roleKey}
                  className="flex items-start gap-3 p-3 rounded-lg border"
                >
                  <config.icon className={`h-5 w-5 mt-0.5 ${config.color.split(" ")[0]}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{config.name}</p>
                      <Badge variant="outline" className={`text-xs ${config.color}`}>
                        {roleKey === ROLES.DEFAULT_ADMIN ? "Super Admin" : "Role"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {config.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconUsersGroup className="h-5 w-5" />
            Current Team Members
          </CardTitle>
          <CardDescription>
            All wallets with roles on protocol contracts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingRoles ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <IconUsersGroup className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No team members found</p>
              <p className="text-xs">Add team members using the form above</p>
            </div>
          ) : (
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div
                  key={member.address}
                  className="rounded-lg border p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <IconShieldCheck className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs text-muted-foreground font-mono">
                            {formatAddress(member.address)}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => copyToClipboard(member.address)}
                          >
                            {copiedAddress === member.address ? (
                              <IconCheck className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <IconCopy className="h-3 w-3" />
                            )}
                          </Button>
                          <a
                            href={`https://sepolia.basescan.org/address/${member.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            <IconExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Roles Table */}
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="text-xs">Contract</TableHead>
                          <TableHead className="text-xs">Role</TableHead>
                          <TableHead className="text-xs text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {member.roles.map((role, idx) => {
                          const roleConfig = ROLE_CONFIG[role.roleKey as keyof typeof ROLE_CONFIG]
                          return (
                            <TableRow key={idx}>
                              <TableCell className="text-sm">{role.contract}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={`text-xs ${roleConfig?.color || ""}`}>
                                  {role.role}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  disabled={!isAdmin || role.roleKey === ROLES.DEFAULT_ADMIN || isRevoking}
                                  onClick={() => {
                                    const contractAddr = MANAGED_CONTRACTS.find(c => c.name === role.contract)?.address
                                    if (contractAddr) {
                                      handleRevokeRole(contractAddr, role.roleKey, member.address)
                                    }
                                  }}
                                >
                                  <IconUserMinus className="h-3 w-3 mr-1" />
                                  Revoke
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contract Addresses Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Contract Addresses</CardTitle>
          <CardDescription>Protocol contracts on Base Sepolia</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MANAGED_CONTRACTS.map((contract) => (
              <div key={contract.address} className="flex items-center justify-between p-3 rounded-lg border">
                <span className="text-sm font-medium">{contract.name}</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-muted-foreground font-mono">
                    {formatAddress(contract.address)}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(contract.address)}
                  >
                    {copiedAddress === contract.address ? (
                      <IconCheck className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <IconCopy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
