"use client";

import { useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, TrendingUp, Calendar, Clock } from "lucide-react";
import type { Investment } from "@/lib/types";
import { getIpfsUrl } from "@/lib/pinata/upload";
import { useTranslations, useCurrencyFormatter } from "@/components/providers/IntlProvider";

interface PropertyCardProps {
  investment: Investment;
}

export default function PropertyCard({ investment }: PropertyCardProps) {
  const router = useRouter();
  const t = useTranslations("propertyCard");
  const { formatCurrency } = useCurrencyFormatter();

  const saleEndDate = useMemo(() => new Date(investment.saleEnd * 1000), [investment.saleEnd]);
  const isSaleEnded = Date.now() > saleEndDate.getTime();
  const timeLeft = saleEndDate.getTime() - Date.now();
  const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60));
  const saleClosed = isSaleEnded || !investment.isActive;
  const saleEndDateDisplay = saleEndDate.toLocaleString();

  const displayImageUrl = investment.imageCid
    ? getIpfsUrl(investment.imageCid)
    : investment.imageUrl || "/placeholder-property.jpg";

  const pricePerShareFormatted = formatCurrency(investment.priceUSD);
  const estimatedValueFormatted = formatCurrency(investment.estimatedValue);

  const locationLabel = `${investment.location.city}, ${investment.location.province}, ${investment.location.country}`;

  const handleOpenVault = () => {
    router.push(`/vault/${investment.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -8 }}
      onClick={handleOpenVault}
      className="group relative cursor-pointer"
    >
      <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-all duration-300">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-12 right-[-15%] h-32 w-32 rounded-full bg-cyan-500/20 blur-[90px]" />
          <div className="absolute -bottom-16 left-[-12%] h-28 w-28 rounded-full bg-blue-500/15 blur-[80px]" />
          <div className="absolute inset-0 rounded-[24px] border border-white/10 opacity-60" />
        </div>

        {/* Image */}
        <div className="relative h-56 w-full overflow-hidden">
          <Image
            src={displayImageUrl || "/placeholder.svg"}
            alt={investment.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(min-width: 1280px) 420px, 100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          <div
            className={`absolute top-4 right-4 px-3 py-1 rounded-full backdrop-blur-sm text-white text-sm font-semibold uppercase tracking-[0.25em] ${
              investment.fundingProgress >= 100 ? "bg-yellow-500/90" : "bg-cyan-500/90"
            }`}
          >
            {investment.fundingProgress >= 100
              ? t("soldOutBadge")
              : t("funded", { percentage: investment.fundingProgress.toFixed(0) })}
          </div>

          <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white">
            <MapPin className="h-4 w-4" />
            <span className="text-sm font-medium">{locationLabel}</span>
          </div>
        </div>

        {/* Content */}
        <div className="relative p-5 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-2 min-w-0">
              <h3 className="text-lg font-semibold leading-tight text-foreground break-words">
                {investment.name}
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground uppercase tracking-[0.18em]">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-semibold text-foreground">
                  {investment.assetType}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-semibold text-foreground">
                  {investment.type}
                </span>
                {investment.votingEnabled && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-semibold text-foreground">
                    🗳️ {t("votingEnabled")}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">{t("pricePerShare")}</p>
              <p className="text-base font-semibold text-cyan-400">{pricePerShareFormatted}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-[0.7rem] uppercase tracking-[0.15em] text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-400" />
                {t("expectedReturn")}
              </p>
              <p className="text-xl font-semibold text-foreground">{investment.expectedReturn.toFixed(2)}%</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-[0.7rem] uppercase tracking-[0.15em] text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-400" />
                {t("saleEndDateLabel", { date: saleEndDateDisplay })}
              </p>
              <p className="text-sm font-semibold text-foreground">{saleEndDateDisplay}</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{t("progress")}</p>
              <p className="text-lg font-semibold text-foreground">
                {investment.fundingProgress.toFixed(1)}% ({investment.sharesSold}/{investment.totalShares})
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-4 w-4" />
              {saleClosed
                ? t("saleEnded")
                : daysLeft > 0
                  ? t("daysLeft", { count: daysLeft })
                  : t("hoursLeft", { count: hoursLeft })}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {t("totalPrice")}: <span className="font-semibold text-foreground">{estimatedValueFormatted}</span>
            </div>
            <button
              type="button"
              onClick={handleOpenVault}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/90 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500"
            >
              {t("fullDetails")}
            </button>
          </div>
        </div>

        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    </motion.div>
  );
}
