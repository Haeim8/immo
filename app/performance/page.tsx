"use client";

import { motion } from "framer-motion";
import { BarChart3, MapPin, Users, TrendingUp } from "lucide-react";
import Navbar from "@/components/organisms/Navbar";
import GlassCard from "@/components/atoms/GlassCard";
import GradientText from "@/components/atoms/GradientText";
import BlurBackground from "@/components/atoms/BlurBackground";
import { mockPropertyPerformance } from "@/lib/mock-data";

export default function PerformancePage() {
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
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                <BarChart3 className="h-8 w-8 text-green-400" />
              </div>
              <h1 className="text-5xl font-bold">
                <GradientText from="from-green-400" to="to-emerald-600">
                  Property Performance
                </GradientText>
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Track the performance of tokenized properties based on dividends distributed to investors
            </p>
          </motion.div>

          {/* Performance Grid */}
          <div className="grid grid-cols-1 gap-6">
            {mockPropertyPerformance.map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <GlassCard hover glow>
                  <div className="flex items-start justify-between flex-wrap gap-6">
                    {/* Left Section */}
                    <div className="flex-1 min-w-[300px]">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                          <span className="text-2xl font-bold text-cyan-400">
                            #{property.rank}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-cyan-400">
                            {property.name}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {property.city}, {property.country}
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-4">
                        This property has distributed a total of{" "}
                        <span className="text-green-400 font-semibold">
                          ${property.totalDividendsDistributed.toLocaleString()}
                        </span>{" "}
                        in dividends to {property.totalInvestors} investors.
                      </p>
                    </div>

                    {/* Right Section - Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="h-4 w-4 text-blue-400" />
                          <span className="text-xs text-muted-foreground">Investors</span>
                        </div>
                        <p className="text-2xl font-bold">{property.totalInvestors}</p>
                      </div>

                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="h-4 w-4 text-green-400" />
                          <span className="text-xs text-muted-foreground">Avg Return</span>
                        </div>
                        <p className="text-2xl font-bold text-green-400">
                          {property.averageReturn}%
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-2 mb-1">
                          <BarChart3 className="h-4 w-4 text-cyan-400" />
                          <span className="text-xs text-muted-foreground">Monthly</span>
                        </div>
                        <p className="text-2xl font-bold text-cyan-400">
                          {property.monthlyReturn}%
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="h-4 w-4 text-green-400" />
                          <span className="text-xs text-muted-foreground">Total Paid</span>
                        </div>
                        <p className="text-lg font-bold text-green-400">
                          ${(property.totalDividendsDistributed / 1000).toFixed(1)}k
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Performance Score</span>
                      <span className="font-semibold text-cyan-400">
                        {property.averageReturn * 10}/100
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-cyan-500 to-green-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${property.averageReturn * 10}%` }}
                        transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                      />
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-8"
          >
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold mb-2 text-cyan-400">
                How Performance is Calculated
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Property performance rankings are based on a combination of factors including:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span>Total dividends distributed to investors over time</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span>Average annual return percentage for all investors</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span>Monthly return consistency and growth trajectory</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span>Number of active investors and overall property engagement</span>
                </li>
              </ul>
            </GlassCard>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
