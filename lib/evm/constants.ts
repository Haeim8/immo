/**
 * CantorFi Protocol - Constants
 * Base Sepolia Testnet
 */

import { baseSepolia } from 'viem/chains';

export const CHAIN = baseSepolia;
export const CHAIN_ID = 84532;
export const CHAIN_NAME = 'Base Sepolia';

// Contract Addresses
export const PROTOCOL_ADDRESS = '0x6a14223324cEd59f89EB80A296a119B2834d1747' as const;
export const USDC_ADDRESS = '0x45f591C36B3506a881eD54638a9456607c2Eed84' as const;
export const FACTORY_ADDRESS = '0x98374B2f2c13b04829654C9997abF762d8414454' as const;
export const FEE_COLLECTOR_ADDRESS = '0x6FC8141187cC9c25Bd632393Da95bAcD88EA354e' as const;
export const VAULT_IMPLEMENTATION_ADDRESS = '0x211BA241808e51CA363a1E0d19C87607C28D3e31' as const;
export const PRICE_ORACLE_ADDRESS = '0xc659BBBe7E819373b10a56d2d4afd152dde98317' as const;
export const COLLATERAL_MANAGER_ADDRESS = '0x06fd3Ba63a478648B88F5e3587c698C594D3b550' as const;
export const READER_ADDRESS = '0x085909eDc9214b8d8e924225ee431d5eB1091dAb' as const;
export const STAKING_ADDRESS = '0x4E3C4B3aF1702Dd65BcDe4Cc1a1f23890451D0a9' as const;

// Vault #0 (USDC)
export const USDC_VAULT_ADDRESS = '0x8c22EaDD42870c4C3Cd04C98F252ae866A1cbD56' as const;
export const CVT_TOKEN_ADDRESS = '0x477B2f1979294174E152bC69735d20C62CC8c213' as const;

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
