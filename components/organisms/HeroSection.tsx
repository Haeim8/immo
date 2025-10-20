"use client";

import { motion } from "framer-motion";
import { TrendingUp, Users, Building2, ExternalLink } from "lucide-react";
import GradientText from "@/components/atoms/GradientText";
import StatCard from "@/components/molecules/StatCard";
import AnimatedButton from "@/components/atoms/AnimatedButton";
import BlurBackground from "@/components/atoms/BlurBackground";
import { useAllProperties } from "@/lib/solana/hooks";
import { calculateGlobalMetrics } from "@/lib/solana/adapters";
import { useTranslations, useCurrencyFormatter } from "@/components/providers/IntlProvider";

export default function HeroSection() {
  const { properties } = useAllProperties();
  const globalMetrics = calculateGlobalMetrics(properties);
  const heroT = useTranslations("hero");
  const { formatCurrency } = useCurrencyFormatter();

  const metrics = [
    {
      icon: Building2,
      label: heroT("metrics.projects"),
      value: globalMetrics.totalProjectsFunded.toLocaleString(),
      iconColor: "text-cyan-400",
      delay: 0.2,
    },
    {
      icon: TrendingUp,
      label: heroT("metrics.dividends"),
      value: formatCurrency(globalMetrics.totalValueDistributed, {
        notation: "compact",
        maximumFractionDigits: 2,
      }),
      iconColor: "text-blue-400",
      delay: 0.4,
    },
    {
      icon: Users,
      label: heroT("metrics.investors"),
      value: globalMetrics.activeInvestors.toLocaleString(),
      iconColor: "text-purple-400",
      delay: 0.6,
    },
  ];

  return (
    <section className="relative min-h-[80vh] flex items-center justify-center py-20">
      <BlurBackground />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Hero Title */}
          <motion.div
            className="text-center space-y-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            <GradientText from="from-cyan-400" to="to-blue-600">
              {heroT("titleLine1")}
            </GradientText>
            <br />
            <span className="text-foreground">{heroT("titleLine2")}</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {heroT("subtitle")}
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
            className="flex items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <AnimatedButton variant="primary" size="lg">
            {heroT("exploreCTA")}
          </AnimatedButton>
          <AnimatedButton
            variant="outline"
            size="lg"
            onClick={() => window.open(globalMetrics.blockchainExplorerUrl, "_blank")}
          >
            <ExternalLink className="h-5 w-5 mr-2" />
            {heroT("explorerCTA")}
          </AnimatedButton>
        </motion.div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {metrics.map((metric, index) => (
              <StatCard key={index} {...metric} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
