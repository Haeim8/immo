export interface Investment {
  id: string;
  name: string;
  location: {
    city: string;
    province: string;
  };
  priceUSD: number;
  estimatedValue: number;
  imageUrl: string;
  imageCid?: string; // IPFS CID from Pinata (optional for backward compatibility)
  description: string;
  type: string;
  surface: number;
  expectedReturn: number;
  fundingProgress: number;
  sharesAvailable?: number; // Shares available for purchase
  totalShares?: number; // Total shares
  sharesSold?: number; // Shares already sold
  contractAddress: string;
  details: {
    yearBuilt: number;
    rooms: number;
    features: string[];
  };
}

export interface Portfolio {
  totalInvested: number;
  totalDividends: number;
  investments: {
    investmentId: string;
    amount: number;
    purchaseDate: string;
    dividendsEarned: number;
    pendingDividends: number;
  }[];
}

export const mockInvestments: Investment[] = [
  {
    id: "1",
    name: "Résidence Les Jardins",
    location: {
      city: "Paris",
      province: "Île-de-France",
    },
    priceUSD: 250000,
    estimatedValue: 280000,
    imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
    description: "Appartement moderne dans le 15ème arrondissement avec vue sur la Tour Eiffel",
    type: "Résidentiel",
    surface: 85,
    expectedReturn: 4.5,
    fundingProgress: 75,
    contractAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    details: {
      yearBuilt: 2020,
      rooms: 3,
      features: ["Parking", "Balcon", "Ascenseur", "Cave"],
    },
  },
  {
    id: "2",
    name: "Immeuble Commerce Lyon",
    location: {
      city: "Lyon",
      province: "Auvergne-Rhône-Alpes",
    },
    priceUSD: 450000,
    estimatedValue: 490000,
    imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800",
    description: "Immeuble commercial situé au centre-ville, locataires établis",
    type: "Commercial",
    surface: 200,
    expectedReturn: 5.2,
    fundingProgress: 90,
    contractAddress: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
    details: {
      yearBuilt: 2015,
      rooms: 8,
      features: ["Climatisation", "Fibre optique", "Parking privé"],
    },
  },
  {
    id: "3",
    name: "Villa Méditerranée",
    location: {
      city: "Nice",
      province: "Provence-Alpes-Côte d'Azur",
    },
    priceUSD: 850000,
    estimatedValue: 920000,
    imageUrl: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800",
    description: "Villa de luxe avec vue mer panoramique",
    type: "Résidentiel Premium",
    surface: 250,
    expectedReturn: 3.8,
    fundingProgress: 45,
    contractAddress: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    details: {
      yearBuilt: 2022,
      rooms: 6,
      features: ["Piscine", "Jardin", "Garage 2 places", "Domotique"],
    },
  },
  {
    id: "4",
    name: "Résidence Étudiante Bordeaux",
    location: {
      city: "Bordeaux",
      province: "Nouvelle-Aquitaine",
    },
    priceUSD: 320000,
    estimatedValue: 350000,
    imageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
    description: "Résidence étudiante proche universités, rendement élevé",
    type: "Résidentiel",
    surface: 180,
    expectedReturn: 6.2,
    fundingProgress: 100,
    contractAddress: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
    details: {
      yearBuilt: 2019,
      rooms: 15,
      features: ["Laverie", "Salle commune", "Fibre", "Sécurité 24/7"],
    },
  },
];

export const mockPortfolio: Portfolio = {
  totalInvested: 125000,
  totalDividends: 8750,
  investments: [
    {
      investmentId: "1",
      amount: 50000,
      purchaseDate: "2024-01-15",
      dividendsEarned: 4500,
      pendingDividends: 375,
    },
    {
      investmentId: "4",
      amount: 75000,
      purchaseDate: "2024-03-20",
      dividendsEarned: 4250,
      pendingDividends: 465,
    },
  ],
};

export const mockMetrics = {
  totalProjectsFunded: 12,
  totalValueDistributed: 2450000,
  activeInvestors: 567,
  blockchainExplorerUrl: "https://etherscan.io",
};

export interface LeaderboardEntry {
  rank: number;
  address: string;
  totalInvested: number;
  totalDividends: number;
  propertiesOwned: number;
  monthlyChange: number;
}

export const mockLeaderboard: LeaderboardEntry[] = [
  {
    rank: 1,
    address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    totalInvested: 2450000,
    totalDividends: 184500,
    propertiesOwned: 8,
    monthlyChange: 12.5,
  },
  {
    rank: 2,
    address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
    totalInvested: 1890000,
    totalDividends: 141750,
    propertiesOwned: 6,
    monthlyChange: 8.3,
  },
  {
    rank: 3,
    address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    totalInvested: 1450000,
    totalDividends: 108750,
    propertiesOwned: 5,
    monthlyChange: -2.1,
  },
  {
    rank: 4,
    address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
    totalInvested: 980000,
    totalDividends: 73500,
    propertiesOwned: 4,
    monthlyChange: 15.7,
  },
  {
    rank: 5,
    address: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6",
    totalInvested: 750000,
    totalDividends: 56250,
    propertiesOwned: 3,
    monthlyChange: 5.2,
  },
];

export interface PropertyPerformance {
  id: string;
  name: string;
  city: string;
  country: string;
  totalInvestors: number;
  totalDividendsDistributed: number;
  averageReturn: number;
  monthlyReturn: number;
  rank: number;
}

export const mockPropertyPerformance: PropertyPerformance[] = [
  {
    id: "4",
    name: "Résidence Étudiante Bordeaux",
    city: "Bordeaux",
    country: "France",
    totalInvestors: 45,
    totalDividendsDistributed: 124500,
    averageReturn: 6.2,
    monthlyReturn: 0.52,
    rank: 1,
  },
  {
    id: "2",
    name: "Immeuble Commerce Lyon",
    city: "Lyon",
    country: "France",
    totalInvestors: 38,
    totalDividendsDistributed: 98750,
    averageReturn: 5.2,
    monthlyReturn: 0.43,
    rank: 2,
  },
  {
    id: "1",
    name: "Résidence Les Jardins",
    city: "Paris",
    country: "France",
    totalInvestors: 52,
    totalDividendsDistributed: 87500,
    averageReturn: 4.5,
    monthlyReturn: 0.38,
    rank: 3,
  },
  {
    id: "3",
    name: "Villa Méditerranée",
    city: "Nice",
    country: "France",
    totalInvestors: 28,
    totalDividendsDistributed: 65800,
    averageReturn: 3.8,
    monthlyReturn: 0.32,
    rank: 4,
  },
];
