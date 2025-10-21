"use client";

import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import GlassCard from "@/components/atoms/GlassCard";
import GradientText from "@/components/atoms/GradientText";
import { useTranslations } from "@/components/providers/IntlProvider";

export default function PerformancePage() {
  const performanceT = useTranslations("performance");

  return (
    <div className="min-h-screen">

      <main className="pb-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-5xl font-bold mb-4">
              <GradientText>{performanceT("title")}</GradientText>
            </h1>
            <p className="text-muted-foreground text-lg">
              {performanceT("subtitle")}
            </p>
          </motion.div>

          <GlassCard className="text-center py-24">
            <BarChart3 className="h-16 w-16 mx-auto mb-6 text-cyan-400" />
            <h2 className="text-3xl font-bold mb-4">
              <GradientText>{performanceT("comingSoonTitle")}</GradientText>
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              {performanceT("comingSoonText")}
            </p>
          </GlassCard>
        </div>
      </main>
    </div>
  );
}
