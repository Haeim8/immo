"use client";

import { motion } from "framer-motion";
import { Trophy, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import Navbar from "@/components/organisms/Navbar";
import GlassCard from "@/components/atoms/GlassCard";
import GradientText from "@/components/atoms/GradientText";
import BlurBackground from "@/components/atoms/BlurBackground";
import { mockLeaderboard } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function LeaderboardPage() {
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
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
                <Trophy className="h-8 w-8 text-yellow-400" />
              </div>
              <h1 className="text-5xl font-bold">
                <GradientText from="from-yellow-400" to="to-orange-600">
                  Leaderboard
                </GradientText>
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Top investors and holders ranked by monthly performance
            </p>
          </motion.div>

          {/* Leaderboard Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                        Rank
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                        Wallet Address
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                        Total Invested
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                        Total Dividends
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                        Properties
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                        Monthly Change
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockLeaderboard.map((entry, index) => (
                      <motion.tr
                        key={entry.rank}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className={cn(
                          "border-b border-white/5 hover:bg-white/5 transition-colors",
                          entry.rank <= 3 && "bg-white/3"
                        )}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {entry.rank === 1 && (
                              <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500/30 to-orange-500/30">
                                <Trophy className="h-5 w-5 text-yellow-400" />
                              </div>
                            )}
                            {entry.rank === 2 && (
                              <div className="p-2 rounded-lg bg-gradient-to-br from-gray-400/30 to-gray-500/30">
                                <Trophy className="h-5 w-5 text-gray-300" />
                              </div>
                            )}
                            {entry.rank === 3 && (
                              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-700/30 to-orange-800/30">
                                <Trophy className="h-5 w-5 text-orange-600" />
                              </div>
                            )}
                            <span className="text-lg font-bold">#{entry.rank}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-cyan-400" />
                            <code className="text-sm font-mono text-cyan-400">
                              {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                            </code>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-lg">
                            ${entry.totalInvested.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-green-400">
                            ${entry.totalDividends.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium">{entry.propertiesOwned}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {entry.monthlyChange >= 0 ? (
                              <>
                                <TrendingUp className="h-4 w-4 text-green-400" />
                                <span className="font-semibold text-green-400">
                                  +{entry.monthlyChange}%
                                </span>
                              </>
                            ) : (
                              <>
                                <TrendingDown className="h-4 w-4 text-red-400" />
                                <span className="font-semibold text-red-400">
                                  {entry.monthlyChange}%
                                </span>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </motion.div>

          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-8"
          >
            <GlassCard className="p-6">
              <p className="text-sm text-muted-foreground">
                Rankings are updated monthly based on total investment value, dividend earnings, and portfolio growth. Monthly change reflects the percentage increase or decrease in portfolio value compared to the previous month.
              </p>
            </GlassCard>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
