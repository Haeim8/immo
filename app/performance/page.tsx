"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { BarChart3, TrendingUp, MapPin, Home, DollarSign, ExternalLink, Package } from "lucide-react";
import GlassCard from "@/components/atoms/GlassCard";
import GradientText from "@/components/atoms/GradientText";
import AnimatedButton from "@/components/atoms/AnimatedButton";
import { useTranslations, useCurrencyFormatter } from "@/components/providers/IntlProvider";
import { usePerformanceData, PropertyPerformance } from "@/lib/solana/hooks";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getIpfsUrl } from "@/lib/pinata/upload";

function PropertyDetailsModal({ property, isOpen, onClose }: { property: PropertyPerformance; isOpen: boolean; onClose: () => void }) {
  const { formatCurrency } = useCurrencyFormatter();
  const t = useTranslations("performance");

  const displayImageUrl = property.imageCid
    ? getIpfsUrl(property.imageCid)
    : "/placeholder-property.jpg";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-2xl border-white/10">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
              {property.name}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image */}
          <div className="relative h-80 w-full overflow-hidden rounded-2xl">
            <Image
              src={displayImageUrl}
              alt={property.name}
              fill
              className="object-cover"
            />
          </div>

          {/* Location */}
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-cyan-400" />
              {t("location")}
            </h3>
            <p className="text-muted-foreground">
              {property.city}, {property.province}, {property.country}
            </p>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <GlassCard className="p-4">
              <TrendingUp className={`h-5 w-5 ${property.performance > 0 ? 'text-green-400' : 'text-muted-foreground'} mb-2`} />
              <p className="text-xs text-muted-foreground">{t("performance")}</p>
              <p className={`text-2xl font-bold ${property.performance > 0 ? 'text-green-400' : 'text-muted-foreground'}`}>
                {property.performance.toFixed(2)}%
              </p>
            </GlassCard>

            <GlassCard className="p-4">
              <DollarSign className="h-5 w-5 text-cyan-400 mb-2" />
              <p className="text-xs text-muted-foreground">{t("expectedReturn")}</p>
              <p className="text-2xl font-bold">{(property.expectedReturn / 100).toFixed(2)}%</p>
            </GlassCard>

            <GlassCard className="p-4">
              <Package className="h-5 w-5 text-blue-400 mb-2" />
              <p className="text-xs text-muted-foreground">{t("sharesSold")}</p>
              <p className="text-2xl font-bold">{property.sharesSold}/{property.totalShares}</p>
            </GlassCard>

            <GlassCard className="p-4">
              <Home className="h-5 w-5 text-purple-400 mb-2" />
              <p className="text-xs text-muted-foreground">{t("sharePrice")}</p>
              <p className="text-2xl font-bold">{formatCurrency(property.sharePriceUSD)}</p>
            </GlassCard>
          </div>

          {/* Financial Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GlassCard className="p-4">
              <h4 className="text-sm font-semibold mb-3 text-cyan-400">{t("totalRaised")}</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">USD</span>
                  <span className="font-semibold">{formatCurrency(property.totalRaisedUSD)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">SOL</span>
                  <span className="font-semibold">{property.totalRaisedSOL.toFixed(4)}</span>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-4">
              <h4 className="text-sm font-semibold mb-3 text-green-400">{t("totalDividends")}</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">USD</span>
                  <span className="font-semibold text-green-400">{formatCurrency(property.totalDividendsDepositedUSD)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">SOL</span>
                  <span className="font-semibold text-green-400">{property.totalDividendsDepositedSOL.toFixed(4)}</span>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Status */}
          <div className="flex items-center gap-4">
            <div className={`px-4 py-2 rounded-full ${property.isActive ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
              {property.isActive ? t("active") : t("inactive")}
            </div>
            {property.isLiquidated && (
              <div className="px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30 text-red-400">
                {t("liquidated")}
              </div>
            )}
          </div>

          {/* Contract */}
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold mb-1">{t("smartContract")}</h3>
                <code className="text-xs text-muted-foreground break-all block">{property.propertyPDA.toBase58()}</code>
              </div>
              <AnimatedButton
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://explorer.solana.com/address/${property.propertyPDA.toBase58()}?cluster=devnet`, "_blank")}
                className="ml-4 shrink-0"
              >
                <ExternalLink className="h-4 w-4" />
              </AnimatedButton>
            </div>
          </GlassCard>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PerformancePage() {
  const performanceT = useTranslations("performance");
  const { formatCurrency } = useCurrencyFormatter();
  const { performance, loading, error } = usePerformanceData();
  const [selectedProperty, setSelectedProperty] = useState<PropertyPerformance | null>(null);

  return (
    <div className="min-h-screen px-2 md:px-0">
      <main className="pb-20 md:pb-8">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 md:mb-12 pt-6 md:pt-12"
          >
            <h1 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              <GradientText>{performanceT("title")}</GradientText>
            </h1>
            <p className="text-muted-foreground text-sm md:text-lg">
              {performanceT("subtitle")}
            </p>
          </motion.div>

          {loading && (
            <GlassCard className="text-center py-12">
              <div className="animate-pulse">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-cyan-400" />
                <p className="text-muted-foreground">{performanceT("loading")}</p>
              </div>
            </GlassCard>
          )}

          {error && (
            <GlassCard className="text-center py-12 border-red-500/20">
              <p className="text-red-400">{performanceT("error")}: {error}</p>
            </GlassCard>
          )}

          {!loading && !error && performance.length === 0 && (
            <GlassCard className="text-center py-24">
              <BarChart3 className="h-16 w-16 mx-auto mb-6 text-cyan-400/50" />
              <h2 className="text-2xl font-bold mb-4">
                <GradientText>{performanceT("noProperties")}</GradientText>
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                {performanceT("noPropertiesText")}
              </p>
            </GlassCard>
          )}

          {!loading && !error && performance.length > 0 && (
            <div className="space-y-4">
              {/* Header */}
              <GlassCard className="hidden md:block">
                <div className="grid grid-cols-7 gap-4 px-6 py-4 text-sm font-semibold text-muted-foreground">
                  <div className="col-span-1">{performanceT("rank")}</div>
                  <div className="col-span-2">{performanceT("property")}</div>
                  <div className="col-span-1 text-right">{performanceT("totalRaised")}</div>
                  <div className="col-span-1 text-right">{performanceT("dividends")}</div>
                  <div className="col-span-1 text-right">{performanceT("funding")}</div>
                  <div className="col-span-1 text-right">{performanceT("performance")}</div>
                </div>
              </GlassCard>

              {/* Performance rows */}
              {performance.map((property, index) => {
                const isTop3 = index < 3;
                const rankColor = index === 0 ? "text-yellow-400" : index === 1 ? "text-gray-400" : index === 2 ? "text-amber-600" : "text-cyan-400";

                return (
                  <motion.div
                    key={property.propertyId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <GlassCard className={`${isTop3 ? 'border-cyan-500/30' : ''} hover:border-cyan-500/50 transition-all cursor-pointer`} onClick={() => setSelectedProperty(property)}>
                      {/* Desktop view */}
                      <div className="hidden md:grid grid-cols-7 gap-4 px-6 py-5 items-center">
                        <div className="col-span-1 flex items-center gap-2">
                          {isTop3 ? (
                            <BarChart3 className={`h-5 w-5 ${rankColor}`} />
                          ) : (
                            <span className="text-muted-foreground font-semibold w-5 text-center">
                              {index + 1}
                            </span>
                          )}
                          <span className="font-bold text-lg">{index + 1}</span>
                        </div>

                        <div className="col-span-2">
                          <div className="font-semibold text-cyan-400">{property.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {property.city}, {property.province}
                          </div>
                        </div>

                        <div className="col-span-1 text-right">
                          <div className="font-semibold">{formatCurrency(property.totalRaisedUSD)}</div>
                          <div className="text-xs text-muted-foreground">{property.totalRaisedSOL.toFixed(4)} SOL</div>
                        </div>

                        <div className="col-span-1 text-right">
                          <div className="font-semibold text-green-400">{formatCurrency(property.totalDividendsDepositedUSD)}</div>
                          <div className="text-xs text-muted-foreground">{property.totalDividendsDepositedSOL.toFixed(4)} SOL</div>
                        </div>

                        <div className="col-span-1 text-right">
                          <div className="font-semibold">{property.fundingProgress.toFixed(1)}%</div>
                          <div className="text-xs text-muted-foreground">{property.sharesSold}/{property.totalShares}</div>
                        </div>

                        <div className="col-span-1 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <TrendingUp className={`h-4 w-4 ${property.performance > 0 ? 'text-green-400' : 'text-muted-foreground'}`} />
                            <span className={`font-bold text-lg ${property.performance > 0 ? 'text-green-400' : 'text-muted-foreground'}`}>
                              {property.performance.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Mobile view */}
                      <div className="md:hidden px-4 py-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isTop3 ? (
                              <BarChart3 className={`h-5 w-5 ${rankColor}`} />
                            ) : (
                              <span className="text-muted-foreground font-semibold">
                                #{index + 1}
                              </span>
                            )}
                            <div>
                              <div className="font-semibold text-cyan-400">{property.name}</div>
                              <div className="text-xs text-muted-foreground">{property.city}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className={`h-4 w-4 ${property.performance > 0 ? 'text-green-400' : 'text-muted-foreground'}`} />
                            <span className={`font-bold ${property.performance > 0 ? 'text-green-400' : 'text-muted-foreground'}`}>
                              {property.performance.toFixed(2)}%
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <div className="text-muted-foreground text-xs">{performanceT("totalRaised")}</div>
                            <div className="font-semibold">{formatCurrency(property.totalRaisedUSD)}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-muted-foreground text-xs">{performanceT("dividends")}</div>
                            <div className="font-semibold text-green-400">{formatCurrency(property.totalDividendsDepositedUSD)}</div>
                          </div>
                          <div className="col-span-2">
                            <div className="text-muted-foreground text-xs">{performanceT("funding")}</div>
                            <div className="font-semibold">{property.fundingProgress.toFixed(1)}%</div>
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Details Modal */}
      {selectedProperty && (
        <PropertyDetailsModal
          property={selectedProperty}
          isOpen={!!selectedProperty}
          onClose={() => setSelectedProperty(null)}
        />
      )}
    </div>
  );
}
