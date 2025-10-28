/**
 * Hook to get ETH price in USD
 */

import { useState, useEffect } from 'react';

interface EthPriceData {
  usd: number;
  lastUpdated: number;
}

export function useEthPrice() {
  const [price, setPrice] = useState<EthPriceData>({
    usd: 3000, // Default estimate
    lastUpdated: Date.now(),
  });

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
        );
        const data = await response.json();

        if (data.ethereum?.usd) {
          setPrice({
            usd: data.ethereum.usd,
            lastUpdated: Date.now(),
          });
        }
      } catch (error) {
        console.error('Failed to fetch ETH price:', error);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return { price };
}

export function usdToEth(usd: number, ethPrice: number): string {
  return (usd / ethPrice).toFixed(6);
}
