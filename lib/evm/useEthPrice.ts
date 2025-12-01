/**
 * Hook pour le prix ETH
 */

'use client';

import { useState, useEffect } from 'react';

export function useEthPrice() {
  const [ethPrice, setEthPrice] = useState(3000);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setEthPrice(3000);
    setIsLoading(false);
  }, []);

  return { ethPrice, isLoading, price: ethPrice };
}
