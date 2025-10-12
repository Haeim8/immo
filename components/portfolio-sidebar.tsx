"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { mockPortfolio, mockInvestments } from "@/lib/mock-data";
import { Wallet, TrendingUp, Home, Calendar, Gift } from "lucide-react";

export default function PortfolioSidebar() {
  const [activeTab, setActiveTab] = useState<"home" | "dividends">("home");
  const [claiming, setClaiming] = useState(false);

  const totalPendingDividends = mockPortfolio.investments.reduce(
    (sum, inv) => sum + inv.pendingDividends,
    0
  );

  const handleClaimDividends = async () => {
    setClaiming(true);
    // Simulate blockchain transaction
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setClaiming(false);
    alert("Dividendes réclamés avec succès!");
  };

  return (
    <div className="space-y-6">
      <SheetHeader>
        <SheetTitle className="text-2xl">Mon Portfolio</SheetTitle>
        <SheetDescription>
          Gérez vos investissements et réclamez vos dividendes
        </SheetDescription>
      </SheetHeader>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("home")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "home"
              ? "border-b-2 border-turquoise-500 text-turquoise-500"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Accueil
        </button>
        <button
          onClick={() => setActiveTab("dividends")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "dividends"
              ? "border-b-2 border-turquoise-500 text-turquoise-500"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Dividendes
        </button>
      </div>

      {/* Home Tab */}
      {activeTab === "home" && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="h-4 w-4 text-turquoise-500" />
                  <span className="text-xs text-muted-foreground">Investi</span>
                </div>
                <p className="text-xl font-bold">
                  ${mockPortfolio.totalInvested.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs text-muted-foreground">Dividendes</span>
                </div>
                <p className="text-xl font-bold text-emerald-500">
                  ${mockPortfolio.totalDividends.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Investments List */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Mes Investissements</h3>
            <div className="space-y-3">
              {mockPortfolio.investments.map((investment) => {
                const projectDetails = mockInvestments.find(
                  (inv) => inv.id === investment.investmentId
                );
                if (!projectDetails) return null;

                return (
                  <Card key={investment.investmentId} className="border-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">
                        {projectDetails.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Montant investi</span>
                        <span className="font-semibold">
                          ${investment.amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Dividendes gagnés</span>
                        <span className="font-semibold text-emerald-500">
                          ${investment.dividendsEarned.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">En attente</span>
                        <span className="font-semibold text-orange-500">
                          ${investment.pendingDividends.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span className="text-xs">
                          Depuis {new Date(investment.purchaseDate).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Dividends Tab */}
      {activeTab === "dividends" && (
        <div className="space-y-4">
          {/* Claim Card */}
          <Card className="border-2 border-turquoise-500/50 bg-gradient-to-br from-turquoise-500/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-turquoise-500" />
                Dividendes Disponibles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Total à réclamer</p>
                <p className="text-4xl font-bold text-turquoise-500">
                  ${totalPendingDividends.toFixed(2)}
                </p>
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={handleClaimDividends}
                disabled={claiming || totalPendingDividends === 0}
              >
                {claiming ? "Réclamation en cours..." : "Réclamer les Dividendes"}
              </Button>
            </CardContent>
          </Card>

          {/* Dividends History */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Historique</h3>
            <div className="space-y-2">
              {mockPortfolio.investments.map((investment) => {
                const projectDetails = mockInvestments.find(
                  (inv) => inv.id === investment.investmentId
                );
                if (!projectDetails) return null;

                return (
                  <Card key={investment.investmentId}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-sm">
                            {projectDetails.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Dividendes totaux
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-500">
                            +${investment.dividendsEarned.toLocaleString()}
                          </p>
                          <p className="text-xs text-orange-500">
                            ${investment.pendingDividends} en attente
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Note */}
          <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
            💡 Les dividendes sont distribués mensuellement. Réclamez-les à tout moment pour les recevoir dans votre wallet.
          </div>
        </div>
      )}
    </div>
  );
}
