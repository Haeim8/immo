"use client";

import { useAllProperties } from "@/lib/solana/hooks";
import { propertyToInvestment } from "@/lib/solana/adapters";
import InvestmentCard from "@/components/investment-card";

export default function InvestmentGrid() {
  const { properties, loading } = useAllProperties();

  if (loading) {
    return (
      <div className="py-8">
        <h2 className="text-3xl font-bold mb-6">Opportunités d'Investissement</h2>
        <p className="text-muted-foreground">Chargement des propriétés...</p>
      </div>
    );
  }

  return (
    <div className="py-8">
      <h2 className="text-3xl font-bold mb-6">Opportunités d'Investissement</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => {
          const investment = propertyToInvestment(property);
          return <InvestmentCard key={investment.id} investment={investment} />;
        })}
      </div>
    </div>
  );
}
