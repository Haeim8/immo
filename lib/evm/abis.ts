/**
 * CantorFi Protocol - ABIs
 * Extracted from backend/artifacts
 */

// Protocol ABI (CantorFiProtocol.sol)
export const PROTOCOL_ABI = [
  {
    inputs: [],
    name: 'vaultCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'vaultId', type: 'uint256' }],
    name: 'getVaultAddress',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'vaultId', type: 'uint256' }],
    name: 'vaultExists',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'vaults',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'offset', type: 'uint256' },
      { internalType: 'uint256', name: 'limit', type: 'uint256' },
    ],
    name: 'getAllVaults',
    outputs: [{ internalType: 'address[]', name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'treasury',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'feeCollector',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'setupFee',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'performanceFee',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'borrowFeeRate',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'paused',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Vault ABI (CantorVault.sol) - Operations are on individual vaults
export const VAULT_ABI = [
  // Supply
  {
    inputs: [
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      {
        components: [
          { internalType: 'bool', name: 'hasLock', type: 'bool' },
          { internalType: 'uint256', name: 'lockDurationSeconds', type: 'uint256' },
          { internalType: 'bool', name: 'canWithdrawEarly', type: 'bool' },
          { internalType: 'uint256', name: 'earlyWithdrawalFee', type: 'uint256' },
        ],
        internalType: 'struct CantorVault.LockConfig',
        name: 'lockConfig',
        type: 'tuple',
      },
    ],
    name: 'supply',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Withdraw
  {
    inputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Borrow
  {
    inputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
    name: 'borrow',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Repay borrow
  {
    inputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
    name: 'repayBorrow',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Claim interest
  {
    inputs: [],
    name: 'claimInterest',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // View: positions
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'positions',
    outputs: [
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'uint256', name: 'cvtBalance', type: 'uint256' },
      {
        components: [
          { internalType: 'bool', name: 'hasLock', type: 'bool' },
          { internalType: 'uint256', name: 'lockDurationSeconds', type: 'uint256' },
          { internalType: 'bool', name: 'canWithdrawEarly', type: 'bool' },
          { internalType: 'uint256', name: 'earlyWithdrawalFee', type: 'uint256' },
        ],
        internalType: 'struct CantorVault.LockConfig',
        name: 'lockConfig',
        type: 'tuple',
      },
      { internalType: 'bool', name: 'isLocked', type: 'bool' },
      { internalType: 'uint256', name: 'lockEndDate', type: 'uint256' },
      { internalType: 'uint256', name: 'interestClaimed', type: 'uint256' },
      { internalType: 'uint256', name: 'interestPending', type: 'uint256' },
      { internalType: 'uint256', name: 'borrowedAmount', type: 'uint256' },
      { internalType: 'uint256', name: 'borrowInterestAccumulated', type: 'uint256' },
      { internalType: 'uint256', name: 'lastInterestUpdate', type: 'uint256' },
      { internalType: 'uint256', name: 'interestIndexSnapshot', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // View: vaultInfo
  {
    inputs: [],
    name: 'vaultInfo',
    outputs: [
      { internalType: 'uint256', name: 'vaultId', type: 'uint256' },
      { internalType: 'uint256', name: 'maxLiquidity', type: 'uint256' },
      { internalType: 'uint256', name: 'borrowBaseRate', type: 'uint256' },
      { internalType: 'uint256', name: 'borrowSlope', type: 'uint256' },
      { internalType: 'uint256', name: 'maxBorrowRatio', type: 'uint256' },
      { internalType: 'uint256', name: 'liquidationBonus', type: 'uint256' },
      { internalType: 'bool', name: 'isActive', type: 'bool' },
      { internalType: 'uint256', name: 'createdAt', type: 'uint256' },
      { internalType: 'address', name: 'treasury', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // View: vaultState
  {
    inputs: [],
    name: 'vaultState',
    outputs: [
      { internalType: 'uint256', name: 'totalSupplied', type: 'uint256' },
      { internalType: 'uint256', name: 'totalBorrowed', type: 'uint256' },
      { internalType: 'uint256', name: 'availableLiquidity', type: 'uint256' },
      { internalType: 'uint256', name: 'utilizationRate', type: 'uint256' },
      { internalType: 'uint256', name: 'totalInterestCollected', type: 'uint256' },
      { internalType: 'uint256', name: 'lastInterestUpdate', type: 'uint256' },
      { internalType: 'uint256', name: 'totalBadDebt', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // View: calculateBorrowRate
  {
    inputs: [],
    name: 'calculateBorrowRate',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // View: token + cvtToken
  {
    inputs: [],
    name: 'token',
    outputs: [{ internalType: 'contract IERC20', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'cvtToken',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'stakingContract',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Reader ABI (CantorVaultReader.sol) - Aggregates data for frontend
export const READER_ABI = [
  {
    inputs: [
      { internalType: 'uint256', name: 'offset', type: 'uint256' },
      { internalType: 'uint256', name: 'limit', type: 'uint256' },
    ],
    name: 'getVaults',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'vaultId', type: 'uint256' },
          { internalType: 'address', name: 'vaultAddress', type: 'address' },
          { internalType: 'uint256', name: 'maxLiquidity', type: 'uint256' },
          { internalType: 'uint256', name: 'borrowBaseRate', type: 'uint256' },
          { internalType: 'uint256', name: 'borrowSlope', type: 'uint256' },
          { internalType: 'uint256', name: 'maxBorrowRatio', type: 'uint256' },
          { internalType: 'uint256', name: 'liquidationBonus', type: 'uint256' },
          { internalType: 'uint256', name: 'expectedReturn', type: 'uint256' },
          { internalType: 'bool', name: 'isActive', type: 'bool' },
          { internalType: 'uint256', name: 'createdAt', type: 'uint256' },
          { internalType: 'uint256', name: 'totalSupplied', type: 'uint256' },
          { internalType: 'uint256', name: 'totalBorrowed', type: 'uint256' },
          { internalType: 'uint256', name: 'availableLiquidity', type: 'uint256' },
          { internalType: 'uint256', name: 'utilizationRate', type: 'uint256' },
          { internalType: 'uint256', name: 'fundingProgress', type: 'uint256' },
          { internalType: 'uint256', name: 'totalInterestCollected', type: 'uint256' },
          { internalType: 'uint256', name: 'totalBadDebt', type: 'uint256' },
          { internalType: 'address', name: 'cvtToken', type: 'address' },
          { internalType: 'uint256', name: 'cvtTotalSupply', type: 'uint256' },
          { internalType: 'bool', name: 'isPaused', type: 'bool' },
          { internalType: 'address', name: 'underlyingToken', type: 'address' },
        ],
        internalType: 'struct CantorVaultReader.VaultData[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'vaultId', type: 'uint256' }],
    name: 'getVaultData',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'vaultId', type: 'uint256' },
          { internalType: 'address', name: 'vaultAddress', type: 'address' },
          { internalType: 'uint256', name: 'maxLiquidity', type: 'uint256' },
          { internalType: 'uint256', name: 'borrowBaseRate', type: 'uint256' },
          { internalType: 'uint256', name: 'borrowSlope', type: 'uint256' },
          { internalType: 'uint256', name: 'maxBorrowRatio', type: 'uint256' },
          { internalType: 'uint256', name: 'liquidationBonus', type: 'uint256' },
          { internalType: 'uint256', name: 'expectedReturn', type: 'uint256' },
          { internalType: 'bool', name: 'isActive', type: 'bool' },
          { internalType: 'uint256', name: 'createdAt', type: 'uint256' },
          { internalType: 'uint256', name: 'totalSupplied', type: 'uint256' },
          { internalType: 'uint256', name: 'totalBorrowed', type: 'uint256' },
          { internalType: 'uint256', name: 'availableLiquidity', type: 'uint256' },
          { internalType: 'uint256', name: 'utilizationRate', type: 'uint256' },
          { internalType: 'uint256', name: 'fundingProgress', type: 'uint256' },
          { internalType: 'uint256', name: 'totalInterestCollected', type: 'uint256' },
          { internalType: 'uint256', name: 'totalBadDebt', type: 'uint256' },
          { internalType: 'address', name: 'cvtToken', type: 'address' },
          { internalType: 'uint256', name: 'cvtTotalSupply', type: 'uint256' },
          { internalType: 'bool', name: 'isPaused', type: 'bool' },
          { internalType: 'address', name: 'underlyingToken', type: 'address' },
        ],
        internalType: 'struct CantorVaultReader.VaultData',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'getUserPortfolio',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'vaultId', type: 'uint256' },
          { internalType: 'address', name: 'vaultAddress', type: 'address' },
          { internalType: 'uint256', name: 'supplyAmount', type: 'uint256' },
          { internalType: 'uint256', name: 'cvtBalance', type: 'uint256' },
          { internalType: 'bool', name: 'isLocked', type: 'bool' },
          { internalType: 'uint256', name: 'lockEndDate', type: 'uint256' },
          { internalType: 'uint256', name: 'interestPending', type: 'uint256' },
          { internalType: 'uint256', name: 'interestClaimed', type: 'uint256' },
          { internalType: 'uint256', name: 'borrowedAmount', type: 'uint256' },
          { internalType: 'uint256', name: 'borrowInterestAccumulated', type: 'uint256' },
          { internalType: 'uint256', name: 'sharePercentage', type: 'uint256' },
        ],
        internalType: 'struct CantorVaultReader.UserPositionData[]',
        name: '',
        type: 'tuple[]',
      },
      {
        components: [
          { internalType: 'uint256', name: 'totalInvested', type: 'uint256' },
          { internalType: 'uint256', name: 'totalClaimed', type: 'uint256' },
          { internalType: 'uint256', name: 'totalPending', type: 'uint256' },
          { internalType: 'uint256', name: 'totalBorrowed', type: 'uint256' },
          { internalType: 'uint256', name: 'netValue', type: 'uint256' },
          { internalType: 'uint256', name: 'vaultCount', type: 'uint256' },
        ],
        internalType: 'struct CantorVaultReader.PortfolioSummary',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getGlobalStats',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'totalVaults', type: 'uint256' },
          { internalType: 'uint256', name: 'totalSupplied', type: 'uint256' },
          { internalType: 'uint256', name: 'totalBorrowed', type: 'uint256' },
          { internalType: 'uint256', name: 'totalRevenuesDistributed', type: 'uint256' },
          { internalType: 'uint256', name: 'totalCapitalRepaid', type: 'uint256' },
          { internalType: 'uint256', name: 'activeVaults', type: 'uint256' },
          { internalType: 'uint256', name: 'averageAPY', type: 'uint256' },
        ],
        internalType: 'struct CantorVaultReader.GlobalStats',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'vaultId', type: 'uint256' }],
    name: 'calculateCurrentAPY',
    outputs: [{ internalType: 'uint256', name: 'currentAPY', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Staking ABI (CVTStaking.sol)
export const STAKING_ABI = [
  // stake(uint256 amount, uint256 lockDuration)
  {
    inputs: [
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'uint256', name: 'lockDuration', type: 'uint256' },
    ],
    name: 'stake',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // unstake()
  {
    inputs: [],
    name: 'unstake',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // claimRewards()
  {
    inputs: [],
    name: 'claimRewards',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // getStakePosition(address user)
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'getStakePosition',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'amount', type: 'uint256' },
          { internalType: 'uint256', name: 'lockEndTime', type: 'uint256' },
          { internalType: 'uint256', name: 'rewardIndexSnapshot', type: 'uint256' },
          { internalType: 'uint256', name: 'pendingRewards', type: 'uint256' },
        ],
        internalType: 'struct CVTStaking.StakePosition',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // getPendingRewards(address user)
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'getPendingRewards',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // isLockExpired(address user)
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'isLockExpired',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  // totalStaked
  {
    inputs: [],
    name: 'totalStaked',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // cvtToken
  {
    inputs: [],
    name: 'cvtToken',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  // vault
  {
    inputs: [],
    name: 'vault',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Extended Vault ABI - includes getMaxBorrow and getUserSummary for accurate position data
export const VAULT_EXTENDED_ABI = [
  // getMaxBorrow(address user) - returns 0 if user has staked CVT
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'getMaxBorrow',
    outputs: [{ internalType: 'uint256', name: 'maxBorrow', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // getWithdrawable(address user) - considers borrow obligations
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'getWithdrawable',
    outputs: [{ internalType: 'uint256', name: 'withdrawable', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // getTotalDebt(address user) - principal + interest
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'getTotalDebt',
    outputs: [{ internalType: 'uint256', name: 'totalDebt', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // getUserSummary(address user) - comprehensive user data
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'getUserSummary',
    outputs: [
      { internalType: 'uint256', name: 'supplied', type: 'uint256' },
      { internalType: 'uint256', name: 'borrowed', type: 'uint256' },
      { internalType: 'uint256', name: 'interest', type: 'uint256' },
      { internalType: 'uint256', name: 'healthFactor', type: 'uint256' },
      { internalType: 'uint256', name: 'maxBorrow', type: 'uint256' },
      { internalType: 'uint256', name: 'withdrawable', type: 'uint256' },
      { internalType: 'uint256', name: 'cvtBalance', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// PriceOracle ABI - for fetching USD prices
export const PRICE_ORACLE_ABI = [
  // getPrice(address token) - returns USD price with 8 decimals
  {
    inputs: [{ internalType: 'address', name: 'token', type: 'address' }],
    name: 'getPrice',
    outputs: [{ internalType: 'uint256', name: 'price', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // getUSDValue(address token, uint256 amount, uint8 tokenDecimals) - returns USD value with 8 decimals
  {
    inputs: [
      { internalType: 'address', name: 'token', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'uint8', name: 'tokenDecimals', type: 'uint8' },
    ],
    name: 'getUSDValue',
    outputs: [{ internalType: 'uint256', name: 'value', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // hasPriceAvailable(address token) - check if price is available
  {
    inputs: [{ internalType: 'address', name: 'token', type: 'address' }],
    name: 'hasPriceAvailable',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// ERC20 ABI
export const ERC20_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
