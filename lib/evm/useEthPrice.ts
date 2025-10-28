/**
 * Hook to get ETH price in USD
 */

import { useState, useEffect, useMemo } from 'react';

export function useEthPrice() {
  const [priceUsd, setPriceUsd] = useState<number>(3000);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
        );
        const data = await response.json();

        if (data.ethereum?.usd) {
          setPriceUsd(data.ethereum.usd);
          setLastUpdated(Date.now());
        }
      } catch (error) {
        console.error('Failed to fetch ETH price:', error);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Stabiliser la référence de l'objet price pour éviter les boucles infinies
  const price = useMemo(() => ({ usd: priceUsd, lastUpdated }), [priceUsd, lastUpdated]);

  return { price };
}
