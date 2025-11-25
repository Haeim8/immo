"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import { MetricsGrid } from "@/components/vault-dashboard/metrics-grid";
import { useAllPlaces, useEthPrice } from "@/lib/evm/hooks";
import { enrichWithMetadata } from "@/lib/evm/adapters";
import type { Investment } from "@/lib/types";
import { useCurrencyFormatter } from "@/components/providers/IntlProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function VaultPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const vaultId = params?.id;
  const { places, isLoading } = useAllPlaces();
  const { price: ethPrice } = useEthPrice();
  const { formatCurrency } = useCurrencyFormatter();

  const [vault, setVault] = useState<Investment | null>(null);
  const [loadingVault, setLoadingVault] = useState(true);

  useEffect(() => {
    async function loadVault() {
      if (!vaultId) return;
      if (isLoading) return;
      const place = places.find(
        (p) => p.info.placeId.toString() === vaultId || p.address.toLowerCase() === vaultId.toLowerCase()
      );
      if (!place) {
        setVault(null);
        setLoadingVault(false);
        return;
      }

      try {
        const enriched = await enrichWithMetadata(place, ethPrice.usd);
        setVault(enriched);
      } finally {
        setLoadingVault(false);
      }
    }

    loadVault();
  }, [places, isLoading, vaultId, ethPrice.usd]);

  const totals = useMemo(() => {
    if (!vault) {
      return { invested: 0, available: 0 };
    }
    const invested = vault.priceUSD * (vault.sharesSold || 0);
    const available = Math.max(0, vault.priceUSD * ((vault.totalShares || 0) - (vault.sharesSold || 0)));
    return { invested, available };
  }, [vault]);

  if (isLoading || loadingVault) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <p>Chargement du vault...</p>
        </div>
      </main>
    );
  }

  if (!vault) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center space-y-3">
            <p className="text-lg font-semibold">Campagne introuvable</p>
            <p className="text-sm text-muted-foreground">
              Impossible de trouver cette campagne. Retournez à l&apos;accueil pour voir les opportunités disponibles.
            </p>
            <a
              href="/home"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-white font-semibold hover:bg-primary/90 transition"
            >
              Retour
            </a>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <section className="py-6 md:py-10">
      <div className="container mx-auto px-4 md:px-6">
        <div className="w-full space-y-8">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Button>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">{vault.name}</h1>
            <p className="text-muted-foreground">{vault.location.city}, {vault.location.province}</p>
          </div>

          <MetricsGrid
            totalInvested={totals.invested}
            availableLiquidity={totals.available}
            currencyFormatter={(amount) =>
              formatCurrency(amount, {
                maximumFractionDigits: 0,
              })
            }
          />

          <section className="mt-8 space-y-6">
            <h2 className="text-2xl font-bold">Détails de l&apos;Actif</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card border border-border/40 rounded-xl p-6">
                <h3 className="text-sm font-medium text-muted-foreground uppercase mb-4">Description</h3>
                <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-line">
                  {vault.details.longDescription || vault.description}
                </p>
              </div>
              <div className="bg-card border border-border/40 rounded-xl p-6">
                <h3 className="text-sm font-medium text-muted-foreground uppercase mb-4">Risques</h3>
                <div className="space-y-2 text-sm text-foreground/80">
                  <p>
                    • <span className="font-medium">Risque de liquidité:</span> Période de blocage possible.
                  </p>
                  <p>
                    • <span className="font-medium">Risque de marché:</span> La valeur de l&apos;actif peut fluctuer.
                  </p>
                  <p>
                    • <span className="font-medium">Risque opérationnel:</span> Dépend de la bonne gestion de la SPV.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
