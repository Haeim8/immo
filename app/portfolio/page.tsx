"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Wallet, TrendingUp, Gift, Loader2 } from "lucide-react";
import GlassCard from "@/components/atoms/GlassCard";
import GradientText from "@/components/atoms/GradientText";
import AnimatedButton from "@/components/atoms/AnimatedButton";
import MetricDisplay from "@/components/atoms/MetricDisplay";
import { usePrivy } from "@privy-io/react-auth";
import { useWalletAddress, useAllPlaces, useAllUserPuzzles, useEthPrice } from "@/lib/evm/hooks";
import { useClaimRewards } from "@/lib/evm/write-hooks";
import { useTranslations, useCurrencyFormatter } from "@/components/providers/IntlProvider";
import { formatEther } from "viem";

export default function PortfolioPage() {
  const { address, isConnected } = useWalletAddress();
  const { login } = usePrivy();
  const { places, isLoading: loadingPlaces } = useAllPlaces();
  const { puzzles: userNFTs, isLoading: loadingNFTs } = useAllUserPuzzles(address);
  const { price: ethPrice } = useEthPrice();
  const { claimRewards } = useClaimRewards();
  const [claimingNFT, setClaimingNFT] = useState<string | null>(null);

  const portfolioT = useTranslations("portfolio");
  const metricsT = useTranslations("portfolio.metrics");
  const { formatCurrency } = useCurrencyFormatter();

  const loading = loadingPlaces || loadingNFTs;

  // Calculate totals from NFTs
  const { totalInvested, totalPendingDividends, totalDividendsEarned } = useMemo(() => {
    let invested = 0;
    const pending = 0;
    const earned = 0;

    userNFTs.forEach((nft) => {
      const place = places.find((p) => p.address.toLowerCase() === nft.placeAddress.toLowerCase());
      if (place) {
        const puzzlePriceETH = parseFloat(formatEther(place.info.puzzlePrice));
        const puzzlePriceUSD = puzzlePriceETH * ethPrice.usd;
        invested += puzzlePriceUSD;

        // TODO: Calculate actual pending and earned from contract
        // For now, set to 0
      }
    });

    return {
      totalInvested: invested,
      totalPendingDividends: pending,
      totalDividendsEarned: earned,
    };
  }, [userNFTs, places, ethPrice.usd]);

  const totalInvestedFormatted = formatCurrency(totalInvested);
  const totalDividendsEarnedFormatted = formatCurrency(totalDividendsEarned);
  const totalPendingDividendsFormatted = formatCurrency(totalPendingDividends, {
    maximumFractionDigits: 2,
  });

  // Claim rewards for a single NFT
  const handleClaimSingle = async (placeAddress: `0x${string}`, tokenId: bigint) => {
    setClaimingNFT(`${placeAddress}-${tokenId.toString()}`);
    try {
      await claimRewards(placeAddress, tokenId);
      alert("✅ Rewards claimed successfully!");
    } catch (err: any) {
      console.error("Error claiming rewards:", err);
      alert(`❌ Failed to claim rewards: ${err.message}`);
    } finally {
      setClaimingNFT(null);
    }
  };

  return (
    <div className="min-h-screen px-2 md:px-0">
      <main className="pb-20 md:pb-8">
        <div className="container mx-auto px-4 md:px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 md:mb-12 pt-6 md:pt-12"
          >
            <h1 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              <GradientText>{portfolioT("title")}</GradientText>
            </h1>
            <p className="text-muted-foreground text-sm md:text-lg">
              {portfolioT("subtitle")}
            </p>
          </motion.div>

          {/* Overview Cards */}
          {!isConnected ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <GlassCard className="text-center py-16 md:py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-purple-500/10" />

                <div className="relative z-10 max-w-2xl mx-auto px-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                    className="mb-6"
                  >
                    <div className="inline-flex p-6 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-600/20 border border-cyan-400/30">
                      <Wallet className="h-16 w-16 text-cyan-400" />
                    </div>
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-2xl md:text-4xl font-bold mb-4"
                  >
                    <GradientText>{portfolioT("connectTitle")}</GradientText>
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-muted-foreground text-base md:text-lg mb-8 max-w-md mx-auto"
                  >
                    {portfolioT("connectMessage")}
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <AnimatedButton
                      variant="primary"
                      size="lg"
                      onClick={login}
                      className="text-lg px-8 py-6"
                    >
                      <Wallet className="mr-2 h-5 w-5" />
                      {portfolioT("connectButton")}
                    </AnimatedButton>
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="text-sm text-muted-foreground mt-6"
                  >
                    {portfolioT("connectHint")}
                  </motion.p>
                </div>
              </GlassCard>
            </motion.div>
          ) : loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-cyan-400" />
              <p className="text-muted-foreground">{portfolioT("loading")}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 md:gap-6 mb-12">
                <GlassCard hover glow>
                  <MetricDisplay
                    icon={Wallet}
                    label={metricsT("invested")}
                    value={totalInvestedFormatted}
                    iconColor="text-cyan-400"
                  />
                </GlassCard>
                <GlassCard hover glow>
                  <MetricDisplay
                    icon={TrendingUp}
                    label={metricsT("dividendsEarned")}
                    value={totalDividendsEarnedFormatted}
                    iconColor="text-green-400"
                    delay={0.1}
                  />
                </GlassCard>
                <GlassCard hover glow>
                  <MetricDisplay
                    icon={Gift}
                    label={metricsT("pendingDividends")}
                    value={totalPendingDividendsFormatted}
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
                          <h2 className="text-2xl font-bold">{metricsT("claimTitle")}</h2>
                        </div>
                        <p className="text-muted-foreground">
                          {metricsT("claimSubtitle", { amount: totalPendingDividendsFormatted })}
                        </p>
                      </div>
                      <AnimatedButton
                        variant="primary"
                        size="lg"
                        disabled={totalPendingDividends === 0}
                      >
                        {metricsT("claimButton", { amount: totalPendingDividendsFormatted })}
                      </AnimatedButton>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>

              {/* Investments */}
              <div>
                <h2 className="text-3xl font-bold mb-6">
                  <GradientText>{portfolioT("investmentsTitle")}</GradientText>
                </h2>

                {userNFTs.length === 0 ? (
                  <GlassCard className="text-center py-12">
                    <p className="text-muted-foreground mb-4">{portfolioT("noInvestments")}</p>
                    <p className="text-sm text-muted-foreground">{portfolioT("browseHint")}</p>
                  </GlassCard>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {userNFTs.map((nft, index) => {
                      const place = places.find((p) => p.address.toLowerCase() === nft.placeAddress.toLowerCase());

                      if (!place) return null;

                      const puzzlePriceETH = parseFloat(formatEther(place.info.puzzlePrice));
                      const puzzlePriceUSD = puzzlePriceETH * ethPrice.usd;
                      const priceFormatted = formatCurrency(puzzlePriceUSD, { maximumFractionDigits: 2 });

                      // TODO: Get actual earned and pending from contract
                      const earnedFormatted = formatCurrency(0, { maximumFractionDigits: 2 });
                      const pendingFormatted = formatCurrency(0, { maximumFractionDigits: 2 });

                      const tokenId = nft.tokenId.toString();
                      const isClaimingThis = claimingNFT === `${nft.placeAddress}-${tokenId}`;

                      return (
                        <motion.div
                          key={`${nft.placeAddress}-${tokenId}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 + index * 0.1 }}
                        >
                          <GlassCard hover glow>
                            <div className="space-y-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="text-xl font-bold mb-1 text-cyan-400">
                                    {place.info.name}
                                  </h3>
                                  <p className="text-sm text-muted-foreground mb-1">
                                    {portfolioT("tokenLabel", { tokenId })}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {place.info.city}, {place.info.province}
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                  <p className="text-xs text-muted-foreground mb-1">
                                    {portfolioT("amountInvestedLabel")}
                                  </p>
                                  <p className="text-2xl font-bold">{priceFormatted}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                  <p className="text-xs text-muted-foreground mb-1">
                                    {portfolioT("totalEarnedLabel")}
                                  </p>
                                  <p className="text-2xl font-bold text-green-400">{earnedFormatted}</p>
                                </div>
                              </div>

                              <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">
                                      {portfolioT("pendingLabel")}
                                    </p>
                                    <p className="text-xl font-bold text-cyan-400">{pendingFormatted}</p>
                                  </div>
                                  <AnimatedButton
                                    variant="outline"
                                    size="sm"
                                    disabled={isClaimingThis}
                                    onClick={() => handleClaimSingle(nft.placeAddress, nft.tokenId)}
                                  >
                                    {isClaimingThis ? (
                                      <>
                                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                        Claiming...
                                      </>
                                    ) : (
                                      portfolioT("claimCta")
                                    )}
                                  </AnimatedButton>
                                </div>
                              </div>

                              <div className="pt-4 border-t border-white/10">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">{portfolioT("roiLabel")}</span>
                                  <span className="font-semibold text-green-400">+0.00%</span>
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
