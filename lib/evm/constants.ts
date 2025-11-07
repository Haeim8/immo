/**
 * EVM Contract Addresses and Constants
 * Base Sepolia Testnet Deployment
 */

import { baseSepolia } from 'viem/chains';

export const CHAIN = baseSepolia;

// Deployed contract addresses on Base Sepolia v2 (Proxy Pattern + OpenSea)
export const USCINFT_ADDRESS = '0xF0d2b21e3aD9C7f6021Dacc24B0F1bDb4FE5CbD9' as const;
export const FACTORY_ADDRESS = '0xf44C9E702E36234cD1D72760D88861F257Ed1c35' as const;

// RPC Configuration
export const BASE_SEPOLIA_RPC = 'https://sepolia.base.org';

// Explorer
export const BLOCK_EXPLORER_URL = 'https://sepolia.basescan.org';

// ETH to USD estimate (for display purposes)
export const ETH_TO_USD_ESTIMATE = 3000;

// Bloc de déploiement du contrat Factory sur Base Sepolia
// Utilisé pour limiter la plage de recherche des événements
// Exact deployment block: 2025-11-06T04:14:46.000Z
export const FACTORY_DEPLOYMENT_BLOCK = 33317099n as const;
