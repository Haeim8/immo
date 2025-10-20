"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { MapPin, TrendingUp, ExternalLink, Calendar, Home } from "lucide-react";
import { Investment } from "@/lib/types";
import GlassCard from "@/components/atoms/GlassCard";
import AnimatedButton from "@/components/atoms/AnimatedButton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { buyShareWithNFT } from "@/lib/solana/buy-share-with-nft";
import { PublicKey } from "@solana/web3.js";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { getIpfsUrl } from "@/lib/pinata/upload";
import { useTranslations, useCurrencyFormatter } from "@/components/providers/IntlProvider";

interface PropertyCardProps {
  investment: Investment;
}

export default function PropertyCard({ investment }: PropertyCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const { connection } = useConnection();
  const wallet = useWallet();
  const { setVisible } = useWalletModal();
  const t = useTranslations("propertyCard");
  const { formatCurrency } = useCurrencyFormatter();

  // Get image URL from IPFS if imageCid exists, otherwise use imageUrl
  const displayImageUrl = investment.imageCid
    ? getIpfsUrl(investment.imageCid)
    : investment.imageUrl || "/placeholder-property.jpg";
  const pricePerShareFormatted = formatCurrency(investment.priceUSD);
  const estimatedValueFormatted = formatCurrency(investment.estimatedValue);
  const totalPriceFormatted = formatCurrency(investment.priceUSD * quantity);
  const actionLabel =
    investment.fundingProgress >= 100
      ? t("soldOut")
      : isBuying
        ? t("processing", { quantity })
        : success
          ? t("purchased")
          : wallet.connected
            ? t("buyShares", { quantity })
            : t("connectWallet");

  const handleInvest = async () => {
    if (!wallet.connected || !wallet.publicKey) {
      setVisible(true);
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
      const propertyPDA = new PublicKey(investment.contractAddress);
      const purchasedShares: string[] = [];

      // Purchase shares one by one
      for (let i = 0; i < quantity; i++) {
        console.log(`🛒 Buying share ${i + 1}/${quantity} with NFT generation...`);

        const { transaction, shareNFTPDA, tokenId, nftSvgData } = await buyShareWithNFT(
          connection,
          propertyPDA,
          wallet.publicKey
        );

        console.log(`📤 Sending transaction ${i + 1}/${quantity} to blockchain...`);
        const signature = await wallet.sendTransaction(transaction, connection);

        console.log(`⏳ Confirming transaction ${i + 1}/${quantity}...`);
        await connection.confirmTransaction(signature, "confirmed");

        console.log(`✅ Share ${i + 1}/${quantity} purchased!`, { signature, shareNFTPDA, tokenId, nftSvgData });
        purchasedShares.push(signature);
      }

      setSuccess(true);
      console.log(`🎉 All ${quantity} shares purchased successfully!`, purchasedShares);

      // Close modal after 2 seconds
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setQuantity(1);
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
            <div className={`absolute top-4 right-4 px-3 py-1 rounded-full backdrop-blur-sm text-white text-sm font-semibold ${
              investment.fundingProgress >= 100
                ? "bg-yellow-500/90"
                : "bg-cyan-500/90"
            }`}>
              {investment.fundingProgress >= 100
                ? "SOLD OUT"
                : `${investment.fundingProgress.toFixed(0)}% Funded`}
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
            </div>
          </div>

          {/* Hover Glow Effect */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </motion.div>

      {/* Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-2xl border-white/10">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
                {investment.name}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Image */}
            <div className="relative h-80 w-full overflow-hidden rounded-2xl">
              <Image
                src={displayImageUrl}
                alt={investment.name}
                fill
                className="object-cover"
              />
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-cyan-400" />
                {t("description")}
              </h3>
              <p className="text-muted-foreground">{investment.description}</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <GlassCard className="p-4">
                <Home className="h-5 w-5 text-cyan-400 mb-2" />
                <p className="text-xs text-muted-foreground">{t("surface")}</p>
                <p className="text-2xl font-bold">{investment.surface}m²</p>
              </GlassCard>
              <GlassCard className="p-4">
                <TrendingUp className="h-5 w-5 text-green-400 mb-2" />
                <p className="text-xs text-muted-foreground">{t("return")}</p>
                <p className="text-2xl font-bold">{investment.expectedReturn.toFixed(2)}%</p>
              </GlassCard>
              <GlassCard className="p-4">
                <Calendar className="h-5 w-5 text-blue-400 mb-2" />
                <p className="text-xs text-muted-foreground">{t("built")}</p>
                <p className="text-2xl font-bold">{investment.details.yearBuilt}</p>
              </GlassCard>
              <GlassCard className="p-4">
                <Home className="h-5 w-5 text-purple-400 mb-2" />
                <p className="text-xs text-muted-foreground">{t("rooms")}</p>
                <p className="text-2xl font-bold">{investment.details.rooms}</p>
              </GlassCard>
            </div>

            {/* Features */}
            {investment.details.features.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">{t("features")}</h3>
                <div className="flex flex-wrap gap-2">
                  {investment.details.features.map((feature, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contract */}
            <GlassCard className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold mb-1">{t("contract")}</h3>
                  <code className="text-xs text-muted-foreground break-all">{investment.contractAddress}</code>
                </div>
                <AnimatedButton
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://explorer.solana.com/address/${investment.contractAddress}?cluster=devnet`, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                </AnimatedButton>
              </div>
            </GlassCard>

            {/* Success/Error Messages */}
            {success && (
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-center">
                {t("purchaseSuccess")}
              </div>
            )}
            {error && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Shares Available Info */}
            {investment.sharesAvailable !== undefined && investment.totalShares !== undefined && (
              <div className={`p-4 rounded-xl border text-center ${
                investment.fundingProgress >= 100
                  ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-400"
                  : investment.sharesAvailable <= 10
                    ? "bg-orange-500/20 border-orange-500/50 text-orange-400"
                    : "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
              }`}>
                {investment.fundingProgress >= 100 ? (
                  <span className="font-semibold">{t("soldOut")}</span>
                ) : (
                  <span className="font-semibold">
                    {t("sharesAvailable", {
                      available: investment.sharesAvailable,
                      total: investment.totalShares,
                    })}
                    {investment.sharesAvailable <= 10 && t("lowSharesWarning")}
                  </span>
                )}
              </div>
            )}

            {/* Quantity Selector */}
            {investment.fundingProgress < 100 && investment.sharesAvailable > 0 && (
              <div className="space-y-3">
                <label className="block text-sm font-medium">{t("quantityLabel")}</label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center font-bold transition-colors"
                    disabled={isBuying || quantity <= 1}
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
                      setQuantity(Math.min(investment.sharesAvailable, Math.max(1, val)));
                    }}
                    className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-center text-xl font-bold focus:border-cyan-500 focus:outline-none"
                    disabled={isBuying}
                  />
                  <button
                    onClick={() => setQuantity(Math.min(investment.sharesAvailable, quantity + 1))}
                    className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center font-bold transition-colors"
                    disabled={isBuying || quantity >= investment.sharesAvailable}
                  >
                    +
                  </button>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{t("pricePerShare")}</span>
                    <span className="font-semibold">{pricePerShareFormatted}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">{t("totalPrice")}</span>
                    <span className="text-2xl font-bold text-cyan-400">
                      {totalPriceFormatted}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <AnimatedButton
                variant="primary"
                size="lg"
                className="flex-1"
                onClick={handleInvest}
                disabled={isBuying || success || investment.fundingProgress >= 100}
              >
                {actionLabel}
              </AnimatedButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
