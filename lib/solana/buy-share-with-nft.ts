/**
 * Helper to buy a share with automatic SVG NFT generation
 * This wraps the buyShare instruction with on-chain SVG generation
 */

import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { buyShare, fetchProperty } from "./instructions";
import { Property } from "./types";

export interface BuyShareWithNFTResult {
  transaction: Transaction;
  shareNFTPDA: PublicKey;
  tokenId: number;
  nftSvgData: string;
}

/**
 * Generate SVG data for the NFT
 */
function generateNFTSvg(params: {
  propertyName: string;
  shareNumber: number;
  totalShares: number;
  city: string;
  province: string;
  country: string;
  assetType: string;
  votingPower: number;
}): string {
  const { shareNumber, totalShares, assetType } = params;

  // Compact SVG to fit in Solana instruction size limits (~400 chars)
  // NOTE: Full metadata (name, city, etc.) is stored in property account
  return `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0a192f"/><stop offset="1" stop-color="#112240"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/><text x="200" y="120" font-size="18" fill="#64ffda" text-anchor="middle" font-weight="bold">${assetType}</text><text x="200" y="220" font-size="72" fill="#64ffda" text-anchor="middle" font-weight="bold">#${shareNumber}</text><text x="200" y="260" font-size="16" fill="#8892b0" text-anchor="middle">/ ${totalShares}</text></svg>`;
}

/**
 * Buy a share with automatic SVG NFT generation
 *
 * This function:
 * 1. Fetches the property data
 * 2. Generates SVG NFT data
 * 3. Creates the buy share transaction with the SVG data
 */
export async function buyShareWithNFT(
  connection: Connection,
  propertyPDA: PublicKey,
  buyer: PublicKey
): Promise<BuyShareWithNFTResult> {
  console.log("🎨 Starting SVG NFT generation for share purchase...");

  // 1. Fetch property data
  const property = await fetchProperty(connection, propertyPDA);
  if (!property) {
    throw new Error("Property not found");
  }

  const tokenId = property.sharesSold.toNumber();

  console.log(`📊 Property: ${property.name}`);
  console.log(`🎟️ Share #${tokenId} of ${property.totalShares.toNumber()}`);

  // 2. Generate SVG NFT data
  console.log("🖼️ Generating SVG NFT data...");
  const nftSvgData = generateNFTSvg({
    propertyName: property.name,
    shareNumber: tokenId,
    totalShares: property.totalShares.toNumber(),
    city: property.city,
    province: property.province,
    country: property.country,
    assetType: property.assetType,
    votingPower: property.votingEnabled ? 1 : 0,
  });

  // 3. Create buy share transaction
  console.log("🔗 Creating buy share transaction...");
  const { transaction, shareNFTPDA } = await buyShare(
    connection,
    propertyPDA,
    buyer,
    nftSvgData
  );

  console.log("✅ SVG NFT generated and transaction ready!");

  return {
    transaction,
    shareNFTPDA,
    tokenId,
    nftSvgData,
  };
}
