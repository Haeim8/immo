/**
 * CantorFi Protocol - Price Utilities
 * Uses fallback prices for token valuation
 */

'use client';

import { ETH_TO_USD_ESTIMATE } from './constants';

// Fallback prices (USD)
const FALLBACK_PRICES: Record<string, number> = {
  ETH: ETH_TO_USD_ESTIMATE,
  WETH: ETH_TO_USD_ESTIMATE,
  USDC: 1,
  USDT: 1,
  DAI: 1,
  WBTC: 95000,
};

// Known stablecoin symbols (always $1)
const STABLECOINS = ['USDC', 'USDT', 'DAI', 'BUSD', 'FRAX', 'LUSD'];

/**
 * Get fallback price for a token symbol
 */
export function getFallbackPrice(symbol: string): number {
  const upperSymbol = symbol.toUpperCase();
  if (STABLECOINS.includes(upperSymbol)) return 1;
  return FALLBACK_PRICES[upperSymbol] || 0;
}

/**
 * Convert token amount to USD value
 * @param amount Token amount (as number or string)
 * @param tokenSymbol Token symbol (for fallback)
 * @param priceUsd Price in USD (from oracle or fallback)
 */
export function toUsdValue(
  amount: number | string,
  tokenSymbol: string,
  priceUsd?: number
): number {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount) || numAmount === 0) return 0;

  // Use provided price or fallback
  const price = priceUsd ?? getFallbackPrice(tokenSymbol);
  return numAmount * price;
}

/**
 * Format a number as USD currency
 * @param value USD value (already converted)
 */
export function formatUsd(value: number): string {
  if (isNaN(value)) return '$0.00';
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value > 0) return `$${value.toFixed(4)}`;
  return '$0.00';
}

/**
 * Format token amount (not USD)
 */
export function formatTokenAmount(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  if (num >= 1) return num.toFixed(2);
  if (num > 0) return num.toFixed(4);
  return '0';
}

/**
 * Get price for a single token using symbol (with fallback)
 */
export function getTokenPrice(symbol: string, oraclePrice?: number): number {
  if (oraclePrice !== undefined && oraclePrice > 0) {
    return oraclePrice;
  }
  return getFallbackPrice(symbol);
}

/**
 * Type for position with USD values
 */
export interface PositionWithUsd {
  vaultId: number;
  tokenSymbol: string;
  supplied: number;
  suppliedUsd: number;
  borrowed: number;
  borrowedUsd: number;
  interestPending: number;
  interestPendingUsd: number;
  maxBorrow: number;
  maxBorrowUsd: number;
}

/**
 * Calculate USD totals from positions with different tokens
 */
export function calculateUsdTotals(
  positions: Array<{
    supplied: string | number;
    borrowed: string | number;
    interestPending: string | number;
    tokenSymbol?: string;
    tokenAddress?: string;
  }>,
  priceMap: Map<string, number>
): { totalSuppliedUsd: number; totalBorrowedUsd: number; totalInterestUsd: number } {
  let totalSuppliedUsd = 0;
  let totalBorrowedUsd = 0;
  let totalInterestUsd = 0;

  positions.forEach((pos) => {
    const symbol = pos.tokenSymbol || 'UNKNOWN';
    const addr = pos.tokenAddress?.toLowerCase() || '';

    // Try oracle price first, then fallback
    const price = priceMap.get(addr) || getFallbackPrice(symbol);

    const supplied = typeof pos.supplied === 'string' ? parseFloat(pos.supplied) : pos.supplied;
    const borrowed = typeof pos.borrowed === 'string' ? parseFloat(pos.borrowed) : pos.borrowed;
    const interest = typeof pos.interestPending === 'string' ? parseFloat(pos.interestPending) : pos.interestPending;

    totalSuppliedUsd += (supplied || 0) * price;
    totalBorrowedUsd += (borrowed || 0) * price;
    totalInterestUsd += (interest || 0) * price;
  });

  return { totalSuppliedUsd, totalBorrowedUsd, totalInterestUsd };
}
