/**
 * CantorFi Protocol - React Hooks
 * Avec cache local pour éviter les appels RPC coûteux
 */

'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { PROTOCOL_ADDRESS, BLOCK_EXPLORER_URL } from './constants';
import { PROTOCOL_ABI } from './abis';
import { getFromCache, setInCache } from './cache';

// Re-exports
export { BLOCK_EXPLORER_URL };

// Mock data for preview when protocol is not connected - set to false in production
const USE_MOCK_VAULTS = true;
const MOCK_VAULTS_DATA: VaultData[] = [
  {
    vaultId: 1,
    vaultAddress: '0x1234567890123456789012345678901234567890' as `0x${string}`,
    tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`,
    tokenSymbol: 'USDC',
    tokenDecimals: 6,
    maxLiquidity: '5000000',
    borrowBaseRate: 2,
    borrowSlope: 15,
    maxBorrowRatio: 80,
    liquidationBonus: 5,
    isActive: true,
    createdAt: Date.now() - 86400000 * 30,
    totalSupplied: '2450000',
    totalBorrowed: '1850000',
    availableLiquidity: '600000',
    utilizationRate: 75.5,
    borrowRate: 8.5,
    supplyRate: 6.4,
  },
  {
    vaultId: 2,
    vaultAddress: '0x2345678901234567890123456789012345678901' as `0x${string}`,
    tokenAddress: '0x4200000000000000000000000000000000000006' as `0x${string}`,
    tokenSymbol: 'WETH',
    tokenDecimals: 18,
    maxLiquidity: '2000000',
    borrowBaseRate: 3,
    borrowSlope: 20,
    maxBorrowRatio: 75,
    liquidationBonus: 8,
    isActive: true,
    createdAt: Date.now() - 86400000 * 20,
    totalSupplied: '1200000',
    totalBorrowed: '780000',
    availableLiquidity: '420000',
    utilizationRate: 65.0,
    borrowRate: 12.2,
    supplyRate: 7.9,
  },
  {
    vaultId: 3,
    vaultAddress: '0x3456789012345678901234567890123456789012' as `0x${string}`,
    tokenAddress: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    tokenSymbol: 'WBTC',
    tokenDecimals: 8,
    maxLiquidity: '1500000',
    borrowBaseRate: 2.5,
    borrowSlope: 18,
    maxBorrowRatio: 70,
    liquidationBonus: 10,
    isActive: true,
    createdAt: Date.now() - 86400000 * 15,
    totalSupplied: '890000',
    totalBorrowed: '450000',
    availableLiquidity: '440000',
    utilizationRate: 50.6,
    borrowRate: 6.8,
    supplyRate: 3.4,
  },
];

// Types
export interface VaultData {
  vaultId: number;
  vaultAddress: `0x${string}`;
  tokenAddress: `0x${string}`;
  tokenSymbol: string;
  tokenDecimals: number;
  maxLiquidity: string;
  borrowBaseRate: number;
  borrowSlope: number;
  maxBorrowRatio: number;
  liquidationBonus: number;
  isActive: boolean;
  createdAt: number;
  totalSupplied: string;
  totalBorrowed: string;
  availableLiquidity: string;
  utilizationRate: number;
  borrowRate: number;
  supplyRate: number;
}

export interface UserPosition {
  vaultId: number;
  vaultAddress: `0x${string}`;
  supplied: string;
  borrowed: string;
  interest: string;
  healthFactor: number;
  maxBorrow: string;
  withdrawable: string;
  cvtBalance: string;
  interestPending: string;
}

/**
 * Hook pour l'adresse du wallet connecté
 */
export function useWalletAddress() {
  const { address, isConnected } = useAccount();
  return { address, isConnected };
}

/**
 * Hook pour le nombre de vaults (avec cache)
 */
export function useVaultCount() {
  const [cachedCount, setCachedCount] = useState<number | null>(() => {
    return getFromCache<number>('vaultCount');
  });

  const { data: vaultCount, isLoading } = useReadContract({
    address: PROTOCOL_ADDRESS,
    abi: PROTOCOL_ABI,
    functionName: 'vaultCount',
  });

  useEffect(() => {
    if (vaultCount !== undefined) {
      const count = Number(vaultCount);
      setCachedCount(count);
      setInCache('vaultCount', count);
    }
  }, [vaultCount]);

  // Return cached value while loading
  const finalCount = cachedCount ?? Number(vaultCount ?? 0);

  return { vaultCount: finalCount, isLoading: isLoading && cachedCount === null };
}

/**
 * Hook pour tous les vaults (avec cache)
 */
export function useAllVaults() {
  const [vaults, setVaults] = useState<VaultData[]>(() => {
    if (USE_MOCK_VAULTS) return MOCK_VAULTS_DATA;
    return getFromCache<VaultData[]>('allVaults') ?? [];
  });
  const [isLoading, setIsLoading] = useState(!USE_MOCK_VAULTS);
  const [error, setError] = useState<string | null>(null);
  const lastFetch = useRef<number>(0);

  const { data: count, isLoading: countLoading, isError } = useReadContract({
    address: PROTOCOL_ADDRESS,
    abi: PROTOCOL_ABI,
    functionName: 'vaultCount',
  });

  useEffect(() => {
    // If using mock data, return immediately
    if (USE_MOCK_VAULTS) {
      setVaults(MOCK_VAULTS_DATA);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Check cache first
    const cached = getFromCache<VaultData[]>('allVaults');
    if (cached && cached.length > 0) {
      setVaults(cached);
      setIsLoading(false);

      // Don't refetch if less than 30 seconds
      if (Date.now() - lastFetch.current < 30000) {
        return;
      }
    }

    if (countLoading) {
      if (!cached || cached.length === 0) {
        setIsLoading(true);
      }
      return;
    }

    if (isError) {
      setError('Failed to connect to protocol');
      if (!cached || cached.length === 0) {
        setVaults([]);
      }
      setIsLoading(false);
      return;
    }

    const vaultCount = Number(count ?? 0);

    if (vaultCount === 0) {
      setVaults([]);
      setInCache('allVaults', []);
      setIsLoading(false);
      return;
    }

    // Update last fetch time
    lastFetch.current = Date.now();

    // Placeholder - les vrais appels seront implémentés plus tard
    // Pour l'instant on garde le cache ou tableau vide
    if (!cached || cached.length === 0) {
      setVaults([]);
      setInCache('allVaults', []);
    }
    setIsLoading(false);
  }, [count, countLoading, isError]);

  const refetch = useCallback(() => {
    lastFetch.current = 0; // Force refetch
    setIsLoading(true);
  }, []);

  return { vaults, isLoading, error, refetch };
}

/**
 * Hook pour les positions d'un utilisateur (avec cache)
 */
export function useUserPositions(userAddress: `0x${string}` | undefined) {
  const { vaults, isLoading: isLoadingVaults } = useAllVaults();

  const cacheKey = userAddress ? `positions_${userAddress}` : null;

  const [positions, setPositions] = useState<UserPosition[]>(() => {
    if (!cacheKey) return [];
    return getFromCache<UserPosition[]>(cacheKey) ?? [];
  });

  const [isLoading, setIsLoading] = useState(true);
  const [totals, setTotals] = useState(() => {
    if (!cacheKey) return { totalSupplied: 0, totalBorrowed: 0, totalInterestPending: 0 };
    const cached = getFromCache<{ totalSupplied: number; totalBorrowed: number; totalInterestPending: number }>(`${cacheKey}_totals`);
    return cached ?? { totalSupplied: 0, totalBorrowed: 0, totalInterestPending: 0 };
  });

  useEffect(() => {
    if (!userAddress || vaults.length === 0) {
      setPositions([]);
      setTotals({ totalSupplied: 0, totalBorrowed: 0, totalInterestPending: 0 });
      setIsLoading(false);
      return;
    }

    // Check cache
    const cached = getFromCache<UserPosition[]>(`positions_${userAddress}`);
    if (cached && cached.length > 0) {
      setPositions(cached);
      const cachedTotals = getFromCache<typeof totals>(`positions_${userAddress}_totals`);
      if (cachedTotals) setTotals(cachedTotals);
      setIsLoading(false);
      return;
    }

    // Placeholder - positions seront chargées plus tard
    setPositions([]);
    setTotals({ totalSupplied: 0, totalBorrowed: 0, totalInterestPending: 0 });
    setIsLoading(false);
  }, [userAddress, vaults, isLoadingVaults]);

  return { positions, totals, isLoading: isLoading || isLoadingVaults };
}

/**
 * Hook pour les totaux du protocole
 */
export function useProtocolTotals() {
  const { vaults, isLoading } = useAllVaults();

  const totals = useMemo(() => {
    // Check cache first
    const cached = getFromCache<{
      totalTVL: number;
      totalBorrowed: number;
      totalAvailable: number;
      vaultCount: number;
    }>('protocolTotals');

    if (cached && vaults.length === 0) {
      return cached;
    }

    const result = {
      totalTVL: 0,
      totalBorrowed: 0,
      totalAvailable: 0,
      vaultCount: vaults.length,
    };

    vaults.forEach((vault) => {
      result.totalTVL += parseFloat(vault.totalSupplied);
      result.totalBorrowed += parseFloat(vault.totalBorrowed);
      result.totalAvailable += parseFloat(vault.availableLiquidity);
    });

    // Save to cache
    if (vaults.length > 0) {
      setInCache('protocolTotals', result);
    }

    return result;
  }, [vaults]);

  return { ...totals, isLoading };
}


// Legacy hooks - compatibilité (retournent juste des valeurs vides)
export function useAllPlaces() {
  const { isLoading } = useAllVaults();
  return { places: [], isLoading };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useAllUserPuzzles(_userAddress: `0x${string}` | undefined) {
  return { puzzles: [], isLoading: false };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useIsAdmin(_address: `0x${string}` | undefined) {
  return { isAdmin: false, isLoading: false };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useIsTeamMember(_address: `0x${string}` | undefined) {
  return { isTeamMember: false, isLoading: false };
}

export function useTeamMembers() {
  return { teamMembers: [], isLoading: false };
}

export function useLeaderboardData() {
  return { leaderboardData: [], isLoading: false };
}
