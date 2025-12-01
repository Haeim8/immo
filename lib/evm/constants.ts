/**
 * CantorFi Protocol - Constants
 * Base Sepolia Testnet
 */

import { baseSepolia } from 'viem/chains';

export const CHAIN = baseSepolia;
export const CHAIN_ID = 84532;
export const CHAIN_NAME = 'Base Sepolia';

// Contract Addresses
export const PROTOCOL_ADDRESS = '0x13AF08E9C8246dB51681A2f37086CE8A4a247493' as const;
export const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;
export const FACTORY_ADDRESS = '0x06A48c88dfd4Ce95CE412d4e9d816484c94B758F' as const;
export const FEE_COLLECTOR_ADDRESS = '0xD7bbF421De7128c85671D35C3187c9FCe65f71f3' as const;
export const VAULT_IMPLEMENTATION_ADDRESS = '0x0c80bFbaA80bD77533dCEaFb31481A02fd4c1690' as const;
export const PRICE_ORACLE_ADDRESS = '0x8d2e5019F48d3F6AE662525aCed5e934f71d1ACf' as const;
export const COLLATERAL_MANAGER_ADDRESS = '0xe729b6262d10798a6a0533C7C8424e804Eb3f2bF' as const;
export const READER_ADDRESS = '0x4972FCF414187bCaCc3DA7D438C448C2e582587E' as const;

// Legacy alias
export const CANTORFINFT_ADDRESS = PROTOCOL_ADDRESS;

// RPC
export const BASE_SEPOLIA_RPC = 'https://sepolia.base.org';

// Block Explorer
export const BLOCK_EXPLORER_URL = 'https://sepolia.basescan.org';

// Deployment
export const DEPLOYMENT_BLOCK = BigInt(34182304);
export const FACTORY_DEPLOYMENT_BLOCK = DEPLOYMENT_BLOCK;

// Token decimals
export const USDC_DECIMALS = 6;
export const ETH_DECIMALS = 18;

// ETH price estimate
export const ETH_TO_USD_ESTIMATE = 3000;

// Setup fee (1% = 100 bps)
export const SETUP_FEE_BPS = 100;
