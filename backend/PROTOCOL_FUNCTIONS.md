# CantorFi Protocol - Function Reference

## Architecture Overview

```
CantorFiProtocol (Registry)
    └── CantorAssetFactory (Creates Vaults)
            └── CantorVault (Main Lending Pool)
                    ├── CVT (Share Token)
                    └── CVTStaking (Staking Contract)
    └── FeeCollector (Fee Management)
```

---

## 1. CantorVault - Main Functions

### User Actions

| Function | Description | Parameters | Who Can Call |
|----------|-------------|------------|--------------|
| `supply(amount, lockConfig)` | Deposit tokens, receive CVT | amount: uint256, lockConfig: LockConfig | Anyone |
| `withdraw(amount)` | Withdraw tokens, burn CVT | amount: uint256 | Position holder |
| `borrow(amount)` | Borrow against supply (max 70%) | amount: uint256 | Suppliers (not stakers) |
| `repayBorrow(amount)` | Repay borrowed amount + interest | amount: uint256 | Borrowers |
| `claimRevenue()` | Claim earned interest/revenue | - | Suppliers |
| `claimCapital()` | Claim repaid capital | - | Suppliers |
| `liquidate(borrower)` | Liquidate insolvent position | borrower: address | Anyone |

### Admin/Protocol Actions

| Function | Description | Parameters | Who Can Call |
|----------|-------------|------------|--------------|
| `protocolBorrow(amount)` | Protocol borrows from staked liquidity | amount: uint256 | Admin |
| `protocolRepay(amount)` | Protocol repays debt (surplus = interest) | amount: uint256 | Admin |
| `setStakingContract(address)` | Set staking contract | _stakingContract: address | Admin |
| `addRevenue(amount)` | Add RWA revenue to distribute | amount: uint256 | Manager |
| `processRepayment(amount)` | Process capital repayment | amount: uint256 | Manager |
| `setInvestmentDate()` | Mark investment start date | - | Manager |
| `pauseRevenue(reason)` | Pause revenue distributions | reason: string | Manager |
| `resumeRevenue()` | Resume revenue distributions | - | Manager |
| `pause()` / `unpause()` | Emergency pause | - | Admin |

### View Functions

| Function | Returns | Description |
|----------|---------|-------------|
| `getVaultInfo()` | VaultInfo | Full vault configuration |
| `getVaultState()` | VaultState | Current vault metrics |
| `getUserPosition(user)` | Position | User's complete position |
| `calculateBorrowRate()` | uint256 | Current variable borrow rate |
| `getUtilizationRate()` | uint256 | Current utilization (borrowed/supplied) |
| `stakedAmounts(user)` | uint256 | User's staked CVT amount |
| `totalStakedLiquidity` | uint256 | Total staked liquidity |
| `protocolDebt` | uint256 | Protocol's current debt |

---

## 2. CVTStaking - Staking Functions

### User Actions

| Function | Description | Parameters | Who Can Call |
|----------|-------------|------------|--------------|
| `stake(amount, lockDuration)` | Stake CVT tokens | amount: uint256, lockDuration: uint256 | CVT holders |
| `unstake()` | Unstake after lock expires | - | Stakers |
| `claimRewards()` | Claim staking rewards | - | Stakers |

### Admin Actions

| Function | Description | Parameters | Who Can Call |
|----------|-------------|------------|--------------|
| `setMaxProtocolBorrowRatio(ratio)` | Set max borrow % | newRatio: uint256 (basis points) | Admin |
| `distributeRewards(amount)` | Distribute rewards (internal) | amount: uint256 | Vault only |

### View Functions

| Function | Returns | Description |
|----------|---------|-------------|
| `getStakePosition(user)` | StakePosition | User's staking position |
| `getPendingRewards(user)` | uint256 | User's claimable rewards |
| `getMaxProtocolBorrow()` | uint256 | Max protocol can borrow |
| `isLockExpired(user)` | bool | Check if lock expired |
| `totalStaked` | uint256 | Total CVT staked |
| `getStakersCount()` | uint256 | Number of stakers |

---

## 3. Money Flow Diagrams

### A. User Supply & Borrow Flow

```
User supplies 10,000 WETH
    │
    ├── Vault receives 10,000 WETH
    │
    └── User receives 10,000 CVT

User borrows 5,000 WETH (50% of supply)
    │
    ├── Vault sends 5,000 WETH to user
    │
    └── Position: supply=10k, borrowed=5k

After 1 year (interest accrued):
User repays 5,500 WETH
    │
    ├── 5,000 → Principal repayment
    │
    └── 500 → Interest
            ├── 75 (15%) → FeeCollector (protocol fee)
            └── 425 (85%) → Distributed to suppliers via revenueIndex
```

### B. CVT Staking & Protocol Borrow Flow

```
User stakes 10,000 CVT for 30 days
    │
    ├── CVT transferred to Staking contract
    │
    ├── vault.stakedAmounts[user] += 10,000
    │
    └── vault.totalStakedLiquidity += 10,000

Admin borrows 6,000 from staked liquidity (60% max)
    │
    ├── vault.protocolDebt = 6,000
    │
    └── Admin receives 6,000 WETH

Admin repays 6,500 WETH
    │
    ├── 6,000 → Principal (debt cleared)
    │
    └── 500 → Interest
            ├── 75 (15%) → FeeCollector
            └── 425 (85%) → Staking contract → stakers
```

### C. Liquidation Flow

```
User position becomes insolvent:
    supply: 10,000 WETH
    borrowed: 7,000 WETH
    interest: 4,000 WETH (after years)
    totalDebt: 11,000 WETH

Liquidator calls liquidate(user)
    │
    ├── Position cleared (supply=0, borrowed=0)
    │
    ├── CVT burned
    │
    ├── Liquidator receives bonus (5% of collateral = 500)
    │
    ├── Bad debt tracked: 11,000 - 10,000 = 1,000
    │
    └── Protocol fee from interest → FeeCollector
```

---

## 4. Health Factor & Solvency

### Solvency Check

```solidity
// Position is solvent if:
borrowedAmount + interest <= supply * maxBorrowRatio

// Example with maxBorrowRatio = 70%:
supply = 10,000
maxBorrow = 10,000 * 70% = 7,000
borrowedAmount = 6,000
interest = 500
totalDebt = 6,500

isSolvent = 6,500 <= 7,000 = true
```

### When Position Becomes Insolvent

1. Interest accrues over time
2. When `totalDebt > supply * maxBorrowRatio` → insolvent
3. Anyone can call `liquidate(borrower)`

### Health Factor Calculation

```
healthFactor = (supply * maxBorrowRatio) / totalDebt

healthFactor > 1 = Solvent
healthFactor < 1 = Insolvent (liquidatable)
```

---

## 5. Fee Structure

| Fee Type | Rate | Recipient | Trigger |
|----------|------|-----------|---------|
| Setup Fee | 1% | FeeCollector | Vault creation |
| Performance Fee | 10% | FeeCollector | addRevenue() |
| Borrow Fee | 15% | FeeCollector | repayBorrow(), protocolRepay() |

---

## 6. Key State Variables

### CantorVault

```solidity
// Vault metrics
vaultState.totalSupplied      // Total tokens supplied
vaultState.totalBorrowed      // Total tokens borrowed
vaultState.availableLiquidity // Available for borrowing
vaultState.utilizationRate    // totalBorrowed / totalSupplied

// Staking metrics
totalStakedLiquidity  // Total underlying from staked CVT
protocolDebt          // Admin's borrowed amount
stakedAmounts[user]   // User's staked underlying amount

// Distribution indexes
revenueIndex  // For distributing interest/revenue to suppliers
capitalIndex  // For distributing capital repayments
```

### CVTStaking

```solidity
totalStaked               // Total CVT staked
maxProtocolBorrowRatio    // Max % protocol can borrow (6000 = 60%)
rewardIndex               // For distributing rewards to stakers
stakes[user].amount       // User's staked CVT
stakes[user].lockEndTime  // When user can unstake
stakes[user].pendingRewards // User's claimable rewards
```

---

## 7. Role Permissions

### ADMIN_ROLE
- protocolBorrow / protocolRepay
- setStakingContract
- pause / unpause
- Upgrade contracts

### MANAGER_ROLE
- addRevenue
- processRepayment
- setInvestmentDate
- pauseRevenue / resumeRevenue

### CREATOR_ROLE (Factory)
- createVault

### NOTIFIER_ROLE (FeeCollector)
- notifyFeeReceived
- Given to: Factory, each Vault

---

## 8. Typical Usage Flows

### For Suppliers (no staking)
```
1. vault.supply(amount, NO_LOCK)    // Deposit
2. Wait for revenue/interest
3. vault.claimRevenue()             // Claim earnings
4. vault.withdraw(amount)           // Withdraw
```

### For Suppliers + Stakers
```
1. vault.supply(amount, NO_LOCK)               // Deposit
2. cvt.approve(staking, cvtBalance)            // Approve CVT
3. staking.stake(cvtBalance, lockDuration)     // Stake (can't borrow now)
4. Wait for protocol repayments
5. staking.claimRewards()                      // Claim staking rewards
6. vault.claimRevenue()                        // Claim supply revenue
7. time.increase(lockDuration)                 // Wait for lock
8. staking.unstake()                           // Get CVT back
9. vault.withdraw(amount)                      // Withdraw tokens
```

### For Borrowers
```
1. vault.supply(amount, NO_LOCK)    // Deposit collateral
2. vault.borrow(amount)             // Borrow (max 70%)
3. Use funds...
4. vault.repayBorrow(totalDebt)     // Repay with interest
5. vault.withdraw(amount)           // Withdraw collateral
```

### For Admin (Protocol)
```
1. Wait for users to stake CVT
2. vault.protocolBorrow(amount)     // Borrow from stakers (max 60%)
3. Use funds for RWA investment
4. vault.protocolRepay(amount)      // Repay with interest
   └── Interest auto-distributed to stakers
```
