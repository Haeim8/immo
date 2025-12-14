/**
 * CantorFi Protocol - Constants
 * Base Sepolia Testnet
 */

import { baseSepolia } from 'viem/chains';

export const CHAIN = baseSepolia;
export const CHAIN_ID = 84532;
export const CHAIN_NAME = 'Base Sepolia';

// Contract Addresses (deployed 2025-12-14)
export const PROTOCOL_ADDRESS = '0x6b6F54EF45A2c2bcbED9B7070E37082b78FADE57' as const;
export const USDC_ADDRESS = '0x45f591C36B3506a881eD54638a9456607c2Eed84' as const;
export const FACTORY_ADDRESS = '0x0B5acAD1fb27FbF87C9e307dE15FC840011d0C51' as const;
export const FEE_COLLECTOR_ADDRESS = '0x0111a3e4A9c25F677C1a49B60664b5cDbbD75B63' as const;
export const VAULT_IMPLEMENTATION_ADDRESS = '0x2da321bB07B1eCB7FA6FB81c376375627D194821' as const;
export const PRICE_ORACLE_ADDRESS = '0xd79d53a623660b598b1349a090Ea364A12Fb51E4' as const;
export const COLLATERAL_MANAGER_ADDRESS = '0x450e0CDF04521260857301225Ea6Ec812E51C0b7' as const;
export const READER_ADDRESS = '0x595294dF1Ac2a60E954CBE421d1628077865bc07' as const;

// Global CVT Token (shared across all vaults)
export const CVT_TOKEN_ADDRESS = '0x4A539C79C9cB592F545Bb5b09296929a46898dfc' as const;

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
