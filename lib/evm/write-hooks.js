/**
 * CantorFi Protocol - Write Hooks
 * Les opérations sont sur les Vaults individuels, pas sur le Protocol
 */

'use client';

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { VAULT_ABI, ERC20_ABI } from './abis';

// Lock config par défaut (pas de lock)
const DEFAULT_LOCK_CONFIG = {
  hasLock: false,
  lockDurationSeconds: BigInt(0),
  canWithdrawEarly: true,
  earlyWithdrawalFee: BigInt(0),
};

/**
 * Hook pour supply dans un vault
 * @param {`0x${string}`} vaultAddress
 */
export function useSupply(vaultAddress) {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const supply = (amount, decimals = 6, lockConfig = DEFAULT_LOCK_CONFIG) => {
    const amountBigInt = parseUnits(amount, decimals);
    writeContract({
      address: vaultAddress,
      abi: VAULT_ABI,
      functionName: 'supply',
      args: [amountBigInt, lockConfig],
    });
  };

  return { supply, isPending: isPending || isConfirming, hash, error, isSuccess };
}

/**
 * Hook pour withdraw d'un vault
 * @param {`0x${string}`} vaultAddress
 */
export function useWithdraw(vaultAddress) {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const withdraw = (amount, decimals = 6) => {
    const amountBigInt = parseUnits(amount, decimals);
    writeContract({
      address: vaultAddress,
      abi: VAULT_ABI,
      functionName: 'withdraw',
      args: [amountBigInt],
    });
  };

  return { withdraw, isPending: isPending || isConfirming, hash, error, isSuccess };
}

/**
 * Hook pour borrow d'un vault
 * @param {`0x${string}`} vaultAddress
 */
export function useBorrow(vaultAddress) {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const borrow = (amount, decimals = 6) => {
    const amountBigInt = parseUnits(amount, decimals);
    writeContract({
      address: vaultAddress,
      abi: VAULT_ABI,
      functionName: 'borrow',
      args: [amountBigInt],
    });
  };

  return { borrow, isPending: isPending || isConfirming, hash, error, isSuccess };
}

/**
 * Hook pour repay un emprunt
 * @param {`0x${string}`} vaultAddress
 */
export function useRepayBorrow(vaultAddress) {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const repayBorrow = (amount, decimals = 6) => {
    const amountBigInt = parseUnits(amount, decimals);
    writeContract({
      address: vaultAddress,
      abi: VAULT_ABI,
      functionName: 'repayBorrow',
      args: [amountBigInt],
    });
  };

  return { repayBorrow, isPending: isPending || isConfirming, hash, error, isSuccess };
}

/**
 * Hook pour claim les intérêts
 * @param {`0x${string}`} vaultAddress
 */
export function useClaimInterest(vaultAddress) {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claimInterest = () => {
    writeContract({
      address: vaultAddress,
      abi: VAULT_ABI,
      functionName: 'claimInterest',
    });
  };

  return { claimInterest, isPending: isPending || isConfirming, hash, error, isSuccess };
}

/**
 * Hook pour approve un token ERC20
 * @param {`0x${string}`} tokenAddress
 */
export function useApproveToken(tokenAddress) {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approve = (spender, amount) => {
    writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spender, amount],
    });
  };

  return { approve, isPending: isPending || isConfirming, hash, error, isSuccess };
}
