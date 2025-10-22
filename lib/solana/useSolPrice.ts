"use client";

import { useState, useEffect } from "react";

export interface SolPriceData {
  usd: number;
  eur: number;
  lastUpdated: number;
}

const COINGECKO_API = "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd,eur";
const CACHE_DURATION = 300000; // 5 minutes cache (increased to reduce API calls)
const LOCAL_STORAGE_KEY = "usci:sol-price";
const LOCAL_STORAGE_TIMESTAMP_KEY = "usci:sol-price-timestamp";

// Initialize from localStorage if available
let cachedPrice: SolPriceData | null = null;
let cacheTimestamp = 0;

// Try to load from localStorage on module load
if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    const storedTimestamp = localStorage.getItem(LOCAL_STORAGE_TIMESTAMP_KEY);
    if (stored && storedTimestamp) {
      const timestamp = parseInt(storedTimestamp, 10);
      if (Date.now() - timestamp < CACHE_DURATION) {
        cachedPrice = JSON.parse(stored);
        cacheTimestamp = timestamp;
      }
    }
  } catch (e) {
    // Ignore localStorage errors
  }
}

export function useSolPrice() {
  const [price, setPrice] = useState<SolPriceData>({
    usd: 150, // Updated fallback price (closer to real SOL price)
    eur: 135,
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
        const response = await fetch(COINGECKO_API, {
          cache: 'force-cache', // Use browser cache
          next: { revalidate: 300 } // Next.js cache for 5 minutes
        });

        if (!response.ok) {
          // If we get rate limited (429), use cached or fallback price
          if (response.status === 429) {
            console.warn("CoinGecko API rate limit reached, using cached/fallback price");
            if (cachedPrice) {
              setPrice(cachedPrice);
            }
            // Don't throw error, just use fallback
            setError("Rate limited - using cached price");
            setLoading(false);
            return;
          }
          throw new Error(`Failed to fetch SOL price: ${response.status}`);
        }

        const data = await response.json();

        if (data.solana) {
          const priceData: SolPriceData = {
            usd: data.solana.usd || 150,
            eur: data.solana.eur || 135,
            lastUpdated: Date.now(),
          };

          cachedPrice = priceData;
          cacheTimestamp = Date.now();
          setPrice(priceData);
          setError(null);

          // Save to localStorage for persistence
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(priceData));
            localStorage.setItem(LOCAL_STORAGE_TIMESTAMP_KEY, cacheTimestamp.toString());
          } catch (e) {
            // Ignore localStorage errors
          }
        }
      } catch (err: any) {
        console.error("Error fetching SOL price:", err);
        setError(err.message);
        // Keep using the previous price or default
        if (cachedPrice) {
          setPrice(cachedPrice);
        }
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
