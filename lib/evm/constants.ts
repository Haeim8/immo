/**
 * CantorFi Protocol - Constants
 * Base Sepolia Testnet
 */

import { baseSepolia } from 'viem/chains';

export const CHAIN = baseSepolia;
export const CHAIN_ID = 84532;
export const CHAIN_NAME = 'Base Sepolia';

// Contract Addresses (deployed 2025-12-14 with global CVT)
export const PROTOCOL_ADDRESS = '0x471aB7d398dfD0958Cc8be0fFF1B4B9DCe5658e7' as const;
export const USDC_ADDRESS = '0x45f591C36B3506a881eD54638a9456607c2Eed84' as const;
export const FACTORY_ADDRESS = '0x749478BEF2FF373eb689B97E0C1F714eeEe1e5B8' as const;
export const FEE_COLLECTOR_ADDRESS = '0xE443F7Dd56961deBE0a99eCcD1f065790Efe44EE' as const;
export const VAULT_IMPLEMENTATION_ADDRESS = '0x08279b996C6dc448Cc161089DEaC16846035b77d' as const;
export const PRICE_ORACLE_ADDRESS = '0xB1708B155724b3CCa64E19467f339727F0cB3607' as const;
export const COLLATERAL_MANAGER_ADDRESS = '0x7546F4EcdcA6b7DA5873f8812D11f1a0157A5c6C' as const;
export const READER_ADDRESS = '0xF65699EF3473A002645d19A44cC39E6e1D94168B' as const;

// Global CVT Token (shared across all vaults)
export const CVT_TOKEN_ADDRESS = '0x966F3b781A8a1A523bBBD5081fa784e72155A76e' as const;

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
