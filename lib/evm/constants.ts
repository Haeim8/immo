/**
 * EVM Contract Addresses and Constants
 * Base Sepolia Testnet Deployment
 */

import { baseSepolia } from 'viem/chains';

export const CHAIN = baseSepolia;

// Deployed contract addresses on Base Sepolia v2 (Proxy Pattern + OpenSea)
export const USCINFT_ADDRESS = '0x2D2E411334f796dE445fD24aF64CaF4118D7551c' as const;
export const FACTORY_ADDRESS = '0x1f03d4D72c23B226DF330Bd8D647253FEc4574FC' as const;

// RPC Configuration
export const BASE_SEPOLIA_RPC = 'https://sepolia.base.org';

// Explorer
export const BLOCK_EXPLORER_URL = 'https://sepolia.basescan.org';

// ETH to USD estimate (for display purposes)
export const ETH_TO_USD_ESTIMATE = 3000;

// Bloc de déploiement du contrat Factory sur Base Sepolia
// Utilisé pour limiter la plage de recherche des événements
// Updated for new factory deployment (2025-01-07)
export const FACTORY_DEPLOYMENT_BLOCK = 20000000n as const;
