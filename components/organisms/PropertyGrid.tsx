"use client";

import { motion } from "framer-motion";
import { useAllProperties } from "@/lib/solana/hooks";
import { propertyToInvestment } from "@/lib/solana/adapters";
import PropertyCard from "@/components/molecules/PropertyCard";
import GradientText from "@/components/atoms/GradientText";
import { Loader2 } from "lucide-react";
import { useTranslations } from "@/components/providers/IntlProvider";

export default function PropertyGrid() {
  const { properties, loading, error } = useAllProperties();
  const gridT = useTranslations("propertyGrid");

  if (loading) {
    return (
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-cyan-400" />
          <p className="text-muted-foreground">{gridT("loading")}</p>
        </div>
      </section>
    );
  }

  if (error) {
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
            <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-400 max-w-md mx-auto">
              {gridT("errorText", {
                error: typeof error === "string" ? error : String(error),
              })}
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  if (properties.length === 0) {
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
    <section className="py-12 md:py-20">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          {properties.map((property, index) => {
            const investment = propertyToInvestment(property);

            return (
              <motion.div
                key={property.publicKey.toBase58()}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <PropertyCard investment={investment} />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
