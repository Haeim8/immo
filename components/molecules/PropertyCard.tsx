"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { MapPin, TrendingUp, ExternalLink, Calendar, Home, Clock } from "lucide-react";
import { Investment } from "@/lib/types";
import GlassCard from "@/components/atoms/GlassCard";
import AnimatedButton from "@/components/atoms/AnimatedButton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getIpfsUrl } from "@/lib/pinata/upload";
import { useTranslations, useCurrencyFormatter } from "@/components/providers/IntlProvider";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { BLOCK_EXPLORER_URL, useWalletAddress } from "@/lib/evm/hooks";
import { useBuyPuzzle } from "@/lib/evm/write-hooks";

interface PropertyCardProps {
  investment: Investment;
}

export default function PropertyCard({ investment }: PropertyCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const { address, isConnected } = useWalletAddress();
  const { openConnectModal } = useConnectModal();
  const { buyPuzzle, isPending: isTxPending } = useBuyPuzzle();
  const t = useTranslations("propertyCard");
  const { formatCurrency } = useCurrencyFormatter();

  // Calculate deadline information
  const saleEndDate = new Date(investment.saleEnd * 1000);
  const isSaleEnded = Date.now() > saleEndDate.getTime();
  const timeLeft = saleEndDate.getTime() - Date.now();
  const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60));
  const saleClosed = isSaleEnded || !investment.isActive;

  // Get image URL from IPFS if imageCid exists, otherwise use imageUrl
  const displayImageUrl = investment.imageCid
    ? getIpfsUrl(investment.imageCid)
    : investment.imageUrl || "/placeholder-property.jpg";
  const pricePerShareFormatted = formatCurrency(investment.priceUSD);
  const estimatedValueFormatted = formatCurrency(investment.estimatedValue);
  const totalPriceFormatted = formatCurrency(investment.priceUSD * quantity);
  const pricePerShareETH = investment.priceETH ?? 0;
  const totalPriceETH = useMemo(() => pricePerShareETH * quantity, [pricePerShareETH, quantity]);
  const puzzlePriceWei = investment.puzzlePriceWei ? BigInt(investment.puzzlePriceWei) : null;
  const saleClosedWithoutSellout = saleClosed && investment.fundingProgress < 100;
  const soldOut = investment.fundingProgress >= 100 || investment.sharesAvailable <= 0;
  const priceUnavailable = puzzlePriceWei === null;
  const canPurchase =
    !saleClosedWithoutSellout && !soldOut && !priceUnavailable && investment.sharesAvailable > 0;
  const actionLabel = saleClosedWithoutSellout
    ? t("saleClosed")
    : soldOut
      ? t("soldOut")
      : priceUnavailable
        ? t("priceUnavailableShort")
        : isBuying || isTxPending
          ? t("processing", { quantity })
          : success
            ? t("purchased")
            : isConnected
              ? t("buyShares", { quantity })
              : t("connectWallet");
  const saleEndDateDisplay = saleEndDate.toLocaleString();
  const campaignDurationDays = Math.max(
    1,
    Math.ceil((investment.saleEnd - investment.saleStart) / 86400)
  );
  const locationLabel = `${investment.location.city}, ${investment.location.province}, ${investment.location.country}`;
  const descriptionShouldCollapse =
    investment.description.length > 320 ||
    Boolean(investment.details.longDescription && investment.details.longDescription.length > 0);

  const handleInvest = async () => {
    if (!isConnected || !address) {
      openConnectModal?.();
      return;
    }

    if (saleClosedWithoutSellout) {
      setError(t("saleClosedError"));
      return;
    }

    if (soldOut) {
      setError(t("soldOut"));
      return;
    }

    if (priceUnavailable || !puzzlePriceWei) {
      setError(t("priceUnavailableError"));
      return;
    }

    if (!investment.contractAddress.startsWith("0x")) {
      setError(t("invalidContractError"));
      return;
    }

    if (quantity < 1 || quantity > investment.sharesAvailable) {
      setError(
        t("quantityRangeError", {
          min: 1,
          max: investment.sharesAvailable,
        })
      );
      return;
    }

    setIsBuying(true);
    setError(null);
    setSuccess(false);

    try {
      const hashes: string[] = [];

      for (let i = 0; i < quantity; i++) {
        const hash = await buyPuzzle(
          investment.contractAddress as `0x${string}`,
          puzzlePriceWei
        );
        if (hash) {
          hashes.push(hash);
        }
      }

      setSuccess(true);
      console.log(`🎉 ${quantity} shares purchased successfully!`, hashes);

      // Close modal after 2 seconds
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setQuantity(1);
        setIsDescriptionExpanded(false);
      }, 2000);
    } catch (err: any) {
      console.error("Error buying share:", err);
      const fallbackMessage = t("purchaseError");
      setError(
        typeof err?.message === "string" && err.message.trim().length > 0
          ? err.message
          : fallbackMessage
      );
    } finally {
      setIsBuying(false);
    }
  };

  const handleModalToggle = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setTimeout(() => {
        setIsDescriptionExpanded(false);
        setSuccess(false);
        setError(null);
        setQuantity(1);
      }, 150);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={{ y: -8 }}
      >
        <div className="group relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-all duration-300 cursor-pointer"
             onClick={() => setIsOpen(true)}>
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-12 right-[-15%] h-32 w-32 rounded-full bg-cyan-500/20 blur-[90px]" />
            <div className="absolute -bottom-16 left-[-12%] h-28 w-28 rounded-full bg-blue-500/15 blur-[80px]" />
            <div className="absolute inset-0 rounded-[24px] border border-white/10 opacity-60" />
          </div>
          {/* Image */}
          <div className="relative h-56 w-full overflow-hidden">
            <Image
              src={displayImageUrl}
              alt={investment.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Funding Progress Badge */}
            <div className={`absolute top-4 right-4 px-3 py-1 rounded-full backdrop-blur-sm text-white text-sm font-semibold uppercase tracking-[0.25em] ${
              investment.fundingProgress >= 100
                ? "bg-yellow-500/90"
                : "bg-cyan-500/90"
            }`}>
              {investment.fundingProgress >= 100
                ? t("soldOutBadge")
                : t("funded", { percentage: investment.fundingProgress.toFixed(0) })}
            </div>

            {/* Location */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white">
              <MapPin className="h-4 w-4" />
              <span className="text-sm font-medium">
                {investment.location.city}, {investment.location.province}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-xl font-bold mb-2 text-foreground group-hover:text-cyan-400 transition-colors">
                {investment.name}
              </h3>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("pricePerShare")}</span>
                <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
                  {pricePerShareFormatted}
                </span>
              </div>
              <div className="flex justify-end text-xs text-muted-foreground">
                {t("priceEth", { amount: pricePerShareETH.toFixed(4) })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("estValue")}</span>
                <span className="font-semibold">{estimatedValueFormatted}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("expectedReturn")}</span>
                <span className="font-semibold text-green-400">
                  {investment.expectedReturn.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("type")}</span>
                <span className="font-semibold">{investment.type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("assetType")}</span>
                <span className="font-semibold capitalize">{investment.assetType}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${investment.fundingProgress}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>

              {/* Deadline Info */}
              {investment.saleEnd > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {saleClosed ? (
                      <span className="text-red-400 font-medium">{t("saleEnded")}</span>
                    ) : daysLeft > 0 ? (
                      <span>{t("daysLeft", { count: daysLeft })}</span>
                    ) : hoursLeft > 0 ? (
                      <span className="text-orange-400 font-medium">
                        {t("hoursLeft", { count: hoursLeft })}
                      </span>
                    ) : (
                      <span className="text-red-400 font-medium">{t("endingSoon")}</span>
                    )}
                  </div>
                  <span className="text-muted-foreground">
                    {t("saleEndDateLabel", { date: saleEndDateDisplay })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Hover Glow Effect */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </motion.div>

      {/* Modal - Bottom sheet on mobile, centered modal on desktop */}
      <Dialog open={isOpen} onOpenChange={handleModalToggle}>
        <AnimatePresence mode="wait">
          {isOpen && (
            <DialogContent forceMount className="flex w-full max-w-[100vw] md:max-w-[min(92vw,1100px)] justify-center p-0 md:p-6">
              <motion.div
                initial={{ opacity: 0, y: "100%" }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: "100%" }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="relative mx-auto grid w-full gap-6 md:gap-8 overflow-y-auto rounded-t-3xl md:rounded-3xl border border-white/10 bg-background/95 md:bg-background/80 px-4 py-6 md:px-6 md:py-8 sm:px-8 lg:grid-cols-[1.15fr,0.85fr] h-[100vh] md:h-auto md:max-h-[85vh] shadow-[0_-10px_50px_-10px_rgba(34,211,238,0.3)] md:shadow-[0_0_120px_-40px_rgba(34,211,238,0.45)]"
              >
                {/* Close button - Top right on mobile, hidden on desktop (uses default X) */}
                <button
                  onClick={() => handleModalToggle(false)}
                  className="md:hidden absolute top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 border border-white/20 backdrop-blur-sm hover:bg-white/20 transition-colors"
                  aria-label="Close"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>

                {/* Background effects - Reduced blur on mobile */}
                <div className="pointer-events-none absolute inset-0 hidden md:block">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/6 via-transparent to-white/4 opacity-70" />
                  <div className="absolute inset-0 rounded-[28px] border border-white/10" />
                  <div className="absolute -top-36 left-[20%] h-96 w-96 rounded-full bg-cyan-500/20 blur-[180px]" />
                  <div className="absolute -bottom-40 right-[15%] h-96 w-96 rounded-full bg-blue-600/20 blur-[200px]" />
                </div>
                <DialogHeader className="lg:col-span-2 space-y-4 border-b border-white/5 pb-6 text-left">
                  <DialogTitle className="text-2xl font-semibold leading-tight text-foreground md:text-3xl">
                    <span className="bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
                      {investment.name}
                    </span>
                  </DialogTitle>
                  <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase text-foreground">
                      {investment.assetType}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase text-foreground">
                      {investment.type}
                    </span>
                    {investment.votingEnabled && (
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-foreground">
                        🗳️ {t("votingEnabled")}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                    <span className="font-medium">{t("pricePerShare")}</span>
                    <span className="text-lg font-semibold text-cyan-400 md:text-xl">
                      {pricePerShareFormatted}
                    </span>
                    <span className="text-xs">
                      {t("priceEth", { amount: pricePerShareETH.toFixed(4) })}
                    </span>
                  </div>
                </DialogHeader>

                <div className="space-y-6 pb-6">
                  <motion.div
                    layout
                    className="group relative aspect-[16/10] min-h-[320px] overflow-hidden rounded-3xl border border-white/20 bg-white/5 shadow-[0_25px_90px_-30px_rgba(6,182,212,0.45)] backdrop-blur-2xl"
                  >
                    <Image
                      src={displayImageUrl}
                      alt={investment.name}
                      fill
                      sizes="(min-width: 1280px) 640px, 100vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="pointer-events-none absolute inset-0">
                      <div className="absolute -top-24 left-[-8%] h-72 w-72 rounded-full bg-cyan-500/25 blur-[140px]" />
                      <div className="absolute -bottom-28 right-[-12%] h-80 w-80 rounded-full bg-blue-500/25 blur-[160px]" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                    <div className="absolute top-5 right-5 flex items-center gap-2 rounded-full border border-white/30 bg-black/50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em] text-white backdrop-blur-md">
                      <span>
                        {investment.fundingProgress >= 100
                          ? t("soldOutBadge")
                          : t("funded", { percentage: investment.fundingProgress.toFixed(0) })}
                      </span>
                    </div>
                    <div className="absolute bottom-5 left-5 flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-4 py-2 text-sm font-medium text-white backdrop-blur">
                        <MapPin className="h-4 w-4" />
                        {locationLabel}
                      </span>
                    </div>
                  </motion.div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <GlassCard glow className="space-y-2 p-5 sm:p-6">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {t("totalRaiseAmount")}
                      </p>
                      <p className="text-xl md:text-2xl font-semibold text-cyan-400">
                        {estimatedValueFormatted}
                      </p>
                    </GlassCard>
                    <GlassCard glow className="space-y-2 p-5 sm:p-6">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {t("campaignDuration")}
                      </p>
                      <p className="text-xl md:text-2xl font-semibold text-orange-400">
                        {t("campaignDurationValue", { count: campaignDurationDays })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {saleClosed
                          ? t("saleEnded")
                          : daysLeft > 0
                            ? t("daysLeft", { count: daysLeft })
                            : t("hoursLeft", { count: hoursLeft })}
                      </p>
                    </GlassCard>
                    <GlassCard glow className="space-y-3 p-5 sm:col-span-2 sm:p-6">
                      <p className="text-[0.7rem] uppercase tracking-[0.28em] text-muted-foreground">
                        {t("location")}
                      </p>
                      <p className="text-lg font-semibold text-foreground">{investment.location.city}</p>
                      <p className="text-sm text-muted-foreground">{locationLabel}</p>
                    </GlassCard>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <GlassCard glow className="space-y-3 p-5 sm:p-6">
                      <Home className="h-5 w-5 text-cyan-400" />
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        {t("surface")}
                      </p>
                      <p className="text-xl font-semibold text-foreground">
                        {investment.surface} m²
                      </p>
                    </GlassCard>
                    <GlassCard glow className="space-y-3 p-5 sm:p-6">
                      <TrendingUp className="h-5 w-5 text-green-400" />
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        {t("return")}
                      </p>
                      <p className="text-xl font-semibold text-foreground">
                        {investment.expectedReturn.toFixed(2)}%
                      </p>
                    </GlassCard>
                    <GlassCard glow className="space-y-3 p-5 sm:p-6">
                      <Calendar className="h-5 w-5 text-blue-400" />
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        {t("built")}
                      </p>
                      <p className="text-xl font-semibold text-foreground">
                        {investment.details.yearBuilt}
                      </p>
                    </GlassCard>
                    <GlassCard glow className="space-y-3 p-5 sm:p-6">
                      <Home className="h-5 w-5 text-purple-400" />
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        {t("rooms")}
                      </p>
                      <p className="text-xl font-semibold text-foreground">
                        {investment.details.rooms}
                      </p>
                    </GlassCard>
                  </div>

                  <GlassCard glow className="space-y-4 p-5 sm:p-6">
                    <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
                      <span>{t("progress")}</span>
                      <span className="font-semibold text-cyan-400">
                        {investment.fundingProgress.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-600"
                        initial={{ width: 0 }}
                        animate={{ width: `${investment.fundingProgress}%` }}
                        transition={{ duration: 1, delay: 0.4 }}
                      />
                    </div>
                    {investment.saleEnd > 0 && (
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {saleClosed ? (
                            <span className="font-medium text-red-400">{t("saleEnded")}</span>
                          ) : daysLeft > 0 ? (
                            <span>{t("daysLeft", { count: daysLeft })}</span>
                          ) : hoursLeft > 0 ? (
                            <span className="font-medium text-orange-400">
                              {t("hoursLeft", { count: hoursLeft })}
                            </span>
                          ) : (
                            <span className="font-medium text-red-400">{t("endingSoon")}</span>
                          )}
                        </div>
                        <span>{t("saleEndDateLabel", { date: saleEndDateDisplay })}</span>
                      </div>
                    )}
                  </GlassCard>
                </div>

                <div className="flex h-full flex-col gap-6 pb-6">
                  <GlassCard glow className="space-y-4 p-5 sm:p-6">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                      <MapPin className="h-4 w-4 text-cyan-400" />
                      {t("description")}
                    </div>
                    <div
                      className={`text-sm leading-relaxed text-muted-foreground transition-all duration-300 ${!isDescriptionExpanded && descriptionShouldCollapse ? "max-h-40 overflow-hidden [mask-image:linear-gradient(to_bottom,rgba(0,0,0,1),rgba(0,0,0,0))]" : ""}`}
                    >
                      {investment.description}
                      {investment.details.longDescription && (
                        <span className={`${!isDescriptionExpanded ? "hidden" : "block"} whitespace-pre-wrap pt-3 text-sm text-muted-foreground`}>
                          {investment.details.longDescription}
                        </span>
                      )}
                    </div>
                    {descriptionShouldCollapse && (
                      <button
                        type="button"
                        onClick={() => setIsDescriptionExpanded((prev) => !prev)}
                        className="text-xs font-semibold uppercase tracking-wide text-cyan-400 transition-colors hover:text-cyan-300"
                      >
                        {isDescriptionExpanded ? t("viewLess") : t("viewMore")}
                      </button>
                    )}
                  </GlassCard>

                  {investment.details.features.length > 0 && (
                    <GlassCard glow className="space-y-4 p-5 sm:p-6">
                      <h3 className="text-xs uppercase tracking-wide text-muted-foreground">
                        {t("features")}
                      </h3>
                      <ul className="grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                        {investment.details.features.map((feature, index) => (
                          <li
                            key={`${feature}-${index}`}
                            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2"
                          >
                            <span className="h-2 w-2 rounded-full bg-cyan-400" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </GlassCard>
                  )}

                  <GlassCard glow className="space-y-4 p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-xs uppercase tracking-wide text-muted-foreground">
                          {t("contract")}
                        </h3>
                        <code className="mt-2 block text-xs text-muted-foreground break-all">
                          {investment.contractAddress}
                        </code>
                      </div>
                      <AnimatedButton
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(
                            `${BLOCK_EXPLORER_URL}/address/${investment.contractAddress}`,
                            "_blank"
                          )
                        }
                      >
                        <ExternalLink className="h-4 w-4" />
                      </AnimatedButton>
                    </div>
                  </GlassCard>

                  {success && (
                    <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-center text-sm font-semibold text-green-400">
                      {t("purchaseSuccess")}
                    </div>
                  )}
                  {error && (
                    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  {investment.sharesAvailable !== undefined &&
                    investment.totalShares !== undefined && (
                      <div
                        className={`rounded-2xl border p-4 text-center text-sm font-semibold ${
                          saleClosedWithoutSellout || soldOut
                            ? "border-yellow-500/50 bg-yellow-500/20 text-yellow-400"
                            : investment.sharesAvailable <= 10
                              ? "border-orange-500/50 bg-orange-500/20 text-orange-400"
                              : "border-cyan-500/50 bg-cyan-500/20 text-cyan-400"
                        }`}
                      >
                        {saleClosedWithoutSellout ? (
                          <span>{t("saleClosedBanner")}</span>
                        ) : soldOut ? (
                          <span>{t("soldOut")}</span>
                        ) : (
                          <span>
                            {t("sharesAvailable", {
                              available: investment.sharesAvailable,
                              total: investment.totalShares,
                            })}
                            {investment.sharesAvailable <= 10 && t("lowSharesWarning")}
                          </span>
                        )}
                      </div>
                    )}

                  <GlassCard glow className="flex flex-col gap-5 p-5 sm:p-6">
                    {canPurchase && (
                      <div className="space-y-3">
                        <label className="text-xs uppercase tracking-wide text-muted-foreground">
                          {t("quantityLabel")}
                        </label>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg font-bold transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={isBuying || isTxPending || quantity <= 1}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={investment.sharesAvailable}
                            value={quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 1;
                              setQuantity(
                                Math.min(investment.sharesAvailable, Math.max(1, val))
                              );
                            }}
                            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-xl font-semibold tracking-wider text-foreground focus:border-cyan-500 focus:outline-none"
                            disabled={isBuying || isTxPending}
                          />
                          <button
                            onClick={() =>
                              setQuantity(
                                Math.min(investment.sharesAvailable, quantity + 1)
                              )
                            }
                            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg font-bold transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={
                              isBuying || isTxPending || quantity >= investment.sharesAvailable
                            }
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-4">
                      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
                        <span>{t("pricePerShare")}</span>
                        <span className="font-semibold text-foreground">
                          {pricePerShareFormatted}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm md:text-base font-semibold text-foreground">
                        <span>{t("totalPrice")}</span>
                        <span className="text-xl md:text-2xl font-bold text-cyan-400">
                          {totalPriceFormatted}
                        </span>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        {t("totalPriceEth", { amount: totalPriceETH.toFixed(4) })}
                      </div>
                    </div>

                    <AnimatedButton
                      variant="primary"
                      size="lg"
                      className="h-12 md:h-14 w-full text-xs md:text-sm font-semibold uppercase tracking-wide"
                      onClick={handleInvest}
                      disabled={!canPurchase || isBuying || isTxPending || success}
                    >
                      {actionLabel}
                    </AnimatedButton>
                  </GlassCard>
                </div>
              </motion.div>
            </DialogContent>
          )}
        </AnimatePresence>
      </Dialog>
    </>
  );
}
