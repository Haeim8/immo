"use client";

import { ChevronRight, ExternalLink, ShieldCheck, Home } from "lucide-react";

interface VaultHeaderProps {
  name: string;
  location: string;
  priceLabel: string;
  contractLabel?: string;
  verified?: boolean;
}

export function VaultHeader({ name, location, priceLabel, contractLabel, verified = true }: VaultHeaderProps) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();

  return (
    <div className="flex flex-col gap-6 pb-6 border-b border-border/50">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span className="flex items-center gap-1 hover:text-primary cursor-pointer transition-colors">
          <Home className="w-4 h-4" />
          RWA Market
        </span>
        <ChevronRight className="w-4 h-4 opacity-50" />
        <span className="hover:text-primary cursor-pointer transition-colors">Résidentiel</span>
        <ChevronRight className="w-4 h-4 opacity-50" />
        <span className="text-foreground font-medium">{name}</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
            <span className="text-2xl font-bold text-primary z-10">{initials}</span>
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">{name}</h1>
            <div className="flex items-center gap-3">
              {verified && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                  <ShieldCheck className="w-3 h-3" />
                  Vérifié
                </span>
              )}
              {contractLabel && (
                <a
                  href="#"
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                  onClick={(e) => e.preventDefault()}
                >
                  Contrat {contractLabel} <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <span className="text-sm text-muted-foreground">{location}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8 bg-card border rounded-xl p-4 shadow-sm md:ml-auto">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Prix de l&apos;Actif</p>
            <p className="text-xl font-bold font-mono">{priceLabel}</p>
          </div>
          <div className="w-px h-10 bg-border/50 hidden sm:block"></div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Oracle</p>
            <p className="text-base font-semibold text-primary">Chainlink RWA</p>
          </div>
        </div>
      </div>
    </div>
  );
}
