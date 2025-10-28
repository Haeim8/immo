"use client";

import { motion } from "framer-motion";
import { BarChart3, TrendingUp, MapPin } from "lucide-react";
import GlassCard from "@/components/atoms/GlassCard";
import GradientText from "@/components/atoms/GradientText";
import { useTranslations, useCurrencyFormatter } from "@/components/providers/IntlProvider";
import { useAllPlaces, useEthPrice } from "@/lib/evm";
import { formatEther } from "viem";

export default function PerformancePage() {
  const performanceT = useTranslations("performance");
  const { formatCurrency } = useCurrencyFormatter();
  const { places, isLoading: loading } = useAllPlaces();
  const { price: ethPrice } = useEthPrice();

  // Calculate performance for each place
  const performanceData = places.map((place, index) => {
    const totalPuzzles = Number(place.info.totalPuzzles);
    const puzzlesSold = Number(place.info.puzzlesSold);
    const puzzlePriceETH = parseFloat(formatEther(place.info.puzzlePrice));
    const puzzlePriceUSD = puzzlePriceETH * ethPrice.usd;

    const totalRaisedUSD = puzzlesSold * puzzlePriceUSD;
    const totalRaisedETH = puzzlesSold * puzzlePriceETH;
    const fundingProgress = totalPuzzles > 0 ? (puzzlesSold / totalPuzzles) * 100 : 0;

    // TODO: Get actual dividends from contract
    const totalDividendsUSD = 0;
    const totalDividendsETH = 0;

    const performance = totalRaisedUSD > 0 ? (totalDividendsUSD / totalRaisedUSD) * 100 : 0;

    return {
      rank: index + 1,
      name: place.info.name,
      city: place.info.city,
      province: place.info.province,
      totalRaisedUSD,
      totalRaisedETH,
      totalDividendsUSD,
      totalDividendsETH,
      fundingProgress,
      sharesSold: puzzlesSold,
      totalShares: totalPuzzles,
      performance,
      expectedReturn: place.info.expectedReturn / 100,
      address: place.address,
    };
  });

  // Sort by performance descending
  const sortedPerformance = [...performanceData].sort((a, b) => b.performance - a.performance);

  return (
    <div className="min-h-screen px-2 md:px-0">
      <main className="pb-20 md:pb-8">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 md:mb-12 pt-6 md:pt-12"
          >
            <h1 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              <GradientText>{performanceT("title")}</GradientText>
            </h1>
            <p className="text-muted-foreground text-sm md:text-lg">
              {performanceT("subtitle")}
            </p>
          </motion.div>

          {loading && (
            <GlassCard className="text-center py-12">
              <div className="animate-pulse">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-cyan-400" />
                <p className="text-muted-foreground">{performanceT("loading")}</p>
              </div>
            </GlassCard>
          )}

          {!loading && sortedPerformance.length === 0 && (
            <GlassCard className="text-center py-24">
              <BarChart3 className="h-16 w-16 mx-auto mb-6 text-cyan-400/50" />
              <h2 className="text-2xl font-bold mb-4">
                <GradientText>{performanceT("noProperties")}</GradientText>
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                {performanceT("noPropertiesText")}
              </p>
            </GlassCard>
          )}

          {!loading && sortedPerformance.length > 0 && (
            <div className="space-y-4">
              {/* Header */}
              <GlassCard className="hidden md:block">
                <div className="grid grid-cols-7 gap-4 px-6 py-4 text-sm font-semibold text-muted-foreground">
                  <div className="col-span-1">{performanceT("rank")}</div>
                  <div className="col-span-2">{performanceT("property")}</div>
                  <div className="col-span-1 text-right">{performanceT("totalRaised")}</div>
                  <div className="col-span-1 text-right">{performanceT("dividends")}</div>
                  <div className="col-span-1 text-right">{performanceT("funding")}</div>
                  <div className="col-span-1 text-right">{performanceT("performance")}</div>
                </div>
              </GlassCard>

              {/* Performance rows */}
              {sortedPerformance.map((property, index) => {
                const isTop3 = index < 3;
                const rankColor = index === 0 ? "text-yellow-400" : index === 1 ? "text-gray-400" : index === 2 ? "text-amber-600" : "text-cyan-400";

                return (
                  <motion.div
                    key={property.address}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <GlassCard className={`${isTop3 ? 'border-cyan-500/30' : ''} hover:border-cyan-500/50 transition-all`}>
                      {/* Desktop view */}
                      <div className="hidden md:grid grid-cols-7 gap-4 px-6 py-5 items-center">
                        <div className="col-span-1 flex items-center gap-2">
                          {isTop3 ? (
                            <BarChart3 className={`h-5 w-5 ${rankColor}`} />
                          ) : (
                            <span className="text-muted-foreground font-semibold w-5 text-center">
                              {index + 1}
                            </span>
                          )}
                          <span className="font-bold text-lg">{index + 1}</span>
                        </div>

                        <div className="col-span-2">
                          <div className="font-semibold text-cyan-400">{property.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {property.city}, {property.province}
                          </div>
                        </div>

                        <div className="col-span-1 text-right">
                          <div className="font-semibold">{formatCurrency(property.totalRaisedUSD)}</div>
                          <div className="text-xs text-muted-foreground">{property.totalRaisedETH.toFixed(4)} ETH</div>
                        </div>

                        <div className="col-span-1 text-right">
                          <div className="font-semibold text-green-400">{formatCurrency(property.totalDividendsUSD)}</div>
                          <div className="text-xs text-muted-foreground">{property.totalDividendsETH.toFixed(4)} ETH</div>
                        </div>

                        <div className="col-span-1 text-right">
                          <div className="font-semibold">{property.fundingProgress.toFixed(1)}%</div>
                          <div className="text-xs text-muted-foreground">{property.sharesSold}/{property.totalShares}</div>
                        </div>

                        <div className="col-span-1 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <TrendingUp className={`h-4 w-4 ${property.performance > 0 ? 'text-green-400' : 'text-muted-foreground'}`} />
                            <span className={`font-bold text-lg ${property.performance > 0 ? 'text-green-400' : 'text-muted-foreground'}`}>
                              {property.performance.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Mobile view */}
                      <div className="md:hidden px-4 py-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isTop3 ? (
                              <BarChart3 className={`h-5 w-5 ${rankColor}`} />
                            ) : (
                              <span className="text-muted-foreground font-semibold">
                                #{index + 1}
                              </span>
                            )}
                            <div>
                              <div className="font-semibold text-cyan-400">{property.name}</div>
                              <div className="text-xs text-muted-foreground">{property.city}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className={`h-4 w-4 ${property.performance > 0 ? 'text-green-400' : 'text-muted-foreground'}`} />
                            <span className={`font-bold ${property.performance > 0 ? 'text-green-400' : 'text-muted-foreground'}`}>
                              {property.performance.toFixed(2)}%
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <div className="text-muted-foreground text-xs">{performanceT("totalRaised")}</div>
                            <div className="font-semibold">{formatCurrency(property.totalRaisedUSD)}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-muted-foreground text-xs">{performanceT("dividends")}</div>
                            <div className="font-semibold text-green-400">{formatCurrency(property.totalDividendsUSD)}</div>
                          </div>
                          <div className="col-span-2">
                            <div className="text-muted-foreground text-xs">{performanceT("funding")}</div>
                            <div className="font-semibold">{property.fundingProgress.toFixed(1)}%</div>
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
      </main>
    </div>
  );
}
