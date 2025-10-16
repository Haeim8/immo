"use client";

import { useState, useEffect } from "react";

export interface SolPriceData {
  usd: number;
  eur: number;
  lastUpdated: number;
}

const COINGECKO_API = "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd,eur";
const CACHE_DURATION = 60000; // 1 minute cache

let cachedPrice: SolPriceData | null = null;
let cacheTimestamp = 0;

export function useSolPrice() {
  const [price, setPrice] = useState<SolPriceData>({
    usd: 100, // Default fallback
    eur: 90,
    lastUpdated: Date.now(),
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPrice() {
      // Use cached price if still valid
      if (cachedPrice && Date.now() - cacheTimestamp < CACHE_DURATION) {
        setPrice(cachedPrice);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(COINGECKO_API);

        if (!response.ok) {
          throw new Error("Failed to fetch SOL price");
        }

        const data = await response.json();

        if (data.solana) {
          const priceData: SolPriceData = {
            usd: data.solana.usd || 100,
            eur: data.solana.eur || 90,
            lastUpdated: Date.now(),
          };

          cachedPrice = priceData;
          cacheTimestamp = Date.now();
          setPrice(priceData);
          setError(null);
        }
      } catch (err: any) {
        console.error("Error fetching SOL price:", err);
        setError(err.message);
        // Keep using the previous price or default
      } finally {
        setLoading(false);
      }
    }

    fetchPrice();

    // Refresh price every minute
    const interval = setInterval(fetchPrice, CACHE_DURATION);

    return () => clearInterval(interval);
  }, []);

  return { price, loading, error };
}

// Helper functions for conversions
export function usdToSol(usd: number, solPriceUSD: number): number {
  return usd / solPriceUSD;
}

export function solToUsd(sol: number, solPriceUSD: number): number {
  return sol * solPriceUSD;
}

export function lamportsToUsd(lamports: number, solPriceUSD: number): number {
  const sol = lamports / 1e9;
  return sol * solPriceUSD;
}

export function usdToLamports(usd: number, solPriceUSD: number): number {
  const sol = usd / solPriceUSD;
  return Math.floor(sol * 1e9);
}
