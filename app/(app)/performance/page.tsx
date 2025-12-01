"use client";

import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Vault, Loader2 } from "lucide-react";
import Image from "next/image";
import { useTranslations, useCurrencyFormatter } from "@/components/providers/IntlProvider";
import { useAllVaults } from "@/lib/evm/hooks";

const tokenLogos: Record<string, string> = {
  USDC: "/usc.png",
  USDT: "/usdt.jpg",
  ETH: "/eth white.png",
  WETH: "/eth white.png",
  WBTC: "/btc.png",
  BTC: "/btc.png",
};

export default function PerformancePage() {
  const performanceT = useTranslations("performance");
  const { formatCurrency } = useCurrencyFormatter();
  const { vaults, isLoading: loading } = useAllVaults();

  // Calculate performance for each vault
  const performanceData = vaults.map((vault, index) => {
    const totalSupplied = parseFloat(vault.totalSupplied);
    const totalBorrowed = parseFloat(vault.totalBorrowed);

    return {
      rank: index + 1,
      name: vault.tokenSymbol,
      vaultId: vault.vaultId,
      totalSupplied,
      totalBorrowed,
      availableLiquidity: parseFloat(vault.availableLiquidity),
      utilizationRate: vault.utilizationRate,
      supplyRate: vault.supplyRate,
      borrowRate: vault.borrowRate,
      isActive: vault.isActive,
      address: vault.vaultAddress,
    };
  });

  // Sort by TVL descending
  const sortedPerformance = [...performanceData].sort((a, b) => b.totalSupplied - a.totalSupplied);

  const getRankStyle = (index: number) => {
    if (index === 0) return "text-warning";
    if (index === 1) return "text-muted-foreground";
    if (index === 2) return "text-accent";
    return "text-primary";
  };

  return (
    <div className="flex-1 py-6 md:py-8">
      <div className="container-app space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-2">{performanceT("title") || "Performance"}</h1>
          <p className="text-muted-foreground">
            {performanceT("subtitle") || "Vault rankings by yield and utilization"}
          </p>
        </motion.div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">{performanceT("loading") || "Loading..."}</p>
            </div>
          </div>
        ) : sortedPerformance.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-vault p-12 text-center"
          >
            <Vault className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-semibold mb-2">
              {performanceT("noProperties") || "No vaults yet"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {performanceT("noPropertiesText") || "Vault performance data will appear here."}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {/* Header - Desktop */}
            <div className="hidden md:grid grid-cols-6 gap-4 px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <div>{performanceT("rank") || "Rank"}</div>
              <div>Vault</div>
              <div className="text-right">TVL</div>
              <div className="text-right">{performanceT("dividends") || "Borrowed"}</div>
              <div className="text-right">{performanceT("funding") || "Utilization"}</div>
              <div className="text-right">APY</div>
            </div>

            {/* Performance rows */}
            {sortedPerformance.map((vault, index) => {
              const isTop3 = index < 3;
              const rankStyle = getRankStyle(index);

              return (
                <motion.div
                  key={vault.address}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`card-vault ${isTop3 ? 'border-primary/20' : ''}`}
                >
                  {/* Desktop view */}
                  <div className="hidden md:grid grid-cols-6 gap-4 p-5 items-center">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isTop3 ? 'bg-primary/10' : 'bg-secondary'}`}>
                        {isTop3 ? (
                          <BarChart3 className={`h-4 w-4 ${rankStyle}`} />
                        ) : (
                          <span className="text-sm font-bold text-muted-foreground">{index + 1}</span>
                        )}
                      </div>
                      <span className={`font-bold text-lg ${rankStyle}`}>#{index + 1}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {tokenLogos[vault.name.toUpperCase()] ? (
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-secondary/50 flex items-center justify-center">
                          <Image
                            src={tokenLogos[vault.name.toUpperCase()]}
                            alt={vault.name}
                            width={32}
                            height={32}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {vault.name.slice(0, 2)}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-foreground">{vault.name}</div>
                        <div className="text-xs text-muted-foreground">Vault #{vault.vaultId}</div>
                      </div>
                    </div>

                    <div className="text-right font-semibold">{formatCurrency(vault.totalSupplied)}</div>
                    <div className="text-right font-semibold text-accent">{formatCurrency(vault.totalBorrowed)}</div>
                    <div className="text-right font-semibold">{vault.utilizationRate.toFixed(1)}%</div>

                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <TrendingUp className={`h-4 w-4 ${vault.supplyRate > 0 ? 'text-success' : 'text-muted-foreground'}`} />
                        <span className={`font-bold text-lg ${vault.supplyRate > 0 ? 'text-success' : 'text-muted-foreground'}`}>
                          {vault.supplyRate.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mobile view */}
                  <div className="md:hidden p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {tokenLogos[vault.name.toUpperCase()] ? (
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary/50 flex items-center justify-center">
                            <Image
                              src={tokenLogos[vault.name.toUpperCase()]}
                              alt={vault.name}
                              width={40}
                              height={40}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                            {vault.name.slice(0, 2)}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold">{vault.name}</div>
                          <div className="text-xs text-muted-foreground">#{index + 1} - Vault #{vault.vaultId}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className={`h-4 w-4 ${vault.supplyRate > 0 ? 'text-success' : 'text-muted-foreground'}`} />
                        <span className={`font-bold ${vault.supplyRate > 0 ? 'text-success' : 'text-muted-foreground'}`}>
                          {vault.supplyRate.toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <div className="text-muted-foreground text-xs">TVL</div>
                        <div className="font-semibold">{formatCurrency(vault.totalSupplied)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Borrowed</div>
                        <div className="font-semibold text-accent">{formatCurrency(vault.totalBorrowed)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Util.</div>
                        <div className="font-semibold">{vault.utilizationRate.toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
