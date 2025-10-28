/**
 * EVM Contract Addresses and Constants
 * Base Sepolia Testnet Deployment
 */

import { baseSepolia } from 'viem/chains';

export const CHAIN = baseSepolia;

// Deployed contract addresses on Base Sepolia
export const USCINFT_ADDRESS = '0xFA88bA8C299cAF14A4Ac52a589Ac3031Cb63C1f8' as const;
export const FACTORY_ADDRESS = '0x0BF94931d6c63EA092d91Ce7d67D46325B912349' as const;

// RPC Configuration
export const BASE_SEPOLIA_RPC = 'https://sepolia.base.org';

// Explorer
export const BLOCK_EXPLORER_URL = 'https://sepolia.basescan.org';

// ETH to USD estimate (for display purposes)
export const ETH_TO_USD_ESTIMATE = 3000;
