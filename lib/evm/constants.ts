/**
 * CantorFi Protocol - Constants
 * Base Sepolia Testnet
 */

import { baseSepolia } from 'viem/chains';

export const CHAIN = baseSepolia;
export const CHAIN_ID = 84532;
export const CHAIN_NAME = 'Base Sepolia';

// Contract Addresses (deployed 2026-02-01)
export const PROTOCOL_ADDRESS = '0xF38DfC53Fffe57EbBba5f83E16F7a53774650660' as const;
export const USDC_ADDRESS = '0x45f591C36B3506a881eD54638a9456607c2Eed84' as const;
export const FACTORY_ADDRESS = '0x10809d5E79C77D93c2cA9b75f2715FEEcC00282D' as const;
export const FEE_COLLECTOR_ADDRESS = '0xd1D803008EfFc980f57D88Ea7d7Ba15149614ce7' as const;
export const VAULT_IMPLEMENTATION_ADDRESS = '0x383fFE3a7e908240021747b5775b625B441a299e' as const;
export const PRICE_ORACLE_ADDRESS = '0xfEe66D72AF156E8b1e31F84e6e40a3cFb0CD9801' as const;
export const COLLATERAL_MANAGER_ADDRESS = '0x75896Ebb9719037E8cD3C8DDdA8c237E68C7FbB7' as const;
export const READER_ADDRESS = '0xF73C6E3c7eE0F1CF0A9dC0D37b7B0Ca42D25d8Ad' as const;

// Global CVT Token (shared across all vaults)
export const CVT_TOKEN_ADDRESS = '0x41f7f3F48Af49d68e24999F3FE5D831a64ac2DBF' as const;

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
