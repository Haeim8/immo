"use client";

import { motion } from "framer-motion";
import { useAllProperties } from "@/lib/solana/hooks";
import { propertyToInvestment } from "@/lib/solana/adapters";
import PropertyCard from "@/components/molecules/PropertyCard";
import GradientText from "@/components/atoms/GradientText";
import { Loader2 } from "lucide-react";

export default function PropertyGrid() {
  const { properties, loading, error } = useAllProperties();

  if (loading) {
    return (
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-cyan-400" />
          <p className="text-muted-foreground">Loading properties from blockchain...</p>
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
              <GradientText>Investment Opportunities</GradientText>
            </h2>
            <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-400 max-w-md mx-auto">
              Error loading properties: {error}
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
              <GradientText>Investment Opportunities</GradientText>
            </h2>
            <p className="text-muted-foreground text-lg mb-4">
              No properties available yet. Be the first to create one!
            </p>
            <p className="text-sm text-muted-foreground">
              Connect your wallet and visit the admin panel to create properties
            </p>
          </motion.div>
        </div>
      </section>
    );
  }

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
            <GradientText>Investment Opportunities</GradientText>
          </h2>
          <p className="text-muted-foreground text-lg">
            Explore our curated selection of tokenized real estate properties
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
