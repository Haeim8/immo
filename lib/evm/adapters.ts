/**
 * EVM Data Adapters
 * Convert blockchain data to UI-friendly formats
 */

import { formatEther } from 'viem';
import { Investment, PortfolioData, GlobalMetrics, PortfolioInvestment } from '../types';
import { fetchPropertyMetadata, PropertyMetadata } from '../pinata/metadata';
import { ETH_TO_USD_ESTIMATE, BLOCK_EXPLORER_URL, FACTORY_ADDRESS } from './constants';

// Type definitions matching smart contract structs
export interface PlaceInfo {
  placeId: bigint;
  assetType: string;
  name: string;
  city: string;
  province: string;
  country: string;
  totalPuzzles: bigint;
  puzzlePrice: bigint;
  puzzlesSold: bigint;
  saleStart: bigint;
  saleEnd: bigint;
  isActive: boolean;
  surface: number;
  rooms: number;
  expectedReturn: number;
  placeType: string;
  yearBuilt: number;
  imageCid: string;
  metadataCid: string;
  votingEnabled: boolean;
}

export interface PlaceData {
  address: `0x${string}`;
  info: PlaceInfo;
}

/**
 * Convert Place onchain data to Investment UI format
 */
export function placeToInvestment(
  place: PlaceData,
  metadata?: PropertyMetadata
): Investment {
  const totalPuzzles = Number(place.info.totalPuzzles);
  const puzzlesSold = Number(place.info.puzzlesSold);
  const puzzlesAvailable = totalPuzzles - puzzlesSold;
  const puzzlePrice = parseFloat(formatEther(place.info.puzzlePrice));
  const puzzlePriceWei = place.info.puzzlePrice.toString();

  return {
    id: place.info.placeId.toString(),
    name: place.info.name,
    location: {
      city: place.info.city,
      province: place.info.province,
      country: place.info.country,
    },
    priceUSD: puzzlePrice * ETH_TO_USD_ESTIMATE,
    priceETH: puzzlePrice,
    estimatedValue: puzzlePrice * totalPuzzles * ETH_TO_USD_ESTIMATE,
    imageCid: place.info.imageCid || undefined,
    imageUrl: metadata?.image ? metadata.image.replace("ipfs://", "") : undefined,
    description: metadata?.description || place.info.name,
    longDescription: metadata?.longDescription,
    type: place.info.placeType,
    surface: place.info.surface,
    expectedReturn: place.info.expectedReturn / 100, // basis points to percentage
    fundingProgress: totalPuzzles > 0 ? (puzzlesSold / totalPuzzles) * 100 : 0,
    sharesAvailable: puzzlesAvailable,
    totalShares: totalPuzzles,
    sharesSold: puzzlesSold,
    contractAddress: place.address,
    puzzlePriceWei,
    saleStart: Number(place.info.saleStart),
    saleEnd: Number(place.info.saleEnd),
    isActive: place.info.isActive,
    details: {
      yearBuilt: place.info.yearBuilt,
      rooms: place.info.rooms,
      features: metadata?.features || [],
    },
  };
}

/**
 * Enrich place with metadata from IPFS
 */
export async function enrichWithMetadata(
  place: PlaceData
): Promise<Investment> {
  try {
    const metadata = place.info.metadataCid
      ? await fetchPropertyMetadata(place.info.metadataCid)
      : undefined;

    return placeToInvestment(place, metadata);
  } catch (error) {
    console.error("Failed to fetch metadata for place:", place.address, error);
    return placeToInvestment(place);
  }
}

/**
 * Calculate global platform metrics from places
 */
export function calculateGlobalMetrics(
  places: PlaceData[]
): GlobalMetrics {
  const totalProjectsFunded = places.length;

  // TODO: Implement totalRewardsDeposited reading from contracts
  const totalValueDistributed = 0;

  const activeInvestors = places.reduce((sum, place) => {
    return sum + Number(place.info.puzzlesSold);
  }, 0);

  return {
    totalProjectsFunded,
    totalValueDistributed,
    activeInvestors,
    blockchainExplorerUrl: `${BLOCK_EXPLORER_URL}/address/${FACTORY_ADDRESS}`,
  };
}

/**
 * Convert user's Puzzle NFTs to portfolio data
 */
export async function nftsToPortfolio(
  nfts: Array<{ tokenId: bigint; placeAddress: `0x${string}` }>,
  places: PlaceData[]
): Promise<PortfolioData> {
  const investments: PortfolioInvestment[] = [];
  let totalInvested = 0;
  let totalDividends = 0;

  for (const nft of nfts) {
    try {
      const place = places.find((p) => p.address.toLowerCase() === nft.placeAddress.toLowerCase());
      if (!place) continue;

      const puzzlePrice = parseFloat(formatEther(place.info.puzzlePrice));
      const amount = puzzlePrice * ETH_TO_USD_ESTIMATE;

      // TODO: Implement rewards reading from contract
      const dividendsEarned = 0;
      const pendingDividends = 0;

      investments.push({
        investmentId: place.info.placeId.toString(),
        amount,
        dividendsEarned,
        pendingDividends,
        purchaseDate: new Date().toISOString(), // TODO: Get from blockchain event
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
 * Get place by ID from list
 */
export function getPlaceById(
  places: PlaceData[],
  placeId: string
): PlaceData | undefined {
  return places.find((p) => p.info.placeId.toString() === placeId);
}
