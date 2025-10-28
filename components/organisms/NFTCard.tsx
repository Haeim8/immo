"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useMemo } from "react";
import { Investment } from "@/lib/types";
import { getNFTMetadataUrl } from "@/lib/nft/metadata";
import GlassCard from "@/components/atoms/GlassCard";
import { ExternalLink, TrendingUp, Calendar, Hash } from "lucide-react";
import { getIpfsUrl } from "@/lib/pinata/upload";

type NumericLike = bigint | number;

export interface PuzzleNFTCardData {
  tokenId: NumericLike;
  metadataCid: string;
  imageCid?: string;
  mintedAt?: number; // Unix timestamp (seconds)
  votingPower?: number;
}

interface NFTCardProps {
  shareNFT: PuzzleNFTCardData;
  property: Investment;
  index: number;
}

const toNumber = (value: NumericLike | undefined): number => {
  if (value === undefined) return 0;
  return typeof value === "bigint" ? Number(value) : value;
};

const normalizeCid = (value?: string): string | null => {
  if (!value) return null;
  if (value.startsWith("ipfs://")) {
    return value.replace("ipfs://", "");
  }
  return value;
};

export default function NFTCard({ shareNFT, property, index }: NFTCardProps) {
  const tokenId = toNumber(shareNFT.tokenId);
  const totalShares = property.totalShares ?? 0;
  const mintedAt = shareNFT.mintedAt ? new Date(Number(shareNFT.mintedAt) * 1000) : null;
  const votingPower = shareNFT.votingPower ?? 0;
  const expectedReturn = property.expectedReturn;

  const nftImageUrl = useMemo(() => {
    const cid = normalizeCid(shareNFT.imageCid);
    return cid ? getIpfsUrl(cid) : "";
  }, [shareNFT.imageCid]);

  const metadataUrl = useMemo(() => {
    const cid = normalizeCid(shareNFT.metadataCid);
    return cid ? getNFTMetadataUrl(cid) : undefined;
  }, [shareNFT.metadataCid]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <GlassCard hover className="overflow-hidden group">
        {/* NFT Image */}
        <div className="relative aspect-square overflow-hidden rounded-t-xl">
          {nftImageUrl ? (
            <Image
              src={nftImageUrl}
              alt={`${property.name} - Share #${tokenId}`}
              fill
              sizes="(max-width: 768px) 100vw, 300px"
              className="object-cover transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <Hash className="h-16 w-16 text-white/20" />
            </div>
          )}

          {/* Share Number Badge */}
          <div className="absolute top-4 right-4 px-3 py-1 rounded-lg bg-cyan-500/90 backdrop-blur-sm">
            <span className="text-white font-bold text-sm">
              #{tokenId} / {totalShares}
            </span>
          </div>

          {/* Voting Badge */}
          {votingPower > 0 && (
            <div className="absolute top-4 left-4 px-3 py-1 rounded-lg bg-purple-500/90 backdrop-blur-sm">
              <span className="text-white font-semibold text-sm">
                🗳️ Vote: {votingPower}
              </span>
            </div>
          )}
        </div>

        {/* NFT Details */}
        <div className="p-6 space-y-4">
          {/* Property Name */}
          <div>
            <h3 className="text-xl font-bold text-cyan-400 mb-1">
              {property.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              📍 {property.location.city}, {property.location.country ?? property.location.province}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-cyan-400" />
              <div>
                <p className="text-xs text-muted-foreground">Minted</p>
                <p className="text-sm font-semibold">
                  {mintedAt ? mintedAt.toLocaleDateString() : "—"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <div>
                <p className="text-xs text-muted-foreground">Expected Return</p>
                <p className="text-sm font-semibold text-green-400">
                  {expectedReturn.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 text-xs rounded-full bg-white/5 border border-white/10">
              {property.surface} m²
            </span>
            <span className="px-2 py-1 text-xs rounded-full bg-white/5 border border-white/10">
              {property.details.rooms} rooms
            </span>
            <span className="px-2 py-1 text-xs rounded-full bg-white/5 border border-white/10">
              {property.type}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {metadataUrl && (
              <a
                href={metadataUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-400 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Metadata
              </a>
            )}
            <button className="flex-1 px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-purple-400 font-semibold text-sm transition-colors">
              Claim Dividends
            </button>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
