/**
 * CantorFi Protocol - React Hooks
 * Connected to CantorVaultReader contract for real data
 */

'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import { formatUnits } from 'viem';
import { PROTOCOL_ADDRESS, READER_ADDRESS, BLOCK_EXPLORER_URL, CHAIN_ID } from './constants';
import { PROTOCOL_ABI, READER_ABI, ERC20_ABI, VAULT_EXTENDED_ABI } from './abis';
import { getFromCache, setInCache } from './cache';
import { getFallbackPrice, formatUsd, formatTokenAmount, toUsdValue } from './prices';

// Re-export price utilities for convenience
export { formatUsd, formatTokenAmount, toUsdValue, getFallbackPrice };

// Re-exports
export { BLOCK_EXPLORER_URL };

// Types
export interface VaultData {
  vaultId: number;
  vaultAddress: `0x${string}`;
  tokenAddress: `0x${string}`;
  cvtTokenAddress: `0x${string}`;
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
  tokenAddress: `0x${string}`;
  tokenSymbol: string;
  tokenDecimals: number;
  supplied: string;
  borrowed: string;
  interest: string;
  healthFactor: number;
  maxBorrow: string;
  withdrawable: string;
  cvtBalance: string;
  interestPending: string;
  // USD values
  suppliedUsd: number;
  borrowedUsd: number;
  interestPendingUsd: number;
  maxBorrowUsd: number;
  tokenPrice: number;
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

  // Extract unique token addresses from reader data
  const tokenAddresses = useMemo(() => {
    if (!readerData || !Array.isArray(readerData)) return [];
    const uniqueTokens = new Set<string>();
    readerData.forEach((v: any) => {
      const tokenAddr = (v.underlyingToken || v.cvtToken)?.toLowerCase();
      if (tokenAddr) uniqueTokens.add(tokenAddr);
    });
    return Array.from(uniqueTokens);
  }, [readerData]);

  // Build multicall contracts for symbol and decimals
  const tokenContracts = useMemo(() => {
    const contracts: any[] = [];
    tokenAddresses.forEach((tokenAddr) => {
      contracts.push(
        {
          address: tokenAddr as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'symbol',
          chainId: CHAIN_ID,
        },
        {
          address: tokenAddr as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'decimals',
          chainId: CHAIN_ID,
        }
      );
    });
    return contracts;
  }, [tokenAddresses]);

  // Multicall to read all token symbols and decimals.
  // NOTE: wagmi types can explode on dynamic contract arrays; cast to `any` to keep TS fast & stable.
  const tokenRead = useReadContracts({
    contracts: tokenContracts as any,
    query: {
      enabled: tokenContracts.length > 0,
    },
  } as any) as { data?: any[]; isLoading: boolean };
  const tokenData = tokenRead.data;
  const tokenLoading = tokenRead.isLoading;

  useEffect(() => {
    // Check cache first
    const cached = getFromCache<VaultData[]>('allVaults');

    // Si reader a plus de vaults que le cache, ignorer le cache
    const readerVaultCount = readerData && Array.isArray(readerData) ? readerData.length : 0;
    const cacheOutdated = cached && readerVaultCount > cached.length;

    if (cached && cached.length > 0 && !cacheOutdated) {
      setVaults(cached);
      setIsLoading(false);

      // Don't refetch if less than 30 seconds
      if (Date.now() - lastFetch.current < 30000) {
        return;
      }
    }

    if (readerLoading || tokenLoading) {
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

    // Build token info map from multicall results
    const tokenInfoMap = new Map<string, { symbol: string; decimals: number }>();
    if (tokenData && tokenAddresses.length > 0) {
      tokenAddresses.forEach((tokenAddr, idx) => {
        const symbolResult = tokenData[idx * 2];
        const decimalsResult = tokenData[idx * 2 + 1];

        const symbol = symbolResult?.result as string || 'UNKNOWN';
        const decimals = decimalsResult?.result as number || 18;

        tokenInfoMap.set(tokenAddr.toLowerCase(), { symbol, decimals });
      });
    }

    // Update last fetch time
    lastFetch.current = Date.now();

    // Transform reader data to VaultData format
    const transformedVaults: VaultData[] = readerData.map((v: any) => {
      const tokenAddress = v.underlyingToken as `0x${string}`;
      const cvtTokenAddress = v.cvtToken as `0x${string}`;
      const tokenInfo = tokenInfoMap.get(tokenAddress.toLowerCase()) || { symbol: 'UNKNOWN', decimals: 18 };
      const decimals = tokenInfo.decimals;

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
        tokenAddress,
        cvtTokenAddress,
        tokenSymbol: tokenInfo.symbol,
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
  }, [readerData, readerLoading, isError, tokenData, tokenLoading, tokenAddresses]);

  const refetch = useCallback(() => {
    lastFetch.current = 0;
    setIsLoading(true);
    refetchReader();
  }, [refetchReader]);

  return { vaults, isLoading, error, refetch };
}

/**
 * Hook pour les positions d'un utilisateur via Reader contract
 * Uses vault contracts directly for maxBorrow/withdrawable (staking-aware)
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

  // Extract vault addresses from portfolio to fetch maxBorrow/withdrawable
  const vaultAddressesForCalls = useMemo(() => {
    if (!portfolioData) return [];
    const [positionsData] = portfolioData as [any[], any];
    if (!positionsData || positionsData.length === 0) return [];
    return positionsData.map((p: any) => p.vaultAddress as `0x${string}`);
  }, [portfolioData]);

  // Build multicall contracts for getMaxBorrow and getWithdrawable on each vault
  const vaultContracts = useMemo(() => {
    if (!userAddress || vaultAddressesForCalls.length === 0) return [];
    const contracts: any[] = [];
    vaultAddressesForCalls.forEach((vaultAddr) => {
      contracts.push(
        {
          address: vaultAddr,
          abi: VAULT_EXTENDED_ABI,
          functionName: 'getMaxBorrow',
          args: [userAddress],
          chainId: CHAIN_ID,
        },
        {
          address: vaultAddr,
          abi: VAULT_EXTENDED_ABI,
          functionName: 'getWithdrawable',
          args: [userAddress],
          chainId: CHAIN_ID,
        }
      );
    });
    return contracts;
  }, [userAddress, vaultAddressesForCalls]);

  // Multicall to get maxBorrow and withdrawable from vault contracts
  const vaultRead = useReadContracts({
    contracts: vaultContracts as any,
    query: {
      enabled: vaultContracts.length > 0,
    },
  } as any) as { data?: any[]; isLoading: boolean };
  const vaultData = vaultRead.data;
  const vaultDataLoading = vaultRead.isLoading;

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

    // Wait for vault data if we have positions
    if (vaultContracts.length > 0 && vaultDataLoading) {
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
    const [positionsData] = portfolioData as [any[], any];

    if (!positionsData || positionsData.length === 0) {
      setPositions([]);
      setTotals({ totalSupplied: 0, totalBorrowed: 0, totalInterestPending: 0 });
      setIsLoading(false);
      return;
    }

    // Build map of vault address -> { maxBorrow, withdrawable } from multicall results
    const vaultValuesMap = new Map<string, { maxBorrow: bigint; withdrawable: bigint }>();
    if (vaultData && vaultAddressesForCalls.length > 0) {
      vaultAddressesForCalls.forEach((vaultAddr, idx) => {
        const maxBorrowResult = vaultData[idx * 2];
        const withdrawableResult = vaultData[idx * 2 + 1];

        const maxBorrow = maxBorrowResult?.result as bigint || BigInt(0);
        const withdrawable = withdrawableResult?.result as bigint || BigInt(0);

        vaultValuesMap.set(vaultAddr.toLowerCase(), { maxBorrow, withdrawable });
      });
    }

    // Transform positions using contract values for maxBorrow/withdrawable
    const transformedPositions: UserPosition[] = positionsData.map((p: any) => {
      // Find vault info
      const vault = vaults.find(v => v.vaultId === Number(p.vaultId));
      const decimals = vault?.tokenDecimals || 18;
      const maxBorrowRatio = vault?.maxBorrowRatio || 80;
      const tokenSymbol = vault?.tokenSymbol || 'UNKNOWN';
      const tokenAddress = vault?.tokenAddress || ('0x0' as `0x${string}`);

      const supplied = parseFloat(formatUnits(BigInt(p.supplyAmount || 0), decimals));
      const borrowed = parseFloat(formatUnits(BigInt(p.borrowedAmount || 0), decimals));
      const interestPending = parseFloat(formatUnits(BigInt(p.interestPending || 0), decimals));

      // Get maxBorrow and withdrawable from contract (staking-aware!)
      const vaultValues = vaultValuesMap.get((p.vaultAddress as string).toLowerCase());
      const maxBorrowFromContract = vaultValues
        ? parseFloat(formatUnits(vaultValues.maxBorrow, decimals))
        : 0;
      const withdrawableFromContract = vaultValues
        ? parseFloat(formatUnits(vaultValues.withdrawable, decimals))
        : supplied;

      // Calculate health factor using contract's logic
      let healthFactor = 10000; // Infinite if no borrow
      if (borrowed > 0) {
        const maxBorrowValue = supplied * (maxBorrowRatio / 100);
        healthFactor = maxBorrowValue > 0 ? (maxBorrowValue / borrowed) * 100 : 0;
      }

      // Get token price (fallback for now, oracle integration can be added)
      const tokenPrice = getFallbackPrice(tokenSymbol);

      // Calculate USD values
      const suppliedUsd = supplied * tokenPrice;
      const borrowedUsd = borrowed * tokenPrice;
      const interestPendingUsd = interestPending * tokenPrice;
      const maxBorrowUsd = maxBorrowFromContract * tokenPrice;

      return {
        vaultId: Number(p.vaultId),
        vaultAddress: p.vaultAddress as `0x${string}`,
        tokenAddress,
        tokenSymbol,
        tokenDecimals: decimals,
        supplied: supplied.toString(),
        borrowed: borrowed.toString(),
        interest: formatUnits(BigInt(p.borrowInterestAccumulated || 0), decimals),
        healthFactor,
        maxBorrow: maxBorrowFromContract.toString(), // From contract - staking aware!
        withdrawable: withdrawableFromContract.toString(), // From contract - borrow aware!
        cvtBalance: formatUnits(BigInt(p.cvtBalance || 0), 18), // CVT always has 18 decimals
        interestPending: interestPending.toString(),
        // USD values
        suppliedUsd,
        borrowedUsd,
        interestPendingUsd,
        maxBorrowUsd,
        tokenPrice,
      };
    });

    // Calculate totals in USD (proper multi-token support!)
    const newTotals = {
      totalSupplied: transformedPositions.reduce((sum, p) => sum + p.suppliedUsd, 0),
      totalBorrowed: transformedPositions.reduce((sum, p) => sum + p.borrowedUsd, 0),
      totalInterestPending: transformedPositions.reduce((sum, p) => sum + p.interestPendingUsd, 0),
    };

    setPositions(transformedPositions);
    setTotals(newTotals);
    setInCache(`positions_${userAddress}`, transformedPositions);
    setInCache(`positions_${userAddress}_totals`, newTotals);
    setIsLoading(false);
  }, [userAddress, portfolioData, portfolioLoading, vaults, isLoadingVaults, vaultData, vaultDataLoading, vaultAddressesForCalls, vaultContracts.length]);

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
