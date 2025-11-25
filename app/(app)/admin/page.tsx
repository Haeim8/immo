"use client";

import { useState, useEffect } from "react";
export const dynamic = 'force-dynamic';
import { motion, AnimatePresence } from "framer-motion";
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
  X,
  AlertTriangle,
  Search,
  ChevronRight,
  Activity
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
} from "@/lib/evm/write-hooks";
import { formatEther, parseEther } from "viem";
import { cn } from "@/lib/utils";

// --- COMPOSANTS UI INTERNES STYLISÉS ---

const TabButton = ({ id, label, icon: Icon, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "relative flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 z-10",
      active ? "text-white" : "text-muted-foreground hover:text-white hover:bg-white/5"
    )}
  >
    {active && (
      <motion.div
        layoutId="activeTab"
        className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full -z-10 shadow-[0_0_20px_rgba(124,58,237,0.4)]"
        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
      />
    )}
    <Icon className="h-4 w-4 relative z-10" />
    <span className="relative z-10">{label}</span>
  </button>
);

const SectionHeader = ({ title, subtitle, icon: Icon, color = "cyan" }: any) => (
  <div className="flex items-start gap-4 mb-6">
    <div className={`p-3 rounded-2xl bg-${color}-500/10 border border-${color}-500/20`}>
      <Icon className={`h-6 w-6 text-${color}-400`} />
    </div>
    <div>
      <h3 className="text-2xl font-bold tracking-tight text-white">{title}</h3>
      <p className="text-muted-foreground text-sm">{subtitle}</p>
    </div>
  </div>
);

const InputField = (props: any) => (
  <input
    {...props}
    className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-white/20 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 focus:outline-none transition-all duration-300"
  />
);

const SelectField = (props: any) => (
  <div className="relative">
    <select
      {...props}
      className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 focus:outline-none appearance-none transition-all duration-300"
    />
    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rotate-90 pointer-events-none" />
  </div>
);

// --- DASHBOARD PRINCIPAL ---

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

    if (isLoadingAdmin || isLoadingTeam) return;

    const canAccess = isAdmin || (isTeamMember ?? false);
    setHasAccess(canAccess);
    setAccessChecked(true);

    if (!canAccess) router.replace("/portfolio");
  }, [isConnected, isAdmin, isTeamMember, isLoadingAdmin, isLoadingTeam, router]);

  if (!accessChecked || isLoadingAdmin || isLoadingTeam) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-20 animate-pulse" />
          <Loader2 className="relative h-12 w-12 animate-spin text-cyan-400" />
        </div>
        <p className="text-sm font-mono text-cyan-400/80 animate-pulse">VERIFICATION_ACCESS_LEVEL...</p>
      </div>
    );
  }

  if (!hasAccess) return null;

  const tabs = [
    { id: "overview", label: "Dashboard", icon: Activity },
    { id: "properties", label: "Properties", icon: Building2 },
    { id: "create", label: "Create", icon: Plus },
    { id: "team", label: "Team", icon: Users },
    { id: "dividends", label: "Rewards", icon: DollarSign },
    { id: "governance", label: "DAO", icon: Gavel },
    { id: "operations", label: "Ops", icon: Wrench },
    { id: "waitlist", label: "Waitlist", icon: Mail },
  ];

  return (
    <div className="min-h-screen w-full pb-20">
      <div className="w-full max-w-[1400px] mx-auto space-y-8">
        
        {/* Header Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pb-6 border-b border-white/5"
        >
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
              <div className="relative p-4 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                Admin <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Console</span>
              </h1>
              <div className="flex items-center gap-2 mt-2">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                 <p className="text-sm font-mono text-muted-foreground">Protocol Status: ONLINE</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-xs font-mono text-muted-foreground">{address?.slice(0,6)}...{address?.slice(-4)}</span>
            <span className="text-xs font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 ml-2">ADMIN</span>
          </div>
        </motion.div>

        {/* Navigation Tabs (Scrollable) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="sticky top-0 z-40 -mx-4 px-4 md:mx-0 md:px-0"
        >
          <div className="flex items-center p-1.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-md overflow-x-auto scrollbar-hide w-full md:w-fit mx-auto">
            {tabs.map((tab) => (
              <TabButton
                key={tab.id}
                {...tab}
                active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id as any)}
              />
            ))}
          </div>
        </motion.div>

        {/* Content Area */}
        <div className="min-h-[500px]">
           <AnimatePresence mode="wait">
             <motion.div
               key={activeTab}
               initial={{ opacity: 0, scale: 0.98 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.98 }}
               transition={{ duration: 0.2 }}
             >
                {activeTab === "overview" && <OverviewTab />}
                {activeTab === "properties" && <PropertiesTab />}
                {activeTab === "create" && <CreatePropertyTab />}
                {activeTab === "team" && <TeamTab />}
                {activeTab === "dividends" && <DividendsTab />}
                {activeTab === "governance" && <GovernanceTab />}
                {activeTab === "operations" && <OperationsTab />}
                {activeTab === "waitlist" && <WaitlistTab />}
             </motion.div>
           </AnimatePresence>
        </div>

      </div>
    </div>
  );
}

// --- SOUS-COMPOSANTS ---

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
    <div className="space-y-8">
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </div>
      ) : (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard 
               label="Total Assets" 
               value={totalProperties} 
               icon={Building2} 
               color="cyan" 
               trend="+12% this month"
            />
            <MetricCard 
               label="TVL (USD)" 
               value={`$${(totalValue / 1000).toFixed(1)}k`} 
               icon={DollarSign} 
               color="green" 
               trend="Live update"
            />
            <MetricCard 
               label="Avg APY" 
               value={`${avgReturn.toFixed(2)}%`} 
               icon={TrendingUp} 
               color="purple" 
            />
            <MetricCard 
               label="Investors" 
               value="--" 
               icon={Users} 
               color="blue" 
               trend="Coming soon"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity / Properties */}
            <GlassCard className="lg:col-span-2 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-32 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-colors" />
               <div className="flex items-center justify-between mb-6 relative z-10">
                 <h3 className="text-xl font-bold text-white">Live Markets</h3>
                 <AnimatedButton variant="outline" size="sm">View All</AnimatedButton>
               </div>
               
               {places.length === 0 ? (
                 <div className="text-center py-12 text-muted-foreground">No properties yet</div>
               ) : (
                 <div className="space-y-3 relative z-10">
                   {places.slice(0, 5).map((place, i) => (
                     <div key={place.address} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all cursor-pointer group">
                       <div className="flex items-center gap-4">
                         <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center border border-white/10">
                            <Building2 className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                         </div>
                         <div>
                            <p className="font-semibold text-white group-hover:text-cyan-300 transition-colors">{place.info.name}</p>
                            <div className="flex items-center gap-2">
                               <p className="text-xs text-muted-foreground">{place.info.city}</p>
                               <span className="w-1 h-1 rounded-full bg-gray-600" />
                               <p className="text-xs font-mono text-muted-foreground">{place.address.slice(0,6)}...</p>
                            </div>
                         </div>
                       </div>
                       <div className="text-right">
                         <p className="text-sm font-bold text-white">
                           {Number(place.info.puzzlesSold)} / {Number(place.info.totalPuzzles)}
                         </p>
                         <div className="w-24 h-1.5 bg-gray-800 rounded-full mt-1 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500" 
                              style={{ width: `${(Number(place.info.puzzlesSold) / Number(place.info.totalPuzzles)) * 100}%` }} 
                            />
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </GlassCard>

            {/* Quick Actions Panel */}
            <GlassCard>
              <h3 className="text-xl font-bold text-white mb-6">Quick Actions</h3>
              <div className="space-y-3">
                 <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 text-cyan-400 transition-all text-left group">
                    <Plus className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">New Property</span>
                 </button>
                 <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 text-purple-400 transition-all text-left group">
                    <DollarSign className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">Distribute Yield</span>
                 </button>
                 <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-muted-foreground hover:text-white transition-all text-left">
                    <Users className="h-5 w-5" />
                    <span className="font-medium">Manage Team</span>
                 </button>
              </div>
            </GlassCard>
          </div>
        </>
      )}
    </div>
  );
}

// Helper pour les cartes Metrics
const MetricCard = ({ label, value, icon: Icon, color, trend }: any) => (
  <GlassCard className="relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
     <div className={`absolute top-0 right-0 p-20 bg-${color}-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-${color}-500/20 transition-colors`} />
     <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
           <div className={`p-2.5 rounded-xl bg-${color}-500/10 border border-${color}-500/20 text-${color}-400`}>
              <Icon className="h-5 w-5" />
           </div>
           {trend && <span className="text-xs font-medium text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">{trend}</span>}
        </div>
        <div className="space-y-1">
           <p className="text-sm font-medium text-muted-foreground">{label}</p>
           <h4 className="text-3xl font-bold text-white tracking-tight">{value}</h4>
        </div>
     </div>
  </GlassCard>
);

function PropertiesTab() {
  const { places, isLoading } = useAllPlaces();
  const { price: ethPrice } = useEthPrice();

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-cyan-400" /></div>;

  return (
    <div className="space-y-6">
      <SectionHeader title="Property Management" subtitle="Overview and status of all real estate assets" icon={Building2} />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {places.map((place, index) => {
            const total = Number(place.info.totalPuzzles);
            const sold = Number(place.info.puzzlesSold);
            const progress = (sold / total) * 100;
            const priceUSD = parseFloat(formatEther(place.info.puzzlePrice)) * ethPrice.usd;

            return (
              <motion.div
                key={place.address}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassCard className="h-full flex flex-col group hover:border-cyan-500/30 transition-colors">
                   <div className="flex justify-between items-start mb-4">
                      <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                         <Building2 className="h-6 w-6 text-muted-foreground group-hover:text-cyan-400 transition-colors" />
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${place.info.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                        {place.info.isActive ? "ACTIVE" : "CLOSED"}
                      </span>
                   </div>
                   
                   <h4 className="text-lg font-bold text-white mb-1 truncate">{place.info.name}</h4>
                   <p className="text-sm text-muted-foreground mb-4">{place.info.city}, {place.info.province}</p>
                   
                   <div className="space-y-3 mb-6 flex-1">
                      <div className="flex justify-between text-sm">
                         <span className="text-muted-foreground">Price</span>
                         <span className="font-mono text-white">${priceUSD.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                         <span className="text-muted-foreground">Yield</span>
                         <span className="font-mono text-cyan-400">{(place.info.expectedReturn/100).toFixed(2)}%</span>
                      </div>
                      <div className="space-y-1.5 pt-2">
                         <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="text-white">{progress.toFixed(1)}%</span>
                         </div>
                         <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                            <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500" style={{ width: `${progress}%` }} />
                         </div>
                      </div>
                   </div>

                   <div className="pt-4 border-t border-white/5 flex gap-2">
                      <AnimatedButton variant="outline" size="sm" className="w-full text-xs" onClick={() => window.open(`${BLOCK_EXPLORER_URL}/address/${place.address}`, '_blank')}>
                         Contract
                      </AnimatedButton>
                   </div>
                </GlassCard>
              </motion.div>
            );
          })}
          
          {/* Add New Card Placeholder */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full min-h-[300px] rounded-3xl border border-dashed border-white/10 bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all group" onClick={() => document.getElementById('create')?.click()}>
             <div className="p-4 rounded-full bg-white/5 group-hover:scale-110 transition-transform">
                <Plus className="h-8 w-8 text-muted-foreground group-hover:text-white" />
             </div>
             <p className="font-medium text-muted-foreground group-hover:text-white">Create New Property</p>
          </motion.div>
      </div>
    </div>
  );
}

function CreatePropertyTab() {
  return (
    <div className="max-w-4xl mx-auto">
      <SectionHeader title="New Asset Listing" subtitle="Deploy a new real estate vault on the blockchain" icon={Plus} color="purple" />
      <CreatePropertyForm />
    </div>
  );
}

function TeamTab() {
  const [newMemberAddress, setNewMemberAddress] = useState("");
  const { address: currentUserAddress } = useWalletAddress();
  const { isAdmin } = useIsAdmin(currentUserAddress);
  const { addTeamMember, isPending: isAdding, isSuccess, error } = useAddTeamMember();
  const { removeTeamMember, isPending: isRemoving, isSuccess: removeSuccess } = useRemoveTeamMember();
  const { teamMembers, isLoading } = useTeamMembers();

  useEffect(() => {
    if (isSuccess || removeSuccess) {
      setNewMemberAddress("");
      window.location.reload();
    }
  }, [isSuccess, removeSuccess]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <SectionHeader title="Team Access Control" subtitle="Manage authorized personnel for protocol operations" icon={Users} color="blue" />

      {isAdmin && (
        <GlassCard className="border-blue-500/20">
           <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full space-y-2">
                 <label className="text-sm font-medium text-blue-200 ml-1">Add New Administrator</label>
                 <div className="relative">
                    <InputField 
                       placeholder="0x..." 
                       value={newMemberAddress}
                       onChange={(e: any) => setNewMemberAddress(e.target.value)}
                    />
                    <Users className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                 </div>
              </div>
              <AnimatedButton variant="primary" onClick={() => addTeamMember(newMemberAddress as `0x${string}`)} disabled={isAdding || !newMemberAddress} className="w-full md:w-auto h-[50px]">
                 {isAdding ? <Loader2 className="animate-spin" /> : <><Plus className="h-4 w-4 mr-2" /> Grant Access</>}
              </AnimatedButton>
           </div>
           {error && <p className="text-red-400 text-sm mt-3 bg-red-500/10 p-2 rounded-lg">Error: {error.message}</p>}
        </GlassCard>
      )}

      <div className="space-y-4">
         <h4 className="text-lg font-bold text-white px-1">Active Personnel</h4>
         {isLoading ? <Loader2 className="animate-spin text-cyan-400" /> : (
            <div className="grid gap-3">
               {teamMembers.map((member) => (
                  <div key={member.address} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
                     <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center font-bold text-white shadow-lg">
                           {member.address.slice(2,4).toUpperCase()}
                        </div>
                        <div>
                           <p className="font-mono text-white tracking-wide">{member.address}</p>
                           <p className="text-xs text-muted-foreground">Added: {member.addedAt.toLocaleDateString()}</p>
                        </div>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => window.open(`${BLOCK_EXPLORER_URL}/address/${member.address}`, '_blank')} className="p-2 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white transition-colors">
                           <Search className="h-4 w-4" />
                        </button>
                        {isAdmin && (
                           <button onClick={() => removeTeamMember(member.address as `0x${string}`)} className="p-2 hover:bg-red-500/20 rounded-lg text-muted-foreground hover:text-red-400 transition-colors">
                              {isRemoving ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                           </button>
                        )}
                     </div>
                  </div>
               ))}
            </div>
         )}
      </div>
    </div>
  );
}

function DividendsTab() {
  const [selectedProperty, setSelectedProperty] = useState("");
  const [amount, setAmount] = useState("");
  const { places } = useAllPlaces();
  const { depositRewards, isPending, isSuccess } = useDepositRewards();
  const { price: ethPrice } = useEthPrice();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
       <SectionHeader title="Yield Distribution" subtitle="Deposit ETH rewards to property vaults" icon={DollarSign} color="green" />
       
       <div className="grid md:grid-cols-2 gap-8">
          <GlassCard className="h-fit space-y-6 border-green-500/20">
             <div className="space-y-4">
                <div className="space-y-2">
                   <label className="text-sm text-green-200 font-medium ml-1">Select Vault</label>
                   <SelectField value={selectedProperty} onChange={(e:any) => setSelectedProperty(e.target.value)}>
                      <option value="">Select Property...</option>
                      {places.map(p => <option key={p.address} value={p.address}>{p.info.name}</option>)}
                   </SelectField>
                </div>
                <div className="space-y-2">
                   <label className="text-sm text-green-200 font-medium ml-1">Amount (USD)</label>
                   <div className="relative">
                      <InputField type="number" value={amount} onChange={(e:any) => setAmount(e.target.value)} placeholder="0.00" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                   </div>
                </div>
             </div>
             
             <AnimatedButton 
                variant="primary" 
                className="w-full bg-green-500 hover:bg-green-600 border-green-400" 
                onClick={() => depositRewards(selectedProperty as `0x${string}`, usdToEth(parseFloat(amount), ethPrice.usd))}
                disabled={isPending || !selectedProperty || !amount}
             >
                {isPending ? <Loader2 className="animate-spin mr-2" /> : <TrendingUp className="h-4 w-4 mr-2" />}
                Distribute Rewards
             </AnimatedButton>
             
             {isSuccess && <div className="p-3 bg-green-500/20 text-green-400 rounded-lg text-center text-sm">Rewards distributed successfully!</div>}
          </GlassCard>

          <div className="space-y-4">
             <h4 className="text-lg font-bold text-white">Yield History</h4>
             <div className="p-8 rounded-2xl bg-white/5 border border-white/5 border-dashed text-center text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No distribution history available yet.
             </div>
          </div>
       </div>
    </div>
  );
}

function GovernanceTab() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
       <div className="p-6 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6 relative">
          <Gavel className="h-12 w-12 text-purple-400" />
          <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full" />
       </div>
       <h3 className="text-2xl font-bold text-white mb-2">Governance Console</h3>
       <p className="text-muted-foreground max-w-md">Voting proposals and community governance features are currently under maintenance.</p>
    </div>
  );
}

function OperationsTab() {
  const { places } = useAllPlaces();
  const [selected, setSelected] = useState("");
  const { closeSale, isPending: closing } = useCloseSale();
  const { pausePlace, isPending: pausing } = usePausePlace();
  const { unpausePlace, isPending: unpausing } = useUnpausePlace();

  return (
     <div className="max-w-4xl mx-auto space-y-8">
        <SectionHeader title="Emergency Operations" subtitle="Critical controls for contract management" icon={AlertTriangle} color="red" />

        <div className="p-1 rounded-2xl bg-gradient-to-r from-red-500/20 to-orange-500/20">
           <GlassCard className="bg-black/80 backdrop-blur-xl">
              <h4 className="text-lg font-bold text-red-400 mb-6 flex items-center gap-2">
                 <AlertTriangle className="h-5 w-5" /> Danger Zone
              </h4>
              
              <div className="space-y-6">
                 <div>
                    <label className="text-sm font-medium text-white mb-2 block">Target Contract</label>
                    <SelectField value={selected} onChange={(e:any) => setSelected(e.target.value)}>
                       <option value="">Select Target...</option>
                       {places.map(p => <option key={p.address} value={p.address}>{p.info.name} ({p.info.isActive ? 'Active' : 'Closed'})</option>)}
                    </SelectField>
                 </div>

                 <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
                    <div className="space-y-2">
                       <h5 className="font-medium text-white">Sale Controls</h5>
                       <p className="text-xs text-muted-foreground">Force close a sale if automation fails.</p>
                       <AnimatedButton 
                          onClick={() => closeSale(selected as `0x${string}`)}
                          disabled={!selected || closing}
                          className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                       >
                          {closing ? <Loader2 className="animate-spin" /> : "Force Close Sale"}
                       </AnimatedButton>
                    </div>

                    <div className="space-y-2">
                       <h5 className="font-medium text-white">Pause State</h5>
                       <p className="text-xs text-muted-foreground">Freeze or unfreeze contract interactions.</p>
                       <div className="flex gap-2">
                          <AnimatedButton 
                             onClick={() => pausePlace(selected as `0x${string}`)} 
                             disabled={!selected || pausing}
                             className="flex-1 border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                          >
                             Pause
                          </AnimatedButton>
                          <AnimatedButton 
                             onClick={() => unpausePlace(selected as `0x${string}`)}
                             disabled={!selected || unpausing}
                             className="flex-1 border-green-500/30 text-green-400 hover:bg-green-500/10"
                          >
                             Resume
                          </AnimatedButton>
                       </div>
                    </div>
                 </div>
              </div>
           </GlassCard>
        </div>
     </div>
  );
}

function WaitlistTab() {
  const [entries, setEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/waitlist").then(res => res.json()).then(data => {
       if(data.success) setEntries(data.entries);
       setIsLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
       <SectionHeader title="Waitlist" subtitle="Early access registrations" icon={Mail} color="pink" />
       
       <GlassCard className="overflow-hidden p-0">
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="bg-white/5 text-xs uppercase text-muted-foreground font-medium">
                   <tr>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Wallet</th>
                      <th className="px-6 py-4">Date</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                   {isLoading ? (
                      <tr><td colSpan={3} className="px-6 py-8 text-center"><Loader2 className="animate-spin mx-auto text-pink-400" /></td></tr>
                   ) : entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                         <td className="px-6 py-4 font-medium text-white">{entry.email}</td>
                         <td className="px-6 py-4 font-mono text-cyan-400">{entry.evmAddress}</td>
                         <td className="px-6 py-4 text-muted-foreground">{new Date(entry.createdAt).toLocaleDateString()}</td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
       </GlassCard>
    </div>
  );
}