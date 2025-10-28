/**
 * EVM Hooks for reading contract data
 */

import { useReadContract, useReadContracts } from 'wagmi';
import { useState, useEffect, useMemo } from 'react';
import { FACTORY_ADDRESS } from './constants';
import { USCIFactoryABI, USCIABI } from './abis';
import { PlaceData, PlaceInfo } from './adapters';
import { useEthPrice } from './useEthPrice';

/**
 * Hook to get total number of places created
 */
export function usePlaceCount() {
  const { data, isLoading, error } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: USCIFactoryABI,
    functionName: 'placeCount',
  });

  return {
    placeCount: data ? Number(data) : 0,
    isLoading,
    error,
  };
}

/**
 * Hook to get address of a place by ID
 */
export function usePlaceAddress(placeId: number) {
  const { data, isLoading, error } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: USCIFactoryABI,
    functionName: 'getPlaceAddress',
    args: [BigInt(placeId)],
  });

  return {
    placeAddress: data as `0x${string}` | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook to get info of a specific place
 */
export function usePlaceInfo(placeAddress: `0x${string}` | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: placeAddress,
    abi: USCIABI,
    functionName: 'getPlaceInfo',
    query: {
      enabled: !!placeAddress,
    },
  });

  return {
    placeInfo: data as PlaceInfo | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook to get all places with their info
 */
export function useAllPlaces() {
  const { placeCount, isLoading: isLoadingCount } = usePlaceCount();

  // Create array of place IDs
  const placeIds = Array.from({ length: placeCount }, (_, i) => i);

  // Batch read all place addresses
  const addressContracts = placeIds.map((id) => ({
    address: FACTORY_ADDRESS,
    abi: USCIFactoryABI,
    functionName: 'getPlaceAddress' as const,
    args: [BigInt(id)],
  }));

  const { data: addresses, isLoading: isLoadingAddresses } = useReadContracts({
    contracts: addressContracts,
    query: {
      enabled: placeCount > 0,
    },
  });

  // Extract place addresses
  const placeAddresses = addresses
    ?.map((result) => result.result as `0x${string}`)
    .filter(Boolean) || [];

  // Batch read all place infos
  const infoContracts = placeAddresses.map((address) => ({
    address,
    abi: USCIABI,
    functionName: 'getPlaceInfo' as const,
  }));

  const { data: infos, isLoading: isLoadingInfos } = useReadContracts({
    contracts: infoContracts,
    query: {
      enabled: placeAddresses.length > 0,
    },
  });

  // Combine addresses and infos - Stabiliser avec useMemo
  const places = useMemo(() => {
    return placeAddresses
      .map((address, index) => {
        const infoResult = infos?.[index];
        if (!infoResult || infoResult.status === 'failure') return null;

        return {
          address,
          info: infoResult.result as PlaceInfo,
        };
      })
      .filter((p): p is PlaceData => p !== null);
  }, [placeAddresses.length, infos]);

  return {
    places,
    isLoading: isLoadingCount || isLoadingAddresses || isLoadingInfos,
  };
}

/**
 * Hook to check if connected wallet is admin
 */
export function useIsAdmin(address: `0x${string}` | undefined) {
  const { data, isLoading } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: USCIFactoryABI,
    functionName: 'admin',
  });

  const adminAddress = data as `0x${string}` | undefined;

  return {
    isAdmin: address && adminAddress ? address.toLowerCase() === adminAddress.toLowerCase() : false,
    adminAddress,
    isLoading,
  };
}

/**
 * Hook to check if connected wallet is team member
 */
export function useIsTeamMember(address: `0x${string}` | undefined) {
  const { data, isLoading } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: USCIFactoryABI,
    functionName: 'isTeamMember',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    isTeamMember: data as boolean | undefined,
    isLoading,
  };
}

/**
 * Hook to get user's puzzle NFTs by reading Transfer events
 */
export function useUserPuzzles(
  userAddress: `0x${string}` | undefined,
  placeAddress: `0x${string}` | undefined
) {
  const [puzzles, setPuzzles] = useState<Array<{ tokenId: bigint; placeAddress: `0x${string}` }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userAddress || !placeAddress) {
      setPuzzles([]);
      setIsLoading(false);
      return;
    }

    async function fetchNFTs() {
      setIsLoading(true);
      try {
        const { createPublicClient, http } = await import('viem');
        const { baseSepolia } = await import('viem/chains');

        const client = createPublicClient({
          chain: baseSepolia,
          transport: http(),
        });

        // Read Transfer events to this user
        const logs = await client.getLogs({
          address: placeAddress,
          event: {
            type: 'event',
            name: 'Transfer',
            inputs: [
              { indexed: true, name: 'from', type: 'address' },
              { indexed: true, name: 'to', type: 'address' },
              { indexed: true, name: 'tokenId', type: 'uint256' },
            ],
          },
          args: {
            to: userAddress,
          },
          fromBlock: 0n,
          toBlock: 'latest',
        });

        // Get current owner for each token (in case user transferred it)
        const nfts: Array<{ tokenId: bigint; placeAddress: `0x${string}` }> = [];

        for (const log of logs) {
          const tokenId = log.args.tokenId as bigint;

          try {
            // Check if user still owns this token
            const owner = await client.readContract({
              address: placeAddress,
              abi: USCIABI,
              functionName: 'ownerOf',
              args: [tokenId],
            }) as `0x${string}`;

            if (owner.toLowerCase() === userAddress.toLowerCase()) {
              nfts.push({ tokenId, placeAddress });
            }
          } catch {
            // Token might not exist or burned, skip
            continue;
          }
        }

        setPuzzles(nfts);
      } catch (error) {
        console.error('Error fetching user NFTs:', error);
        setPuzzles([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchNFTs();
  }, [userAddress, placeAddress]);

  return { puzzles, isLoading };
}

/**
 * Hook to get ALL user's puzzle NFTs across all places
 */
export function useAllUserPuzzles(userAddress: `0x${string}` | undefined) {
  const { places, isLoading: isLoadingPlaces } = useAllPlaces();
  const [allPuzzles, setAllPuzzles] = useState<Array<{ tokenId: bigint; placeAddress: `0x${string}` }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Stabiliser places.length au lieu de places
  const placesCount = places.length;
  const placeAddresses = useMemo(() => places.map(p => p.address), [placesCount]);

  useEffect(() => {
    if (!userAddress || placesCount === 0) {
      setAllPuzzles([]);
      setIsLoading(false);
      return;
    }

    async function fetchAllNFTs() {
      setIsLoading(true);
      try {
        const { createPublicClient, http } = await import('viem');
        const { baseSepolia } = await import('viem/chains');

        const client = createPublicClient({
          chain: baseSepolia,
          transport: http(),
        });

        const allNfts: Array<{ tokenId: bigint; placeAddress: `0x${string}` }> = [];

        // Query all places in parallel
        await Promise.all(
          placeAddresses.map(async (placeAddress) => {
            try {
              const logs = await client.getLogs({
                address: placeAddress,
                event: {
                  type: 'event',
                  name: 'Transfer',
                  inputs: [
                    { indexed: true, name: 'from', type: 'address' },
                    { indexed: true, name: 'to', type: 'address' },
                    { indexed: true, name: 'tokenId', type: 'uint256' },
                  ],
                },
                args: {
                  to: userAddress,
                },
                fromBlock: 0n,
                toBlock: 'latest',
              });

              for (const log of logs) {
                const tokenId = log.args.tokenId as bigint;

                try {
                  const owner = await client.readContract({
                    address: placeAddress,
                    abi: USCIABI,
                    functionName: 'ownerOf',
                    args: [tokenId],
                  }) as `0x${string}`;

                  if (owner.toLowerCase() === userAddress.toLowerCase()) {
                    allNfts.push({ tokenId, placeAddress });
                  }
                } catch {
                  continue;
                }
              }
            } catch (error) {
              console.error(`Error fetching NFTs for place ${placeAddress}:`, error);
            }
          })
        );

        setAllPuzzles(allNfts);
      } catch (error) {
        console.error('Error fetching all user NFTs:', error);
        setAllPuzzles([]);
      } finally {
        setIsLoading(false);
      }
    }

    if (!isLoadingPlaces) {
      fetchAllNFTs();
    }
  }, [userAddress, placesCount, placeAddresses, isLoadingPlaces]);

  return { puzzles: allPuzzles, isLoading: isLoading || isLoadingPlaces };
}

/**
 * Hook to get pending rewards for a token
 */
export function usePendingRewards(
  placeAddress: `0x${string}` | undefined,
  tokenId: bigint | undefined
) {
  const { data, isLoading } = useReadContract({
    address: placeAddress,
    abi: USCIABI,
    functionName: 'calculateClaimable',
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: !!placeAddress && tokenId !== undefined,
    },
  });

  return {
    pendingRewards: data as bigint | undefined,
    isLoading,
  };
}

/**
 * Hook to get total rewards deposited to a place
 */
export function useTotalRewardsDeposited(placeAddress: `0x${string}` | undefined) {
  const { data, isLoading } = useReadContract({
    address: placeAddress,
    abi: USCIABI,
    functionName: 'totalRewardsDeposited',
    query: {
      enabled: !!placeAddress,
    },
  });

  return {
    totalRewardsDeposited: data as bigint | undefined,
    isLoading,
  };
}

/**
 * Hook to get leaderboard data (all investors ranked by total invested)
 */
export function useLeaderboardData() {
  const { places, isLoading: isLoadingPlaces } = useAllPlaces();
  const { price: ethPrice } = useEthPrice();
  const [leaderboardData, setLeaderboardData] = useState<Array<{
    address: string;
    totalInvestedUSD: number;
    totalDividendsEarned: number;
    nftCount: number;
    investments: Array<{ placeName: string; tokenId: string }>;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Stabiliser les dépendances
  const placesCount = places.length;
  const ethPriceUsd = ethPrice.usd;
  const placesData = useMemo(() => places.map(p => ({ address: p.address, name: p.info.name, puzzlePrice: p.info.puzzlePrice })), [placesCount]);

  useEffect(() => {
    if (placesCount === 0 || isLoadingPlaces) {
      setLeaderboardData([]);
      setIsLoading(false);
      return;
    }

    async function fetchLeaderboardData() {
      setIsLoading(true);
      try {
        const { createPublicClient, http } = await import('viem');
        const { baseSepolia } = await import('viem/chains');
        const { formatEther } = await import('viem');

        const client = createPublicClient({
          chain: baseSepolia,
          transport: http(),
        });

        // Map to aggregate investor data
        const investorMap = new Map<string, {
          totalInvestedUSD: number;
          totalDividendsEarned: number;
          nftCount: number;
          investments: Array<{ placeName: string; tokenId: string }>;
        }>();

        // Query all places in parallel
        await Promise.all(
          placesData.map(async (place) => {
            try {
              const logs = await client.getLogs({
                address: place.address,
                event: {
                  type: 'event',
                  name: 'Transfer',
                  inputs: [
                    { indexed: true, name: 'from', type: 'address' },
                    { indexed: true, name: 'to', type: 'address' },
                    { indexed: true, name: 'tokenId', type: 'uint256' },
                  ],
                },
                fromBlock: 0n,
                toBlock: 'latest',
              });

              // Get current owners for all tokens
              for (const log of logs) {
                const tokenId = log.args.tokenId as bigint;

                try {
                  const owner = await client.readContract({
                    address: place.address,
                    abi: USCIABI,
                    functionName: 'ownerOf',
                    args: [tokenId],
                  }) as `0x${string}`;

                  const ownerLower = owner.toLowerCase();

                  // Calculate investment value
                  const puzzlePriceETH = parseFloat(formatEther(place.puzzlePrice));
                  const puzzlePriceUSD = puzzlePriceETH * ethPriceUsd;

                  // Add to investor map
                  if (!investorMap.has(ownerLower)) {
                    investorMap.set(ownerLower, {
                      totalInvestedUSD: 0,
                      totalDividendsEarned: 0,
                      nftCount: 0,
                      investments: [],
                    });
                  }

                  const investorData = investorMap.get(ownerLower)!;
                  investorData.totalInvestedUSD += puzzlePriceUSD;
                  investorData.nftCount += 1;
                  investorData.investments.push({
                    placeName: place.name,
                    tokenId: tokenId.toString(),
                  });
                } catch {
                  // Token might not exist or burned, skip
                  continue;
                }
              }
            } catch (error) {
              console.error(`Error fetching leaderboard data for place ${place.address}:`, error);
            }
          })
        );

        // Convert map to array and sort by totalInvestedUSD descending
        const leaderboard = Array.from(investorMap.entries())
          .map(([address, data]) => ({
            address,
            ...data,
          }))
          .sort((a, b) => b.totalInvestedUSD - a.totalInvestedUSD);

        setLeaderboardData(leaderboard);
      } catch (error) {
        console.error('Error fetching leaderboard data:', error);
        setLeaderboardData([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLeaderboardData();
  }, [placesCount, placesData, ethPriceUsd, isLoadingPlaces]);

  return { leaderboardData, isLoading: isLoading || isLoadingPlaces };
}
