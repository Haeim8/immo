"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import Navbar from "@/components/organisms/Navbar";
import GlassCard from "@/components/atoms/GlassCard";
import GradientText from "@/components/atoms/GradientText";
import BlurBackground from "@/components/atoms/BlurBackground";

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <BlurBackground />

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-5xl font-bold mb-4">
              <GradientText>Top Investors</GradientText>
            </h1>
            <p className="text-muted-foreground text-lg">
              See the top performers in the BrickChain ecosystem
            </p>
          </motion.div>

          <GlassCard className="text-center py-24">
            <Trophy className="h-16 w-16 mx-auto mb-6 text-cyan-400" />
            <h2 className="text-3xl font-bold mb-4">
              <GradientText>Coming Soon</GradientText>
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              The leaderboard will showcase top investors based on their holdings and returns.
              Check back soon to see where you rank!
            </p>
          </GlassCard>
        </div>
      </main>
    </div>
  );
}
