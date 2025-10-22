"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Plus,
  TrendingUp,
  Users,
  Building2,
  DollarSign,
  Settings as SettingsIcon,
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
import { useBrickChain, useAllProperties, usePropertyProposals, useFactoryAccount } from "@/lib/solana/hooks";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useSolPrice, usdToLamports } from "@/lib/solana/useSolPrice";
import { uploadPropertyImage, getIpfsUrl } from "@/lib/pinata/upload";
import { createPropertyMetadata, uploadPropertyMetadata } from "@/lib/pinata/metadata";
import { addTeamMember, removeTeamMember, getAllTeamMembers, isTeamMember, type TeamMember } from "@/lib/solana/team";
import { ADMIN_WALLET } from "@/lib/config/admin";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "properties" | "create" | "team" | "investors" | "dividends" | "governance" | "operations"
  >("overview");
  const router = useRouter();
  const wallet = useWallet();
  const { connection } = useConnection();
  const [hasAccess, setHasAccess] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const enforceAccess = async () => {
      const walletAddress = wallet.publicKey?.toBase58() || null;

      if (!walletAddress) {
        if (!cancelled) {
          setHasAccess(false);
          setAccessChecked(true);
          router.replace("/");
        }
        return;
      }

      if (walletAddress === ADMIN_WALLET) {
        if (!cancelled) {
          setHasAccess(true);
          setAccessChecked(true);
        }
        return;
      }

      if (solanaWallet) {
        try {
          const member = await isTeamMember(connection, solanaWallet);
          if (!cancelled) {
            setHasAccess(member);
            setAccessChecked(true);
            if (!member) {
              router.replace("/portfolio");
            }
          }
        } catch (error) {
          console.error("Failed to verify admin access:", error);
          if (!cancelled) {
            setHasAccess(false);
            setAccessChecked(true);
            router.replace("/");
          }
        }
        return;
      }

      if (!cancelled) {
        setHasAccess(false);
        setAccessChecked(true);
        router.replace("/");
      }
    };

    if (!wallet.connected) {
      setHasAccess(false);
      setAccessChecked(true);
      router.replace("/");
      return;
    }

    enforceAccess();

    return () => {
      cancelled = true;
    };
  }, [wallet.connected, wallet.publicKey, connection, router]);

  if (!accessChecked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        <p className="text-sm text-muted-foreground">Chargement...</p>
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
                  { id: "investors", label: "Investors", icon: Users },
                  { id: "dividends", label: "Dividends", icon: DollarSign },
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
          {activeTab === "investors" && <InvestorsTab />}
          {activeTab === "dividends" && <DividendsTab />}
          {activeTab === "governance" && <GovernanceTab />}
          {activeTab === "operations" && <OperationsTab />}
        </div>
      </main>
    </div>
  );
}

function OverviewTab() {
  const { properties, loading } = useAllProperties();
  const { price: solPrice } = useSolPrice();

  // Calculate real metrics from blockchain
  const totalProperties = properties.length;
  const totalValue = properties.reduce((sum, p) => {
    try {
      if (!p?.account?.totalShares || !p?.account?.sharePrice) return sum;
      const totalShares = p.account.totalShares.toNumber();
      const sharePrice = p.account.sharePrice.toNumber();
      const totalLamports = totalShares * sharePrice;
      return sum + (totalLamports / 1e9) * solPrice.usd;
    } catch (e) {
      console.error("Error calculating property value:", e);
      return sum;
    }
  }, 0);

  const avgReturn = properties.length > 0
    ? properties.reduce((sum, p) => {
        try {
          return sum + (p?.account?.expectedReturn || 0);
        } catch (e) {
          return sum;
        }
      }, 0) / properties.length / 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      {loading ? (
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

          {/* Recent Properties */}
          <GlassCard>
            <h3 className="text-xl font-bold mb-4 text-purple-400">Recent Properties</h3>
            {properties.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No properties created yet</p>
            ) : (
              <div className="space-y-3">
                {properties.slice(0, 5).map((property, i) => (
                  <motion.div
                    key={property.publicKey.toBase58()}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div>
                      <p className="font-medium">{property.account.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {property.account.city}, {property.account.province}
                      </p>
                    </div>
                    <span className="text-sm text-cyan-400 font-semibold">
                      {property.account.sharesSold.toNumber()}/{property.account.totalShares.toNumber()} sold
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
  const { properties, loading, error, refresh } = useAllProperties();
  const { price: solPrice } = useSolPrice();

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-cyan-400" />
        <p className="text-muted-foreground">Loading properties from blockchain...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-400 max-w-md mx-auto">
          Error loading properties: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold">Manage Properties ({properties.length})</h3>
        <div className="flex gap-2">
          <AnimatedButton variant="outline" onClick={refresh}>
            Refresh
          </AnimatedButton>
          <AnimatedButton variant="primary">
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </AnimatedButton>
        </div>
      </div>

      {properties.length === 0 ? (
        <GlassCard>
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No properties created yet</p>
            <p className="text-sm text-muted-foreground mt-2">Create your first property from the "Create New" tab</p>
          </div>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {properties.map((property, index) => {
            const fundingProgress = (property.account.sharesSold.toNumber() / property.account.totalShares.toNumber()) * 100;
            const pricePerShareSOL = property.account.sharePrice.toNumber() / 1e9;
            const pricePerShareUSD = pricePerShareSOL * solPrice.usd;

            return (
              <motion.div
                key={property.publicKey.toBase58()}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard hover>
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-cyan-400 mb-2">{property.account.name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {property.account.city}, {property.account.province}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono mb-4">
                        {property.publicKey.toBase58().slice(0, 8)}...{property.publicKey.toBase58().slice(-8)}
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Price per Share</p>
                          <p className="font-semibold">${pricePerShareUSD.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">{pricePerShareSOL.toFixed(4)} SOL</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Proposals</p>
                          <p className="font-semibold text-purple-400">
                            {property.account.proposalCount.toNumber()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Shares Sold</p>
                          <p className="font-semibold text-green-400">{property.account.sharesSold.toNumber()} / {property.account.totalShares.toNumber()}</p>
                          <p className="text-xs text-muted-foreground">{fundingProgress.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Expected Return</p>
                          <p className="font-semibold text-cyan-400">{(property.account.expectedReturn / 100).toFixed(2)}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Status</p>
                          <p className="font-semibold">
                            {property.account.isLiquidated ? (
                              <span className="text-purple-400 flex items-center gap-1">
                                <CheckCircle2 className="h-4 w-4" /> Liquidated
                              </span>
                            ) : property.account.isActive ? (
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
                        onClick={() => window.open(`https://explorer.solana.com/address/${property.publicKey.toBase58()}?cluster=devnet`, '_blank')}
                      >
                        View Details
                      </AnimatedButton>
                      <AnimatedButton variant="outline" size="sm">
                        <SettingsIcon className="h-4 w-4" />
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
  const { createNewProperty, loading, error } = useBrickChain();
  const { connected } = useWallet();
  const { price: solPrice } = useSolPrice();
  const [formData, setFormData] = useState({
    assetType: "real_estate",
    name: "",
    city: "",
    province: "",
    country: "",
    price: "",
    shares: "",
    pricePerShare: "",
    duration: "",
    expectedReturn: "",
    description: "",
    longDescription: "",
    surface: "",
    rooms: "",
    features: "",
    propertyType: "",
    yearBuilt: "",
    votingEnabled: true,
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageCid, setImageCid] = useState("");
  const [success, setSuccess] = useState(false);

  // Calcul automatique du prix par part
  useEffect(() => {
    const totalPrice = parseFloat(formData.price);
    const totalShares = parseFloat(formData.shares);

    if (totalPrice > 0 && totalShares > 0) {
      const calculatedPricePerShare = (totalPrice / totalShares).toFixed(2);
      setFormData(prev => ({ ...prev, pricePerShare: calculatedPricePerShare }));
    } else if (!formData.price || !formData.shares) {
      setFormData(prev => ({ ...prev, pricePerShare: "" }));
    }
  }, [formData.price, formData.shares]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!connected) {
      alert("Please connect your wallet first!");
      return;
    }

    if (!selectedImage) {
      alert("Please upload an image!");
      return;
    }

    try {
      setSuccess(false);

      // 1. Upload image to IPFS first
      setUploadingImage(true);
      let imageCid = "";
      try {
        imageCid = await uploadPropertyImage(selectedImage, formData.name);
        setImageCid(imageCid);
        console.log("✅ Image uploaded to IPFS:", imageCid);
      } catch (err) {
        alert("Failed to upload image to IPFS. Please check your Pinata configuration.");
        setUploadingImage(false);
        return;
      }

      // 2. Create and upload property metadata JSON to IPFS
      const pricePerShareUSD = parseFloat(formData.pricePerShare);
      const expectedReturnPercentage = parseFloat(formData.expectedReturn);

      const metadata = createPropertyMetadata({
        assetType: formData.assetType,
        name: formData.name,
        city: formData.city,
        province: formData.province,
        country: formData.country,
        description: formData.description,
        longDescription: formData.longDescription,
        imageCid: imageCid,
        surface: parseInt(formData.surface),
        rooms: parseInt(formData.rooms),
        propertyType: formData.propertyType,
        yearBuilt: parseInt(formData.yearBuilt),
        features: formData.features,
        totalShares: parseInt(formData.shares),
        sharePrice: pricePerShareUSD,
        expectedReturn: expectedReturnPercentage,
        votingEnabled: formData.votingEnabled,
        externalUrl: `https://usci.com/property/`,
      });

      let metadataCid = "";
      try {
        metadataCid = await uploadPropertyMetadata(metadata);
        console.log("✅ Property metadata uploaded to IPFS:", metadataCid);
      } catch (err) {
        alert("Failed to upload metadata to IPFS. Please check your Pinata configuration.");
        setUploadingImage(false);
        return;
      }
      setUploadingImage(false);

      // 3. Convert USD to lamports using real SOL price
      const pricePerShareLamports = usdToLamports(pricePerShareUSD, solPrice.usd);

      // 4. Convert expected return to basis points (5.5% -> 550)
      const expectedReturnBasisPoints = Math.floor(expectedReturnPercentage * 100);

      // 5. Convert duration days to seconds
      const durationSeconds = parseInt(formData.duration) * 24 * 60 * 60;

      // 6. Prepare params with IPFS CIDs (minimal onchain data)
      const params = {
        assetType: formData.assetType,
        name: formData.name,
        city: formData.city,
        province: formData.province,
        country: formData.country,
        totalShares: parseInt(formData.shares),
        sharePrice: pricePerShareLamports,
        saleDuration: durationSeconds,
        surface: parseInt(formData.surface),
        rooms: parseInt(formData.rooms),
        expectedReturn: expectedReturnBasisPoints,
        propertyType: formData.propertyType,
        yearBuilt: parseInt(formData.yearBuilt),
        imageCid: imageCid,  // IPFS CID only
        metadataCid: metadataCid,  // IPFS CID for full metadata JSON
        votingEnabled: formData.votingEnabled,
      };

      // 7. Create property on-chain
      const result = await createNewProperty(params);

      setSuccess(true);
      alert(`Property created successfully!\nProperty PDA: ${result.propertyPDA.toBase58()}`);

      // Reset form
      setFormData({
        assetType: "real_estate",
        name: "",
        city: "",
        province: "",
        country: "",
        price: "",
        shares: "",
        pricePerShare: "",
        duration: "",
        expectedReturn: "",
        description: "",
        longDescription: "",
        surface: "",
        rooms: "",
        features: "",
        propertyType: "",
        yearBuilt: "",
        votingEnabled: true,
      });
      setSelectedImage(null);
      setImagePreview("");
      setImageCid("");
    } catch (err: any) {
      console.error("Error creating property:", err);
      alert(`Error: ${err.message || "Failed to create property"}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <GlassCard>
        <h3 className="text-2xl font-bold mb-6 text-purple-400">Create New Property</h3>

        <div className="space-y-6">
          {/* Basic Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Basic Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Property Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none"
                  placeholder="e.g., Villa Méditerranée"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none"
                  placeholder="e.g., Paris"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Province/Region</label>
                <input
                  type="text"
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none"
                  placeholder="e.g., Île-de-France"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Country</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none"
                  placeholder="e.g., France"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Surface (m²)</label>
                <input
                  type="number"
                  value={formData.surface}
                  onChange={(e) => setFormData({ ...formData, surface: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none"
                  placeholder="e.g., 120"
                />
              </div>
            </div>
          </div>

          {/* Financial Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Financial Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Total Amount to Raise (USD)
                  <span className="text-xs text-muted-foreground ml-2">Montant total à collecter</span>
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none"
                  placeholder="e.g., 500000"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Number of Shares to Sell
                  <span className="text-xs text-muted-foreground ml-2">Nombre de parts à vendre</span>
                </label>
                <input
                  type="number"
                  value={formData.shares}
                  onChange={(e) => setFormData({ ...formData, shares: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none"
                  placeholder="e.g., 1000"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Price per Share (USD)
                  <span className="text-xs text-cyan-400 ml-2">✨ Calculé automatiquement</span>
                </label>
                <input
                  type="text"
                  value={formData.pricePerShare ? `$${parseFloat(formData.pricePerShare).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ""}
                  disabled
                  className="w-full px-4 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-semibold cursor-not-allowed"
                  placeholder="Enter total price and shares first"
                />
                {formData.pricePerShare && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.price && formData.shares && (
                      <>💡 ${formData.price} ÷ {formData.shares} shares = ${formData.pricePerShare} per share</>
                    )}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Expected Return (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.expectedReturn}
                  onChange={(e) => setFormData({ ...formData, expectedReturn: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none"
                  placeholder="e.g., 5.5"
                />
              </div>
            </div>

            {/* Calculation Summary */}
            {formData.price && formData.shares && (
              <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-cyan-400">💰</span>
                  <h5 className="font-semibold text-cyan-400">Calculation Summary</h5>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total to raise</p>
                    <p className="text-lg font-bold">${parseFloat(formData.price).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Number of shares</p>
                    <p className="text-lg font-bold">{parseFloat(formData.shares).toLocaleString()} shares</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Price per share</p>
                    <p className="text-lg font-bold text-cyan-400">${formData.pricePerShare}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Duration and Property Details */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Property Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Duration (days)</label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none"
                  placeholder="e.g., 30"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Rooms</label>
                <input
                  type="number"
                  value={formData.rooms}
                  onChange={(e) => setFormData({ ...formData, rooms: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none"
                  placeholder="e.g., 4"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Property Type</label>
                <input
                  type="text"
                  value={formData.propertyType}
                  onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none"
                  placeholder="e.g., Résidentiel, Commercial"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Year Built</label>
                <input
                  type="number"
                  value={formData.yearBuilt}
                  onChange={(e) => setFormData({ ...formData, yearBuilt: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none"
                  placeholder="e.g., 2020"
                  required
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description (courte - max 512 caractères)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              maxLength={512}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none resize-none"
              placeholder="Describe the property..."
            />
            <p className="text-xs text-muted-foreground mt-1">{formData.description.length}/512 caractères</p>
          </div>

          {/* Long Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description détaillée pour investisseurs (max 2000 caractères)</label>
            <textarea
              value={formData.longDescription}
              onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })}
              rows={8}
              maxLength={2000}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none resize-none"
              placeholder="Description complète avec tous les détails pour les investisseurs..."
              required
            />
            <p className="text-xs text-muted-foreground mt-1">{formData.longDescription.length}/2000 caractères</p>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">Image de la propriété</label>
            <div className="space-y-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-500/20 file:text-cyan-400 hover:file:bg-cyan-500/30"
                required
              />
              {imagePreview && (
                <div className="relative rounded-xl overflow-hidden border border-white/10">
                  <img src={imagePreview} alt="Preview" className="w-full h-64 object-cover" />
                  {imageCid && (
                    <div className="absolute top-2 right-2 px-3 py-1 rounded-lg bg-green-500/80 text-white text-xs font-mono">
                      CID: {imageCid.substring(0, 8)}...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Features */}
          <div>
            <label className="block text-sm font-medium mb-2">Features (comma separated)</label>
            <input
              type="text"
              value={formData.features}
              onChange={(e) => setFormData({ ...formData, features: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none"
              placeholder="e.g., Pool, Garage, Garden"
            />
          </div>

          {/* SOL Price Display */}
          <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
            <p className="text-sm text-muted-foreground">
              Current SOL Price: <span className="text-cyan-400 font-semibold">${solPrice.usd.toFixed(2)} USD</span>
              {" • "}
              <span className="text-xs">Updated: {new Date(solPrice.lastUpdated).toLocaleTimeString()}</span>
            </p>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="p-4 rounded-xl bg-green-500/20 border border-green-500/50 text-green-400">
              Property created successfully!
            </div>
          )}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-400">
              Error: {error}
            </div>
          )}

          {/* Wallet Warning */}
          {!connected && (
            <div className="p-4 rounded-xl bg-yellow-500/20 border border-yellow-500/50 text-yellow-400">
              Please connect your wallet to create a property
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-6">
            <AnimatedButton
              variant="outline"
              className="flex-1"
              onClick={() => {
                setFormData({
                  assetType: "real_estate",
                  name: "",
                  city: "",
                  province: "",
                  country: "",
                  price: "",
                  shares: "",
                  pricePerShare: "",
                  duration: "",
                  expectedReturn: "",
                  description: "",
                  longDescription: "",
                  surface: "",
                  rooms: "",
                  features: "",
                  propertyType: "",
                  yearBuilt: "",
                  votingEnabled: true,
                });
                setSelectedImage(null);
                setImagePreview("");
                setImageCid("");
              }}
            >
              Reset Form
            </AnimatedButton>
            <AnimatedButton
              variant="primary"
              className="flex-1"
              onClick={handleSubmit}
              disabled={loading || uploadingImage || !connected}
            >
              {uploadingImage ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading to IPFS...
                </>
              ) : loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating on-chain...
                </>
              ) : (
                "Create Property"
              )}
            </AnimatedButton>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

function GovernanceTab() {
  const { properties, loading: loadingProperties, error: propertiesError, refresh } = useAllProperties();
  const { createGovernanceProposal, closeGovernanceProposal, loading, error } = useBrickChain();
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationHours, setDurationHours] = useState("24");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const propertyPubkey = selectedProperty ? new PublicKey(selectedProperty) : null;
  const {
    proposals,
    loading: proposalsLoading,
    error: proposalsError,
    refresh: refreshProposals,
  } = usePropertyProposals(propertyPubkey);

  const handleCreateProposal = async () => {
    if (!propertyPubkey) {
      alert("Please select a property first.");
      return;
    }

    if (!title.trim()) {
      alert("Please provide a proposal title.");
      return;
    }

    const durationSeconds = Math.max(1, Math.floor(Number(durationHours || "0") * 3600));

    try {
      const { proposalId } = await createGovernanceProposal(
        propertyPubkey,
        title.trim(),
        description.trim(),
        durationSeconds
      );

      setSuccessMessage(`Proposal #${proposalId} created successfully.`);
      setTitle("");
      setDescription("");
      refreshProposals();
      refresh();
    } catch {
      // handled by hook (error state)
    }
  };

  const handleCloseProposal = async (proposalKey: PublicKey) => {
    if (!propertyPubkey) return;
    try {
      await closeGovernanceProposal(propertyPubkey, proposalKey);
      refreshProposals();
      refresh();
    } catch {
      // handled by hook
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-2xl font-bold">Governance</h3>
          <p className="text-muted-foreground">
            Create proposals and follow the decision process for each property.
          </p>
        </div>
        <div className="flex gap-2">
          <AnimatedButton variant="outline" onClick={refresh}>
            Refresh Properties
          </AnimatedButton>
          <AnimatedButton variant="outline" onClick={refreshProposals} disabled={!propertyPubkey}>
            Refresh Proposals
          </AnimatedButton>
        </div>
      </div>

      {propertiesError && (
        <GlassCard>
          <div className="text-red-400">Error loading properties: {propertiesError}</div>
        </GlassCard>
      )}

      <GlassCard>
        <div className="grid gap-4">
          <div>
            <label className="text-sm text-muted-foreground block mb-2">Select Property</label>
            <select
              value={selectedProperty}
              onChange={(e) => {
                setSelectedProperty(e.target.value);
                setSuccessMessage(null);
              }}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm"
            >
              <option value="">-- Select a property --</option>
              {properties.map((property) => (
                <option key={property.publicKey.toBase58()} value={property.publicKey.toBase58()}>
                  {property.account.name} ({property.account.city})
                </option>
              ))}
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Proposal Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm"
                  placeholder="e.g. Approve renovation budget"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground block mb-2">Voting Duration (hours)</label>
                <input
                  type="number"
                  min={1}
                  value={durationHours}
                  onChange={(e) => setDurationHours(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground block mb-2">Proposal Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm resize-none"
                placeholder="Explain the proposal, expected benefits, risks, etc."
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg border border-red-500/40 bg-red-500/10 text-red-200 text-sm">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-lg border border-green-500/40 bg-green-500/10 text-green-200 text-sm">
              {successMessage}
            </div>
          )}

          <div className="flex justify-end">
            <AnimatedButton
              variant="primary"
              onClick={handleCreateProposal}
              disabled={!selectedProperty || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...
                </>
              ) : (
                "Create Proposal"
              )}
            </AnimatedButton>
          </div>
        </div>
      </GlassCard>

      {propertyPubkey && (
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-semibold text-purple-400">Proposals</h4>
              <p className="text-sm text-muted-foreground">
                {propertyPubkey.toBase58()}
              </p>
            </div>
          </div>

          {proposalsError && (
            <div className="p-3 rounded-lg border border-red-500/40 bg-red-500/10 text-red-200 text-sm mb-4">
              {proposalsError}
            </div>
          )}

          {proposalsLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-cyan-400" />
              <p className="text-muted-foreground">Loading proposals...</p>
            </div>
          ) : proposals.length === 0 ? (
            <div className="text-muted-foreground text-center py-8">
              No proposals found for this property.
            </div>
          ) : (
            <div className="space-y-4">
              {proposals.map((proposal) => {
                const votingEndsAt = new Date(proposal.account.votingEndsAt.toNumber() * 1000);
                return (
                  <div
                    key={proposal.publicKey.toBase58()}
                    className="border border-white/10 rounded-xl p-4 bg-white/5"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h5 className="text-lg font-semibold text-cyan-400">
                          {proposal.account.title}
                        </h5>
                        <p className="text-sm text-muted-foreground mb-2">
                          {proposal.account.description}
                        </p>
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          <span>Yes votes: {proposal.account.yesVotes.toNumber()}</span>
                          <span>No votes: {proposal.account.noVotes.toNumber()}</span>
                          <span>
                            Voting ends: {votingEndsAt.toLocaleString()}
                          </span>
                          <span>Status: {proposal.account.isActive ? "Active" : "Closed"}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {proposal.account.isActive && (
                          <AnimatedButton
                            variant="outline"
                            onClick={() => handleCloseProposal(proposal.publicKey)}
                            disabled={loading}
                          >
                            {loading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Close Proposal"
                            )}
                          </AnimatedButton>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {loadingProperties && (
            <div className="text-muted-foreground text-sm mt-4">Loading properties...</div>
          )}
        </GlassCard>
      )}
    </div>
  );
}

function OperationsTab() {
  const { properties, loading, error, refresh } = useAllProperties();
  const { factory, loading: loadingFactory, refresh: refreshFactory } = useFactoryAccount();
  const { closeSaleManually, triggerLiquidation, initializeFactory, loading: actionLoading, error: actionError } = useBrickChain();
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [liquidationAmount, setLiquidationAmount] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [treasuryAddress, setTreasuryAddress] = useState<string>("");

  const selected = useMemo(
    () => properties.find((p) => p.publicKey.toBase58() === selectedProperty) || null,
    [properties, selectedProperty]
  );

  const handleCloseSale = async () => {
    if (!selected) {
      alert("Select a property first.");
      return;
    }

    setSuccessMessage(null);

    try {
      await closeSaleManually(selected.publicKey);
      setSuccessMessage("Sale closed successfully.");
      refresh();
    } catch {
      // handled by hook
    }
  };

  const handleLiquidation = async () => {
    if (!selected) {
      alert("Select a property first.");
      return;
    }

    const amountSOL = parseFloat(liquidationAmount);
    if (isNaN(amountSOL) || amountSOL <= 0) {
      alert("Enter a valid liquidation amount (in SOL).");
      return;
    }

    setSuccessMessage(null);

    try {
      const lamports = Math.floor(amountSOL * LAMPORTS_PER_SOL);
      await triggerLiquidation(selected.publicKey, lamports);
      setSuccessMessage("Liquidation triggered. Investors can now claim their proceeds.");
      setLiquidationAmount("");
      refresh();
    } catch {
      // handled by hook
    }
  };

  const handleInitializeFactory = async () => {
    const treasury = treasuryAddress.trim();
    if (!treasury) {
      alert("Enter a treasury wallet address.");
      return;
    }

    try {
      const treasuryPubkey = new PublicKey(treasury);
      const { factoryPDA } = await initializeFactory(treasuryPubkey);
      setSuccessMessage(`Factory initialized: ${factoryPDA.toBase58()}`);
      setTreasuryAddress("");
      refreshFactory();
    } catch (err: any) {
      alert(err.message || "Failed to initialize factory");
    }
  };

  const saleEndDate =
    selected?.account.saleEnd && selected.account.saleEnd.toNumber() > 0
      ? new Date(selected.account.saleEnd.toNumber() * 1000)
      : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-2xl font-bold">Manual Operations</h3>
          <p className="text-muted-foreground">
            Close sales and trigger liquidation flows directly from the admin panel.
          </p>
        </div>
        <AnimatedButton variant="outline" onClick={refresh}>
          Refresh Properties
        </AnimatedButton>
      </div>

      {!loadingFactory && !factory && (
        <GlassCard>
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div>
              <h4 className="text-lg font-semibold text-purple-400">Factory not initialized</h4>
              <p className="text-sm text-muted-foreground">
                Deployé sur Devnet, le programme doit être initialisé avec un trésor avant de gérer des propriétés
                ou l’équipe. Utilise ce formulaire pour créer le compte factory (effectué une seule fois).
              </p>
            </div>
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                placeholder="Treasury wallet address"
                value={treasuryAddress}
                onChange={(e) => setTreasuryAddress(e.target.value)}
                className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm"
              />
              <AnimatedButton
                variant="primary"
                onClick={handleInitializeFactory}
                disabled={actionLoading || !treasuryAddress.trim()}
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Initialize Factory"}
              </AnimatedButton>
            </div>
          </div>
        </GlassCard>
      )}

      {error && (
        <GlassCard>
          <div className="text-red-400">Error loading properties: {error}</div>
        </GlassCard>
      )}

      <GlassCard>
        <div className="grid gap-4">
          <div>
            <label className="text-sm text-muted-foreground block mb-2">Select Property</label>
            <select
              value={selectedProperty}
              onChange={(e) => {
                setSelectedProperty(e.target.value);
                setSuccessMessage(null);
              }}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm"
            >
              <option value="">-- Select a property --</option>
              {properties.map((property) => (
                <option key={property.publicKey.toBase58()} value={property.publicKey.toBase58()}>
                  {property.account.name} ({property.account.city})
                </option>
              ))}
            </select>
          </div>

          {selected && (
            <div className="grid md:grid-cols-3 gap-4 bg-white/5 border border-white/10 rounded-xl p-4">
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="font-semibold">
                  {selected.account.isLiquidated
                    ? "Liquidated"
                    : selected.account.isActive
                      ? "Active"
                      : "Closed"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Shares Sold</p>
                <p className="font-semibold">
                  {selected.account.sharesSold.toNumber()} / {selected.account.totalShares.toNumber()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sale End</p>
                <p className="font-semibold">
                  {saleEndDate ? saleEndDate.toLocaleString() : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Liquidation Amount</p>
                <p className="font-semibold">
                  {selected.account.liquidationAmount.toNumber() === 0
                    ? "Not set"
                    : `${(selected.account.liquidationAmount.toNumber() / LAMPORTS_PER_SOL).toFixed(2)} SOL`}
                </p>
              </div>
            </div>
          )}

          {actionError && (
            <div className="p-3 rounded-lg border border-red-500/40 bg-red-500/10 text-red-200 text-sm">
              {actionError}
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-lg border border-green-500/40 bg-green-500/10 text-green-200 text-sm">
              {successMessage}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-cyan-400">Close Sale</h4>
              <p className="text-sm text-muted-foreground">
                Force the sale to close if the automatic closure fails (for example, after the deadline).
              </p>
              <AnimatedButton
                variant="primary"
                onClick={handleCloseSale}
                disabled={!selected || actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  "Close Sale Manually"
                )}
              </AnimatedButton>
            </div>

            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-purple-400">Trigger Liquidation</h4>
              <p className="text-sm text-muted-foreground">
                Deposit the property sale proceeds so investors can claim their final payout. Amount in SOL.
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Total sale amount (SOL)"
                  value={liquidationAmount}
                  onChange={(e) => setLiquidationAmount(e.target.value)}
                  className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm"
                />
                <AnimatedButton
                  variant="outline"
                  onClick={handleLiquidation}
                  disabled={!selected || actionLoading}
                >
                  {actionLoading ? (
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

function InvestorsTab() {
  const investors: any[] = [];

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold">Investor Management</h3>

      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-left text-sm font-semibold">Wallet</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Total Invested</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Properties</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Joined</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {investors.map((investor, i) => (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="border-b border-white/5 hover:bg-white/5"
                >
                  <td className="px-6 py-4">
                    <code className="text-cyan-400 font-mono">{investor.address}</code>
                  </td>
                  <td className="px-6 py-4 font-semibold">{investor.invested}</td>
                  <td className="px-6 py-4">{investor.properties}</td>
                  <td className="px-6 py-4 text-muted-foreground">{investor.joined}</td>
                  <td className="px-6 py-4">
                    <AnimatedButton variant="outline" size="sm">
                      View Details
                    </AnimatedButton>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

function TeamTab() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [teamMembers, setTeamMembers] = useState<{ publicKey: PublicKey; account: TeamMember }[]>([]);
  const [newMemberAddress, setNewMemberAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingMembers, setFetchingMembers] = useState(true);

  // Fetch team members on mount
  useEffect(() => {
    const fetchMembers = async () => {
      setFetchingMembers(true);
      try {
        const members = await getAllTeamMembers(connection);
        setTeamMembers(members);
      } catch (err) {
        console.error("Error fetching team members:", err);
      } finally {
        setFetchingMembers(false);
      }
    };

    fetchMembers();
  }, [connection]);

  const handleAddMember = async () => {
    if (!newMemberAddress.trim()) {
      alert("Please enter a wallet address");
      return;
    }

    if (!wallet.connected || !wallet.publicKey) {
      alert("Please connect your wallet first");
      return;
    }

    setLoading(true);
    try {
      // Validate address
      let memberPubkey: PublicKey;
      try {
        memberPubkey = new PublicKey(newMemberAddress);
      } catch {
        alert("Invalid wallet address format");
        setLoading(false);
        return;
      }

      // Create transaction
      const { transaction, teamMemberPDA } = await addTeamMember(
        connection,
        newMemberAddress,
        wallet.publicKey
      );

      // Sign and send transaction
      const signature = await wallet.sendTransaction(transaction, connection);
      console.log("Transaction signature:", signature);

      // Wait for confirmation
      await connection.confirmTransaction(signature, "confirmed");

      // Refresh team members list
      const members = await getAllTeamMembers(connection);
      setTeamMembers(members);

      setNewMemberAddress("");
      alert(`Team member added successfully!\nSignature: ${signature}`);
    } catch (err: any) {
      console.error("Error adding team member:", err);
      alert(`Error: ${err.message || "Failed to add team member"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberWallet: PublicKey) => {
    const address = memberWallet.toBase58();
    if (!confirm(`Remove ${address.slice(0, 8)}...${address.slice(-8)} from team?`)) return;

    if (!wallet.connected || !wallet.publicKey) {
      alert("Please connect your wallet first");
      return;
    }

    setLoading(true);
    try {
      // Create transaction
      const transaction = await removeTeamMember(
        connection,
        address,
        wallet.publicKey
      );

      // Sign and send transaction
      const signature = await wallet.sendTransaction(transaction, connection);
      console.log("Transaction signature:", signature);

      // Wait for confirmation
      await connection.confirmTransaction(signature, "confirmed");

      // Refresh team members list
      const members = await getAllTeamMembers(connection);
      setTeamMembers(members);

      alert(`Team member removed successfully!\nSignature: ${signature}`);
    } catch (err: any) {
      console.error("Error removing team member:", err);
      alert(`Error: ${err.message || "Failed to remove team member"}`);
    } finally {
      setLoading(false);
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
            placeholder="Enter wallet address (e.g., 7xKX...aBcD)"
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none"
            disabled={loading}
          />
          <AnimatedButton
            variant="primary"
            onClick={handleAddMember}
            disabled={loading || !newMemberAddress.trim()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Member
          </AnimatedButton>
        </div>
      </GlassCard>

      {/* Team Members List */}
      <GlassCard>
        <h4 className="text-lg font-semibold mb-4">
          Team Members ({teamMembers.length})
        </h4>

        {fetchingMembers ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-cyan-400" />
            <p className="text-muted-foreground">Loading team members from blockchain...</p>
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No team members added yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Add team members to delegate property and proposal management
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {teamMembers.map((member, i) => {
              const walletAddress = member.account.wallet.toBase58();
              const addedAt = new Date(member.account.addedAt.toNumber() * 1000).toLocaleDateString();
              const isActive = member.account.isActive;

              return (
                <motion.div
                  key={member.publicKey.toBase58()}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${isActive ? 'from-purple-500 to-pink-600' : 'from-gray-500 to-gray-600'} flex items-center justify-center`}>
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="text-cyan-400 font-mono text-sm">
                          {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
                        </code>
                        {isActive ? (
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-green-500/20 text-green-400 rounded-full">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-gray-500/20 text-gray-400 rounded-full">
                            INACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Added on {addedAt} • Can manage properties & proposals
                      </p>
                    </div>
                  </div>
                  <AnimatedButton
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveMember(member.account.wallet)}
                    disabled={loading || !isActive}
                    className="text-red-400 hover:text-red-300 border-red-400/20 hover:border-red-400/40"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remove"}
                  </AnimatedButton>
                </motion.div>
              );
            })}
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
  const [isDistributing, setIsDistributing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { properties, loading: loadingProperties } = useAllProperties();
  const { connection } = useConnection();
  const wallet = useWallet();
  const { price: solPrice } = useSolPrice();

  const handleDistribute = async () => {
    if (!wallet.publicKey || !selectedProperty || !amount) {
      setError("Please select a property and enter an amount");
      return;
    }

    setIsDistributing(true);
    setError(null);

    try {
      const amountUSD = parseFloat(amount);
      const amountLamports = usdToLamports(amountUSD, solPrice.usd);
      const propertyPDA = new PublicKey(selectedProperty);

      const { depositDividends } = await import("@/lib/solana/instructions");
      const transaction = await depositDividends(
        connection,
        propertyPDA,
        amountLamports,
        wallet.publicKey
      );

      const signature = await wallet.sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, "confirmed");

      setSuccess(true);
      setTimeout(() => {
        setIsDistributeOpen(false);
        setSuccess(false);
        setSelectedProperty("");
        setAmount("");
      }, 2000);
    } catch (err: any) {
      console.error("Error distributing dividends:", err);
      setError(err.message || "Failed to distribute dividends");
    } finally {
      setIsDistributing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Distribute Dividends Modal */}
      {isDistributeOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <GlassCard>
              <h3 className="text-2xl font-bold mb-6">Distribute Dividends</h3>

              <div className="space-y-4">
                {/* Property Selector */}
                <div>
                  <label className="block text-sm font-medium mb-2">Select Property</label>
                  <select
                    value={selectedProperty}
                    onChange={(e) => setSelectedProperty(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-400 focus:outline-none"
                    disabled={isDistributing || loadingProperties}
                  >
                    <option value="">Select a property...</option>
                    {properties.map((prop) => (
                      <option key={prop.publicKey.toBase58()} value={prop.publicKey.toBase58()}>
                        {prop.account.name} - {prop.account.city}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount Input */}
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
                    ✅ Dividends distributed successfully!
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
        <h3 className="text-2xl font-bold">Dividend Management</h3>
        <AnimatedButton variant="primary" onClick={() => setIsDistributeOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Distribute Dividends
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

      <GlassCard>
        <h4 className="text-lg font-semibold mb-4">Recent Distributions</h4>
        <div className="space-y-3">
          {[].map((dist: any, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
            >
              <div>
                <p className="font-semibold">{dist.property}</p>
                <p className="text-sm text-muted-foreground">{dist.investors} investors</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-green-400">{dist.amount}</p>
                <p className="text-sm text-muted-foreground">{dist.date}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
