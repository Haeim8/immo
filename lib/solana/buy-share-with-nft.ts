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
  const { propertyName, shareNumber, totalShares, city, province, country, assetType, votingPower } = params;

  return `<svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#16213e;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="400" height="600" fill="url(#bg)"/>
  <text x="200" y="50" font-family="Arial" font-size="24" fill="#f5f5f5" text-anchor="middle" font-weight="bold">${assetType}</text>
  <text x="200" y="100" font-family="Arial" font-size="18" fill="#00d4ff" text-anchor="middle">${propertyName}</text>
  <text x="200" y="140" font-family="Arial" font-size="14" fill="#a0a0a0" text-anchor="middle">${city}, ${province}</text>
  <text x="200" y="160" font-family="Arial" font-size="14" fill="#a0a0a0" text-anchor="middle">${country}</text>
  <rect x="50" y="200" width="300" height="150" fill="#0f3460" rx="10"/>
  <text x="200" y="240" font-family="Arial" font-size="16" fill="#f5f5f5" text-anchor="middle">Share Number</text>
  <text x="200" y="280" font-family="Arial" font-size="48" fill="#00d4ff" text-anchor="middle" font-weight="bold">#${shareNumber}</text>
  <text x="200" y="320" font-family="Arial" font-size="14" fill="#a0a0a0" text-anchor="middle">of ${totalShares} shares</text>
  ${votingPower > 0 ? `<text x="200" y="400" font-family="Arial" font-size="14" fill="#00ff88" text-anchor="middle">🗳️ Voting Power: ${votingPower}</text>` : ''}
  <text x="200" y="550" font-family="Arial" font-size="12" fill="#666" text-anchor="middle">Powered by Solana</text>
</svg>`;
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
