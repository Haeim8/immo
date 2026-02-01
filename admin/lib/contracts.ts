// Contract addresses sur Base Sepolia (alignés avec lib/evm/constants.ts)
// Mise à jour : 2026-02-01
export const CONTRACTS = {
  network: "baseSepolia",
  chainId: 84532,
  deployer: "0x222fD66bbfc6808e123aB51f5FB21644731dFDE2",
  usdc: "0x45f591C36B3506a881eD54638a9456607c2Eed84",
  protocol: "0xF38DfC53Fffe57EbBba5f83E16F7a53774650660",
  feeCollector: "0xd1D803008EfFc980f57D88Ea7d7Ba15149614ce7",
  priceOracle: "0xfEe66D72AF156E8b1e31F84e6e40a3cFb0CD9801",
  collateralManager: "0x75896Ebb9719037E8cD3C8DDdA8c237E68C7FbB7",
  vaultImplementation: "0x383fFE3a7e908240021747b5775b625B441a299e",
  factory: "0x10809d5E79C77D93c2cA9b75f2715FEEcC00282D",
  reader: "0xF73C6E3c7eE0F1CF0A9dC0D37b7B0Ca42D25d8Ad",
  cvtToken: "0x41f7f3F48Af49d68e24999F3FE5D831a64ac2DBF",
  // staking: fetched dynamically from vault.stakingContract()
} as const;

// Token addresses on Base Mainnet (for production)
export const BASE_TOKENS = {
  USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  WETH: "0x4200000000000000000000000000000000000006",
} as const;

// Token addresses on Base Sepolia (for testnet)
export const BASE_SEPOLIA_TOKENS = {
  USDC: "0x45f591C36B3506a881eD54638a9456607c2Eed84", // Mock USDC on testnet
  WETH: "0x4200000000000000000000000000000000000006", // WETH is same address
} as const;

// Pool configuration types
export type PoolType = "usdc" | "weth";

export const POOL_CONFIG = {
  usdc: {
    name: "USDC Pool",
    description: "Supply USDC, Borrow USDC",
    token: BASE_SEPOLIA_TOKENS.USDC,
    symbol: "USDC",
    decimals: 6,
  },
  weth: {
    name: "WETH Pool",
    description: "Supply WETH, Borrow WETH",
    token: BASE_SEPOLIA_TOKENS.WETH,
    symbol: "WETH",
    decimals: 18,
  },
} as const;

// ============== PROTOCOL ABI ==============
export const PROTOCOL_ABI = [
  {
    inputs: [],
    name: "vaultCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "setupFee",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "performanceFee",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "borrowFeeRate",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "treasury",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "feeCollector",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "vaultId", type: "uint256" }],
    name: "getVaultAddress",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "offset", type: "uint256" },
      { internalType: "uint256", name: "limit", type: "uint256" },
    ],
    name: "getAllVaults",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "newFee", type: "uint256" }],
    name: "setSetupFee",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "newFee", type: "uint256" }],
    name: "setPerformanceFee",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "newFee", type: "uint256" }],
    name: "setBorrowFeeRate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "newTreasury", type: "address" }],
    name: "setTreasury",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "newCollector", type: "address" }],
    name: "setFeeCollector",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "factory", type: "address" }],
    name: "addFactory",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "factory", type: "address" }],
    name: "removeFactory",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "pause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "unpause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// ============== READER ABI (CantorVaultReader) ==============
export const READER_ABI = [
  {
    inputs: [],
    name: "getGlobalStats",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "totalVaults", type: "uint256" },
          { internalType: "uint256", name: "totalSupplied", type: "uint256" },
          { internalType: "uint256", name: "totalBorrowed", type: "uint256" },
          { internalType: "uint256", name: "totalRevenuesDistributed", type: "uint256" },
          { internalType: "uint256", name: "totalCapitalRepaid", type: "uint256" },
          { internalType: "uint256", name: "activeVaults", type: "uint256" },
          { internalType: "uint256", name: "averageAPY", type: "uint256" },
        ],
        internalType: "struct CantorVaultReader.GlobalStats",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "offset", type: "uint256" },
      { internalType: "uint256", name: "limit", type: "uint256" },
    ],
    name: "getVaults",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "vaultId", type: "uint256" },
          { internalType: "address", name: "vaultAddress", type: "address" },
          { internalType: "uint256", name: "maxLiquidity", type: "uint256" },
          { internalType: "uint256", name: "borrowBaseRate", type: "uint256" },
          { internalType: "uint256", name: "borrowSlope", type: "uint256" },
          { internalType: "uint256", name: "maxBorrowRatio", type: "uint256" },
          { internalType: "uint256", name: "liquidationThreshold", type: "uint256" },
          { internalType: "uint256", name: "liquidationBonus", type: "uint256" },
          { internalType: "uint256", name: "expectedReturn", type: "uint256" },
          { internalType: "uint256", name: "currentBorrowRate", type: "uint256" },
          { internalType: "bool", name: "isActive", type: "bool" },
          { internalType: "uint256", name: "createdAt", type: "uint256" },
          { internalType: "uint256", name: "totalSupplied", type: "uint256" },
          { internalType: "uint256", name: "totalBorrowed", type: "uint256" },
          { internalType: "uint256", name: "availableLiquidity", type: "uint256" },
          { internalType: "uint256", name: "utilizationRate", type: "uint256" },
          { internalType: "uint256", name: "fundingProgress", type: "uint256" },
          { internalType: "uint256", name: "totalInterestCollected", type: "uint256" },
          { internalType: "uint256", name: "totalBadDebt", type: "uint256" },
          { internalType: "address", name: "cvtToken", type: "address" },
          { internalType: "uint256", name: "cvtTotalSupply", type: "uint256" },
          { internalType: "bool", name: "isPaused", type: "bool" },
          { internalType: "address", name: "underlyingToken", type: "address" },
        ],
        internalType: "struct CantorVaultReader.VaultData[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

// ============== FEE COLLECTOR ABI ==============
export const FEE_COLLECTOR_ABI = [
  {
    inputs: [{ internalType: "address", name: "token", type: "address" }],
    name: "totalFeesCollected",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "token", type: "address" }],
    name: "totalFeesDistributed",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "token", type: "address" }],
    name: "getAvailableBalance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "token", type: "address" }],
    name: "getFeeStats",
    outputs: [
      { internalType: "uint256", name: "collected", type: "uint256" },
      { internalType: "uint256", name: "distributed", type: "uint256" },
      { internalType: "uint256", name: "available", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "treasury",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "stakingContract",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "distributeToTreasury",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "distributeFees",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "notifier", type: "address" }],
    name: "addNotifier",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "newStaking", type: "address" }],
    name: "setStakingContract",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// ============== FACTORY ABI (UPDATED) ==============
// CreateVaultParams: { token, maxLiquidity, borrowBaseRate, borrowSlope, maxBorrowRatio, liquidationThreshold, liquidationBonus }
export const FACTORY_ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "token", type: "address" },
          { internalType: "uint256", name: "maxLiquidity", type: "uint256" },
          { internalType: "uint256", name: "borrowBaseRate", type: "uint256" },
          { internalType: "uint256", name: "borrowSlope", type: "uint256" },
          { internalType: "uint256", name: "maxBorrowRatio", type: "uint256" },
          { internalType: "uint256", name: "liquidationThreshold", type: "uint256" },
          { internalType: "uint256", name: "liquidationBonus", type: "uint256" },
        ],
        internalType: "struct CantorAssetFactory.CreateVaultParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "createVault",
    outputs: [
      { internalType: "address", name: "vaultAddress", type: "address" },
      { internalType: "uint256", name: "vaultId", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getVaultCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "vaultId", type: "uint256" }],
    name: "getVaultAddress",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "creator", type: "address" }],
    name: "addCreator",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "creator", type: "address" }],
    name: "removeCreator",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// ============== VAULT ABI (UPDATED) ==============
export const VAULT_ABI = [
  // VaultInfo struct getter (10 fields including liquidationThreshold)
  {
    inputs: [],
    name: "vaultInfo",
    outputs: [
      { internalType: "uint256", name: "vaultId", type: "uint256" },
      { internalType: "uint256", name: "maxLiquidity", type: "uint256" },
      { internalType: "uint256", name: "borrowBaseRate", type: "uint256" },
      { internalType: "uint256", name: "borrowSlope", type: "uint256" },
      { internalType: "uint256", name: "maxBorrowRatio", type: "uint256" },
      { internalType: "uint256", name: "liquidationBonus", type: "uint256" },
      { internalType: "uint256", name: "liquidationThreshold", type: "uint256" },
      { internalType: "bool", name: "isActive", type: "bool" },
      { internalType: "uint256", name: "createdAt", type: "uint256" },
      { internalType: "address", name: "treasury", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  // VaultState struct getter
  {
    inputs: [],
    name: "vaultState",
    outputs: [
      { internalType: "uint256", name: "totalSupplied", type: "uint256" },
      { internalType: "uint256", name: "totalBorrowed", type: "uint256" },
      { internalType: "uint256", name: "availableLiquidity", type: "uint256" },
      { internalType: "uint256", name: "utilizationRate", type: "uint256" },
      { internalType: "uint256", name: "totalInterestCollected", type: "uint256" },
      { internalType: "uint256", name: "lastInterestUpdate", type: "uint256" },
      { internalType: "uint256", name: "totalBadDebt", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  // Token address
  {
    inputs: [],
    name: "token",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  // CVT token address
  {
    inputs: [],
    name: "cvtToken",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  // View functions
  {
    inputs: [],
    name: "calculateBorrowRate",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getSuppliersCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getUtilizationRate",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getVaultInfo",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "vaultId", type: "uint256" },
          { internalType: "uint256", name: "maxLiquidity", type: "uint256" },
          { internalType: "uint256", name: "borrowBaseRate", type: "uint256" },
          { internalType: "uint256", name: "borrowSlope", type: "uint256" },
          { internalType: "uint256", name: "maxBorrowRatio", type: "uint256" },
          { internalType: "uint256", name: "liquidationBonus", type: "uint256" },
          { internalType: "bool", name: "isActive", type: "bool" },
          { internalType: "uint256", name: "createdAt", type: "uint256" },
          { internalType: "address", name: "treasury", type: "address" },
        ],
        internalType: "struct CantorVault.VaultInfo",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getVaultState",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "totalSupplied", type: "uint256" },
          { internalType: "uint256", name: "totalBorrowed", type: "uint256" },
          { internalType: "uint256", name: "availableLiquidity", type: "uint256" },
          { internalType: "uint256", name: "utilizationRate", type: "uint256" },
          { internalType: "uint256", name: "totalInterestCollected", type: "uint256" },
          { internalType: "uint256", name: "lastInterestUpdate", type: "uint256" },
          { internalType: "uint256", name: "totalBadDebt", type: "uint256" },
        ],
        internalType: "struct CantorVault.VaultState",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getVaultMetrics",
    outputs: [
      { internalType: "uint256", name: "totalSupplied", type: "uint256" },
      { internalType: "uint256", name: "totalBorrowed", type: "uint256" },
      { internalType: "uint256", name: "availableLiquidity", type: "uint256" },
      { internalType: "uint256", name: "utilizationRate", type: "uint256" },
      { internalType: "uint256", name: "borrowRate", type: "uint256" },
      { internalType: "uint256", name: "supplyRate", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  // Staking related
  {
    inputs: [],
    name: "stakingContract",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalStakedLiquidity",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "protocolDebt",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Admin functions
  {
    inputs: [{ internalType: "uint256", name: "newMaxLiquidity", type: "uint256" }],
    name: "setMaxLiquidity",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "newBaseRate", type: "uint256" },
      { internalType: "uint256", name: "newSlope", type: "uint256" },
    ],
    name: "setBorrowRates",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "newMaxBorrowRatio", type: "uint256" }],
    name: "setMaxBorrowRatio",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "newLiquidationBonus", type: "uint256" }],
    name: "setLiquidationBonus",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_stakingContract", type: "address" }],
    name: "setStakingContract",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "pause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "unpause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Protocol borrow/repay
  {
    inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    name: "protocolBorrow",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    name: "protocolRepay",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    name: "crossCollateralBorrow",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    name: "repayCrossCollateralBorrow",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_collateralManager", type: "address" }],
    name: "setCollateralManager",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bool", name: "enabled", type: "bool" }],
    name: "setCrossCollateralEnabled",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "borrower", type: "address" }],
    name: "liquidate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// ============== STAKING ABI ==============
export const STAKING_ABI = [
  {
    inputs: [],
    name: "totalStaked",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "maxProtocolBorrowRatio",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getMaxProtocolBorrow",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "rewardIndex",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getStakersCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getStakePosition",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "uint256", name: "lockEndTime", type: "uint256" },
          { internalType: "uint256", name: "rewardIndexSnapshot", type: "uint256" },
          { internalType: "uint256", name: "pendingRewards", type: "uint256" },
        ],
        internalType: "struct CVTStaking.StakePosition",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getPendingRewards",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "isLockExpired",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "newRatio", type: "uint256" }],
    name: "setMaxProtocolBorrowRatio",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "pause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "unpause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "paused",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "vault",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "cvtToken",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "underlyingToken",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// ============== ACCESS CONTROL ABI ==============
export const ACCESS_CONTROL_ABI = [
  {
    inputs: [{ internalType: "bytes32", name: "role", type: "bytes32" }],
    name: "getRoleAdmin",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" },
    ],
    name: "hasRole",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" },
    ],
    name: "grantRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" },
    ],
    name: "revokeRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// ============== COLLATERAL MANAGER ABI (admin actions) ==============
export const COLLATERAL_MANAGER_ABI = [
  {
    inputs: [{ internalType: "address", name: "vaultAddress", type: "address" }],
    name: "addVault",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "vaultAddress", type: "address" }],
    name: "removeVault",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "newMaxLTV", type: "uint256" }],
    name: "setMaxLTV",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "newThreshold", type: "uint256" }],
    name: "setLiquidationThreshold",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "newOracle", type: "address" }],
    name: "setPriceOracle",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  { inputs: [], name: "pause", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [], name: "unpause", outputs: [], stateMutability: "nonpayable", type: "function" },
] as const;

// ============== PRICE ORACLE ABI ==============
export const PRICE_ORACLE_MINI_ABI = [
  {
    inputs: [{ internalType: "address", name: "token", type: "address" }],
    name: "getPrice",
    outputs: [{ internalType: "uint256", name: "price", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "address", name: "feed", type: "address" },
    ],
    name: "setPriceFeed",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "price", type: "uint256" },
    ],
    name: "setManualPrice",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "newThreshold", type: "uint256" }],
    name: "setStalePriceThreshold",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// Role constants (keccak256 hashes)
export const ROLES = {
  DEFAULT_ADMIN: "0x0000000000000000000000000000000000000000000000000000000000000000",
  ADMIN_ROLE: "0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775",
  PAUSER_ROLE: "0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a",
  MANAGER_ROLE: "0x241ecf16d79d0f8dbfb92cbc07fe17840425976cf0667f022fe9877caa831b08",
  FACTORY_ROLE: "0xd8aa0f3194971a2a116679f7c2090f6939c8d4e01a2a8d7e41d55e5351469e63",
  CREATOR_ROLE: "0x828634d95e775031b9ff576b159a8509f3c5e5e864e23ee6d25e1c3e4e0c9e5a",
  DISTRIBUTOR_ROLE: "0xfbd454f36a7e1a388bd6fc3ab10d434aa4578f811acbbcf33afb1c697486313c",
} as const;

// ============== ERC20 ABI ==============
export const ERC20_ABI = [
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Alias for backwards compatibility
export const USDC_ABI = ERC20_ABI;
