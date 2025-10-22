"use client";

import { motion } from "framer-motion";
import { Trophy, TrendingUp, Package } from "lucide-react";
import GlassCard from "@/components/atoms/GlassCard";
import GradientText from "@/components/atoms/GradientText";
import { useTranslations, useCurrencyFormatter } from "@/components/providers/IntlProvider";
import { useLeaderboardData } from "@/lib/solana/hooks";

export default function LeaderboardPage() {
  const leaderboardT = useTranslations("leaderboard");
  const { formatCurrency } = useCurrencyFormatter();
  const { leaderboard, loading, error } = useLeaderboardData();

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
              <GradientText>{leaderboardT("title")}</GradientText>
            </h1>
            <p className="text-muted-foreground text-sm md:text-lg">
              {leaderboardT("subtitle")}
            </p>
          </motion.div>

          {loading && (
            <GlassCard className="text-center py-12">
              <div className="animate-pulse">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-cyan-400" />
                <p className="text-muted-foreground">{leaderboardT("loading")}</p>
              </div>
            </GlassCard>
          )}

          {error && (
            <GlassCard className="text-center py-12 border-red-500/20">
              <p className="text-red-400">{leaderboardT("error")}: {error}</p>
            </GlassCard>
          )}

          {!loading && !error && leaderboard.length === 0 && (
            <GlassCard className="text-center py-24">
              <Trophy className="h-16 w-16 mx-auto mb-6 text-cyan-400/50" />
              <h2 className="text-2xl font-bold mb-4">
                <GradientText>{leaderboardT("noInvestors")}</GradientText>
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                {leaderboardT("noInvestorsText")}
              </p>
            </GlassCard>
          )}

          {!loading && !error && leaderboard.length > 0 && (
            <div className="space-y-4">
              {/* Header */}
              <GlassCard className="hidden md:block">
                <div className="grid grid-cols-6 gap-4 px-6 py-4 text-sm font-semibold text-muted-foreground">
                  <div className="col-span-1">{leaderboardT("rank")}</div>
                  <div className="col-span-1">{leaderboardT("investor")}</div>
                  <div className="col-span-1 text-right">{leaderboardT("investments")}</div>
                  <div className="col-span-1 text-right">{leaderboardT("totalInvested")}</div>
                  <div className="col-span-1 text-right">{leaderboardT("dividends")}</div>
                  <div className="col-span-1 text-right">{leaderboardT("performance")}</div>
                </div>
              </GlassCard>

              {/* Leaderboard rows */}
              {leaderboard.map((investor, index) => {
                const isTop3 = index < 3;
                const medalColor = index === 0 ? "text-yellow-400" : index === 1 ? "text-gray-400" : index === 2 ? "text-amber-600" : "text-cyan-400";

                return (
                  <motion.div
                    key={investor.address}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <GlassCard className={`${isTop3 ? 'border-cyan-500/30' : ''} hover:border-cyan-500/50 transition-all`}>
                      {/* Desktop view */}
                      <div className="hidden md:grid grid-cols-6 gap-4 px-6 py-5 items-center">
                        <div className="col-span-1 flex items-center gap-2">
                          {isTop3 ? (
                            <Trophy className={`h-5 w-5 ${medalColor}`} />
                          ) : (
                            <span className="text-muted-foreground font-semibold w-5 text-center">
                              {index + 1}
                            </span>
                          )}
                          <span className="font-bold text-lg">{index + 1}</span>
                        </div>
                        <div className="col-span-1">
                          <code className="text-sm bg-background/50 px-2 py-1 rounded">
                            {investor.displayAddress}
                          </code>
                        </div>
                        <div className="col-span-1 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Package className="h-4 w-4 text-cyan-400" />
                            <span className="font-semibold">{investor.numberOfInvestments}</span>
                          </div>
                        </div>
                        <div className="col-span-1 text-right">
                          <div className="font-semibold">{formatCurrency(investor.totalInvestedUSD)}</div>
                          <div className="text-xs text-muted-foreground">{investor.totalInvestedSOL.toFixed(4)} SOL</div>
                        </div>
                        <div className="col-span-1 text-right">
                          <div className="font-semibold text-green-400">{formatCurrency(investor.totalDividendsUSD)}</div>
                          <div className="text-xs text-muted-foreground">{investor.totalDividendsSOL.toFixed(4)} SOL</div>
                        </div>
                        <div className="col-span-1 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <TrendingUp className={`h-4 w-4 ${investor.performance > 0 ? 'text-green-400' : 'text-muted-foreground'}`} />
                            <span className={`font-bold text-lg ${investor.performance > 0 ? 'text-green-400' : 'text-muted-foreground'}`}>
                              {investor.performance.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Mobile view */}
                      <div className="md:hidden px-4 py-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isTop3 ? (
                              <Trophy className={`h-5 w-5 ${medalColor}`} />
                            ) : (
                              <span className="text-muted-foreground font-semibold">
                                #{index + 1}
                              </span>
                            )}
                            <code className="text-sm bg-background/50 px-2 py-1 rounded">
                              {investor.displayAddress}
                            </code>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className={`h-4 w-4 ${investor.performance > 0 ? 'text-green-400' : 'text-muted-foreground'}`} />
                            <span className={`font-bold ${investor.performance > 0 ? 'text-green-400' : 'text-muted-foreground'}`}>
                              {investor.performance.toFixed(2)}%
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <div className="text-muted-foreground text-xs">{leaderboardT("investments")}</div>
                            <div className="font-semibold">{investor.numberOfInvestments}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-muted-foreground text-xs">{leaderboardT("totalInvested")}</div>
                            <div className="font-semibold">{formatCurrency(investor.totalInvestedUSD)}</div>
                          </div>
                          <div className="col-span-2">
                            <div className="text-muted-foreground text-xs">{leaderboardT("dividends")}</div>
                            <div className="font-semibold text-green-400">{formatCurrency(investor.totalDividendsUSD)}</div>
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
