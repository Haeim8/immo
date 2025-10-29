/**
 * Write hooks pour les transactions - Utilise Wagmi
 */

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { FACTORY_ADDRESS } from './constants';
import { USCIFactoryABI, USCIABI } from './abis';

/**
 * Hook pour créer une place
 */
export interface CreatePlaceParams {
  assetType: string;
  name: string;
  city: string;
  province: string;
  country: string;
  totalPuzzles: number;
  puzzlePrice: bigint;
  saleDurationSeconds: number;
  surface: number;
  rooms: number;
  expectedReturnBps: number;
  placeType: string;
  yearBuilt: number;
  imageCid: string;
  metadataCid: string;
  votingEnabled: boolean;
}

export function useCreatePlace() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createPlace = (params: CreatePlaceParams) => {
    writeContract({
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
        params.puzzlePrice,
        BigInt(params.saleDurationSeconds),
        params.surface,
        params.rooms,
        params.expectedReturnBps,
        params.placeType,
        params.yearBuilt,
        params.imageCid,
        params.metadataCid,
        params.votingEnabled,
      ],
    });
  };

  return { createPlace, isPending: isPending || isConfirming, hash, error, isSuccess };
}

/**
 * Hook pour ajouter un team member
 */
export function useAddTeamMember() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const addTeamMember = (memberAddress: `0x${string}`) => {
    writeContract({
      address: FACTORY_ADDRESS,
      abi: USCIFactoryABI,
      functionName: 'addTeamMember',
      args: [memberAddress],
    });
  };

  return { addTeamMember, isPending: isPending || isConfirming, hash, error, isSuccess };
}

/**
 * Hook pour retirer un team member
 */
export function useRemoveTeamMember() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const removeTeamMember = (memberAddress: `0x${string}`) => {
    writeContract({
      address: FACTORY_ADDRESS,
      abi: USCIFactoryABI,
      functionName: 'removeTeamMember',
      args: [memberAddress],
    });
  };

  return { removeTeamMember, isPending: isPending || isConfirming, hash, error, isSuccess };
}

/**
 * Hook pour déposer des rewards
 */
export function useDepositRewards() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const depositRewards = (placeAddress: `0x${string}`, amount: bigint) => {
    writeContract({
      address: placeAddress,
      abi: USCIABI,
      functionName: 'depositRewards',
      value: amount,
    });
  };

  return { depositRewards, isPending: isPending || isConfirming, hash, error, isSuccess };
}

/**
 * Hook pour fermer la vente
 */
export function useCloseSale() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const closeSale = (placeAddress: `0x${string}`) => {
    writeContract({
      address: placeAddress,
      abi: USCIABI,
      functionName: 'closeSale',
    });
  };

  return { closeSale, isPending: isPending || isConfirming, hash, error, isSuccess };
}

/**
 * Hook pour compléter une place (liquidation)
 */
export function useCompletPlace() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const completePlace = (placeAddress: `0x${string}`, amount: bigint) => {
    writeContract({
      address: placeAddress,
      abi: USCIABI,
      functionName: 'complete',
      value: amount,
    });
  };

  return {
    completePlace,
    completPlace: completePlace,
    isPending: isPending || isConfirming,
    hash,
    error,
    isSuccess,
  };
}

export const useCompletePlace = useCompletPlace;

/**
 * Hook pour claim rewards
 */
export function useClaimRewards() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claimRewards = (placeAddress: `0x${string}`, tokenId: bigint) => {
    writeContract({
      address: placeAddress,
      abi: USCIABI,
      functionName: 'claimRewards',
      args: [tokenId],
    });
  };

  return { claimRewards, isPending: isPending || isConfirming, hash, error, isSuccess };
}

/**
 * Hook pour acheter un puzzle
 */
export function useBuyPuzzle() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const buyPuzzle = (placeAddress: `0x${string}`, puzzlePrice: bigint) => {
    writeContract({
      address: placeAddress,
      abi: USCIABI,
      functionName: 'takePuzzle',
      value: puzzlePrice,
    });
  };

  return { buyPuzzle, isPending: isPending || isConfirming, hash, error, isSuccess };
}

/**
 * Hook pour créer une proposition
 */
export function useCreateProposal() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createProposal = (
    placeAddress: `0x${string}`,
    title: string,
    description: string,
    votingDuration: bigint
  ) => {
    writeContract({
      address: placeAddress,
      abi: USCIABI,
      functionName: 'createProposal',
      args: [title, description, votingDuration],
    });
  };

  return { createProposal, isPending: isPending || isConfirming, hash, error, isSuccess };
}

/**
 * Hook pour voter
 */
export function useCastVote() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const castVote = (
    placeAddress: `0x${string}`,
    proposalId: bigint,
    tokenId: bigint,
    vote: boolean
  ) => {
    writeContract({
      address: placeAddress,
      abi: USCIABI,
      functionName: 'castVote',
      args: [proposalId, tokenId, vote],
    });
  };

  return { castVote, isPending: isPending || isConfirming, hash, error, isSuccess };
}

/**
 * Hook pour fermer une proposition
 */
export function useCloseProposal() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const closeProposal = (placeAddress: `0x${string}`, proposalId: bigint) => {
    writeContract({
      address: placeAddress,
      abi: USCIABI,
      functionName: 'closeProposal',
      args: [proposalId],
    });
  };

  return { closeProposal, isPending: isPending || isConfirming, hash, error, isSuccess };
}
