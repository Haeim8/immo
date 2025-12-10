/**
 * CantorFi Protocol - React Hooks
 * Connected to CantorVaultReader contract for real data
 */

'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { PROTOCOL_ADDRESS, READER_ADDRESS, BLOCK_EXPLORER_URL, USDC_DECIMALS, CHAIN_ID } from './constants';
import { PROTOCOL_ABI, READER_ABI } from './abis';
import { getFromCache, setInCache } from './cache';

// Re-exports
export { BLOCK_EXPLORER_URL };

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
    chainId: CHAIN_ID,
  });

  useEffect(() => {
    if (vaultCount !== undefined) {
      const count = Number(vaultCount);
      setCachedCount(count);
      setInCache('vaultCount', count);
    }
  }, [vaultCount]);

  const finalCount = cachedCount ?? Number(vaultCount ?? 0);

  return { vaultCount: finalCount, isLoading: isLoading && cachedCount === null };
}

/**
 * Hook pour tous les vaults via Reader contract
 */
export function useAllVaults() {
  const [vaults, setVaults] = useState<VaultData[]>(() => {
    return getFromCache<VaultData[]>('allVaults') ?? [];
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetch = useRef<number>(0);

  // Read vaults from Reader contract
  const { data: readerData, isLoading: readerLoading, isError, refetch: refetchReader } = useReadContract({
    address: READER_ADDRESS,
    abi: READER_ABI,
    functionName: 'getVaults',
    args: [BigInt(0), BigInt(100)], // Get up to 100 vaults
    chainId: CHAIN_ID,
  });

  useEffect(() => {
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

    if (readerLoading) {
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

    if (!readerData || !Array.isArray(readerData) || readerData.length === 0) {
      setVaults([]);
      setInCache('allVaults', []);
      setIsLoading(false);
      return;
    }

    // Update last fetch time
    lastFetch.current = Date.now();

    // Transform reader data to VaultData format
    const transformedVaults: VaultData[] = readerData.map((v: any) => {
      const decimals = USDC_DECIMALS;

      const utilizationBps = Number(v.utilizationRate || 0);
      const utilizationRate = utilizationBps / 100; // bps -> %
      const expectedReturnBps = Number(v.expectedReturn || 0); // supply APY in bps
      const supplyRate = expectedReturnBps / 100; // %

      // Approximate borrow APY from supply APY and utilization when available
      const borrowRateBps =
        utilizationBps > 0 ? Math.floor((expectedReturnBps * 10000) / utilizationBps) : 0;
      const borrowRate =
        borrowRateBps > 0 ? borrowRateBps / 100 : Number(v.borrowBaseRate || 0) / 100;

      return {
        vaultId: Number(v.vaultId),
        vaultAddress: v.vaultAddress as `0x${string}`,
        tokenAddress: (v.underlyingToken || v.cvtToken) as `0x${string}`,
        tokenSymbol: 'USDC',
        tokenDecimals: decimals,
        maxLiquidity: formatUnits(BigInt(v.maxLiquidity || 0), decimals),
        borrowBaseRate: Number(v.borrowBaseRate || 0) / 100,
        borrowSlope: Number(v.borrowSlope || 0) / 100,
        maxBorrowRatio: Number(v.maxBorrowRatio || 0) / 100,
        liquidationBonus: Number(v.liquidationBonus || 0) / 100,
        isActive: v.isActive,
        createdAt: Number(v.createdAt || 0) * 1000,
        totalSupplied: formatUnits(BigInt(v.totalSupplied || 0), decimals),
        totalBorrowed: formatUnits(BigInt(v.totalBorrowed || 0), decimals),
        availableLiquidity: formatUnits(BigInt(v.availableLiquidity || 0), decimals),
        utilizationRate,
        borrowRate,
        supplyRate,
      };
    });

    setVaults(transformedVaults);
    setInCache('allVaults', transformedVaults);
    setIsLoading(false);
    setError(null);
  }, [readerData, readerLoading, isError]);

  const refetch = useCallback(() => {
    lastFetch.current = 0;
    setIsLoading(true);
    refetchReader();
  }, [refetchReader]);

  return { vaults, isLoading, error, refetch };
}

/**
 * Hook pour les positions d'un utilisateur via Reader contract
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

  // Read user portfolio from Reader contract
  const { data: portfolioData, isLoading: portfolioLoading } = useReadContract({
    address: READER_ADDRESS,
    abi: READER_ABI,
    functionName: 'getUserPortfolio',
    args: userAddress ? [userAddress] : undefined,
    chainId: CHAIN_ID,
    query: {
      enabled: !!userAddress,
    },
  });

  useEffect(() => {
    if (!userAddress) {
      setPositions([]);
      setTotals({ totalSupplied: 0, totalBorrowed: 0, totalInterestPending: 0 });
      setIsLoading(false);
      return;
    }

    if (portfolioLoading || isLoadingVaults) {
      setIsLoading(true);
      return;
    }

    if (!portfolioData) {
      // Check cache
      const cached = getFromCache<UserPosition[]>(`positions_${userAddress}`);
      if (cached && cached.length > 0) {
        setPositions(cached);
        const cachedTotals = getFromCache<typeof totals>(`positions_${userAddress}_totals`);
        if (cachedTotals) setTotals(cachedTotals);
      } else {
        setPositions([]);
        setTotals({ totalSupplied: 0, totalBorrowed: 0, totalInterestPending: 0 });
      }
      setIsLoading(false);
      return;
    }

    // portfolioData is [positions[], summary]
    const [positionsData, summaryData] = portfolioData as [any[], any];

    if (!positionsData || positionsData.length === 0) {
      setPositions([]);
      setTotals({ totalSupplied: 0, totalBorrowed: 0, totalInterestPending: 0 });
      setIsLoading(false);
      return;
    }

    const decimals = USDC_DECIMALS;

    // Transform positions
    const transformedPositions: UserPosition[] = positionsData.map((p: any) => {
      const supplied = parseFloat(formatUnits(BigInt(p.supplyAmount || 0), decimals));
      const borrowed = parseFloat(formatUnits(BigInt(p.borrowedAmount || 0), decimals));
      const interestPending = parseFloat(formatUnits(BigInt(p.interestPending || 0), decimals));

      // Find vault info
      const vault = vaults.find(v => v.vaultId === Number(p.vaultId));
      const maxBorrowRatio = vault?.maxBorrowRatio || 80;

      // Calculate health factor
      let healthFactor = 10000; // Infinite if no borrow
      if (borrowed > 0) {
        const maxBorrow = supplied * (maxBorrowRatio / 100);
        healthFactor = maxBorrow > 0 ? (maxBorrow / borrowed) * 100 : 0;
      }

      // Calculate max additional borrow
      const maxBorrowValue = supplied * (maxBorrowRatio / 100);
      const maxBorrow = Math.max(0, maxBorrowValue - borrowed);

      // Calculate withdrawable (considering borrow)
      let withdrawable = supplied;
      if (borrowed > 0) {
        const requiredCollateral = borrowed / (maxBorrowRatio / 100);
        withdrawable = Math.max(0, supplied - requiredCollateral);
      }

      return {
        vaultId: Number(p.vaultId),
        vaultAddress: p.vaultAddress as `0x${string}`,
        supplied: supplied.toString(),
        borrowed: borrowed.toString(),
        interest: formatUnits(BigInt(p.borrowInterestAccumulated || 0), decimals),
        healthFactor,
        maxBorrow: maxBorrow.toString(),
        withdrawable: withdrawable.toString(),
        cvtBalance: formatUnits(BigInt(p.cvtBalance || 0), decimals),
        interestPending: interestPending.toString(),
      };
    });

    // Calculate totals from summary
    const newTotals = {
      totalSupplied: parseFloat(formatUnits(BigInt(summaryData?.totalInvested || 0), decimals)),
      totalBorrowed: parseFloat(formatUnits(BigInt(summaryData?.totalBorrowed || 0), decimals)),
      totalInterestPending: parseFloat(formatUnits(BigInt(summaryData?.totalPending || 0), decimals)),
    };

    setPositions(transformedPositions);
    setTotals(newTotals);
    setInCache(`positions_${userAddress}`, transformedPositions);
    setInCache(`positions_${userAddress}_totals`, newTotals);
    setIsLoading(false);
  }, [userAddress, portfolioData, portfolioLoading, vaults, isLoadingVaults]);

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
