"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import GlassCard from "@/components/atoms/GlassCard";
import GradientText from "@/components/atoms/GradientText";
import { useTranslations } from "@/components/providers/IntlProvider";

export default function LeaderboardPage() {
  const leaderboardT = useTranslations("leaderboard");

  return (
    <div className="min-h-screen px-2 md:px-0">

      <main className="pb-20 md:pb-8">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 md:mb-12 pt-4 md:pt-0"
          >
            <h1 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              <GradientText>{leaderboardT("title")}</GradientText>
            </h1>
            <p className="text-muted-foreground text-sm md:text-lg">
              {leaderboardT("subtitle")}
            </p>
          </motion.div>

          <GlassCard className="text-center py-24">
            <Trophy className="h-16 w-16 mx-auto mb-6 text-cyan-400" />
            <h2 className="text-3xl font-bold mb-4">
              <GradientText>{leaderboardT("comingSoonTitle")}</GradientText>
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              {leaderboardT("comingSoonText")}
            </p>
          </GlassCard>
        </div>
      </main>
    </div>
  );
}
