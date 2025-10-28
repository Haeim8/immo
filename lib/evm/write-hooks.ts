/**
 * Write hooks pour les transactions - Utilise Privy directement
 */

import { useState } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { FACTORY_ADDRESS } from './constants';
import { USCIFactoryABI, USCIABI } from './abis';

/**
 * Hook générique pour écrire sur un contrat
 */
function useContractWrite() {
  const { wallets } = useWallets();
  const [isPending, setIsPending] = useState(false);
  const [hash, setHash] = useState<string | undefined>();
  const [error, setError] = useState<Error | null>(null);

  const writeContract = async (params: {
    address: `0x${string}`;
    abi: any;
    functionName: string;
    args?: any[];
    value?: bigint;
  }) => {
    setIsPending(true);
    setError(null);

    try {
      if (!wallets || wallets.length === 0) {
        throw new Error('No wallet connected');
      }

      const wallet = wallets[0];
      await wallet.switchChain(84532); // Base Sepolia

      const provider = await wallet.getEthersProvider();
      const signer = provider.getSigner();

      const { ethers } = await import('ethers');
      const contract = new ethers.Contract(params.address, params.abi, await signer);

      const tx = await contract[params.functionName](...(params.args || []), {
        value: params.value || 0,
      });

      setHash(tx.hash);
      await tx.wait();

      return tx;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { writeContract, isPending, hash, error };
}

/**
 * Hook pour créer une place
 */
export function useCreatePlace() {
  const { writeContract, isPending, hash, error } = useContractWrite();

  const createPlace = async (params: {
    name: string;
    city: string;
    province: string;
    surface: number;
    rooms: number;
    propertyType: string;
    yearBuilt: number;
    totalPuzzles: number;
    puzzlePrice: bigint;
    expectedReturn: number;
    saleDuration: number;
    imageCid: string;
    metadataCid: string;
    votingEnabled: boolean;
  }) => {
    return writeContract({
      address: FACTORY_ADDRESS,
      abi: USCIFactoryABI,
      functionName: 'createPlace',
      args: [
        params.name,
        params.city,
        params.province,
        params.surface,
        params.rooms,
        params.propertyType,
        params.yearBuilt,
        params.totalPuzzles,
        params.puzzlePrice,
        params.expectedReturn,
        params.saleDuration,
        params.imageCid,
        params.metadataCid,
        params.votingEnabled,
      ],
    });
  };

  return { createPlace, isPending, hash, error };
}

/**
 * Hook pour ajouter un team member
 */
export function useAddTeamMember() {
  const { writeContract, isPending, hash, error } = useContractWrite();

  const addTeamMember = async (memberAddress: `0x${string}`) => {
    return writeContract({
      address: FACTORY_ADDRESS,
      abi: USCIFactoryABI,
      functionName: 'addTeamMember',
      args: [memberAddress],
    });
  };

  return { addTeamMember, isPending, hash, error };
}

/**
 * Hook pour retirer un team member
 */
export function useRemoveTeamMember() {
  const { writeContract, isPending, hash, error } = useContractWrite();

  const removeTeamMember = async (memberAddress: `0x${string}`) => {
    return writeContract({
      address: FACTORY_ADDRESS,
      abi: USCIFactoryABI,
      functionName: 'removeTeamMember',
      args: [memberAddress],
    });
  };

  return { removeTeamMember, isPending, hash, error };
}

/**
 * Hook pour déposer des rewards
 */
export function useDepositRewards() {
  const { writeContract, isPending, hash, error } = useContractWrite();

  const depositRewards = async (placeAddress: `0x${string}`, amount: bigint) => {
    return writeContract({
      address: placeAddress,
      abi: USCIABI,
      functionName: 'depositRewards',
      value: amount,
    });
  };

  return { depositRewards, isPending, hash, error };
}

/**
 * Hook pour fermer la vente
 */
export function useCloseSale() {
  const { writeContract, isPending, hash, error } = useContractWrite();

  const closeSale = async (placeAddress: `0x${string}`) => {
    return writeContract({
      address: placeAddress,
      abi: USCIABI,
      functionName: 'closeSale',
    });
  };

  return { closeSale, isPending, hash, error };
}

/**
 * Hook pour compléter une place (liquidation)
 */
export function useCompletPlace() {
  const { writeContract, isPending, hash, error } = useContractWrite();

  const completPlace = async (placeAddress: `0x${string}`, amount: bigint) => {
    return writeContract({
      address: placeAddress,
      abi: USCIABI,
      functionName: 'complete',
      value: amount,
    });
  };

  return { completPlace, isPending, hash, error };
}

/**
 * Hook pour claim rewards
 */
export function useClaimRewards() {
  const { writeContract, isPending, hash, error } = useContractWrite();

  const claimRewards = async (placeAddress: `0x${string}`, tokenId: bigint) => {
    return writeContract({
      address: placeAddress,
      abi: USCIABI,
      functionName: 'claimRewards',
      args: [tokenId],
    });
  };

  return { claimRewards, isPending, hash, error };
}

/**
 * Hook pour acheter un puzzle
 */
export function useBuyPuzzle() {
  const { writeContract, isPending, hash, error } = useContractWrite();

  const buyPuzzle = async (placeAddress: `0x${string}`, puzzlePrice: bigint) => {
    return writeContract({
      address: placeAddress,
      abi: USCIABI,
      functionName: 'takePuzzle',
      value: puzzlePrice,
    });
  };

  return { buyPuzzle, isPending, hash, error };
}

/**
 * Hook pour créer une proposition
 */
export function useCreateProposal() {
  const { writeContract, isPending, hash, error } = useContractWrite();

  const createProposal = async (
    placeAddress: `0x${string}`,
    title: string,
    description: string,
    votingDuration: bigint
  ) => {
    return writeContract({
      address: placeAddress,
      abi: USCIABI,
      functionName: 'createProposal',
      args: [title, description, votingDuration],
    });
  };

  return { createProposal, isPending, hash, error };
}

/**
 * Hook pour voter
 */
export function useCastVote() {
  const { writeContract, isPending, hash, error } = useContractWrite();

  const castVote = async (
    placeAddress: `0x${string}`,
    proposalId: bigint,
    tokenId: bigint,
    vote: boolean
  ) => {
    return writeContract({
      address: placeAddress,
      abi: USCIABI,
      functionName: 'castVote',
      args: [proposalId, tokenId, vote],
    });
  };

  return { castVote, isPending, hash, error };
}

/**
 * Hook pour fermer une proposition
 */
export function useCloseProposal() {
  const { writeContract, isPending, hash, error } = useContractWrite();

  const closeProposal = async (placeAddress: `0x${string}`, proposalId: bigint) => {
    return writeContract({
      address: placeAddress,
      abi: USCIABI,
      functionName: 'closeProposal',
      args: [proposalId],
    });
  };

  return { closeProposal, isPending, hash, error };
}
