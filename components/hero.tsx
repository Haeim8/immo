"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAllProperties } from "@/lib/solana/hooks";
import { calculateGlobalMetrics } from "@/lib/solana/adapters";
import { TrendingUp, Users, Building2, ExternalLink } from "lucide-react";

export default function Hero() {
  const { properties } = useAllProperties();
  const globalMetrics = calculateGlobalMetrics(properties);

  const metrics = [
    {
      icon: Building2,
      label: "Projets Financés",
      value: globalMetrics.totalProjectsFunded,
      color: "text-turquoise-500",
    },
    {
      icon: TrendingUp,
      label: "Dividendes Distribués",
      value: `$${(globalMetrics.totalValueDistributed / 1000000).toFixed(2)}M`,
      color: "text-emerald-500",
    },
    {
      icon: Users,
      label: "Investisseurs Actifs",
      value: globalMetrics.activeInvestors,
      color: "text-blue-500",
    },
  ];

  return (
    <div className="py-12 space-y-8">
      {/* Hero Title */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-turquoise-400 to-blue-500 bg-clip-text text-transparent">
          Investissement Immobilier Tokenisé
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Accédez à l'immobilier premium avec la blockchain. Investissez, générez des revenus passifs et suivez vos actifs en temps réel.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index} className="border-2 hover:border-turquoise-500/50 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg bg-background ${metric.color}`}>
                  <metric.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className="text-2xl font-bold">{metric.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Blockchain Link */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => window.open(globalMetrics.blockchainExplorerUrl, "_blank")}
        >
          <ExternalLink className="h-4 w-4" />
          Voir les Contrats sur la Blockchain
        </Button>
      </div>
    </div>
  );
}
