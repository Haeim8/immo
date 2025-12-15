"use client";

import { useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { CONTRACTS, PROTOCOL_ABI, FEE_COLLECTOR_ABI, VAULT_ABI, ERC20_ABI, READER_ABI } from "@/lib/contracts";
import { formatUnits } from "viem";

// Read global stats by aggregating from protocol and vaults
export function useGlobalStats() {
  const { isConnected } = useAccount();
  const { vaults, isLoading: isLoadingVaults } = useVaults();

  // First get global stats from Reader (on-chain)
  const { data: globalData, isLoading: isLoadingGlobal } = useReadContract({
    address: CONTRACTS.reader as `0x${string}`,
    abi: READER_ABI,
    functionName: "getGlobalStats",
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
    args: [CONTRACTS.usdc as `0x${string}`],
    query: {
      enabled: isConnected,
      retry: 1,
      staleTime: 30000,
      gcTime: 60000,
    },
  });

  const isLoading = isLoadingGlobal || isLoadingFees || isLoadingVaults;

  let stats = null;

  try {
    const gd = globalData as any;
    const totalVaults = gd ? Number(gd.totalVaults || 0) : vaults?.length || 0;

    // Agrégation fiable côté front avec les valeurs converties (décimales ERC20 déjà appliquées dans useVaults)
    const aggregate = vaults?.reduce(
      (acc, v: any) => {
        acc.totalSupplied += parseFloat(v.totalSupplied || "0");
        acc.totalBorrowed += parseFloat(v.totalBorrowed || "0");
        return acc;
      },
      { totalSupplied: 0, totalBorrowed: 0 }
    ) || { totalSupplied: 0, totalBorrowed: 0 };

    // Moyenne pondérée des APY (supplyRate) par la TVL
    const totalWeight = vaults?.reduce((acc, v: any) => acc + parseFloat(v.totalSupplied || "0"), 0) || 0;
    const weightedApy = vaults && totalWeight > 0
      ? vaults.reduce((acc, v: any) => acc + parseFloat(v.supplyRate || 0) * parseFloat(v.totalSupplied || "0"), 0) / totalWeight
      : gd
        ? Number(gd.averageAPY || 0) / 100 // averageAPY en bps
        : 0;

    if (feeData && Array.isArray(feeData)) {
      stats = {
        totalVaults,
        totalSupplied: aggregate.totalSupplied.toString(),
        totalBorrowed: aggregate.totalBorrowed.toString(),
        totalRevenuesDistributed: gd ? Number(gd.totalRevenuesDistributed || 0).toString() : formatUnits(feeData[1] || BigInt(0), 6),
        totalCapitalRepaid: gd ? Number(gd.totalCapitalRepaid || 0).toString() : "0",
        activeVaults: gd ? Number(gd.activeVaults || 0) : totalVaults,
        averageAPY: weightedApy.toString(),
        totalFeesCollected: formatUnits(feeData[0] || BigInt(0), 6),
        availableFees: formatUnits(feeData[2] || BigInt(0), 6),
      };
    } else {
      stats = {
        totalVaults,
        totalSupplied: aggregate.totalSupplied.toString(),
        totalBorrowed: aggregate.totalBorrowed.toString(),
        totalRevenuesDistributed: gd ? Number(gd.totalRevenuesDistributed || 0).toString() : "0",
        totalCapitalRepaid: gd ? Number(gd.totalCapitalRepaid || 0).toString() : "0",
        activeVaults: gd ? Number(gd.activeVaults || 0) : totalVaults,
        averageAPY: weightedApy.toString(),
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

  // Extract token addresses from vault data to fetch symbol/decimals dynamically
  const tokenAddresses = vaultData && vaultAddresses && Array.isArray(vaultAddresses)
    ? vaultAddresses.map((_, index: number) => {
        const tokenResult = vaultData[index * 3 + 2];
        return tokenResult?.result as string | undefined;
      }).filter((addr): addr is string => !!addr)
    : [];

  // Get unique token addresses to avoid duplicate reads
  const uniqueTokenAddresses = [...new Set(tokenAddresses)];

  // Build contracts for reading token symbol and decimals from ERC20
  const tokenContracts = uniqueTokenAddresses.flatMap((tokenAddr) => [
    {
      address: tokenAddr as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "symbol" as const,
    },
    {
      address: tokenAddr as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "decimals" as const,
    },
  ]);

  const { data: tokenInfoData, isLoading: isLoadingTokenInfo } = useReadContracts({
    contracts: tokenContracts,
    query: {
      enabled: tokenContracts.length > 0,
      retry: 1,
      staleTime: 60000,
      gcTime: 120000,
    },
  });

  // Build a map from token address to {symbol, decimals}
  const tokenInfoMap = new Map<string, { symbol: string; decimals: number }>();
  if (tokenInfoData && uniqueTokenAddresses.length > 0) {
    uniqueTokenAddresses.forEach((tokenAddr, index) => {
      const symbolResult = tokenInfoData[index * 2];
      const decimalsResult = tokenInfoData[index * 2 + 1];
      const symbol = (symbolResult?.result as string) || "???";
      const decimals = (decimalsResult?.result as number) || 18;
      tokenInfoMap.set(tokenAddr.toLowerCase(), { symbol, decimals });
    });
  }

  const isLoading = isLoadingAddresses || isLoadingVaults || isLoadingTokenInfo;
  const error = addressError || vaultError;

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

        // Get token info from map (dynamically fetched from ERC20 contract)
        const tokenInfo = tokenAddress ? tokenInfoMap.get(tokenAddress.toLowerCase()) : null;
        const decimals = tokenInfo?.decimals ?? 18;
        const tokenSymbol = tokenInfo?.symbol ?? "???";

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

  const tokenAddress = tokenData as string | undefined;

  // Dynamically read token symbol from ERC20 contract
  const { data: tokenSymbolData, isLoading: isLoadingSymbol } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "symbol",
    query: {
      enabled: !!tokenAddress,
      retry: 1,
      staleTime: 60000,
      gcTime: 120000,
    },
  });

  // Dynamically read token decimals from ERC20 contract
  const { data: tokenDecimalsData, isLoading: isLoadingDecimals } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "decimals",
    query: {
      enabled: !!tokenAddress,
      retry: 1,
      staleTime: 60000,
      gcTime: 120000,
    },
  });

  const isLoading = isLoadingInfo || isLoadingState || isLoadingToken || isLoadingSymbol || isLoadingDecimals;
  const error = infoError || stateError;
  const refetch = () => {
    refetchInfo();
    refetchState();
  };

  let vault = null;

  try {
    const info = infoData as any;
    const state = stateData as any;

    // Get token info dynamically from ERC20 contract
    const decimals = (tokenDecimalsData as number) ?? 18;
    const tokenSymbol = (tokenSymbolData as string) ?? "???";

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
    args: [CONTRACTS.usdc as `0x${string}`],
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
