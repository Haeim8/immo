"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Search,
  Car,
  Ship,
  Home,
  Wrench,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  mockVaults,
  mockUserPositions,
  Category,
  Vault,
  Position,
} from "@/data/mockVaults";

export default function PropertyContainer(_props?: { properties?: unknown }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | "All">("All");

  const vaults: Vault[] = mockVaults;
  const userPositions: Position[] = mockUserPositions;

  const filteredVaults = vaults.filter((vault) => {
    const matchesSearch =
      vault.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vault.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || vault.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories: { id: Category | "All"; label: string; icon: any }[] = [
    { id: "All", label: "All Assets", icon: Filter },
    { id: "Real Estate", label: "Real Estate", icon: Home },
    { id: "Vehicles", label: "Vehicles", icon: Car },
    { id: "Marine", label: "Marine", icon: Ship },
    { id: "Equipment", label: "Equipment", icon: Wrench },
  ];

  return (
    <div className="w-full space-y-8">
      {userPositions.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Your Positions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-border/40 bg-card/30 shadow-lg backdrop-blur-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border/40 bg-muted/20 flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Your Supplies
                </span>
                <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Earn 8.45% APY
                </span>
              </div>
              <div className="p-4">
                {userPositions
                  .filter((p) => p.type === "supply")
                  .map((pos) => {
                    const vault = vaults.find((v) => v.id === pos.vaultId);
                    if (!vault) return null;
                    return (
                      <div
                        key={pos.vaultId}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={vault.image || "/placeholder.svg"}
                            alt={vault.name}
                            className="w-10 h-10 rounded-md object-cover"
                          />
                          <div>
                            <div className="font-semibold">{vault.name}</div>
                            <div className="text-xs text-muted-foreground">{vault.category}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-foreground">${pos.amount.toLocaleString()}</div>
                          <div className="text-xs text-emerald-500 flex items-center justify-end gap-1">
                            <ArrowUpRight className="w-3 h-3" />
                            Earned: $245.20
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="rounded-xl border border-border/40 bg-card/30 shadow-lg backdrop-blur-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border/40 bg-muted/20 flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Your Borrows</span>
                <span className="text-xs font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">
                  Rate 4.5% APY
                </span>
              </div>
              <div className="p-4">
                {userPositions
                  .filter((p) => p.type === "borrow")
                  .map((pos) => {
                    const vault = vaults.find((v) => v.id === pos.vaultId);
                    if (!vault) return null;
                    return (
                      <div
                        key={pos.vaultId}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={vault.image || "/placeholder.svg"}
                            alt={vault.name}
                            className="w-10 h-10 rounded-md object-cover"
                          />
                          <div>
                            <div className="font-semibold">{vault.name}</div>
                            <div className="text-xs text-muted-foreground">{vault.category}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-foreground">${pos.amount.toLocaleString()}</div>
                          <div className="text-xs text-blue-500 flex items-center justify-end gap-1">
                            <ArrowDownLeft className="w-3 h-3" />
                            Interest: $12.50
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar w-full md:w-auto">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className={`h-9 gap-2 whitespace-nowrap ${
                selectedCategory === cat.id
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border-border/50 text-muted-foreground hover:text-foreground hover:bg-primary/5"
              }`}
            >
              <cat.icon className="w-4 h-4" />
              {cat.label}
            </Button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            className="pl-9 bg-background/50 border-border/50 focus:bg-background transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-foreground">Active Vaults</h2>
          <span className="flex h-5 items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-medium text-primary">
            {filteredVaults.length}
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/40 bg-card/30 shadow-lg backdrop-blur-sm">
        <div className="w-full text-sm">
          <div className="grid grid-cols-12 gap-4 border-b border-border/40 bg-muted/20 px-6 py-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <div className="col-span-4">Asset Name</div>
            <div className="col-span-2 text-right">Net APY</div>
            <div className="col-span-3 text-right">Liquidity</div>
            <div className="col-span-3 text-right">Actions</div>
          </div>

          <div className="divide-y divide-border/40">
            {filteredVaults.length > 0 ? (
              filteredVaults.map((vault) => (
                <div
                  key={vault.id}
                  onClick={() => router.push(`/vault/${vault.id}`)}
                  className="group grid grid-cols-12 items-center gap-4 bg-background/20 px-6 py-5 transition-all duration-200 hover:bg-primary/5 hover:shadow-[inset_2px_0_0_0_hsl(var(--primary))] cursor-pointer"
                >
                  <div className="col-span-4 flex items-center gap-4">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border/50 shadow-sm">
                      <img
                        src={vault.image || "/placeholder.svg"}
                        alt={vault.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {vault.name}
                      </h3>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/50">
                          {vault.category}
                        </span>
                        <span className="text-xs text-muted-foreground">• {vault.tokens.map((t) => t.symbol).join(" / ")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2 text-right">
                    <div className="flex items-center justify-end gap-1 font-bold text-emerald-500 dark:text-emerald-400">
                      <TrendingUp className="h-3 w-3" />
                      {vault.netApy}%
                    </div>
                    <div className="text-xs text-muted-foreground">Annualized</div>
                  </div>

                  <div className="col-span-3 text-right">
                    <div className="font-medium text-foreground">${(vault.liquidity / 1000000).toFixed(2)}M</div>
                    <div className="mt-1.5 flex flex-col items-end gap-1">
                      <Progress value={vault.utilization} className="h-1.5 w-24 bg-muted/50 [&>div]:bg-primary/80" />
                      <span className="text-[10px] text-muted-foreground">{vault.utilization}% Utilization</span>
                    </div>
                  </div>

                  <div className="col-span-3 flex justify-end gap-2">
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => e.stopPropagation()}
                            className="h-9 min-w-[80px] border-emerald-500/20 bg-emerald-500/5 text-emerald-600 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300"
                          >
                            Supply
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Deposit assets to earn APY</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => e.stopPropagation()}
                            className="h-9 min-w-[80px] border-primary/20 bg-primary/5 text-primary hover:border-primary/40 hover:bg-primary/10"
                          >
                            Borrow
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Borrow against your collateral</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <Search className="mx-auto h-12 w-12 opacity-20 mb-4" />
                <p>No vaults found matching your criteria.</p>
                <Button
                  variant="link"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All");
                  }}
                  className="mt-2 text-primary"
                >
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
