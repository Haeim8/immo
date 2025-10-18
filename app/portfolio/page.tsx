"use client";

import { motion } from "framer-motion";
import { Wallet, TrendingUp, Calendar, Gift, Loader2 } from "lucide-react";
import Navbar from "@/components/organisms/Navbar";
import GlassCard from "@/components/atoms/GlassCard";
import GradientText from "@/components/atoms/GradientText";
import AnimatedButton from "@/components/atoms/AnimatedButton";
import MetricDisplay from "@/components/atoms/MetricDisplay";
import BlurBackground from "@/components/atoms/BlurBackground";
import { useUserShareNFTs, useAllProperties } from "@/lib/solana/hooks";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSolPrice, lamportsToUsd } from "@/lib/solana/useSolPrice";

export default function PortfolioPage() {
  const { connected } = useWallet();
  const { shareNFTs, loading: loadingNFTs, error: errorNFTs } = useUserShareNFTs();
  const { properties, loading: loadingProperties } = useAllProperties();
  const { price: solPrice } = useSolPrice();

  const loading = loadingNFTs || loadingProperties;
  const error = errorNFTs;

  // Calculate totals from real blockchain data with safety checks
  const totalInvested = shareNFTs.reduce((sum, nft) => {
    try {
      // Find the property for this NFT
      const property = properties.find(p => p.publicKey.equals(nft.account.property));
      if (!property?.account?.sharePrice) return sum;

      const priceInUSD = lamportsToUsd(property.account.sharePrice.toNumber(), solPrice.usd);
      return sum + priceInUSD;
    } catch (e) {
      console.error("Error calculating invested amount:", e);
      return sum;
    }
  }, 0);

  const totalPendingDividends = shareNFTs.reduce((sum, nft) => {
    try {
      // Find the property for this NFT
      const property = properties.find(p => p.publicKey.equals(nft.account.property));
      if (!property?.account) return sum;

      const totalDividends = property.account.totalDividendsDeposited?.toNumber() || 0;
      const sharesSold = property.account.sharesSold?.toNumber() || 1;
      const claimedDividends = nft.account.dividendsClaimed?.toNumber() || 0;

      const dividendsPerShare = totalDividends / sharesSold;
      const unclaimed = Math.max(0, dividendsPerShare - claimedDividends);
      return sum + lamportsToUsd(unclaimed, solPrice.usd);
    } catch (e) {
      console.error("Error calculating pending dividends:", e);
      return sum;
    }
  }, 0);

  const totalDividendsEarned = shareNFTs.reduce((sum, nft) => {
    try {
      const claimed = nft.account.dividendsClaimed?.toNumber() || 0;
      return sum + lamportsToUsd(claimed, solPrice.usd);
    } catch (e) {
      console.error("Error calculating earned dividends:", e);
      return sum;
    }
  }, 0);

  return (
    <div className="min-h-screen">
      <Navbar />
      <BlurBackground />

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-5xl font-bold mb-4">
              <GradientText>My Portfolio</GradientText>
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage your investments and claim your dividends
            </p>
          </motion.div>

          {/* Overview Cards */}
          {!connected ? (
            <GlassCard className="text-center py-12">
              <p className="text-muted-foreground mb-4">Connect your wallet to view your portfolio</p>
              <p className="text-sm text-muted-foreground">Click "Connect Wallet" in the header to get started</p>
            </GlassCard>
          ) : loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-cyan-400" />
              <p className="text-muted-foreground">Loading your portfolio from blockchain...</p>
            </div>
          ) : error ? (
            <GlassCard className="text-center py-12">
              <p className="text-red-400">Error: {error}</p>
            </GlassCard>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <GlassCard hover glow>
                  <MetricDisplay
                    icon={Wallet}
                    label="Total Invested"
                    value={`$${totalInvested.toLocaleString()}`}
                    iconColor="text-cyan-400"
                  />
                </GlassCard>
                <GlassCard hover glow>
                  <MetricDisplay
                    icon={TrendingUp}
                    label="Total Dividends Earned"
                    value={`$${totalDividendsEarned.toLocaleString()}`}
                    iconColor="text-green-400"
                    delay={0.1}
                  />
                </GlassCard>
                <GlassCard hover glow>
                  <MetricDisplay
                    icon={Gift}
                    label="Pending Dividends"
                    value={`$${totalPendingDividends.toFixed(2)}`}
                    iconColor="text-blue-400"
                    delay={0.2}
                  />
                </GlassCard>
              </div>

          {/* Claim Dividends Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-12"
          >
            <GlassCard className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10" />
              <div className="relative z-10">
                <div className="flex items-center justify-between flex-wrap gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Gift className="h-8 w-8 text-cyan-400" />
                      <h2 className="text-2xl font-bold">Claim Your Dividends</h2>
                    </div>
                    <p className="text-muted-foreground">
                      You have ${totalPendingDividends.toFixed(2)} available to claim
                    </p>
                  </div>
                  <AnimatedButton
                    variant="primary"
                    size="lg"
                    disabled={totalPendingDividends === 0}
                  >
                    Claim ${totalPendingDividends.toFixed(2)}
                  </AnimatedButton>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Investments */}
          <div>
            <h2 className="text-3xl font-bold mb-6">
              <GradientText>My Investments</GradientText>
            </h2>

            {shareNFTs.length === 0 ? (
              <GlassCard className="text-center py-12">
                <p className="text-muted-foreground mb-4">You don't have any investments yet</p>
                <p className="text-sm text-muted-foreground">Browse properties to start investing</p>
              </GlassCard>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {shareNFTs.map((nft, index) => {
                  // Find the property for this NFT
                  const property = properties.find(p => p.publicKey.equals(nft.account.property));

                  let priceInUSD = 0;
                  let earnedInUSD = 0;
                  let pendingUSD = 0;
                  let propertyName = "Unknown Property";

                  try {
                    if (property?.account) {
                      propertyName = property.account.name || propertyName;
                      priceInUSD = lamportsToUsd(property.account.sharePrice?.toNumber() || 0, solPrice.usd);
                      earnedInUSD = lamportsToUsd(nft.account.dividendsClaimed?.toNumber() || 0, solPrice.usd);

                      const totalDividends = property.account.totalDividendsDeposited?.toNumber() || 0;
                      const sharesSold = property.account.sharesSold?.toNumber() || 1;
                      const claimedDividends = nft.account.dividendsClaimed?.toNumber() || 0;

                      const dividendsPerShare = totalDividends / sharesSold;
                      const unclaimed = Math.max(0, dividendsPerShare - claimedDividends);
                      pendingUSD = lamportsToUsd(unclaimed, solPrice.usd);
                    }
                  } catch (e) {
                    console.error("Error calculating NFT values:", e);
                  }

                  return (
                    <motion.div
                      key={nft.publicKey.toBase58()}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                    >
                      <GlassCard hover glow>
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-xl font-bold mb-1 text-cyan-400">
                                {propertyName}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-1">
                                NFT #{nft.account.tokenId?.toString() || "N/A"}
                              </p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                Minted {new Date((nft.account.mintTime?.toNumber() || 0) * 1000).toLocaleDateString()}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                              <p className="text-xs text-muted-foreground mb-1">Amount Invested</p>
                              <p className="text-2xl font-bold">
                                ${priceInUSD.toFixed(2)}
                              </p>
                            </div>
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                              <p className="text-xs text-muted-foreground mb-1">Total Earned</p>
                              <p className="text-2xl font-bold text-green-400">
                                ${earnedInUSD.toFixed(2)}
                              </p>
                            </div>
                          </div>

                          <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Pending Dividends</p>
                                <p className="text-xl font-bold text-cyan-400">
                                  ${pendingUSD.toFixed(2)}
                                </p>
                              </div>
                              <AnimatedButton variant="outline" size="sm" disabled={pendingUSD === 0}>
                                Claim
                              </AnimatedButton>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-white/10">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">ROI</span>
                              <span className="font-semibold text-green-400">
                                +{priceInUSD > 0 ? ((earnedInUSD / priceInUSD) * 100).toFixed(2) : 0}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
