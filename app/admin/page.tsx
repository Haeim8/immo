"use client";

import { useState, useEffect } from "react";

export const dynamic = 'force-dynamic';
import { motion } from "framer-motion";
import {
  Shield,
  Plus,
  TrendingUp,
  Users,
  Building2,
  DollarSign,
  BarChart3,
  Clock,
  CheckCircle2,
  Loader2,
  Gavel,
  Wrench
} from "lucide-react";
import GlassCard from "@/components/atoms/GlassCard";
import GradientText from "@/components/atoms/GradientText";
import AnimatedButton from "@/components/atoms/AnimatedButton";
import MetricDisplay from "@/components/atoms/MetricDisplay";
import { useRouter } from "next/navigation";
import CreatePropertyForm from "@/components/admin/CreatePropertyForm";
import {
  useWalletAddress,
  useAllPlaces,
  useIsAdmin,
  useIsTeamMember,
  useEthPrice,
  BLOCK_EXPLORER_URL
} from "@/lib/evm/hooks";
import { usdToEth } from "@/lib/evm/adapters";
import {
  useAddTeamMember,
  useDepositRewards,
  useCloseSale,
  useCompletPlace,
} from "@/lib/evm/write-hooks";
import { formatEther, parseEther } from "viem";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "properties" | "create" | "team" | "dividends" | "governance" | "operations"
  >("overview");
  const router = useRouter();
  const { address, isConnected } = useWalletAddress();
  const [hasAccess, setHasAccess] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);

  const { isAdmin, isLoading: isLoadingAdmin } = useIsAdmin(address);
  const { isTeamMember, isLoading: isLoadingTeam } = useIsTeamMember(address);

  useEffect(() => {
    if (!isConnected) {
      setHasAccess(false);
      setAccessChecked(true);
      router.replace("/");
      return;
    }

    if (isLoadingAdmin || isLoadingTeam) {
      return;
    }

    const canAccess = isAdmin || (isTeamMember ?? false);
    setHasAccess(canAccess);
    setAccessChecked(true);

    if (!canAccess) {
      router.replace("/portfolio");
    }
  }, [isConnected, isAdmin, isTeamMember, isLoadingAdmin, isLoadingTeam, router]);

  if (!accessChecked || isLoadingAdmin || isLoadingTeam) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        <p className="text-sm text-muted-foreground">Vérification des accès...</p>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <main className="pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <Shield className="h-8 w-8 text-purple-400" />
              </div>
              <div>
                <h1 className="text-5xl font-bold">
                  <GradientText from="from-purple-400" to="to-pink-600">
                    Admin Dashboard
                  </GradientText>
                </h1>
                <p className="text-muted-foreground text-lg">
                  Manage the entire platform
                </p>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <GlassCard className="p-2">
              <div className="flex gap-2 overflow-x-auto">
                {[
                  { id: "overview", label: "Overview", icon: BarChart3 },
                  { id: "properties", label: "Properties", icon: Building2 },
                  { id: "create", label: "Create New", icon: Plus },
                  { id: "team", label: "Team", icon: Users },
                  { id: "dividends", label: "Rewards", icon: DollarSign },
                  { id: "governance", label: "Governance", icon: Gavel },
                  { id: "operations", label: "Operations", icon: Wrench },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg"
                        : "hover:bg-white/5 text-muted-foreground"
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          {/* Content */}
          {activeTab === "overview" && <OverviewTab />}
          {activeTab === "properties" && <PropertiesTab />}
          {activeTab === "create" && <CreatePropertyTab />}
          {activeTab === "team" && <TeamTab />}
          {activeTab === "dividends" && <DividendsTab />}
          {activeTab === "governance" && <GovernanceTab />}
          {activeTab === "operations" && <OperationsTab />}
        </div>
      </main>
    </div>
  );
}

function OverviewTab() {
  const { places, isLoading } = useAllPlaces();
  const { price: ethPrice } = useEthPrice();

  const totalProperties = places.length;
  const totalValue = places.reduce((sum, p) => {
    const totalPuzzles = Number(p.info.totalPuzzles);
    const puzzlePrice = parseFloat(formatEther(p.info.puzzlePrice));
    return sum + (totalPuzzles * puzzlePrice * ethPrice.usd);
  }, 0);

  const avgReturn = places.length > 0
    ? places.reduce((sum, p) => sum + (p.info.expectedReturn / 100), 0) / places.length
    : 0;

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-cyan-400" />
          <p className="text-muted-foreground">Loading metrics...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <GlassCard hover glow>
              <MetricDisplay
                icon={Building2}
                label="Total Properties"
                value={totalProperties}
                iconColor="text-cyan-400"
              />
            </GlassCard>
            <GlassCard hover glow>
              <MetricDisplay
                icon={Users}
                label="Total Investors"
                value="Coming Soon"
                iconColor="text-blue-400"
                delay={0.1}
              />
            </GlassCard>
            <GlassCard hover glow>
              <MetricDisplay
                icon={DollarSign}
                label="Total Value"
                value={`$${(totalValue / 1000000).toFixed(2)}M`}
                iconColor="text-green-400"
                delay={0.2}
              />
            </GlassCard>
            <GlassCard hover glow>
              <MetricDisplay
                icon={TrendingUp}
                label="Avg Return"
                value={`${avgReturn.toFixed(2)}%`}
                iconColor="text-purple-400"
                delay={0.3}
              />
            </GlassCard>
          </div>

          <GlassCard>
            <h3 className="text-xl font-bold mb-4 text-purple-400">Recent Properties</h3>
            {places.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No properties created yet</p>
            ) : (
              <div className="space-y-3">
                {places.slice(0, 5).map((place, i) => (
                  <motion.div
                    key={place.address}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div>
                      <p className="font-medium">{place.info.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {place.info.city}, {place.info.province}
                      </p>
                    </div>
                    <span className="text-sm text-cyan-400 font-semibold">
                      {Number(place.info.puzzlesSold)}/{Number(place.info.totalPuzzles)} sold
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </GlassCard>
        </>
      )}
    </div>
  );
}

function PropertiesTab() {
  const { places, isLoading } = useAllPlaces();
  const { price: ethPrice } = useEthPrice();

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-cyan-400" />
        <p className="text-muted-foreground">Loading properties from blockchain...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold">Manage Properties ({places.length})</h3>
      </div>

      {places.length === 0 ? (
        <GlassCard>
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No properties created yet</p>
            <p className="text-sm text-muted-foreground mt-2">Create your first property from the "Create New" tab</p>
          </div>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {places.map((place, index) => {
            const totalPuzzles = Number(place.info.totalPuzzles);
            const puzzlesSold = Number(place.info.puzzlesSold);
            const fundingProgress = (puzzlesSold / totalPuzzles) * 100;
            const puzzlePriceETH = parseFloat(formatEther(place.info.puzzlePrice));
            const puzzlePriceUSD = puzzlePriceETH * ethPrice.usd;

            return (
              <motion.div
                key={place.address}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard hover>
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-cyan-400 mb-2">{place.info.name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {place.info.city}, {place.info.province}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono mb-4">
                        {place.address.slice(0, 10)}...{place.address.slice(-8)}
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Price per Puzzle</p>
                          <p className="font-semibold">${puzzlePriceUSD.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">{puzzlePriceETH.toFixed(4)} ETH</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Puzzles Sold</p>
                          <p className="font-semibold text-green-400">{puzzlesSold} / {totalPuzzles}</p>
                          <p className="text-xs text-muted-foreground">{fundingProgress.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Expected Return</p>
                          <p className="font-semibold text-cyan-400">{(place.info.expectedReturn / 100).toFixed(2)}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Status</p>
                          <p className="font-semibold">
                            {place.info.isActive ? (
                              fundingProgress === 100 ? (
                                <span className="text-green-400 flex items-center gap-1">
                                  <CheckCircle2 className="h-4 w-4" /> Funded
                                </span>
                              ) : (
                                <span className="text-yellow-400 flex items-center gap-1">
                                  <Clock className="h-4 w-4" /> Active
                                </span>
                              )
                            ) : (
                              <span className="text-gray-400">Closed</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <AnimatedButton
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`${BLOCK_EXPLORER_URL}/address/${place.address}`, '_blank')}
                      >
                        View on Explorer
                      </AnimatedButton>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CreatePropertyTab() {
  return <CreatePropertyForm />;
}

function TeamTab() {
  const [newMemberAddress, setNewMemberAddress] = useState("");
  const { addTeamMember, isPending: isAdding } = useAddTeamMember();

  const handleAddMember = async () => {
    if (!newMemberAddress.trim()) {
      alert("Please enter a wallet address");
      return;
    }

    try {
      await addTeamMember(newMemberAddress as `0x${string}`);
      alert("Team member added successfully!");
      setNewMemberAddress("");
    } catch (error: any) {
      console.error("Error adding team member:", error);
      alert(`Error: ${error.message || "Failed to add team member"}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Team Management</h3>
          <p className="text-muted-foreground mt-1">Manage team members who can create properties and proposals</p>
        </div>
      </div>

      {/* Add Team Member */}
      <GlassCard>
        <h4 className="text-lg font-semibold mb-4">Add Team Member</h4>
        <div className="flex gap-4">
          <input
            type="text"
            value={newMemberAddress}
            onChange={(e) => setNewMemberAddress(e.target.value)}
            placeholder="Enter EVM address (0x...)"
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none"
            disabled={isAdding}
          />
          <AnimatedButton
            variant="primary"
            onClick={handleAddMember}
            disabled={isAdding || !newMemberAddress.trim()}
          >
            {isAdding ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Add Member
          </AnimatedButton>
        </div>
      </GlassCard>

      {/* Info Card */}
      <GlassCard className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-cyan-400" />
            </div>
          </div>
          <div>
            <h5 className="font-semibold text-cyan-400 mb-2">Team Member Permissions</h5>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Create new properties and campaigns</li>
              <li>• Create proposals for voting</li>
              <li>• Manage property details</li>
              <li>• View admin dashboard</li>
              <li className="text-yellow-400">⚠️ Cannot withdraw funds from treasury</li>
            </ul>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

function DividendsTab() {
  const [isDistributeOpen, setIsDistributeOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const { places, isLoading: loadingProperties } = useAllPlaces();
  const { depositRewards, isPending: isDistributing } = useDepositRewards();
  const { price: ethPrice } = useEthPrice();

  const handleDistribute = async () => {
    if (!selectedProperty || !amount) {
      setError("Please select a property and enter an amount");
      return;
    }

    try {
      const amountUSD = parseFloat(amount);
      const amountETH = usdToEth(amountUSD, ethPrice.usd);

      await depositRewards(selectedProperty as `0x${string}`, amountETH);

      setSuccess(true);
      setTimeout(() => {
        setIsDistributeOpen(false);
        setSuccess(false);
        setSelectedProperty("");
        setAmount("");
      }, 2000);
    } catch (err: any) {
      console.error("Error distributing rewards:", err);
      setError(err.message || "Failed to distribute rewards");
    }
  };

  return (
    <div className="space-y-6">
      {/* Distribute Modal */}
      {isDistributeOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <GlassCard>
              <h3 className="text-2xl font-bold mb-6">Distribute Rewards</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Select Property</label>
                  <select
                    value={selectedProperty}
                    onChange={(e) => setSelectedProperty(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-400 focus:outline-none"
                    disabled={isDistributing || loadingProperties}
                  >
                    <option value="">Select a property...</option>
                    {places.map((place) => (
                      <option key={place.address} value={place.address}>
                        {place.info.name} - {place.info.city}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Amount (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-400 focus:outline-none"
                    disabled={isDistributing}
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/50 text-green-400 text-sm">
                    ✅ Rewards distributed successfully!
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <AnimatedButton
                    variant="outline"
                    onClick={() => setIsDistributeOpen(false)}
                    disabled={isDistributing}
                    className="flex-1"
                  >
                    Cancel
                  </AnimatedButton>
                  <AnimatedButton
                    variant="primary"
                    onClick={handleDistribute}
                    disabled={isDistributing || !selectedProperty || !amount}
                    className="flex-1"
                  >
                    {isDistributing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Distributing...
                      </>
                    ) : (
                      "Distribute"
                    )}
                  </AnimatedButton>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold">Reward Management</h3>
        <AnimatedButton variant="primary" onClick={() => setIsDistributeOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Distribute Rewards
        </AnimatedButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard>
          <MetricDisplay
            icon={DollarSign}
            label="Pending Distribution"
            value="$0"
            iconColor="text-yellow-400"
          />
        </GlassCard>
        <GlassCard>
          <MetricDisplay
            icon={CheckCircle2}
            label="Distributed This Month"
            value="$0"
            iconColor="text-green-400"
            delay={0.1}
          />
        </GlassCard>
        <GlassCard>
          <MetricDisplay
            icon={TrendingUp}
            label="Total Distributed"
            value="$0"
            iconColor="text-cyan-400"
            delay={0.2}
          />
        </GlassCard>
      </div>
    </div>
  );
}

function GovernanceTab() {
  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="text-center py-12">
          <Gavel className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Governance feature coming soon</p>
          <p className="text-sm text-muted-foreground mt-2">
            Create and manage proposals for each property
          </p>
        </div>
      </GlassCard>
    </div>
  );
}

function OperationsTab() {
  const { places, isLoading } = useAllPlaces();
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [liquidationAmount, setLiquidationAmount] = useState<string>("");

  const { closeSale, isPending: isClosing } = useCloseSale();
  const { completePlace, isPending: isCompleting } = useCompletPlace();

  const selected = places.find((p) => p.address === selectedProperty);

  const handleCloseSale = async () => {
    if (!selected) {
      alert("Select a property first.");
      return;
    }

    try {
      await closeSale(selected.address);
      alert("Sale closed successfully.");
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleComplete = async () => {
    if (!selected) {
      alert("Select a property first.");
      return;
    }

    const amountEthString = liquidationAmount.trim();
    if (!amountEthString || parseFloat(amountEthString) <= 0) {
      alert("Enter a valid amount in ETH.");
      return;
    }

    try {
      const amountWei = parseEther(amountEthString);
      await completePlace(selected.address, amountWei);
      alert("Completion triggered. Investors can now claim their proceeds.");
      setLiquidationAmount("");
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const saleEndDate = selected
    ? new Date(Number(selected.info.saleEnd) * 1000)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-2xl font-bold">Manual Operations</h3>
          <p className="text-muted-foreground">
            Close sales and trigger completion flows directly from the admin panel.
          </p>
        </div>
      </div>

      {isLoading && (
        <GlassCard>
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-cyan-400" />
            <p className="text-muted-foreground">Loading properties...</p>
          </div>
        </GlassCard>
      )}

      <GlassCard>
        <div className="grid gap-4">
          <div>
            <label className="text-sm text-muted-foreground block mb-2">Select Property</label>
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm"
            >
              <option value="">-- Select a property --</option>
              {places.map((place) => (
                <option key={place.address} value={place.address}>
                  {place.info.name} ({place.info.city})
                </option>
              ))}
            </select>
          </div>

          {selected && (
            <div className="grid md:grid-cols-3 gap-4 bg-white/5 border border-white/10 rounded-xl p-4">
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="font-semibold">
                  {selected.info.isActive ? "Active" : "Closed"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Puzzles Sold</p>
                <p className="font-semibold">
                  {Number(selected.info.puzzlesSold)} / {Number(selected.info.totalPuzzles)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sale End</p>
                <p className="font-semibold">
                  {saleEndDate ? saleEndDate.toLocaleString() : "—"}
                </p>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-cyan-400">Close Sale</h4>
              <p className="text-sm text-muted-foreground">
                Force the sale to close if the automatic closure fails.
              </p>

              {selected && saleEndDate && (() => {
                const isSaleEnded = Date.now() > saleEndDate.getTime();
                const timeLeft = saleEndDate.getTime() - Date.now();
                const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));

                return (
                  <div className={`p-3 rounded-lg border ${
                    isSaleEnded || !selected.info.isActive
                      ? "border-red-500/40 bg-red-500/10"
                      : "border-cyan-500/40 bg-cyan-500/10"
                  }`}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Sale Deadline:</span>
                      <span className="font-semibold">
                        {saleEndDate.toLocaleDateString()} {saleEndDate.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="h-4 w-4" />
                      {isSaleEnded || !selected.info.isActive ? (
                        <span className="text-red-400 font-medium">⚠️ Sale Ended - Ready to Close</span>
                      ) : daysLeft > 0 ? (
                        <span className="text-cyan-400">{daysLeft} day{daysLeft !== 1 ? 's' : ''} left</span>
                      ) : (
                        <span className="text-red-400">Ending soon</span>
                      )}
                    </div>
                  </div>
                );
              })()}

              <AnimatedButton
                variant="primary"
                onClick={handleCloseSale}
                disabled={!selected || isClosing}
              >
                {isClosing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  "Close Sale Manually"
                )}
              </AnimatedButton>
            </div>

            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-purple-400">Trigger Completion</h4>
              <p className="text-sm text-muted-foreground">
                Deposit the property sale proceeds so investors can claim their final payout. Amount in ETH.
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Total amount (ETH)"
                  value={liquidationAmount}
                  onChange={(e) => setLiquidationAmount(e.target.value)}
                  className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm"
                />
                <AnimatedButton
                  variant="outline"
                  onClick={handleComplete}
                  disabled={!selected || isCompleting}
                >
                  {isCompleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Trigger"
                  )}
                </AnimatedButton>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
