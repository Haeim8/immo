import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

// Program IDs - DEVNET
export const FACTORY_PROGRAM_ID = new PublicKey("HZp9dtYNuCC7AUapf8FZmdU83S5UH8AU21ffbpTTXQ6J");
export const PROPERTY_PROGRAM_ID = new PublicKey("97eUkEnc8ycsVemeh65NEfh4P4nnPMSZReUG66fSe3Kr");

// Factory Account
export interface Factory {
  admin: PublicKey;
  treasury: PublicKey;
  propertyCount: BN;
  bump: number;
}

// Property Account
export interface Property {
  factory: PublicKey;
  propertyId: BN;
  assetType: string; // "real_estate", "vehicle", "business", "collectible"
  name: string;
  city: string;
  province: string;
  country: string;
  totalShares: BN;
  sharePrice: BN;
  sharesSold: BN;
  saleStart: BN;
  saleEnd: BN;
  isActive: boolean;
  surface: number;
  rooms: number;
  expectedReturn: number; // basis points (550 = 5.50%)
  propertyType: string;
  yearBuilt: number;
  imageCid: string; // IPFS CID for main image
  metadataCid: string; // IPFS CID for full property metadata JSON
  votingEnabled: boolean;
  totalDividendsDeposited: BN;
  totalDividendsClaimed: BN;
  proposalCount: BN;
  isLiquidated: boolean;
  liquidationAmount: BN;
  liquidationClaimed: BN;
  bump: number;
}

// ShareNFT Account
export interface ShareNFT {
  property: PublicKey;
  owner: PublicKey;
  tokenId: BN;
  mintTime: BN;
  dividendsClaimed: BN;
  nftImageUri: string;
  nftMetadataUri: string;
  votingPower: BN;
  bump: number;
  nftSvgData: string;
}

// Governance
export interface Proposal {
  property: PublicKey;
  proposalId: BN;
  title: string;
  description: string;
  creator: PublicKey;
  createdAt: BN;
  votingEndsAt: BN;
  yesVotes: BN;
  noVotes: BN;
  isActive: boolean;
  isExecuted: boolean;
  bump: number;
}

export interface Vote {
  proposal: PublicKey;
  voter: PublicKey;
  shareNft: PublicKey;
  voteChoice: boolean;
  votedAt: BN;
  bump: number;
}

// Property Stats (from property_contract)
export interface PropertyStats {
  property: PublicKey;
  totalInvestors: BN;
  totalVolume: BN;
  totalTransfers: BN;
  averageHoldTime: BN;
  bump: number;
}

// Transfer Record
export interface TransferRecord {
  shareNft: PublicKey;
  from: PublicKey;
  to: PublicKey;
  timestamp: BN;
  bump: number;
}

// Property Metadata
export interface PropertyMetadata {
  property: PublicKey;
  metadataKey: string;
  metadataValue: string;
  createdAt: BN;
  bump: number;
}

// Team Member
export interface TeamMember {
  factory: PublicKey;
  wallet: PublicKey;
  addedBy: PublicKey;
  addedAt: BN;
  isActive: boolean;
  bump: number;
}

// Frontend specific types
export interface PropertyDisplay extends Property {
  sharesAvailable: number;
  percentageFunded: number;
  isExpired: boolean;
  daysRemaining: number;
  sharePriceSOL: number;
  totalValue: number;
  isLiquidated: boolean;
}

export interface ShareNFTDisplay extends ShareNFT {
  propertyName: string;
  unclaimedDividends: number;
  propertyDetails?: Property;
}

// Transaction response types
export interface CreatePropertyParams {
  assetType: string; // "real_estate", "vehicle", "business", "collectible"
  name: string;
  city: string;
  province: string;
  country: string;
  totalShares: number;
  sharePrice: number; // in lamports
  saleDuration: number; // in seconds (ex: 30 * 24 * 60 * 60 = 30 days)
  surface: number; // in m²
  rooms: number;
  expectedReturn: number; // basis points (ex: 550 = 5.50%)
  propertyType: string; // "Résidentiel", "Commercial", etc.
  yearBuilt: number;
  imageCid: string; // IPFS CID for main image
  metadataCid: string; // IPFS CID for full property metadata JSON
  votingEnabled: boolean; // Enable voting for investors
}

export interface BuyShareResponse {
  signature: string;
  shareNFT: PublicKey;
  tokenId: number;
}

export interface ClaimDividendsResponse {
  signature: string;
  amount: number;
  shareNFT: PublicKey;
}
