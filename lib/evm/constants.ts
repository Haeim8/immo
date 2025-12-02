/**
 * CantorFi Protocol - Constants
 * Base Sepolia Testnet
 */

import { baseSepolia } from 'viem/chains';

export const CHAIN = baseSepolia;
export const CHAIN_ID = 84532;
export const CHAIN_NAME = 'Base Sepolia';

// Contract Addresses
export const PROTOCOL_ADDRESS = '0x3e883B420440315b07665ACb246e2262CF0747EF' as const;
export const USDC_ADDRESS = '0x45f591C36B3506a881eD54638a9456607c2Eed84' as const;
export const FACTORY_ADDRESS = '0x4b2F9C4Eb9eFF88Db3a502D9bB8C6aE0cBEFd3C8' as const;
export const FEE_COLLECTOR_ADDRESS = '0x188fDa1eD80335bdC4685E57E7C151c5AA5F45A6' as const;
export const VAULT_IMPLEMENTATION_ADDRESS = '0x9780adB3A22A5124C4e11867502B87A9bb9D5B6a' as const;
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
