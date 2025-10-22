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

// Global cache shared across all instances
let cachedPrice: SolPriceData | null = null;
let cacheTimestamp = 0;
let pendingRequest: Promise<SolPriceData | null> | null = null;

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

// Global fetch function with deduplication
async function fetchPriceGlobal(): Promise<SolPriceData | null> {
  // If there's already a pending request, wait for it
  if (pendingRequest) {
    return pendingRequest;
  }

  // Use cached price if still valid
  if (cachedPrice && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedPrice;
  }

  // Create new request and store as pending
  pendingRequest = (async () => {
    try {
      const response = await fetch(COINGECKO_API, {
        cache: 'force-cache',
        next: { revalidate: 300 }
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.warn("⚠️ CoinGecko API rate limit - using cached price");
          return cachedPrice;
        }
        throw new Error(`HTTP ${response.status}`);
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

        // Save to localStorage
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(priceData));
          localStorage.setItem(LOCAL_STORAGE_TIMESTAMP_KEY, cacheTimestamp.toString());
        } catch (e) {
          // Ignore
        }

        return priceData;
      }

      return cachedPrice;
    } catch (err: any) {
      console.error("Error fetching SOL price:", err.message);
      return cachedPrice;
    } finally {
      // Clear pending request after it completes
      pendingRequest = null;
    }
  })();

  return pendingRequest;
}

export function useSolPrice() {
  const [price, setPrice] = useState<SolPriceData>(() => {
    // Initialize with cached price if available
    if (cachedPrice) {
      return cachedPrice;
    }
    return {
      usd: 150,
      eur: 135,
      lastUpdated: Date.now(),
    };
  });
  const [loading, setLoading] = useState(!cachedPrice);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPrice() {
      try {
        setLoading(true);
        const result = await fetchPriceGlobal();

        if (result) {
          setPrice(result);
          setError(null);
        } else if (cachedPrice) {
          setPrice(cachedPrice);
        }
      } catch (err: any) {
        console.error("Error in useSolPrice:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPrice();

    // Refresh price every 5 minutes
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
