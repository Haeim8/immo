"use client";

import { motion } from "framer-motion";
import { Trophy, Medal, Crown, Wallet, TrendingUp, Loader2 } from "lucide-react";
import GlassCard from "@/components/atoms/GlassCard";
import GradientText from "@/components/atoms/GradientText";
import { useTranslations, useCurrencyFormatter } from "@/components/providers/IntlProvider";
import { useLeaderboardData } from "@/lib/evm/hooks";

export default function LeaderboardPage() {
  const leaderboardT = useTranslations("leaderboard");
  const { formatCurrency } = useCurrencyFormatter();
  const { leaderboardData, isLoading } = useLeaderboardData();

  // Helper to shorten address
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Helper to get rank styling
  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return {
        icon: <Crown className="h-6 w-6 text-yellow-400" />,
        gradient: "from-yellow-400/20 to-amber-600/20",
        border: "border-yellow-400/50",
        textColor: "text-yellow-400",
      };
    }
    if (rank === 2) {
      return {
        icon: <Medal className="h-6 w-6 text-gray-300" />,
        gradient: "from-gray-300/20 to-gray-500/20",
        border: "border-gray-300/50",
        textColor: "text-gray-300",
      };
    }
    if (rank === 3) {
      return {
        icon: <Medal className="h-6 w-6 text-amber-600" />,
        gradient: "from-amber-600/20 to-amber-800/20",
        border: "border-amber-600/50",
        textColor: "text-amber-600",
      };
    }
    return {
      icon: <Trophy className="h-5 w-5 text-cyan-400" />,
      gradient: "from-cyan-500/10 to-blue-500/10",
      border: "border-white/10",
      textColor: "text-cyan-400",
    };
  };

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

          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-cyan-400" />
              <p className="text-muted-foreground">Loading leaderboard...</p>
            </div>
          ) : leaderboardData.length === 0 ? (
            <GlassCard className="text-center py-24">
              <div className="max-w-2xl mx-auto px-4">
                <div className="p-6 rounded-full bg-gradient-to-br from-yellow-400/20 to-amber-600/20 border border-yellow-400/30 inline-flex mb-6">
                  <Trophy className="h-12 w-12 text-yellow-400" />
                </div>
                <h2 className="text-2xl font-bold mb-4">
                  <GradientText>No Investors Yet</GradientText>
                </h2>
                <p className="text-muted-foreground mb-6">
                  The leaderboard will show top investors once properties are purchased.
                </p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>🏆 Rankings by total invested</p>
                  <p>💰 Dividends earned tracking</p>
                  <p>📈 Performance metrics</p>
                  <p>🔄 Real-time updates</p>
                </div>
              </div>
            </GlassCard>
          ) : (
            <div className="space-y-4">
              {leaderboardData.map((investor, index) => {
                const rank = index + 1;
                const badge = getRankBadge(rank);
                const totalInvestedFormatted = formatCurrency(investor.totalInvestedUSD);
                const totalDividendsFormatted = formatCurrency(investor.totalDividendsEarned);

                return (
                  <motion.div
                    key={investor.address}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <GlassCard
                      hover
                      glow
                      className={`relative overflow-hidden ${rank <= 3 ? "border-2" : ""} ${badge.border}`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-r ${badge.gradient}`} />

                      <div className="relative z-10">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          {/* Rank & Address */}
                          <div className="flex items-center gap-4 min-w-0 flex-1">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                              {badge.icon}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-lg font-bold ${badge.textColor}`}>
                                  #{rank}
                                </span>
                                <span className="text-sm font-mono text-muted-foreground">
                                  {shortenAddress(investor.address)}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {investor.nftCount} NFT{investor.nftCount !== 1 ? "s" : ""} • {investor.investments.length} investment{investor.investments.length !== 1 ? "s" : ""}
                              </p>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <div className="flex items-center gap-2 mb-1">
                                <Wallet className="h-4 w-4 text-cyan-400" />
                                <p className="text-xs text-muted-foreground">Total Invested</p>
                              </div>
                              <p className="text-xl font-bold">{totalInvestedFormatted}</p>
                            </div>

                            <div className="text-right">
                              <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="h-4 w-4 text-green-400" />
                                <p className="text-xs text-muted-foreground">Dividends Earned</p>
                              </div>
                              <p className="text-xl font-bold text-green-400">{totalDividendsFormatted}</p>
                            </div>
                          </div>
                        </div>

                        {/* Investments detail (collapsible preview) */}
                        {rank <= 3 && investor.investments.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-white/10">
                            <p className="text-xs text-muted-foreground mb-2">Recent Investments:</p>
                            <div className="flex flex-wrap gap-2">
                              {investor.investments.slice(0, 3).map((inv, i) => (
                                <div
                                  key={i}
                                  className="text-xs px-2 py-1 rounded-lg bg-white/5 border border-white/10"
                                >
                                  {inv.placeName} #{inv.tokenId}
                                </div>
                              ))}
                              {investor.investments.length > 3 && (
                                <div className="text-xs px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-muted-foreground">
                                  +{investor.investments.length - 3} more
                                </div>
                              )}
                            </div>
                          </div>
                        )}
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
