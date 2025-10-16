import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

// Program IDs - DEVNET
export const FACTORY_PROGRAM_ID = new PublicKey("H8S27aKztqdyCPZCPUvmAahSDBrTrw5ahCjQbJpzSECL");
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
  description: string;
  imageCid: string;
  longDescription: string;
  metadataUri: string;
  votingEnabled: boolean;
  totalDividendsDeposited: BN;
  totalDividendsClaimed: BN;
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
  description: string;
  imageCid: string; // IPFS CID
  longDescription: string; // Detailed description
  metadataUri: string; // URI to website or JSON metadata
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
