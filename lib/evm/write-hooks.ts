/**
 * EVM Write Hooks for admin functions
 */

import { useWriteContract } from 'wagmi';
import { parseEther } from 'viem';
import { FACTORY_ADDRESS } from './constants';
import { USCIFactoryABI, USCIABI } from './abis';

/**
 * Hook to create a new place
 */
export function useCreatePlace() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const createPlace = async (params: {
    assetType: string;
    name: string;
    city: string;
    province: string;
    country: string;
    totalPuzzles: number;
    puzzlePrice: string; // in ETH
    saleDuration: number; // in days
    surface: number;
    rooms: number;
    expectedReturn: number; // percentage (5.5 = 5.5%)
    propertyType: string;
    yearBuilt: number;
    imageCid: string;
    metadataCid: string;
    votingEnabled: boolean;
  }) => {
    const puzzlePriceWei = parseEther(params.puzzlePrice);
    const saleDurationSeconds = params.saleDuration * 24 * 60 * 60;
    const expectedReturnBasisPoints = Math.floor(params.expectedReturn * 100);

    return await writeContract({
      address: FACTORY_ADDRESS,
      abi: USCIFactoryABI,
      functionName: 'createPlace',
      args: [
        params.assetType,
        params.name,
        params.city,
        params.province,
        params.country,
        BigInt(params.totalPuzzles),
        puzzlePriceWei,
        BigInt(saleDurationSeconds),
        params.surface,
        params.rooms,
        expectedReturnBasisPoints,
        params.propertyType,
        params.yearBuilt,
        params.imageCid,
        params.metadataCid,
        params.votingEnabled,
      ],
    });
  };

  return { createPlace, hash, isPending, error };
}

/**
 * Hook to add team member
 */
export function useAddTeamMember() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const addTeamMember = async (memberAddress: `0x${string}`) => {
    return await writeContract({
      address: FACTORY_ADDRESS,
      abi: USCIFactoryABI,
      functionName: 'addTeamMember',
      args: [memberAddress],
    });
  };

  return { addTeamMember, hash, isPending, error };
}

/**
 * Hook to remove team member
 */
export function useRemoveTeamMember() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const removeTeamMember = async (memberAddress: `0x${string}`) => {
    return await writeContract({
      address: FACTORY_ADDRESS,
      abi: USCIFactoryABI,
      functionName: 'removeTeamMember',
      args: [memberAddress],
    });
  };

  return { removeTeamMember, hash, isPending, error };
}

/**
 * Hook to deposit rewards to a place
 */
export function useDepositRewards() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const depositRewards = async (placeAddress: `0x${string}`, amountEth: string) => {
    const amountWei = parseEther(amountEth);

    return await writeContract({
      address: placeAddress,
      abi: USCIABI,
      functionName: 'depositRewards',
      value: amountWei,
    });
  };

  return { depositRewards, hash, isPending, error };
}

/**
 * Hook to create governance proposal
 */
export function useCreateProposal() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const createProposal = async (
    placeAddress: `0x${string}`,
    title: string,
    description: string,
    durationHours: number
  ) => {
    const durationSeconds = durationHours * 60 * 60;

    return await writeContract({
      address: placeAddress,
      abi: USCIABI,
      functionName: 'createProposal',
      args: [title, description, BigInt(durationSeconds)],
    });
  };

  return { createProposal, hash, isPending, error };
}

/**
 * Hook to close proposal
 */
export function useCloseProposal() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const closeProposal = async (
    placeAddress: `0x${string}`,
    proposalId: number | bigint
  ) => {
    const id = typeof proposalId === 'bigint' ? proposalId : BigInt(proposalId);

    return await writeContract({
      address: placeAddress,
      abi: USCIABI,
      functionName: 'closeProposal',
      args: [id],
    });
  };

  return { closeProposal, hash, isPending, error };
}

/**
 * Hook to close sale manually
 */
export function useCloseSale() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const closeSale = async (placeAddress: `0x${string}`) => {
    return await writeContract({
      address: placeAddress,
      abi: USCIABI,
      functionName: 'closeSale',
    });
  };

  return { closeSale, hash, isPending, error };
}

/**
 * Hook to complete place (final distribution)
 */
export function useCompletPlace() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const completePlace = async (placeAddress: `0x${string}`, amountEth: string) => {
    const amountWei = parseEther(amountEth);

    return await writeContract({
      address: placeAddress,
      abi: USCIABI,
      functionName: 'complete',
      value: amountWei,
    });
  };

  return { completePlace, hash, isPending, error };
}

/**
 * Hook to pause/unpause factory
 */
export function usePauseFactory() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const pauseFactory = async () => {
    return await writeContract({
      address: FACTORY_ADDRESS,
      abi: USCIFactoryABI,
      functionName: 'pause',
    });
  };

  const unpauseFactory = async () => {
    return await writeContract({
      address: FACTORY_ADDRESS,
      abi: USCIFactoryABI,
      functionName: 'unpause',
    });
  };

  return { pauseFactory, unpauseFactory, hash, isPending, error };
}

/**
 * Hook to pause/unpause place
 */
export function usePausePlace() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const pausePlace = async (placeAddress: `0x${string}`) => {
    return await writeContract({
      address: placeAddress,
      abi: USCIABI,
      functionName: 'pause',
    });
  };

  const unpausePlace = async (placeAddress: `0x${string}`) => {
    return await writeContract({
      address: placeAddress,
      abi: USCIABI,
      functionName: 'unpause',
    });
  };

  return { pausePlace, unpausePlace, hash, isPending, error };
}

/**
 * Hook to claim rewards for a specific token
 */
export function useClaimRewards() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const claimRewards = async (placeAddress: `0x${string}`, tokenId: number) => {
    return await writeContract({
      address: placeAddress,
      abi: USCIABI,
      functionName: 'claimRewards',
      args: [BigInt(tokenId)],
    });
  };

  return { claimRewards, hash, isPending, error };
}

/**
 * Hook to buy a puzzle
 */
export function useBuyPuzzle() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const buyPuzzle = async (placeAddress: `0x${string}`, puzzlePrice: bigint) => {
    const result = await writeContract({
      address: placeAddress,
      abi: USCIABI,
      functionName: 'takePuzzle',
      value: puzzlePrice,
    });
    return result;
  };

  return { buyPuzzle, hash, isPending, error };
}

export function useClaimCompletion() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const claimCompletion = async (placeAddress: `0x${string}`, tokenId: number) => {
    return await writeContract({
      address: placeAddress,
      abi: USCIABI,
      functionName: 'claimCompletion',
      args: [BigInt(tokenId)],
    });
  };

  return { claimCompletion, hash, isPending, error };
}

/**
 * Hook to cast a vote on a proposal
 */
export function useCastVote() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const castVote = async (
    placeAddress: `0x${string}`,
    proposalId: number | bigint,
    tokenId: number | bigint,
    vote: boolean
  ) => {
    const proposal = typeof proposalId === 'bigint' ? proposalId : BigInt(proposalId);
    const token = typeof tokenId === 'bigint' ? tokenId : BigInt(tokenId);

    return await writeContract({
      address: placeAddress,
      abi: USCIABI,
      functionName: 'castVote',
      args: [proposal, token, vote],
    });
  };

  return { castVote, hash, isPending, error };
}
