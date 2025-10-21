"use client";

import { motion } from "framer-motion";
import { Wallet, TrendingUp, Calendar, Gift, Loader2 } from "lucide-react";
import GlassCard from "@/components/atoms/GlassCard";
import GradientText from "@/components/atoms/GradientText";
import AnimatedButton from "@/components/atoms/AnimatedButton";
import MetricDisplay from "@/components/atoms/MetricDisplay";
import { useUserShareNFTs, useAllProperties } from "@/lib/solana/hooks";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSolPrice, lamportsToUsd } from "@/lib/solana/useSolPrice";
import { useTranslations, useIntl, useCurrencyFormatter } from "@/components/providers/IntlProvider";

export default function PortfolioPage() {
  const { connected } = useWallet();
  const { shareNFTs, loading: loadingNFTs, error: errorNFTs } = useUserShareNFTs();
  const { properties, loading: loadingProperties } = useAllProperties();
  const { price: solPrice } = useSolPrice();
  const portfolioT = useTranslations("portfolio");
  const metricsT = useTranslations("portfolio.metrics");
  const { language } = useIntl();
  const { formatCurrency } = useCurrencyFormatter();

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

  const totalInvestedFormatted = formatCurrency(totalInvested);
  const totalDividendsEarnedFormatted = formatCurrency(totalDividendsEarned);
  const totalPendingDividendsFormatted = formatCurrency(totalPendingDividends, {
    maximumFractionDigits: 2,
  });

  return (
    <div className="min-h-screen px-2 md:px-0">

      <main className="pb-20 md:pb-8">
        <div className="container mx-auto px-4 md:px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 md:mb-12 pt-4 md:pt-0"
          >
            <h1 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              <GradientText>{portfolioT("title")}</GradientText>
            </h1>
            <p className="text-muted-foreground text-sm md:text-lg">
              {portfolioT("subtitle")}
            </p>
          </motion.div>

          {/* Overview Cards */}
          {!connected ? (
            <GlassCard className="text-center py-12">
              <p className="text-muted-foreground mb-4">{portfolioT("connectMessage")}</p>
              <p className="text-sm text-muted-foreground">{portfolioT("connectHint")}</p>
            </GlassCard>
          ) : loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-cyan-400" />
              <p className="text-muted-foreground">{portfolioT("loading")}</p>
            </div>
          ) : error ? (
            <GlassCard className="text-center py-12">
              <p className="text-red-400">
                {portfolioT("error", { error: typeof error === "string" ? error : String(error) })}
              </p>
            </GlassCard>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
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

            {shareNFTs.length === 0 ? (
              <GlassCard className="text-center py-12">
                <p className="text-muted-foreground mb-4">{portfolioT("noInvestments")}</p>
                <p className="text-sm text-muted-foreground">{portfolioT("browseHint")}</p>
              </GlassCard>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {shareNFTs.map((nft, index) => {
                  // Find the property for this NFT
                  const property = properties.find(p => p.publicKey.equals(nft.account.property));

                  let priceInUSD = 0;
                  let earnedInUSD = 0;
                  let pendingUSD = 0;
                  let propertyName = portfolioT("unknownProperty");

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

                  const mintTimestamp = nft.account.mintTime?.toNumber() || 0;
                  const mintedDate = mintTimestamp ? new Date(mintTimestamp * 1000) : null;
                  const mintedDateFormatted = mintedDate
                    ? new Intl.DateTimeFormat(language).format(mintedDate)
                    : "—";
                  const tokenId = nft.account.tokenId?.toString() || "N/A";
                  const priceFormatted = formatCurrency(priceInUSD, {
                    maximumFractionDigits: 2,
                  });
                  const earnedFormatted = formatCurrency(earnedInUSD, {
                    maximumFractionDigits: 2,
                  });
                  const pendingFormatted = formatCurrency(pendingUSD, {
                    maximumFractionDigits: 2,
                  });

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
                                {portfolioT("tokenLabel", { tokenId })}
                              </p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                {portfolioT("minted", { date: mintedDateFormatted })}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                              <p className="text-xs text-muted-foreground mb-1">
                                {portfolioT("amountInvestedLabel")}
                              </p>
                              <p className="text-2xl font-bold">
                                {priceFormatted}
                              </p>
                            </div>
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                              <p className="text-xs text-muted-foreground mb-1">
                                {portfolioT("totalEarnedLabel")}
                              </p>
                              <p className="text-2xl font-bold text-green-400">
                                {earnedFormatted}
                              </p>
                            </div>
                          </div>

                          <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">
                                  {portfolioT("pendingLabel")}
                                </p>
                                <p className="text-xl font-bold text-cyan-400">
                                  {pendingFormatted}
                                </p>
                              </div>
                              <AnimatedButton variant="outline" size="sm" disabled={pendingUSD === 0}>
                                {portfolioT("claimCta")}
                              </AnimatedButton>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-white/10">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{portfolioT("roiLabel")}</span>
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
