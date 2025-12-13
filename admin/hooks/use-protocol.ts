"use client";

import { useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { CONTRACTS, PROTOCOL_ABI, FEE_COLLECTOR_ABI, VAULT_ABI, ERC20_ABI } from "@/lib/contracts";
import { formatUnits } from "viem";

type TokenMeta = { symbol: string; decimals: number };

function isValidAddress(value: string | undefined): value is `0x${string}` {
  return !!value && /^0x[a-fA-F0-9]{40}$/.test(value);
}

// Read global stats by aggregating from protocol and vaults
export function useGlobalStats() {
  const { isConnected } = useAccount();

  // First get vault count from protocol
  const { data: vaultCountData, isLoading: isLoadingCount } = useReadContract({
    address: CONTRACTS.protocol as `0x${string}`,
    abi: PROTOCOL_ABI,
    functionName: "vaultCount",
    query: {
      enabled: isConnected,
      retry: 1,
      staleTime: 30000,
      gcTime: 60000,
    },
  });

  // Get fee stats from fee collector
  const { data: feeData, isLoading: isLoadingFees, error, refetch } = useReadContract({
    address: CONTRACTS.feeCollector as `0x${string}`,
    abi: FEE_COLLECTOR_ABI,
    functionName: "getFeeStats",
    args: [CONTRACTS.usdc],
    query: {
      enabled: isConnected,
      retry: 1,
      staleTime: 30000,
      gcTime: 60000,
    },
  });

  const isLoading = isLoadingCount || isLoadingFees;

  let stats = null;

  try {
    const totalVaults = vaultCountData ? Number(vaultCountData) : 0;

    if (feeData && Array.isArray(feeData)) {
      stats = {
        totalVaults,
        totalSupplied: "0", // Will be aggregated from vaults when we have them
        totalBorrowed: "0",
        totalRevenuesDistributed: formatUnits(feeData[1] || BigInt(0), 6),
        totalCapitalRepaid: "0",
        activeVaults: totalVaults, // Assume all are active for now
        averageAPY: "0",
        totalFeesCollected: formatUnits(feeData[0] || BigInt(0), 6),
        availableFees: formatUnits(feeData[2] || BigInt(0), 6),
      };
    } else {
      stats = {
        totalVaults,
        totalSupplied: "0",
        totalBorrowed: "0",
        totalRevenuesDistributed: "0",
        totalCapitalRepaid: "0",
        activeVaults: totalVaults,
        averageAPY: "0",
        totalFeesCollected: "0",
        availableFees: "0",
      };
    }
  } catch (e) {
    console.error("Error parsing global stats:", e);
  }

  return { stats, isLoading, error, refetch };
}

// Read all vaults from protocol contract
export function useVaults(offset = 0, limit = 100) {
  const { isConnected } = useAccount();

  // Get vault addresses from protocol
  const { data: vaultAddresses, isLoading: isLoadingAddresses, error: addressError, refetch } = useReadContract({
    address: CONTRACTS.protocol as `0x${string}`,
    abi: PROTOCOL_ABI,
    functionName: "getAllVaults",
    args: [BigInt(offset), BigInt(limit)],
    query: {
      enabled: isConnected,
      retry: 1,
      staleTime: 30000,
      gcTime: 60000,
    },
  });

  // Build contracts array for reading vault info, state, and token
  const vaultContracts = vaultAddresses && Array.isArray(vaultAddresses)
    ? vaultAddresses.flatMap((addr: string) => [
        {
          address: addr as `0x${string}`,
          abi: VAULT_ABI,
          functionName: "vaultInfo" as const,
        },
        {
          address: addr as `0x${string}`,
          abi: VAULT_ABI,
          functionName: "vaultState" as const,
        },
        {
          address: addr as `0x${string}`,
          abi: VAULT_ABI,
          functionName: "token" as const,
        },
      ])
    : [];

  const { data: vaultData, isLoading: isLoadingVaults, error: vaultError } = useReadContracts({
    contracts: vaultContracts,
    query: {
      enabled: isConnected && vaultContracts.length > 0,
      retry: 1,
      staleTime: 30000,
      gcTime: 60000,
    },
  });

  // Build a list of unique token addresses from the vault token() calls
  const tokenAddresses = (() => {
    const unique = new Set<string>();
    if (!vaultAddresses || !Array.isArray(vaultAddresses) || !vaultData) return [];
    vaultAddresses.forEach((_addr: string, index: number) => {
      const tokenResult = vaultData[index * 3 + 2];
      const tokenAddress = tokenResult?.result as string | undefined;
      if (isValidAddress(tokenAddress)) unique.add(tokenAddress.toLowerCase());
    });
    return Array.from(unique);
  })();

  const tokenContracts = tokenAddresses.flatMap((tokenAddress) => [
    { address: tokenAddress as `0x${string}`, abi: ERC20_ABI, functionName: "symbol" as const },
    { address: tokenAddress as `0x${string}`, abi: ERC20_ABI, functionName: "decimals" as const },
  ]);

  const { data: tokenMetaData, isLoading: isLoadingTokens, error: tokenError } = useReadContracts({
    contracts: tokenContracts,
    query: {
      enabled: isConnected && tokenContracts.length > 0,
      retry: 1,
      staleTime: 30000,
      gcTime: 60000,
    },
  });

  const isLoading = isLoadingAddresses || isLoadingVaults || isLoadingTokens;
  const error = addressError || vaultError || tokenError;

  const tokenMetaMap = (() => {
    const map = new Map<string, TokenMeta>();
    if (!tokenMetaData || tokenAddresses.length === 0) return map;
    tokenAddresses.forEach((tokenAddress, idx) => {
      const symbolResult = tokenMetaData[idx * 2];
      const decimalsResult = tokenMetaData[idx * 2 + 1];
      const symbol = (symbolResult?.result as string | undefined) ?? "UNKNOWN";
      const decimals = Number(decimalsResult?.result ?? 18);
      map.set(tokenAddress.toLowerCase(), { symbol, decimals });
    });
    return map;
  })();

  let vaults: any[] = [];

  try {
    if (vaultAddresses && Array.isArray(vaultAddresses) && vaultData) {
      vaults = vaultAddresses.map((addr: string, index: number) => {
        const infoResult = vaultData[index * 3];
        const stateResult = vaultData[index * 3 + 1];
        const tokenResult = vaultData[index * 3 + 2];

        const info = infoResult?.result as any;
        const state = stateResult?.result as any;
        const tokenAddress = tokenResult?.result as string;

        if (!info) return null;

        const tokenMeta = tokenMetaMap.get(tokenAddress?.toLowerCase());
        const decimals = tokenMeta?.decimals ?? 18;
        const tokenSymbol = tokenMeta?.symbol ?? "UNKNOWN";

        return {
          id: Number(info[0] || index), // vaultId
          vaultAddress: addr,
          tokenAddress: tokenAddress || "",
          tokenSymbol,
          decimals,
          // New VaultInfo structure
          maxLiquidity: formatUnits(info[1] || BigInt(0), decimals), // maxLiquidity
          borrowBaseRate: (Number(info[2] || 0) / 100).toFixed(2), // borrowBaseRate (bps to %)
          borrowSlope: (Number(info[3] || 0) / 100).toFixed(2), // borrowSlope (bps to %)
          maxBorrowRatio: (Number(info[4] || 0) / 100).toFixed(2), // maxBorrowRatio (bps to %)
          liquidationBonus: (Number(info[5] || 0) / 100).toFixed(2), // liquidationBonus (bps to %)
          isActive: info[6] || false, // isActive
          createdAt: info[7] ? new Date(Number(info[7]) * 1000) : new Date(), // createdAt
          treasury: info[8] || "", // treasury
          // VaultState
          totalSupplied: state ? formatUnits(state[0] || BigInt(0), decimals) : "0", // totalSupplied
          totalBorrowed: state ? formatUnits(state[1] || BigInt(0), decimals) : "0", // totalBorrowed
          availableLiquidity: state ? formatUnits(state[2] || BigInt(0), decimals) : "0", // availableLiquidity
          utilizationRate: state ? (Number(state[3] || 0) / 100).toFixed(2) : "0", // utilizationRate (bps to %)
          totalInterestCollected: state ? formatUnits(state[4] || BigInt(0), decimals) : "0", // totalInterestCollected
          lastInterestUpdate: state && state[5] ? new Date(Number(state[5]) * 1000) : null, // lastInterestUpdate
          totalBadDebt: state ? formatUnits(state[6] || BigInt(0), decimals) : "0", // totalBadDebt
          // Calculated fields
          status: info[6] ? "Active" : "Inactive",
          fundingProgress: info[1] && state?.[0]
            ? ((Number(state[0]) / Number(info[1])) * 100).toFixed(2)
            : "0",
        };
      }).filter(Boolean);
    }
  } catch (e) {
    console.error("Error parsing vaults:", e);
  }

  return { vaults, isLoading, error, refetch };
}

// Read single vault data
export function useVaultData(vaultAddress: string) {
  const { isConnected } = useAccount();

  const { data: infoData, isLoading: isLoadingInfo, error: infoError, refetch: refetchInfo } = useReadContract({
    address: vaultAddress as `0x${string}`,
    abi: VAULT_ABI,
    functionName: "vaultInfo",
    query: {
      enabled: isConnected && !!vaultAddress,
      retry: 1,
      staleTime: 30000,
      gcTime: 60000,
    },
  });

  const { data: stateData, isLoading: isLoadingState, error: stateError, refetch: refetchState } = useReadContract({
    address: vaultAddress as `0x${string}`,
    abi: VAULT_ABI,
    functionName: "vaultState",
    query: {
      enabled: isConnected && !!vaultAddress,
      retry: 1,
      staleTime: 30000,
      gcTime: 60000,
    },
  });

  const { data: tokenData, isLoading: isLoadingToken } = useReadContract({
    address: vaultAddress as `0x${string}`,
    abi: VAULT_ABI,
    functionName: "token",
    query: {
      enabled: isConnected && !!vaultAddress,
      retry: 1,
      staleTime: 30000,
      gcTime: 60000,
    },
  });

  const tokenAddress = (tokenData as string | undefined) ?? "";
  const tokenContracts = isValidAddress(tokenAddress)
    ? [
        { address: tokenAddress as `0x${string}`, abi: ERC20_ABI, functionName: "symbol" as const },
        { address: tokenAddress as `0x${string}`, abi: ERC20_ABI, functionName: "decimals" as const },
      ]
    : [];

  const { data: tokenMetaData, isLoading: isLoadingTokenMeta, error: tokenMetaError } = useReadContracts({
    contracts: tokenContracts,
    query: {
      enabled: isConnected && tokenContracts.length > 0,
      retry: 1,
      staleTime: 30000,
      gcTime: 60000,
    },
  });

  const isLoading = isLoadingInfo || isLoadingState || isLoadingToken || isLoadingTokenMeta;
  const error = infoError || stateError || tokenMetaError;
  const refetch = () => {
    refetchInfo();
    refetchState();
  };

  let vault = null;

  try {
    const info = infoData as any;
    const state = stateData as any;
    const tokenSymbol = (tokenMetaData?.[0]?.result as string | undefined) ?? "UNKNOWN";
    const decimals = Number(tokenMetaData?.[1]?.result ?? 18);

    if (info) {
      vault = {
        id: Number(info[0] || 0), // vaultId
        vaultAddress,
        tokenAddress: tokenAddress || "",
        tokenSymbol,
        decimals,
        // VaultInfo
        maxLiquidity: formatUnits(info[1] || BigInt(0), decimals),
        borrowBaseRate: (Number(info[2] || 0) / 100).toFixed(2),
        borrowSlope: (Number(info[3] || 0) / 100).toFixed(2),
        maxBorrowRatio: (Number(info[4] || 0) / 100).toFixed(2),
        liquidationBonus: (Number(info[5] || 0) / 100).toFixed(2),
        isActive: info[6] || false,
        createdAt: info[7] ? new Date(Number(info[7]) * 1000) : new Date(),
        treasury: info[8] || "",
        // VaultState
        totalSupplied: state ? formatUnits(state[0] || BigInt(0), decimals) : "0",
        totalBorrowed: state ? formatUnits(state[1] || BigInt(0), decimals) : "0",
        availableLiquidity: state ? formatUnits(state[2] || BigInt(0), decimals) : "0",
        utilizationRate: state ? (Number(state[3] || 0) / 100).toFixed(2) : "0",
        totalInterestCollected: state ? formatUnits(state[4] || BigInt(0), decimals) : "0",
        lastInterestUpdate: state && state[5] ? new Date(Number(state[5]) * 1000) : null,
        totalBadDebt: state ? formatUnits(state[6] || BigInt(0), decimals) : "0",
        // Calculated
        fundingProgress: info[1] && state?.[0]
          ? ((Number(state[0]) / Number(info[1])) * 100).toFixed(2)
          : "0",
      };
    }
  } catch (e) {
    console.error("Error parsing vault data:", e);
  }

  return { vault, isLoading, error, refetch };
}

// Read protocol settings
export function useProtocolSettings() {
  const { isConnected } = useAccount();

  const { data, isLoading, error, refetch } = useReadContracts({
    contracts: [
      {
        address: CONTRACTS.protocol as `0x${string}`,
        abi: PROTOCOL_ABI,
        functionName: "setupFee",
      },
      {
        address: CONTRACTS.protocol as `0x${string}`,
        abi: PROTOCOL_ABI,
        functionName: "performanceFee",
      },
      {
        address: CONTRACTS.protocol as `0x${string}`,
        abi: PROTOCOL_ABI,
        functionName: "borrowFeeRate",
      },
      {
        address: CONTRACTS.protocol as `0x${string}`,
        abi: PROTOCOL_ABI,
        functionName: "treasury",
      },
      {
        address: CONTRACTS.protocol as `0x${string}`,
        abi: PROTOCOL_ABI,
        functionName: "vaultCount",
      },
    ],
    query: {
      enabled: isConnected,
      retry: 1,
      staleTime: 30000,
      gcTime: 60000,
    },
  });

  let settings = null;

  try {
    if (data) {
      settings = {
        setupFee: data[0]?.result ? (Number(data[0].result) / 100).toFixed(2) : "0",
        performanceFee: data[1]?.result ? (Number(data[1].result) / 100).toFixed(2) : "0",
        borrowFeeRate: data[2]?.result ? (Number(data[2].result) / 100).toFixed(2) : "0",
        treasury: data[3]?.result || "",
        vaultCount: data[4]?.result ? Number(data[4].result) : 0,
      };
    }
  } catch (e) {
    console.error("Error parsing protocol settings:", e);
  }

  return { settings, isLoading, error, refetch };
}

// Read fee collector stats
export function useFeeCollectorStats() {
  const { isConnected } = useAccount();

  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.feeCollector as `0x${string}`,
    abi: FEE_COLLECTOR_ABI,
    functionName: "getFeeStats",
    query: {
      enabled: isConnected,
      retry: 1,
      retryDelay: 1000,
      staleTime: 30000,
      gcTime: 60000,
    },
  });

  let stats = null;

  try {
    if (data && Array.isArray(data)) {
      stats = {
        totalCollected: formatUnits(data[0] || BigInt(0), 6),
        totalDistributed: formatUnits(data[1] || BigInt(0), 6),
        availableBalance: formatUnits(data[2] || BigInt(0), 6),
      };
    }
  } catch (e) {
    console.error("Error parsing fee stats:", e);
  }

  return { stats, isLoading, error, refetch };
}

// Update protocol fees
export function useUpdateProtocolFees() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const updateSetupFee = (newFee: number) => {
    writeContract({
      address: CONTRACTS.protocol as `0x${string}`,
      abi: PROTOCOL_ABI,
      functionName: "setSetupFee",
      args: [BigInt(newFee * 100)],
    });
  };

  const updatePerformanceFee = (newFee: number) => {
    writeContract({
      address: CONTRACTS.protocol as `0x${string}`,
      abi: PROTOCOL_ABI,
      functionName: "setPerformanceFee",
      args: [BigInt(newFee * 100)],
    });
  };

  const updateBorrowFeeRate = (newFee: number) => {
    writeContract({
      address: CONTRACTS.protocol as `0x${string}`,
      abi: PROTOCOL_ABI,
      functionName: "setBorrowFeeRate",
      args: [BigInt(newFee * 100)],
    });
  };

  return {
    updateSetupFee,
    updatePerformanceFee,
    updateBorrowFeeRate,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

// Vault management hooks (updated for new contract structure)
export function useVaultManagement(vaultAddress: string) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const setMaxLiquidity = (newMaxLiquidity: bigint) => {
    writeContract({
      address: vaultAddress as `0x${string}`,
      abi: VAULT_ABI,
      functionName: "setMaxLiquidity",
      args: [newMaxLiquidity],
    });
  };

  const setBorrowRates = (newBaseRate: bigint, newSlope: bigint) => {
    writeContract({
      address: vaultAddress as `0x${string}`,
      abi: VAULT_ABI,
      functionName: "setBorrowRates",
      args: [newBaseRate, newSlope],
    });
  };

  const setMaxBorrowRatio = (newRatio: bigint) => {
    writeContract({
      address: vaultAddress as `0x${string}`,
      abi: VAULT_ABI,
      functionName: "setMaxBorrowRatio",
      args: [newRatio],
    });
  };

  const setLiquidationBonus = (newBonus: bigint) => {
    writeContract({
      address: vaultAddress as `0x${string}`,
      abi: VAULT_ABI,
      functionName: "setLiquidationBonus",
      args: [newBonus],
    });
  };

  const protocolBorrow = (amount: bigint) => {
    writeContract({
      address: vaultAddress as `0x${string}`,
      abi: VAULT_ABI,
      functionName: "protocolBorrow",
      args: [amount],
    });
  };

  const protocolRepay = (amount: bigint) => {
    writeContract({
      address: vaultAddress as `0x${string}`,
      abi: VAULT_ABI,
      functionName: "protocolRepay",
      args: [amount],
    });
  };

  const pauseVault = () => {
    writeContract({
      address: vaultAddress as `0x${string}`,
      abi: VAULT_ABI,
      functionName: "pause",
    });
  };

  const unpauseVault = () => {
    writeContract({
      address: vaultAddress as `0x${string}`,
      abi: VAULT_ABI,
      functionName: "unpause",
    });
  };

  return {
    setMaxLiquidity,
    setBorrowRates,
    setMaxBorrowRatio,
    setLiquidationBonus,
    protocolBorrow,
    protocolRepay,
    pauseVault,
    unpauseVault,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}
