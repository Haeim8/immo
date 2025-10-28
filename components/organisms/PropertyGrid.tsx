"use client";

import { motion } from "framer-motion";
import { useAllPlaces } from "@/lib/evm/hooks";
import { enrichWithMetadata } from "@/lib/evm/adapters";
import PropertyContainer from "@/components/organisms/PropertyContainer";
import GradientText from "@/components/atoms/GradientText";
import { Loader2 } from "lucide-react";
import { useTranslations } from "@/components/providers/IntlProvider";
import { useState, useEffect } from "react";
import { Investment } from "@/lib/types";

export default function PropertyGrid() {
  const { places, isLoading } = useAllPlaces();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const gridT = useTranslations("propertyGrid");

  useEffect(() => {
    async function loadInvestments() {
      if (isLoading) return;

      try {
        const enrichedPlaces = await Promise.all(
          places.map(place => enrichWithMetadata(place))
        );
        setInvestments(enrichedPlaces);
      } catch (error) {
        console.error("Failed to load investments:", error);
      } finally {
        setLoading(false);
      }
    }

    loadInvestments();
  }, [places, isLoading]);

  if (isLoading || loading) {
    return (
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-cyan-400" />
          <p className="text-muted-foreground">{gridT("loading")}</p>
        </div>
      </section>
    );
  }

  if (places.length === 0) {
    return (
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <GradientText>{gridT("title")}</GradientText>
            </h2>
            <p className="text-muted-foreground text-lg mb-4">
              {gridT("emptyText")}
            </p>
            <p className="text-sm text-muted-foreground">
              {gridT("createHint")}
            </p>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6 md:py-10">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 md:mb-12"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 px-2">
            <GradientText>{gridT("title")}</GradientText>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg px-4">
            {gridT("subtitle")}
          </p>
        </motion.div>

        {/* Nouveau conteneur avec pagination et filtres */}
        <PropertyContainer properties={investments} />
      </div>
    </section>
  );
}
