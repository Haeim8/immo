"use client";

import { motion } from "framer-motion";
import { TrendingUp, Users, Building2, ExternalLink } from "lucide-react";
import GradientText from "@/components/atoms/GradientText";
import StatCard from "@/components/molecules/StatCard";
import AnimatedButton from "@/components/atoms/AnimatedButton";
import { useAllPlaces } from "@/lib/evm";
import { useMemo } from "react";
import { useTranslations, useCurrencyFormatter } from "@/components/providers/IntlProvider";

export default function HeroSection() {
  const { places } = useAllPlaces();
  const heroT = useTranslations("hero");
  const { formatCurrency } = useCurrencyFormatter();

  const globalMetrics = useMemo(() => {
    const totalProjects = places.length;
    const totalValueDistributed = places.reduce((sum, place) =>
      sum + Number(place.info.totalRewardsDeposited), 0
    );
    const activeInvestors = 0; // TODO: Calculer avec leaderboard data

    return {
      totalProjectsFunded: totalProjects,
      totalValueDistributed,
      activeInvestors,
      blockchainExplorerUrl: "https://sepolia.basescan.org/",
    };
  }, [places]);

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
    <section className="relative min-h-[55vh] md:min-h-[65vh] flex items-center justify-center py-8 md:py-12">

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-5xl mx-auto space-y-8 md:space-y-12">
          {/* Hero Title */}
          <motion.div
            className="text-center space-y-4 md:space-y-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold leading-tight px-2">
            <GradientText from="from-cyan-400" to="to-blue-600">
              {heroT("titleLine1")}
            </GradientText>
            <br />
            <span className="text-foreground">{heroT("titleLine2")}</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            {heroT("subtitle")}
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
            className="flex flex-row items-center justify-center gap-2 md:gap-4 px-4"
            initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <AnimatedButton variant="primary" size="lg" className="flex-1 sm:flex-none text-xs sm:text-sm md:text-base">
            {heroT("exploreCTA")}
          </AnimatedButton>
          <AnimatedButton
            variant="outline"
            size="lg"
            className="flex-1 sm:flex-none text-xs sm:text-sm md:text-base"
            onClick={() => window.open(globalMetrics.blockchainExplorerUrl, "_blank")}
          >
            <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 mr-1 sm:mr-2" />
            {heroT("explorerCTA")}
          </AnimatedButton>
        </motion.div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-3 md:gap-6">
            {metrics.map((metric, index) => (
              <StatCard key={index} {...metric} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
