/**
 * Solana Data Adapters
 * Convert blockchain data to UI-friendly formats
 */

import { PublicKey, Connection } from "@solana/web3.js";
import { Property, ShareNFT } from "./types";
import { Investment, PortfolioData, GlobalMetrics, PortfolioInvestment } from "../types";
import { lamportsToSOL } from "./instructions";
import { fetchPropertyMetadata, PropertyMetadata } from "../pinata/metadata";

const SOL_TO_USD_ESTIMATE = 150; // Rough estimate for display purposes

/**
 * Convert Property onchain data to Investment UI format
 */
export function propertyToInvestment(
  property: { publicKey: PublicKey; account: Property },
  metadata?: PropertyMetadata
): Investment {
  const totalShares = property.account.totalShares?.toNumber ? property.account.totalShares.toNumber() : 0;
  const sharesSold = property.account.sharesSold?.toNumber ? property.account.sharesSold.toNumber() : 0;
  const sharesAvailable = totalShares - sharesSold;
  const sharePrice = property.account.sharePrice?.toNumber ? lamportsToSOL(property.account.sharePrice.toNumber()) : 0;

  return {
    id: property.account.propertyId.toString(),
    name: property.account.name,
    location: {
      city: property.account.city,
      province: property.account.province,
      country: property.account.country,
    },
    priceUSD: sharePrice * SOL_TO_USD_ESTIMATE,
    estimatedValue: sharePrice * totalShares * SOL_TO_USD_ESTIMATE,
    imageCid: property.account.imageCid || undefined,
    imageUrl: metadata?.image ? metadata.image.replace("ipfs://", "") : undefined,
    description: metadata?.description || property.account.name,
    longDescription: metadata?.longDescription,
    type: property.account.propertyType,
    surface: property.account.surface,
    expectedReturn: property.account.expectedReturn / 100, // basis points to percentage
    fundingProgress: totalShares > 0 ? (sharesSold / totalShares) * 100 : 0,
    sharesAvailable,
    totalShares,
    sharesSold,
    contractAddress: property.publicKey.toBase58(),
    details: {
      yearBuilt: property.account.yearBuilt,
      rooms: property.account.rooms,
      features: metadata?.features || [],
    },
  };
}

/**
 * Enrich property with metadata from IPFS
 */
export async function enrichWithMetadata(
  property: { publicKey: PublicKey; account: Property }
): Promise<Investment> {
  try {
    const metadata = property.account.metadataCid
      ? await fetchPropertyMetadata(property.account.metadataCid)
      : undefined;

    return propertyToInvestment(property, metadata);
  } catch (error) {
    console.error("Failed to fetch metadata for property:", property.publicKey.toBase58(), error);
    // Return investment without metadata on error
    return propertyToInvestment(property);
  }
}

/**
 * Calculate global platform metrics from properties
 */
export function calculateGlobalMetrics(
  properties: Array<{ publicKey: PublicKey; account: Property }>
): GlobalMetrics {
  const totalProjectsFunded = properties.length;

  const totalValueDistributed = properties.reduce((sum, property) => {
    try {
      const dividends = property.account.totalDividendsClaimed?.toNumber ? lamportsToSOL(property.account.totalDividendsClaimed.toNumber()) : 0;
      return sum + dividends * SOL_TO_USD_ESTIMATE;
    } catch (e) {
      return sum;
    }
  }, 0);

  // Count unique investors (approximate - would need to aggregate all ShareNFT owners)
  const activeInvestors = properties.reduce((sum, property) => {
    try {
      return sum + (property.account.sharesSold?.toNumber ? property.account.sharesSold.toNumber() : 0);
    } catch (e) {
      return sum;
    }
  }, 0);

  return {
    totalProjectsFunded,
    totalValueDistributed,
    activeInvestors,
    blockchainExplorerUrl: "https://explorer.solana.com/?cluster=devnet",
  };
}

/**
 * Convert user's ShareNFTs to portfolio data
 */
export async function shareNFTsToPortfolio(
  shareNFTs: Array<{ publicKey: PublicKey; account: ShareNFT }>,
  properties: Array<{ publicKey: PublicKey; account: Property }>
): Promise<PortfolioData> {
  const investments: PortfolioInvestment[] = [];
  let totalInvested = 0;
  let totalDividends = 0;

  for (const nft of shareNFTs) {
    try {
      const property = properties.find((p) =>
        p.publicKey.equals(nft.account.property)
      );

      if (!property?.account) continue;

      const sharePrice = property.account.sharePrice?.toNumber ? lamportsToSOL(property.account.sharePrice.toNumber()) : 0;
      const amount = sharePrice * SOL_TO_USD_ESTIMATE;
      const dividendsEarned = nft.account.dividendsClaimed?.toNumber ? lamportsToSOL(nft.account.dividendsClaimed.toNumber()) * SOL_TO_USD_ESTIMATE : 0;

      // Calculate pending dividends (simplified - would need more complex calculation)
      const totalShares = property.account.totalShares?.toNumber ? property.account.totalShares.toNumber() : 1;
      const totalDividendsPerShare = totalShares > 0 && property.account.totalDividendsDeposited?.toNumber
        ? lamportsToSOL(property.account.totalDividendsDeposited.toNumber()) / totalShares
        : 0;
      const claimedDividendsPerShare = nft.account.dividendsClaimed?.toNumber ? lamportsToSOL(nft.account.dividendsClaimed.toNumber()) : 0;
      const pendingDividends = Math.max(0, (totalDividendsPerShare - claimedDividendsPerShare) * SOL_TO_USD_ESTIMATE);

      const mintTime = nft.account.mintTime?.toNumber ? nft.account.mintTime.toNumber() : 0;
      investments.push({
        investmentId: property.account.propertyId.toString(),
        amount,
        dividendsEarned,
        pendingDividends,
        purchaseDate: new Date(mintTime * 1000).toISOString(),
        shareCount: 1,
      });

      totalInvested += amount;
      totalDividends += dividendsEarned;
    } catch (e) {
      console.error("Error processing NFT for portfolio:", e);
      continue;
    }
  }

  return {
    totalInvested,
    totalDividends,
    investments,
  };
}

/**
 * Get property by ID from list
 */
export function getPropertyById(
  properties: Array<{ publicKey: PublicKey; account: Property }>,
  propertyId: string
): { publicKey: PublicKey; account: Property } | undefined {
  return properties.find((p) => p.account.propertyId.toString() === propertyId);
}
