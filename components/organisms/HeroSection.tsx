"use client";

import { Building2 } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative py-12 md:py-16 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-primary/10 rounded-[100%] blur-[100px] pointer-events-none" />

      <div className="container relative mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
            <Building2 className="w-3 h-3" />
            RWA Protocol Markets
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
            Real World Assets
            <br />
            <span className="text-primary">On-Chain Liquidity</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl">
            Access premium real estate yields through diversified vaults. Supply liquidity or borrow against your assets
            instantly.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-16 pt-8 w-full max-w-2xl border-t border-border/50 mt-8">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Value Locked</p>
              <p className="text-3xl font-bold font-mono">$12.4M</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Active Vaults</p>
              <p className="text-3xl font-bold font-mono">3</p>
            </div>
            <div className="space-y-1 col-span-2 md:col-span-1">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Yield Paid</p>
              <p className="text-3xl font-bold font-mono text-green-500">+$842k</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
