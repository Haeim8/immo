"use client";

import { motion } from "framer-motion";
import { mockInvestments } from "@/lib/mock-data";
import PropertyCard from "@/components/molecules/PropertyCard";
import GradientText from "@/components/atoms/GradientText";

export default function PropertyGrid() {
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
          {mockInvestments.map((investment, index) => (
            <motion.div
              key={investment.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <PropertyCard investment={investment} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
