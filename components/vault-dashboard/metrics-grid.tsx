"use client";

import { Info, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { VaultChart } from "./chart";

interface MetricsGridProps {
  totalInvested: number;
  availableLiquidity: number;
  currencyFormatter: (amount: number) => string;
}

export function MetricsGrid({ totalInvested, availableLiquidity, currencyFormatter }: MetricsGridProps) {
  const utilization = totalInvested + availableLiquidity > 0
    ? (totalInvested / (totalInvested + availableLiquidity)) * 100
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
      {/* Left Column: Reserve Status & Configuration */}
      <div className="space-y-6">
        <Card className="overflow-hidden border-t-4 border-t-primary">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              État du Vault
              <Info className="w-4 h-4 text-muted-foreground/70" />
            </h3>

            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Taux d&apos;Utilisation</span>
                  <span className="text-xl font-bold">{utilization.toFixed(1)}%</span>
                </div>
                <Progress value={utilization} className="h-2 mb-1" />
                <p className="text-xs text-muted-foreground text-right">Optimal: 90%</p>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Total Investi</span>
                <span className="font-semibold">{currencyFormatter(totalInvested)}</span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Liquidité Disponible</span>
                <span className="font-semibold">{currencyFormatter(availableLiquidity)}</span>
              </div>

              <div className="pt-2">
                <h4 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">
                  Configuration
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg border bg-card/50">
                    <p className="text-xs text-muted-foreground mb-1">Max LTV</p>
                    <p className="font-bold">75.00%</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-card/50">
                    <p className="text-xs text-muted-foreground mb-1">Seuil Liquidation</p>
                    <p className="font-bold">82.50%</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-card/50">
                    <p className="text-xs text-muted-foreground mb-1">Pénalité</p>
                    <p className="font-bold">5.00%</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-card/50">
                    <p className="text-xs text-muted-foreground mb-1">Période Lock-up</p>
                    <p className="font-bold">12 Mois</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">
              Information Actif
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">Immobilier Résidentiel</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Localisation</span>
                <span className="font-medium">Nice, France</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Assurance</span>
                <span className="font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Couvert
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Center Column: Investment/Supply Info */}
      <div className="space-y-6">
        <Card className="h-full border-t-4 border-t-green-500 shadow-lg shadow-green-500/5">
          <CardContent className="p-6 h-full flex flex-col">
            <h3 className="text-lg font-semibold mb-1 flex items-center gap-2 text-green-600 dark:text-green-400">
              Investissement (Supply)
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Fournissez de la liquidité pour financer cet actif.
            </p>

            <div className="bg-secondary/30 rounded-2xl p-6 mb-6 flex flex-col items-center justify-center text-center border border-border/50">
              <span className="text-sm font-medium text-muted-foreground mb-2">Rendement Annuel (APY)</span>
              <span className="text-5xl font-bold tracking-tight text-foreground">8.45%</span>
              <span className="text-xs text-green-600 dark:text-green-400 font-medium mt-2 bg-green-500/10 px-2 py-1 rounded-full">
                +2.1% vs Inflation
              </span>
            </div>

            <div className="mb-6 h-48 w-full">
              <VaultChart color="#22c55e" label="Rendement Historique" />
            </div>

            <div className="mt-auto space-y-3">
              <div className="flex justify-between text-sm py-2 border-b border-border/50">
                <span className="text-muted-foreground">Vos Parts</span>
                <span className="font-mono">0.00 VA</span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b border-border/50">
                <span className="text-muted-foreground">Gains accumulés</span>
                <span className="font-mono text-green-600">0.00 €</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4">
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold h-11">
                  Investir
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-11 border-green-600/20 hover:bg-green-600/5 text-green-600 dark:text-green-400 bg-transparent"
                >
                  Retirer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Financing/Borrow Info */}
      <div className="space-y-6">
        <Card className="h-full border-t-4 border-t-primary shadow-lg shadow-primary/5">
          <CardContent className="p-6 h-full flex flex-col">
            <h3 className="text-lg font-semibold mb-1 flex items-center gap-2 text-primary">Financement (Borrow)</h3>
            <p className="text-sm text-muted-foreground mb-6">Empruntez contre vos parts d&apos;actifs.</p>

            <div className="bg-secondary/30 rounded-2xl p-6 mb-6 flex flex-col items-center justify-center text-center border border-border/50">
              <span className="text-sm font-medium text-muted-foreground mb-2">Coût d&apos;Emprunt (APY)</span>
              <span className="text-5xl font-bold tracking-tight text-foreground">11.2%</span>
              <span className="text-xs text-primary font-medium mt-2 bg-primary/10 px-2 py-1 rounded-full">
                Taux Variable
              </span>
            </div>

            <div className="mb-6 h-48 w-full">
              <VaultChart color="hsl(199, 89%, 48%)" label="Coût Historique" />
            </div>

            <div className="mt-auto space-y-3">
              <div className="flex justify-between text-sm py-2 border-b border-border/50">
                <span className="text-muted-foreground">Votre Dette</span>
                <span className="font-mono">0.00 €</span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b border-border/50">
                <span className="text-muted-foreground">Capacité d&apos;emprunt</span>
                <span className="font-mono">0.00 €</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4">
                <Button className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold">
                  Emprunter
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-11 border-primary/20 hover:bg-primary/5 text-primary bg-transparent"
                >
                  Rembourser
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
