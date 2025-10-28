/**
 * Common UI Types
 * Shared interfaces for frontend components
 */

export interface Investment {
  id: string;
  name: string;
  location: {
    city: string;
    province: string;
    country?: string;
  };
  priceUSD: number;
  priceETH?: number;
  estimatedValue: number;
  imageUrl?: string;
  imageCid?: string;
  description: string;
  longDescription?: string;
  type: string;
  surface: number;
  expectedReturn: number; // percentage
  fundingProgress: number; // 0-100
  sharesAvailable: number;
  totalShares: number;
  sharesSold: number;
  contractAddress: string;
  puzzlePriceWei?: string;
  saleStart: number; // Unix timestamp in seconds
  saleEnd: number; // Unix timestamp in seconds
  isActive: boolean;
  details: {
    yearBuilt: number;
    rooms: number;
    features: string[];
  };
}

export interface PortfolioInvestment {
  investmentId: string;
  amount: number;
  dividendsEarned: number;
  pendingDividends: number;
  purchaseDate: string;
  shareCount: number;
}

export interface PortfolioData {
  totalInvested: number;
  totalDividends: number;
  investments: PortfolioInvestment[];
}

export interface GlobalMetrics {
  totalProjectsFunded: number;
  totalValueDistributed: number;
  activeInvestors: number;
  blockchainExplorerUrl: string;
}
