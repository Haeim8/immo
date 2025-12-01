"use client";

import { motion } from "framer-motion";
import { Users, TrendingUp, Loader2, ArrowUpRight, Sparkles } from "lucide-react";
import { useTranslations, useCurrencyFormatter } from "@/components/providers/IntlProvider";
import { useLeaderboardData } from "@/lib/evm/hooks";

// Elegant rank indicators using geometric shapes
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="relative w-12 h-12 flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-warning/20 to-warning/5 rounded-xl" />
        <div className="absolute inset-1 border-2 border-warning/40 rounded-lg" />
        <span className="relative text-xl font-bold text-warning">1</span>
        <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-warning" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="relative w-12 h-12 flex items-center justify-center">
        <div className="absolute inset-0 bg-muted/50 rounded-xl" />
        <div className="absolute inset-1 border-2 border-muted-foreground/30 rounded-lg" />
        <span className="relative text-xl font-bold text-muted-foreground">2</span>
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="relative w-12 h-12 flex items-center justify-center">
        <div className="absolute inset-0 bg-accent/10 rounded-xl" />
        <div className="absolute inset-1 border-2 border-accent/30 rounded-lg" />
        <span className="relative text-xl font-bold text-accent">3</span>
      </div>
    );
  }
  return (
    <div className="w-12 h-12 flex items-center justify-center bg-secondary/50 rounded-xl border border-border">
      <span className="text-lg font-semibold text-muted-foreground">{rank}</span>
    </div>
  );
}

export default function LeaderboardPage() {
  const leaderboardT = useTranslations("leaderboard");
  const { formatCurrency } = useCurrencyFormatter();
  const { leaderboardData, isLoading } = useLeaderboardData();

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="flex-1 py-6 md:py-8">
      <div className="container-app space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-2">{leaderboardT("title")}</h1>
          <p className="text-muted-foreground">{leaderboardT("subtitle")}</p>
        </motion.div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">{leaderboardT("loading")}</p>
            </div>
          </div>
        ) : leaderboardData.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-vault p-12 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{leaderboardT("noInvestors")}</h3>
            <p className="text-sm text-muted-foreground">{leaderboardT("noInvestorsText")}</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {/* Desktop Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <div className="col-span-1">{leaderboardT("rank")}</div>
              <div className="col-span-5">{leaderboardT("investor")}</div>
              <div className="col-span-3 text-right">{leaderboardT("totalInvested")}</div>
              <div className="col-span-3 text-right">{leaderboardT("dividends")}</div>
            </div>

            {/* Leaderboard Rows */}
            {leaderboardData.map((investor, index) => {
              const rank = index + 1;
              const totalInvestedFormatted = formatCurrency(investor.totalInvestedUSD);
              const totalDividendsFormatted = formatCurrency(investor.totalDividendsEarned);
              const isTop3 = rank <= 3;

              return (
                <motion.div
                  key={investor.address}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`card-vault ${isTop3 ? 'border-primary/20' : ''}`}
                >
                  {/* Desktop View */}
                  <div className="hidden md:grid grid-cols-12 gap-4 p-5 items-center">
                    <div className="col-span-1">
                      <RankBadge rank={rank} />
                    </div>

                    <div className="col-span-5">
                      <div className="flex items-center gap-4">
                        {/* Avatar placeholder with initials */}
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold text-muted-foreground">
                          {investor.address.slice(2, 4).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">{shortenAddress(investor.address)}</span>
                            {isTop3 && (
                              <span className="badge-primary text-[10px]">
                                Top {rank}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {investor.nftCount} position{investor.nftCount !== 1 ? "s" : ""} • {investor.investments.length} {leaderboardT("investments")}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-3 text-right">
                      <p className="text-lg font-bold">{totalInvestedFormatted}</p>
                      <p className="text-xs text-muted-foreground">{leaderboardT("totalInvested")}</p>
                    </div>

                    <div className="col-span-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <ArrowUpRight className="w-4 h-4 text-success" />
                        <p className="text-lg font-bold text-success">{totalDividendsFormatted}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{leaderboardT("dividends")}</p>
                    </div>
                  </div>

                  {/* Mobile View */}
                  <div className="md:hidden p-4 space-y-4">
                    <div className="flex items-center gap-4">
                      <RankBadge rank={rank} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm">{shortenAddress(investor.address)}</span>
                          {isTop3 && <span className="badge-primary text-[10px]">Top {rank}</span>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {investor.nftCount} position{investor.nftCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">{leaderboardT("totalInvested")}</p>
                        <p className="text-lg font-bold">{totalInvestedFormatted}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">{leaderboardT("dividends")}</p>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 text-success" />
                          <p className="text-lg font-bold text-success">{totalDividendsFormatted}</p>
                        </div>
                      </div>
                    </div>

                    {/* Investments preview for top 3 */}
                    {isTop3 && investor.investments.length > 0 && (
                      <div className="pt-3 border-t border-border">
                        <div className="flex flex-wrap gap-2">
                          {investor.investments.slice(0, 3).map((inv, i) => (
                            <span key={i} className="badge bg-secondary text-secondary-foreground text-xs">
                              {inv.placeName}
                            </span>
                          ))}
                          {investor.investments.length > 3 && (
                            <span className="badge bg-muted text-muted-foreground text-xs">
                              +{investor.investments.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
