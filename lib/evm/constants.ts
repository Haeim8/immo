/**
 * CantorFi Protocol - Constants
 * Base Sepolia Testnet
 */

import { baseSepolia } from 'viem/chains';

export const CHAIN = baseSepolia;
export const CHAIN_ID = 84532;
export const CHAIN_NAME = 'Base Sepolia';

// Contract Addresses (deployed 2025-12-15)
export const PROTOCOL_ADDRESS = '0x019A6562e7966Da17C1EE3ec4A3d0c79E079CeA5' as const;
export const USDC_ADDRESS = '0x45f591C36B3506a881eD54638a9456607c2Eed84' as const;
export const FACTORY_ADDRESS = '0x2079Cd6B84b91dd23dcD412bA260f205d64601DE' as const;
export const FEE_COLLECTOR_ADDRESS = '0x677674bA37100898dd51BEE1c09ad8b23d526513' as const;
export const VAULT_IMPLEMENTATION_ADDRESS = '0x2c597B9e5B0517F9EB2d5fCE489826661B71D787' as const;
export const PRICE_ORACLE_ADDRESS = '0xc77C80C64093c64a0E4f3a9096F54e55028A6D69' as const;
export const COLLATERAL_MANAGER_ADDRESS = '0x27d524D2f8f3373FF270F023941cdd1036175c49' as const;
export const READER_ADDRESS = '0x43160000C1Ef1FDe467F46ECB295BC1d3627C32E' as const;

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
