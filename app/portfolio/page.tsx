"use client";

import { motion } from "framer-motion";
import { Wallet, TrendingUp, Calendar, Gift } from "lucide-react";
import Navbar from "@/components/organisms/Navbar";
import GlassCard from "@/components/atoms/GlassCard";
import GradientText from "@/components/atoms/GradientText";
import AnimatedButton from "@/components/atoms/AnimatedButton";
import MetricDisplay from "@/components/atoms/MetricDisplay";
import BlurBackground from "@/components/atoms/BlurBackground";
import { mockPortfolio, mockInvestments } from "@/lib/mock-data";

export default function PortfolioPage() {
  const totalPendingDividends = mockPortfolio.investments.reduce(
    (sum, inv) => sum + inv.pendingDividends,
    0
  );

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <GlassCard hover glow>
              <MetricDisplay
                icon={Wallet}
                label="Total Invested"
                value={`$${mockPortfolio.totalInvested.toLocaleString()}`}
                iconColor="text-cyan-400"
              />
            </GlassCard>
            <GlassCard hover glow>
              <MetricDisplay
                icon={TrendingUp}
                label="Total Dividends Earned"
                value={`$${mockPortfolio.totalDividends.toLocaleString()}`}
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {mockPortfolio.investments.map((investment, index) => {
                const projectDetails = mockInvestments.find(
                  (inv) => inv.id === investment.investmentId
                );
                if (!projectDetails) return null;

                return (
                  <motion.div
                    key={investment.investmentId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                  >
                    <GlassCard hover glow>
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-bold mb-1 text-cyan-400">
                              {projectDetails.name}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              Invested since {new Date(investment.purchaseDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric"
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <p className="text-xs text-muted-foreground mb-1">Amount Invested</p>
                            <p className="text-2xl font-bold">
                              ${investment.amount.toLocaleString()}
                            </p>
                          </div>
                          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <p className="text-xs text-muted-foreground mb-1">Total Earned</p>
                            <p className="text-2xl font-bold text-green-400">
                              ${investment.dividendsEarned.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Pending Dividends</p>
                              <p className="text-xl font-bold text-cyan-400">
                                ${investment.pendingDividends.toFixed(2)}
                              </p>
                            </div>
                            <AnimatedButton variant="outline" size="sm">
                              Claim
                            </AnimatedButton>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-white/10">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">ROI</span>
                            <span className="font-semibold text-green-400">
                              +{((investment.dividendsEarned / investment.amount) * 100).toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
