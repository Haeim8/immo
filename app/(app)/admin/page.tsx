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
  Wrench,
  Mail,
  X
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
import { useTeamMembers } from "@/lib/evm/hooks";
import { usdToEth } from "@/lib/evm/adapters";
import {
  useAddTeamMember,
  useRemoveTeamMember,
  useDepositRewards,
  useCloseSale,
  useCompletPlace,
  usePausePlace,
  useUnpausePlace,
  usePauseFactory,
  useUnpauseFactory,
  useCreateProposal,
  useCastVote,
  useCloseProposal,
} from "@/lib/evm/write-hooks";
import { formatEther, parseEther } from "viem";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "properties" | "create" | "team" | "dividends" | "governance" | "operations" | "waitlist"
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
                  { id: "waitlist", label: "Waitlist", icon: Mail },
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
          {activeTab === "waitlist" && <WaitlistTab />}
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
  const [localError, setLocalError] = useState("");
  const { address: currentUserAddress } = useWalletAddress();
  const { isAdmin } = useIsAdmin(currentUserAddress);
  const { addTeamMember, isPending: isAdding, isSuccess, error } = useAddTeamMember();
  const { removeTeamMember, isPending: isRemoving, isSuccess: removeSuccess, error: removeError } = useRemoveTeamMember();
  const { teamMembers, isLoading: isLoadingMembers } = useTeamMembers();

  // Gérer le succès de la transaction - recharger après ajout/suppression
  useEffect(() => {
    if (isSuccess || removeSuccess) {
      setNewMemberAddress("");
      setLocalError("");
      // Forcer un rechargement après ajout/suppression
      window.location.reload();
    }
  }, [isSuccess, removeSuccess]);

  const handleAddMember = () => {
    if (!newMemberAddress.trim()) {
      setLocalError("Veuillez entrer une adresse wallet valide");
      return;
    }

    setLocalError("");
    addTeamMember(newMemberAddress as `0x${string}`);
  };

  const handleRemoveMember = (memberAddress: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir retirer ce membre de l'équipe ?\n\n${memberAddress}`)) {
      removeTeamMember(memberAddress as `0x${string}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Gestion de l'équipe</h3>
          <p className="text-muted-foreground mt-1">Gérer les membres de l'équipe qui peuvent créer des propriétés et des propositions</p>
        </div>
      </div>

      {/* Add Team Member - Seulement pour le wallet admin */}
      {isAdmin && (
        <GlassCard>
          <h4 className="text-lg font-semibold mb-4">Ajouter un membre</h4>
        <div className="space-y-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={newMemberAddress}
              onChange={(e) => setNewMemberAddress(e.target.value)}
              placeholder="Entrer l'adresse EVM (0x...)"
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
              Ajouter
            </AnimatedButton>
          </div>

          {/* État de chargement */}
          {isAdding && (
            <div className="p-4 rounded-xl bg-blue-500/15 border border-blue-500/40 text-blue-300 flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
              <div>
                <p className="font-medium">Transaction en cours...</p>
                <p className="text-sm text-muted-foreground">Veuillez signer dans votre wallet et attendre la confirmation.</p>
              </div>
            </div>
          )}

          {/* Message de succès */}
          {isSuccess && !isAdding && (
            <div className="p-4 rounded-xl bg-green-500/15 border border-green-500/40 text-green-300">
              ✅ Membre de l'équipe ajouté avec succès ! La transaction a été confirmée.
            </div>
          )}

          {/* Message d'erreur du hook */}
          {error && !isAdding && (
            <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300">
              ❌ Erreur : {error.message || "Échec de l'ajout du membre"}
            </div>
          )}

          {/* Message d'erreur local (validation) */}
          {localError && (
            <div className="p-4 rounded-xl bg-yellow-500/15 border border-yellow-500/40 text-yellow-300">
              ⚠️ {localError}
            </div>
          )}

          {/* Message de succès remove */}
          {removeSuccess && !isRemoving && (
            <div className="p-4 rounded-xl bg-green-500/15 border border-green-500/40 text-green-300">
              ✅ Membre révoqué avec succès ! La transaction a été confirmée.
            </div>
          )}

          {/* Message d'erreur remove */}
          {removeError && !isRemoving && (
            <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300">
              ❌ Erreur : {removeError.message || "Échec de la révocation"}
            </div>
          )}
        </div>
      </GlassCard>
      )}

      {/* Liste des membres de l'équipe */}
      <GlassCard>
        <h4 className="text-lg font-semibold mb-4">Membres de l'équipe actifs</h4>
        {isLoadingMembers ? (
          <div className="text-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-cyan-400" />
            <p className="text-sm text-muted-foreground">Chargement des membres...</p>
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Aucun membre d'équipe pour le moment</p>
            <p className="text-sm text-muted-foreground mt-2">Ajoutez des membres ci-dessus</p>
          </div>
        ) : (
          <div className="space-y-3">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.address}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex-1">
                  <p className="font-mono text-sm text-cyan-400">{member.address}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ajouté le {member.addedAt.toLocaleDateString()} à {member.addedAt.toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <AnimatedButton
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`${BLOCK_EXPLORER_URL}/address/${member.address}`, '_blank')}
                  >
                    Explorer
                  </AnimatedButton>
                  {isAdmin && (
                    <AnimatedButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveMember(member.address)}
                      disabled={isRemoving}
                      className="text-red-400 border-red-500/40 hover:bg-red-500/10"
                    >
                      {isRemoving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Révoquer"
                      )}
                    </AnimatedButton>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
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
            <h5 className="font-semibold text-cyan-400 mb-2">Permissions des membres</h5>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Créer de nouvelles propriétés et campagnes</li>
              <li>• Créer des propositions de vote</li>
              <li>• Gérer les détails des propriétés</li>
              <li>• Accéder au tableau de bord admin</li>
              <li className="text-yellow-400">⚠️ Ne peut pas retirer de fonds du trésor</li>
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
  const [localError, setLocalError] = useState("");

  const { places, isLoading: loadingProperties } = useAllPlaces();
  const {
    depositRewards,
    isPending: isDistributing,
    isSuccess,
    error
  } = useDepositRewards();
  const { price: ethPrice } = useEthPrice();

  // Gérer le succès de la transaction
  useEffect(() => {
    if (isSuccess) {
      // Fermer la modal et réinitialiser après succès
      setTimeout(() => {
        setIsDistributeOpen(false);
        setSelectedProperty("");
        setAmount("");
        setLocalError("");
      }, 2000);
    }
  }, [isSuccess]);

  const handleDistribute = () => {
    if (!selectedProperty || !amount) {
      setLocalError("Veuillez sélectionner une propriété et entrer un montant");
      return;
    }

    const amountUSD = parseFloat(amount);
    if (!Number.isFinite(amountUSD) || amountUSD <= 0) {
      setLocalError("Veuillez entrer un montant valide");
      return;
    }

    setLocalError("");
    const amountETH = usdToEth(amountUSD, ethPrice.usd);
    depositRewards(selectedProperty as `0x${string}`, amountETH);
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

                {/* État de chargement */}
                {isDistributing && (
                  <div className="p-4 rounded-xl bg-blue-500/15 border border-blue-500/40 text-blue-300 flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Transaction en cours...</p>
                      <p className="text-xs text-muted-foreground">
                        Veuillez signer dans votre wallet et attendre la confirmation.
                      </p>
                    </div>
                  </div>
                )}

                {/* Message de succès */}
                {isSuccess && !isDistributing && (
                  <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/50 text-green-400 text-sm">
                    ✅ Rewards distribués avec succès ! La transaction a été confirmée.
                  </div>
                )}

                {/* Erreur de transaction */}
                {error && !isDistributing && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
                    ❌ Erreur : {error.message || "Échec de la transaction"}
                  </div>
                )}

                {/* Erreur de validation locale */}
                {localError && (
                  <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/50 text-yellow-400 text-sm">
                    ⚠️ {localError}
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
  const { places, isLoading: loadingPlaces } = useAllPlaces();
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalDescription, setProposalDescription] = useState("");
  const [votingDurationDays, setVotingDurationDays] = useState("7");
  const [localError, setLocalError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const {
    createProposal,
    isPending: isCreating,
    isSuccess: createSuccess,
    error: createError
  } = useCreateProposal();

  const selected = places.find((p) => p.address === selectedProperty);

  // Reset form on success
  useEffect(() => {
    if (createSuccess) {
      setTimeout(() => {
        setShowCreateModal(false);
        setProposalTitle("");
        setProposalDescription("");
        setVotingDurationDays("7");
        setSelectedProperty("");
        setLocalError("");
      }, 2000);
    }
  }, [createSuccess]);

  const handleCreateProposal = () => {
    if (!selected) {
      setLocalError("Veuillez sélectionner une propriété");
      return;
    }

    if (!proposalTitle.trim()) {
      setLocalError("Veuillez entrer un titre");
      return;
    }

    if (!proposalDescription.trim()) {
      setLocalError("Veuillez entrer une description");
      return;
    }

    const days = parseInt(votingDurationDays, 10);
    if (!Number.isInteger(days) || days < 1 || days > 30) {
      setLocalError("La durée de vote doit être entre 1 et 30 jours");
      return;
    }

    setLocalError("");
    const durationSeconds = BigInt(days * 86400);
    createProposal(selected.address, proposalTitle.trim(), proposalDescription.trim(), durationSeconds);
  };

  return (
    <div className="space-y-6">
      {/* Create Proposal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <GlassCard>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold">Create New Proposal</h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Select Property</label>
                  <select
                    value={selectedProperty}
                    onChange={(e) => setSelectedProperty(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-400 focus:outline-none"
                    disabled={isCreating || loadingPlaces}
                  >
                    <option value="">Select a property...</option>
                    {places.filter(p => p.info.votingEnabled).map((place) => (
                      <option key={place.address} value={place.address}>
                        {place.info.name} - {place.info.city}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Only properties with voting enabled are shown
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Proposal Title</label>
                  <input
                    type="text"
                    value={proposalTitle}
                    onChange={(e) => setProposalTitle(e.target.value)}
                    placeholder="Ex: Authorize renovation works"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-400 focus:outline-none"
                    disabled={isCreating}
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={proposalDescription}
                    onChange={(e) => setProposalDescription(e.target.value)}
                    placeholder="Describe the proposal in detail..."
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-400 focus:outline-none resize-none"
                    disabled={isCreating}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {proposalDescription.length}/500 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Voting Duration (days)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={votingDurationDays}
                    onChange={(e) => setVotingDurationDays(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-400 focus:outline-none"
                    disabled={isCreating}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Between 1 and 30 days
                  </p>
                </div>

                {/* Transaction en cours */}
                {isCreating && (
                  <div className="p-4 rounded-xl bg-blue-500/15 border border-blue-500/40 text-blue-300 flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Creating proposal...</p>
                      <p className="text-xs text-muted-foreground">
                        Please sign the transaction and wait for confirmation.
                      </p>
                    </div>
                  </div>
                )}

                {/* Success */}
                {createSuccess && !isCreating && (
                  <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/50 text-green-400 text-sm">
                    ✅ Proposal created successfully!
                  </div>
                )}

                {/* Error */}
                {createError && !isCreating && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
                    ❌ Error: {createError.message || "Transaction failed"}
                  </div>
                )}

                {/* Local error */}
                {localError && (
                  <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/50 text-yellow-400 text-sm">
                    ⚠️ {localError}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <AnimatedButton
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    disabled={isCreating}
                    className="flex-1"
                  >
                    Cancel
                  </AnimatedButton>
                  <AnimatedButton
                    variant="primary"
                    onClick={handleCreateProposal}
                    disabled={isCreating || !selectedProperty || !proposalTitle || !proposalDescription}
                    className="flex-1"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Proposal"
                    )}
                  </AnimatedButton>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-2xl font-bold">Community Governance</h3>
          <p className="text-muted-foreground">
            Create proposals for properties with voting enabled
          </p>
        </div>
        <AnimatedButton variant="primary" onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Proposal
        </AnimatedButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard>
          <MetricDisplay
            icon={Gavel}
            label="Active Proposals"
            value="0"
            iconColor="text-cyan-400"
          />
        </GlassCard>
        <GlassCard>
          <MetricDisplay
            icon={CheckCircle2}
            label="Passed Proposals"
            value="0"
            iconColor="text-green-400"
            delay={0.1}
          />
        </GlassCard>
        <GlassCard>
          <MetricDisplay
            icon={Users}
            label="Total Votes Cast"
            value="0"
            iconColor="text-purple-400"
            delay={0.2}
          />
        </GlassCard>
      </div>

      <GlassCard>
        <div className="text-center py-12">
          <Gavel className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground mb-2">No proposals yet</p>
          <p className="text-sm text-muted-foreground">
            Create your first proposal to enable community voting
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
  const [localError, setLocalError] = useState("");

  const {
    closeSale,
    isPending: isClosing,
    isSuccess: closeSuccess,
    error: closeError
  } = useCloseSale();

  const {
    completePlace,
    isPending: isCompleting,
    isSuccess: completeSuccess,
    error: completeError
  } = useCompletPlace();

  const {
    pausePlace,
    isPending: isPausingPlace,
    isSuccess: pausePlaceSuccess,
    error: pausePlaceError
  } = usePausePlace();

  const {
    unpausePlace,
    isPending: isUnpausingPlace,
    isSuccess: unpausePlaceSuccess,
    error: unpausePlaceError
  } = useUnpausePlace();

  const {
    pauseFactory,
    isPending: isPausingFactory,
    isSuccess: pauseFactorySuccess,
    error: pauseFactoryError
  } = usePauseFactory();

  const {
    unpauseFactory,
    isPending: isUnpausingFactory,
    isSuccess: unpauseFactorySuccess,
    error: unpauseFactoryError
  } = useUnpauseFactory();

  const selected = places.find((p) => p.address === selectedProperty);

  // Gérer le succès du close sale
  useEffect(() => {
    if (closeSuccess) {
      setLocalError("");
    }
  }, [closeSuccess]);

  // Gérer le succès de la complétion
  useEffect(() => {
    if (completeSuccess) {
      setLiquidationAmount("");
      setLocalError("");
    }
  }, [completeSuccess]);

  const handleCloseSale = () => {
    if (!selected) {
      setLocalError("Veuillez sélectionner une propriété");
      return;
    }

    setLocalError("");
    closeSale(selected.address);
  };

  const handleComplete = () => {
    if (!selected) {
      setLocalError("Veuillez sélectionner une propriété");
      return;
    }

    const amountEthString = liquidationAmount.trim();
    if (!amountEthString || parseFloat(amountEthString) <= 0) {
      setLocalError("Veuillez entrer un montant valide en ETH");
      return;
    }

    setLocalError("");
    const amountWei = parseEther(amountEthString);
    completePlace(selected.address, amountWei);
  };

  const handlePausePlace = () => {
    if (!selected) {
      setLocalError("Veuillez sélectionner une propriété");
      return;
    }
    setLocalError("");
    pausePlace(selected.address);
  };

  const handleUnpausePlace = () => {
    if (!selected) {
      setLocalError("Veuillez sélectionner une propriété");
      return;
    }
    setLocalError("");
    unpausePlace(selected.address);
  };

  const handlePauseFactory = () => {
    setLocalError("");
    pauseFactory();
  };

  const handleUnpauseFactory = () => {
    setLocalError("");
    unpauseFactory();
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

      {/* PAUSE/UNPAUSE CONTROLS */}
      <GlassCard>
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-red-400 mb-2">🚨 Emergency Controls</h3>
            <p className="text-sm text-muted-foreground">
              Pause/Unpause individual campaigns or the entire factory. Use only in emergency situations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Campaign Pause Controls */}
            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-orange-400">Campaign Controls</h4>
              <p className="text-sm text-muted-foreground">
                Pause or resume the selected campaign to prevent/allow puzzle purchases.
              </p>

              <div className="flex gap-2">
                <AnimatedButton
                  variant="outline"
                  onClick={handlePausePlace}
                  disabled={!selected || isPausingPlace}
                  className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
                >
                  {isPausingPlace ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Pausing...
                    </>
                  ) : (
                    "⏸️ Pause Campaign"
                  )}
                </AnimatedButton>

                <AnimatedButton
                  variant="outline"
                  onClick={handleUnpausePlace}
                  disabled={!selected || isUnpausingPlace}
                  className="flex-1 border-green-500/50 text-green-400 hover:bg-green-500/10"
                >
                  {isUnpausingPlace ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Unpausing...
                    </>
                  ) : (
                    "▶️ Resume Campaign"
                  )}
                </AnimatedButton>
              </div>
            </div>

            {/* Factory Pause Controls */}
            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-red-400">Factory Controls</h4>
              <p className="text-sm text-muted-foreground">
                Pause or resume the entire factory to prevent/allow new campaign creation.
              </p>

              <div className="flex gap-2">
                <AnimatedButton
                  variant="outline"
                  onClick={handlePauseFactory}
                  disabled={isPausingFactory}
                  className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
                >
                  {isPausingFactory ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Pausing...
                    </>
                  ) : (
                    "🛑 Pause Factory"
                  )}
                </AnimatedButton>

                <AnimatedButton
                  variant="outline"
                  onClick={handleUnpauseFactory}
                  disabled={isUnpausingFactory}
                  className="flex-1 border-green-500/50 text-green-400 hover:bg-green-500/10"
                >
                  {isUnpausingFactory ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Unpausing...
                    </>
                  ) : (
                    "✅ Resume Factory"
                  )}
                </AnimatedButton>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Messages de statut */}
      {(isClosing || isCompleting || isPausingPlace || isUnpausingPlace || isPausingFactory || isUnpausingFactory) && (
        <GlassCard>
          <div className="p-4 rounded-xl bg-blue-500/15 border border-blue-500/40 text-blue-300 flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
            <div>
              <p className="font-medium">Transaction en cours...</p>
              <p className="text-sm text-muted-foreground">
                Veuillez signer dans votre wallet et attendre la confirmation.
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Success Messages */}
      {pausePlaceSuccess && !isPausingPlace && (
        <GlassCard>
          <div className="p-4 rounded-xl bg-green-500/15 border border-green-500/40 text-green-300">
            ✅ Campaign pausée avec succès !
          </div>
        </GlassCard>
      )}

      {unpausePlaceSuccess && !isUnpausingPlace && (
        <GlassCard>
          <div className="p-4 rounded-xl bg-green-500/15 border border-green-500/40 text-green-300">
            ✅ Campaign reprise avec succès !
          </div>
        </GlassCard>
      )}

      {pauseFactorySuccess && !isPausingFactory && (
        <GlassCard>
          <div className="p-4 rounded-xl bg-green-500/15 border border-green-500/40 text-green-300">
            ✅ Factory pausée avec succès ! Aucune nouvelle campaign ne peut être créée.
          </div>
        </GlassCard>
      )}

      {unpauseFactorySuccess && !isUnpausingFactory && (
        <GlassCard>
          <div className="p-4 rounded-xl bg-green-500/15 border border-green-500/40 text-green-300">
            ✅ Factory reprise avec succès ! Les campaigns peuvent à nouveau être créées.
          </div>
        </GlassCard>
      )}

      {closeSuccess && !isClosing && (
        <GlassCard>
          <div className="p-4 rounded-xl bg-green-500/15 border border-green-500/40 text-green-300">
            ✅ Vente fermée avec succès ! La transaction a été confirmée.
          </div>
        </GlassCard>
      )}

      {completeSuccess && !isCompleting && (
        <GlassCard>
          <div className="p-4 rounded-xl bg-green-500/15 border border-green-500/40 text-green-300">
            ✅ Complétion déclenchée avec succès ! Les investisseurs peuvent maintenant réclamer leurs gains.
          </div>
        </GlassCard>
      )}

      {closeError && !isClosing && (
        <GlassCard>
          <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300">
            ❌ Erreur lors de la fermeture : {closeError.message || "Échec de la transaction"}
          </div>
        </GlassCard>
      )}

      {completeError && !isCompleting && (
        <GlassCard>
          <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300">
            ❌ Erreur lors de la complétion : {completeError.message || "Échec de la transaction"}
          </div>
        </GlassCard>
      )}

      {pausePlaceError && !isPausingPlace && (
        <GlassCard>
          <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300">
            ❌ Erreur lors de la pause de la campaign : {pausePlaceError.message || "Échec de la transaction"}
          </div>
        </GlassCard>
      )}

      {unpausePlaceError && !isUnpausingPlace && (
        <GlassCard>
          <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300">
            ❌ Erreur lors de la reprise de la campaign : {unpausePlaceError.message || "Échec de la transaction"}
          </div>
        </GlassCard>
      )}

      {pauseFactoryError && !isPausingFactory && (
        <GlassCard>
          <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300">
            ❌ Erreur lors de la pause de la factory : {pauseFactoryError.message || "Échec de la transaction"}
          </div>
        </GlassCard>
      )}

      {unpauseFactoryError && !isUnpausingFactory && (
        <GlassCard>
          <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300">
            ❌ Erreur lors de la reprise de la factory : {unpauseFactoryError.message || "Échec de la transaction"}
          </div>
        </GlassCard>
      )}

      {localError && (
        <GlassCard>
          <div className="p-4 rounded-xl bg-yellow-500/15 border border-yellow-500/40 text-yellow-300">
            ⚠️ {localError}
          </div>
        </GlassCard>
      )}
    </div>
  );
}

function WaitlistTab() {
  const [entries, setEntries] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [maxMembers] = useState(2500);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWaitlist = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/waitlist");
        const data = await res.json();
        if (data.success) {
          setEntries(data.entries);
          setCount(data.count);
        }
      } catch (err) {
        console.error("Error fetching waitlist:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchWaitlist();
  }, []);

  const handleExportCSV = () => {
    const csv = [
      ["Email", "EVM Address", "Joined At"],
      ...entries.map((e) => [
        e.email,
        e.evmAddress,
        new Date(e.createdAt).toLocaleString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `waitlist-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-2xl font-bold">Waitlist Management</h3>
          <p className="text-muted-foreground">
            Manage early access registrations for the platform
          </p>
        </div>
        {entries.length > 0 && (
          <AnimatedButton variant="outline" onClick={handleExportCSV}>
            Export CSV
          </AnimatedButton>
        )}
      </div>

      {/* Counter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard hover glow>
          <MetricDisplay
            icon={Users}
            label="Total Registered"
            value={count}
            iconColor="text-cyan-400"
          />
        </GlassCard>
        <GlassCard hover glow>
          <MetricDisplay
            icon={CheckCircle2}
            label="Spots Remaining"
            value={maxMembers - count}
            iconColor="text-green-400"
            delay={0.1}
          />
        </GlassCard>
        <GlassCard hover glow>
          <MetricDisplay
            icon={TrendingUp}
            label="Fill Rate"
            value={`${((count / maxMembers) * 100).toFixed(1)}%`}
            iconColor="text-purple-400"
            delay={0.2}
          />
        </GlassCard>
      </div>

      {/* Progress Bar */}
      <GlassCard>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Waitlist Progress
            </span>
            <span className="text-lg font-bold text-cyan-400">
              {count} / {maxMembers}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-600"
              initial={{ width: 0 }}
              animate={{ width: `${(count / maxMembers) * 100}%` }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </div>
          {count >= maxMembers * 0.9 && (
            <p className="text-sm text-orange-400">
              ⚠️ Waitlist is {count >= maxMembers ? "full" : "almost full"}!
            </p>
          )}
        </div>
      </GlassCard>

      {/* Table */}
      <GlassCard>
        <h4 className="text-lg font-semibold mb-4">Registered Members</h4>
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-cyan-400" />
            <p className="text-muted-foreground">Loading waitlist...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No registrations yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Share the waitlist page to start collecting signups
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    #
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    EVM Address
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Joined At
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <motion.tr
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {index + 1}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium">
                      {entry.email}
                    </td>
                    <td className="py-3 px-4">
                      <code className="text-xs text-cyan-400 font-mono">
                        {entry.evmAddress.slice(0, 6)}...
                        {entry.evmAddress.slice(-4)}
                      </code>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleDateString()}{" "}
                      {new Date(entry.createdAt).toLocaleTimeString()}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
