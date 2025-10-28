/**
 * EVM Hooks avec Wagmi
 */

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { createPublicClient, http, formatEther } from 'viem';
import { baseSepolia } from 'viem/chains';
import { FACTORY_ADDRESS, BLOCK_EXPLORER_URL } from './constants';
import { USCIFactoryABI, USCIABI } from './abis';
import { PlaceData, PlaceInfo } from './adapters';
import { useEthPrice } from './useEthPrice';

// Re-export useEthPrice
export { useEthPrice };
// Re-export constants
export { BLOCK_EXPLORER_URL };

// Client Viem public pour lecture
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

/**
 * Hook pour obtenir l'adresse du wallet connecté
 */
export function useWalletAddress() {
  const { address, isConnected } = useAccount();
  return { address, isConnected };
}

/**
 * Hook pour obtenir le nombre de places
 */
export function usePlaceCount() {
  const [placeCount, setPlaceCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCount() {
      try {
        const count = await publicClient.readContract({
          address: FACTORY_ADDRESS,
          abi: USCIFactoryABI,
          functionName: 'placeCount',
        });
        setPlaceCount(Number(count));
      } catch (error) {
        console.error('Error fetching place count:', error);
        setPlaceCount(0);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCount();
  }, []);

  return { placeCount, isLoading };
}

/**
 * Hook pour obtenir toutes les places
 */
export function useAllPlaces() {
  const [places, setPlaces] = useState<PlaceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPlaces() {
      setIsLoading(true);
      try {
        // Get place count
        const count = await publicClient.readContract({
          address: FACTORY_ADDRESS,
          abi: USCIFactoryABI,
          functionName: 'placeCount',
        });

        const placeCount = Number(count);
        if (placeCount === 0) {
          setPlaces([]);
          setIsLoading(false);
          return;
        }

        // Get all place addresses
        const addressPromises = Array.from({ length: placeCount }, (_, i) =>
          publicClient.readContract({
            address: FACTORY_ADDRESS,
            abi: USCIFactoryABI,
            functionName: 'getPlaceAddress',
            args: [BigInt(i)],
          })
        );

        const addresses = await Promise.all(addressPromises);

        // Get all place infos
        const infoPromises = addresses.map((addr) =>
          publicClient.readContract({
            address: addr as `0x${string}`,
            abi: USCIABI,
            functionName: 'getPlaceInfo',
          })
        );

        const infos = await Promise.all(infoPromises);

        // Combine
        const placesData: PlaceData[] = addresses
          .map((address, index) => ({
            address: address as `0x${string}`,
            info: infos[index] as PlaceInfo,
          }))
          .filter((p) => p.info !== null);

        setPlaces(placesData);
      } catch (error) {
        console.error('Error fetching places:', error);
        setPlaces([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPlaces();
  }, []);

  return { places, isLoading };
}

/**
 * Hook pour vérifier si l'adresse est admin
 */
export function useIsAdmin(address: `0x${string}` | undefined) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!address) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    async function checkAdmin() {
      try {
        const admin = await publicClient.readContract({
          address: FACTORY_ADDRESS,
          abi: USCIFactoryABI,
          functionName: 'admin',
        });
        setIsAdmin((admin as string).toLowerCase() === address.toLowerCase());
      } catch (error) {
        console.error('Error checking admin:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkAdmin();
  }, [address]);

  return { isAdmin, isLoading };
}

/**
 * Hook pour vérifier si l'adresse est team member
 */
export function useIsTeamMember(address: `0x${string}` | undefined) {
  const [isTeamMember, setIsTeamMember] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!address) {
      setIsTeamMember(false);
      setIsLoading(false);
      return;
    }

    async function checkTeamMember() {
      try {
        const isMember = await publicClient.readContract({
          address: FACTORY_ADDRESS,
          abi: USCIFactoryABI,
          functionName: 'isTeamMember',
          args: [address],
        });
        setIsTeamMember(isMember as boolean);
      } catch (error) {
        console.error('Error checking team member:', error);
        setIsTeamMember(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkTeamMember();
  }, [address]);

  return { isTeamMember, isLoading };
}

/**
 * Hook pour obtenir tous les NFTs d'un utilisateur
 */
export function useAllUserPuzzles(userAddress: `0x${string}` | undefined) {
  const { places, isLoading: isLoadingPlaces } = useAllPlaces();
  const [allPuzzles, setAllPuzzles] = useState<Array<{ tokenId: bigint; placeAddress: `0x${string}` }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userAddress || places.length === 0) {
      setAllPuzzles([]);
      setIsLoading(false);
      return;
    }

    async function fetchAllNFTs() {
      setIsLoading(true);
      try {
        const allNfts: Array<{ tokenId: bigint; placeAddress: `0x${string}` }> = [];

        await Promise.all(
          places.map(async (place) => {
            try {
              const logs = await publicClient.getLogs({
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
                args: { to: userAddress },
                fromBlock: 0n,
                toBlock: 'latest',
              });

              for (const log of logs) {
                const tokenId = log.args.tokenId as bigint;
                try {
                  const owner = (await publicClient.readContract({
                    address: place.address,
                    abi: USCIABI,
                    functionName: 'ownerOf',
                    args: [tokenId],
                  })) as `0x${string}`;

                  if (owner.toLowerCase() === userAddress.toLowerCase()) {
                    allNfts.push({ tokenId, placeAddress: place.address });
                  }
                } catch {
                  continue;
                }
              }
            } catch (error) {
              console.error(`Error fetching NFTs for place ${place.address}:`, error);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAddress, places.length, isLoadingPlaces]);

  return { puzzles: allPuzzles, isLoading: isLoading || isLoadingPlaces };
}

/**
 * Hook leaderboard data
 */
export function useLeaderboardData() {
  const { places, isLoading: isLoadingPlaces } = useAllPlaces();
  const { price: ethPrice } = useEthPrice();
  const [leaderboardData, setLeaderboardData] = useState<
    Array<{
      address: string;
      totalInvestedUSD: number;
      totalDividendsEarned: number;
      nftCount: number;
      investments: Array<{ placeName: string; tokenId: string }>;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (places.length === 0 || isLoadingPlaces) {
      setLeaderboardData([]);
      setIsLoading(false);
      return;
    }

    async function fetchLeaderboardData() {
      setIsLoading(true);
      try {
        const investorMap = new Map<
          string,
          {
            totalInvestedUSD: number;
            totalDividendsEarned: number;
            nftCount: number;
            investments: Array<{ placeName: string; tokenId: string }>;
          }
        >();

        await Promise.all(
          places.map(async (place) => {
            try {
              const logs = await publicClient.getLogs({
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

              for (const log of logs) {
                const tokenId = log.args.tokenId as bigint;
                try {
                  const owner = (await publicClient.readContract({
                    address: place.address,
                    abi: USCIABI,
                    functionName: 'ownerOf',
                    args: [tokenId],
                  })) as `0x${string}`;

                  const ownerLower = owner.toLowerCase();
                  const puzzlePriceETH = parseFloat(formatEther(place.info.puzzlePrice));
                  const puzzlePriceUSD = puzzlePriceETH * ethPrice.usd;

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
                    placeName: place.info.name,
                    tokenId: tokenId.toString(),
                  });
                } catch {
                  continue;
                }
              }
            } catch (error) {
              console.error(`Error fetching leaderboard data for place ${place.address}:`, error);
            }
          })
        );

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places.length, ethPrice.usd, isLoadingPlaces]);

  return { leaderboardData, isLoading: isLoading || isLoadingPlaces };
}
