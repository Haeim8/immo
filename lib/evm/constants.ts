/**
 * EVM Contract Addresses and Constants
 * Base Sepolia Testnet Deployment
 */

import { baseSepolia } from 'viem/chains';

export const CHAIN = baseSepolia;

// Deployed contract addresses on Base Sepolia v2 (Proxy Pattern + OpenSea)
export const USCINFT_ADDRESS = '0xA083C9582F84370d73d808836B7BA785Ba63f65c' as const;
export const FACTORY_ADDRESS = '0x741b6692f19f64805ddC2e1DB4e724b12f77ff7a' as const;

// RPC Configuration
export const BASE_SEPOLIA_RPC = 'https://sepolia.base.org';

// Explorer
export const BLOCK_EXPLORER_URL = 'https://sepolia.basescan.org';

// ETH to USD estimate (for display purposes)
export const ETH_TO_USD_ESTIMATE = 3000;

// Bloc de déploiement du contrat Factory sur Base Sepolia
// Utilisé pour limiter la plage de recherche des événements
// Exact deployment block: 2025-11-07T17:14:22.000Z
export const FACTORY_DEPLOYMENT_BLOCK = 33383687n as const;
