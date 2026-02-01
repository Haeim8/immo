// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./CantorVaultInterestModel.sol";
import "./CVT.sol";
import "./interfaces/IFeeCollector.sol";

interface ICVTStaking {
    function totalStaked() external view returns (uint256);

    function distributeRewards(uint256 amount) external;
}

interface ICollateralManager {
    function canBorrow(address user, uint256 vaultId, uint256 amount) external view returns (bool);
    function recordCollateralDeposit(address user, uint256 vaultId, uint256 amount) external;
    function recordCollateralWithdrawal(address user, uint256 vaultId, uint256 amount) external;
    function recordDebtIncrease(address user, uint256 vaultId, uint256 amount) external;
    function recordDebtRepayment(address user, uint256 vaultId, uint256 amount) external returns (uint256 interestPaid, uint256 principalPaid);
    function isLiquidatable(address user) external view returns (bool);
    function getTotalCollateralValueUSD(address user) external view returns (uint256);
    function getTotalDebtValueUSD(address user) external view returns (uint256);
}

/**
 * @title CantorVault
 * @notice Main vault contract - manages supply/borrow/revenue/repayments for 1 RWA asset
 * @dev One vault = one credit = one asset (villa, ferrari, building, etc.)
 */
contract CantorVault is
    Initializable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    using SafeERC20 for IERC20;
    using CantorVaultInterestModel for uint256;

    // ============== ROLES ==============

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    // ============== STRUCTS ==============

    struct VaultInfo {
        uint256 vaultId;
        uint256 maxLiquidity;
        uint256 borrowBaseRate;
        uint256 borrowSlope;
        uint256 maxBorrowRatio;
        uint256 liquidationBonus;
        uint256 liquidationThreshold;
        bool isActive;
        uint256 createdAt;
        address treasury;
    }

    struct VaultState {
        uint256 totalSupplied;
        uint256 totalBorrowed;
        uint256 availableLiquidity;
        uint256 utilizationRate;
        uint256 totalInterestCollected;
        uint256 lastInterestUpdate;
        uint256 totalBadDebt;
    }

    struct LockConfig {
        bool hasLock;
        uint256 lockDurationSeconds;
        bool canWithdrawEarly;
        uint256 earlyWithdrawalFee;
    }

    struct Position {
        uint256 amount;
        uint256 cvtBalance;
        LockConfig lockConfig;
        bool isLocked;
        uint256 lockEndDate;
        uint256 interestClaimed;
        uint256 interestPending;
        uint256 borrowedAmount;
        uint256 borrowInterestAccumulated;
        uint256 lastInterestUpdate;
        uint256 interestIndexSnapshot;
    }

    // ============== STATE VARIABLES ==============

    VaultInfo public vaultInfo;
    VaultState public vaultState;

    IERC20 public token;
    CVT public cvtToken;
    address public protocol;
    address public feeCollector;

    mapping(address => Position) public positions;
    address[] private suppliers;

    uint256 public setupFee;
    uint256 public performanceFee;
    uint256 public borrowFeeRate; // Protocol fee on borrow interest (e.g., 1500 = 15%)

    // Global index for O(1) interest distribution
    uint256 public interestIndex;
    uint256 private constant INDEX_PRECISION = 1e18;

    // ============== STAKING VARIABLES ==============

    ICVTStaking public stakingContract;
    uint256 public totalStakedLiquidity; // Total liquidity from staked CVT
    mapping(address => uint256) public stakedAmounts; // User's staked underlying amount

    // ============== CROSS-COLLATERAL VARIABLES ==============

    ICollateralManager public collateralManager;
    bool public crossCollateralEnabled; // If true, use CollateralManager for borrow checks

    // ============== STORAGE GAP ==============

    /**
     * @dev Reserved storage space for future upgrades.
     * This allows adding new state variables without breaking storage layout.
     * See https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable#storage-gaps
     */
    uint256[50] private __gap;

    // ============== EVENTS ==============

    event Supplied(address indexed supplier, uint256 amount, uint256 cvtMinted);
    event Withdrawn(address indexed supplier, uint256 amount, uint256 cvtBurned, uint256 penalty);
    event Borrowed(address indexed borrower, uint256 amount);
    event BorrowRepaid(address indexed borrower, uint256 amount);
    event InterestClaimed(address indexed supplier, uint256 amount);
    event BorrowInterestCollected(address indexed borrower, uint256 totalInterest, uint256 protocolFee, uint256 supplierShare);
    event Liquidated(address indexed liquidator, address indexed borrower, uint256 debtRepaid, uint256 collateralSeized, uint256 surplusReturned);
    event StakingContractSet(address indexed stakingContract);
    event StakeNotified(address indexed user, uint256 amount);
    event UnstakeNotified(address indexed user, uint256 amount);
    event CollateralManagerSet(address indexed collateralManager);
    event CrossCollateralToggled(bool enabled);
    event CrossCollateralBorrow(address indexed borrower, uint256 amount);
    event VaultConfigUpdated(string param, uint256 newValue);

    // ============== ERRORS ==============

    error InvalidAddress();
    error InvalidAmount();
    error InsufficientBalance();
    error PositionLocked();
    error ExceedsMaxBorrow();
    error InsufficientLiquidity();
    error PositionNotSolvent();
    error PositionSolvent();
    error VaultNotActive();
    error NothingToClaim();
    error OnlyStakingContract();
    error UserHasStakedCVT();
    error UtilizationTooHigh();

    // ============== MODIFIERS ==============

    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "Not admin");
        _;
    }

    modifier onlyManager() {
        require(hasRole(MANAGER_ROLE, msg.sender), "Not manager");
        _;
    }

    modifier vaultActive() {
        if (!vaultInfo.isActive) revert VaultNotActive();
        _;
    }

    modifier onlyStaking() {
        if (msg.sender != address(stakingContract)) revert OnlyStakingContract();
        _;
    }

    // ============== INTERNAL HELPERS ==============

    /**
     * @dev Scale amount from underlying token decimals to CVT decimals (18)
     * @param amount Amount in underlying token units
     * @return Scaled amount in CVT units (18 decimals)
     */
    function _scaleToCVT(uint256 amount) internal view returns (uint256) {
        uint8 tokenDecimals = IERC20Metadata(address(token)).decimals();
        uint8 cvtDecimals = 18; // CVT always has 18 decimals

        if (tokenDecimals == cvtDecimals) {
            return amount;
        } else if (tokenDecimals < cvtDecimals) {
            // Scale up (e.g., USDC 6 decimals -> CVT 18 decimals)
            return amount * (10 ** (cvtDecimals - tokenDecimals));
        } else {
            // Scale down (shouldn't happen but handle it)
            return amount / (10 ** (tokenDecimals - cvtDecimals));
        }
    }

    /**
     * @dev Scale amount from CVT decimals (18) back to underlying token decimals
     * @param cvtAmount Amount in CVT units (18 decimals)
     * @return Scaled amount in underlying token units
     */
    function _scaleFromCVT(uint256 cvtAmount) internal view returns (uint256) {
        uint8 tokenDecimals = IERC20Metadata(address(token)).decimals();
        uint8 cvtDecimals = 18; // CVT always has 18 decimals

        if (tokenDecimals == cvtDecimals) {
            return cvtAmount;
        } else if (tokenDecimals < cvtDecimals) {
            // Scale down (e.g., CVT 18 decimals -> USDC 6 decimals)
            return cvtAmount / (10 ** (cvtDecimals - tokenDecimals));
        } else {
            // Scale up (shouldn't happen but handle it)
            return cvtAmount * (10 ** (tokenDecimals - cvtDecimals));
        }
    }

    // ============== CONSTRUCTOR ==============

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _protocol,
        address _token,
        address _cvtToken,
        address _admin,
        address _treasury,
        address _feeCollector,
        uint256 _vaultId,
        uint256 _maxLiquidity,
        uint256 _borrowBaseRate,
        uint256 _borrowSlope,
        uint256 _maxBorrowRatio,
        uint256 _liquidationThreshold,
        uint256 _liquidationBonus,
        uint256 _setupFee,
        uint256 _performanceFee,
        uint256 _borrowFeeRate
    ) external initializer {
        __AccessControl_init();
        __Pausable_init();
        __ReentrancyGuard_init();

        if (_protocol == address(0) || _token == address(0) || _admin == address(0) || _cvtToken == address(0)) {
            revert InvalidAddress();
        }

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(MANAGER_ROLE, _treasury);

        protocol = _protocol;
        token = IERC20(_token);
        cvtToken = CVT(_cvtToken);
        feeCollector = _feeCollector;
        setupFee = _setupFee;
        performanceFee = _performanceFee;
        borrowFeeRate = _borrowFeeRate;

        vaultInfo = VaultInfo({
            vaultId: _vaultId,
            maxLiquidity: _maxLiquidity,
            borrowBaseRate: _borrowBaseRate,
            borrowSlope: _borrowSlope,
            maxBorrowRatio: _maxBorrowRatio,
            liquidationThreshold: _liquidationThreshold,
            liquidationBonus: _liquidationBonus,
            isActive: true,
            createdAt: block.timestamp,
            treasury: _treasury
        });

        vaultState = VaultState({
            totalSupplied: 0,
            totalBorrowed: 0,
            availableLiquidity: 0,
            utilizationRate: 0,
            totalInterestCollected: 0,
            lastInterestUpdate: block.timestamp,
            totalBadDebt: 0
        });
    }

    // ============== SUPPLY / WITHDRAW ==============

    /**
     * @notice Supply USDC to the vault
     * @param amount Amount of USDC to supply
     * @param lockConfig Lock configuration for the position
     * @dev CEI pattern: Checks -> Effects -> Interactions
     */
    function supply(uint256 amount, LockConfig memory lockConfig)
        external
        nonReentrant
        whenNotPaused
        vaultActive
    {
        // ===== CHECKS =====
        if (amount == 0) revert InvalidAmount();
        if (vaultState.totalSupplied + amount > vaultInfo.maxLiquidity) {
            revert InvalidAmount();
        }

        // Update interests and rewards before supply
        _updateInterests(msg.sender);
        _updateUserRewards(msg.sender);

        Position storage pos = positions[msg.sender];

        // If first time, add to suppliers list and set index snapshot
        if (pos.amount == 0) {
            suppliers.push(msg.sender);
            pos.lastInterestUpdate = block.timestamp;
            pos.interestIndexSnapshot = interestIndex;
        }

        // ===== EFFECTS (update state BEFORE external calls) =====
        // Calculate CVT amount (scaled to 18 decimals)
        uint256 cvtAmount = _scaleToCVT(amount);

        // Update position
        pos.amount += amount;
        pos.cvtBalance += cvtAmount; // Store in CVT units (18 decimals)

        // Setup lock if configured
        if (lockConfig.hasLock) {
            pos.lockConfig = lockConfig;
            pos.isLocked = true;
            pos.lockEndDate = block.timestamp + lockConfig.lockDurationSeconds;
        }

        // Update vault state
        vaultState.totalSupplied += amount;
        vaultState.availableLiquidity += amount;
        _updateUtilization();

        // ===== INTERACTIONS (external calls AFTER state updates) =====
        // Transfer token from supplier to vault
        token.safeTransferFrom(msg.sender, address(this), amount);

        // Mint CVT tokens (scaled to 18 decimals)
        cvtToken.mint(msg.sender, cvtAmount);

        // Record collateral in CollateralManager if cross-collateral is enabled
        if (crossCollateralEnabled && address(collateralManager) != address(0)) {
            collateralManager.recordCollateralDeposit(msg.sender, vaultInfo.vaultId, amount);
        }

        emit Supplied(msg.sender, amount, cvtAmount);
    }

    /**
     * @notice Withdraw USDC from the vault
     * @param amount Amount to withdraw
     * @dev CEI pattern: Checks -> Effects -> Interactions
     */
    function withdraw(uint256 amount) external nonReentrant whenNotPaused {
        // ===== CHECKS =====
        if (amount == 0) revert InvalidAmount();

        Position storage pos = positions[msg.sender];
        if (pos.amount < amount) revert InsufficientBalance();

        // Update interests BEFORE solvency check to include accumulated interest
        _updateInterests(msg.sender);
        _updateUserRewards(msg.sender);

        // Check solvency if user has borrowed (now includes updated interest)
        if (pos.borrowedAmount > 0) {
            uint256 remainingSupply = pos.amount - amount;
            uint256 totalDebt = pos.borrowedAmount + pos.borrowInterestAccumulated;
            if (!CantorVaultInterestModel.isSolvent(
                remainingSupply,
                totalDebt,
                vaultInfo.maxBorrowRatio
            )) {
                revert PositionNotSolvent();
            }
        }

        uint256 penalty = 0;
        uint256 amountToWithdraw = amount;

        // Check lock status
        if (pos.isLocked && block.timestamp < pos.lockEndDate) {
            if (!pos.lockConfig.canWithdrawEarly) {
                revert PositionLocked();
            }
            // Apply early withdrawal penalty
            penalty = (amount * pos.lockConfig.earlyWithdrawalFee) / 10000;
            amountToWithdraw = amount - penalty;

            // Distribute penalty to other suppliers as interest
            if (penalty > 0) {
                _distributeInterest(penalty);
            }
        }

        // Check available liquidity
        if (vaultState.availableLiquidity < amountToWithdraw) {
            revert InsufficientLiquidity();
        }

        // ===== EFFECTS (update state BEFORE external calls) =====
        // Calculate CVT amount to burn (scaled to 18 decimals)
        uint256 cvtAmount = _scaleToCVT(amount);

        // Update position
        pos.amount -= amount;
        pos.cvtBalance -= cvtAmount; // CVT balance is in 18 decimals

        // Update vault state
        vaultState.totalSupplied -= amount;
        vaultState.availableLiquidity -= amountToWithdraw;
        _updateUtilization();

        // ===== INTERACTIONS (external calls AFTER state updates) =====
        // Burn CVT tokens (scaled to 18 decimals)
        cvtToken.burn(msg.sender, cvtAmount);

        // Record withdrawal in CollateralManager if cross-collateral is enabled
        if (crossCollateralEnabled && address(collateralManager) != address(0)) {
            collateralManager.recordCollateralWithdrawal(msg.sender, vaultInfo.vaultId, amount);
        }

        // Transfer token to withdrawer (minus penalty)
        token.safeTransfer(msg.sender, amountToWithdraw);

        emit Withdrawn(msg.sender, amountToWithdraw, cvtAmount, penalty);
    }

    // ============== BORROW / REPAY ==============

    /**
     * @notice Borrow USDC from the vault using your supply as collateral
     * @param amount Amount to borrow
     * @dev Users with staked CVT cannot borrow (their CVT is locked in staking)
     */
    function borrow(uint256 amount) external nonReentrant whenNotPaused vaultActive {
        if (amount == 0) revert InvalidAmount();

        Position storage pos = positions[msg.sender];
        if (pos.amount == 0) revert InsufficientBalance();

        // Users with staked CVT cannot borrow
        if (stakedAmounts[msg.sender] > 0) revert UserHasStakedCVT();

        // Update interests and rewards before borrow
        _updateInterests(msg.sender);
        _updateUserRewards(msg.sender);

        // Check max borrow ratio
        uint256 maxBorrow = CantorVaultInterestModel.calculateMaxBorrow(
            pos.amount,
            vaultInfo.maxBorrowRatio
        );

        if (pos.borrowedAmount + amount > maxBorrow) {
            revert ExceedsMaxBorrow();
        }

        // Check available liquidity
        if (vaultState.availableLiquidity < amount) {
            revert InsufficientLiquidity();
        }

        // Check utilization won't exceed MAX_UTILIZATION (95%)
        // This keeps 5% liquidity buffer for withdrawals
        uint256 newTotalBorrowed = vaultState.totalBorrowed + amount;
        uint256 newUtilization = CantorVaultInterestModel.calculateUtilization(
            newTotalBorrowed,
            vaultState.totalSupplied
        );
        if (!CantorVaultInterestModel.isUtilizationSafe(newUtilization)) {
            revert UtilizationTooHigh();
        }

        // If first borrow, initialize lastInterestUpdate to now
        // This ensures interest accrues only from borrow start, not from supply date
        if (pos.borrowedAmount == 0) {
            pos.lastInterestUpdate = block.timestamp;
        }

        // Update position
        pos.borrowedAmount += amount;

        // Update vault state
        vaultState.totalBorrowed += amount;
        vaultState.availableLiquidity -= amount;
        _updateUtilization();

        // Transfer token to borrower
        token.safeTransfer(msg.sender, amount);

        emit Borrowed(msg.sender, amount);
    }

    /**
     * @notice Repay a borrow position
     * @param amount Amount to repay
     * @dev CEI pattern: Checks -> Effects -> Interactions
     */
    function repayBorrow(uint256 amount) external nonReentrant whenNotPaused {
        // ===== CHECKS =====
        if (amount == 0) revert InvalidAmount();

        Position storage pos = positions[msg.sender];
        if (pos.borrowedAmount == 0) revert InvalidAmount();

        // Update interests and rewards before repay
        _updateInterests(msg.sender);
        _updateUserRewards(msg.sender);

        // Cap at total debt (principal + interest)
        uint256 totalDebt = pos.borrowedAmount + pos.borrowInterestAccumulated;
        if (amount > totalDebt) {
            amount = totalDebt;
        }

        // ===== EFFECTS (calculate and update state BEFORE transfers) =====
        uint256 remainingAmount = amount;
        uint256 interestPayment = 0;
        uint256 protocolFee = 0;
        uint256 supplierShare = 0;

        // First repay accumulated interest, then principal
        if (pos.borrowInterestAccumulated > 0) {
            interestPayment = remainingAmount > pos.borrowInterestAccumulated
                ? pos.borrowInterestAccumulated
                : remainingAmount;
            pos.borrowInterestAccumulated -= interestPayment;
            remainingAmount -= interestPayment;

            // Track total interest collected
            vaultState.totalInterestCollected += interestPayment;

            // Split interest: protocol takes borrowFeeRate%, suppliers get the rest
            protocolFee = (interestPayment * borrowFeeRate) / 10000;
            supplierShare = interestPayment - protocolFee;

            // Distribute remaining interest to suppliers (updates interestIndex)
            if (supplierShare > 0) {
                _distributeInterest(supplierShare);
            }
        }

        // Repay principal
        if (remainingAmount > 0) {
            pos.borrowedAmount -= remainingAmount;
            vaultState.totalBorrowed -= remainingAmount;
        }

        // Update available liquidity (amount minus protocol fee that was sent out)
        uint256 protocolFeeDeducted = (interestPayment * borrowFeeRate) / 10000;
        vaultState.availableLiquidity += (amount - protocolFeeDeducted);
        _updateUtilization();

        // ===== INTERACTIONS (external calls AFTER state updates) =====
        // Transfer token from borrower to vault
        token.safeTransferFrom(msg.sender, address(this), amount);

        // Send protocol fee to FeeCollector
        if (protocolFee > 0 && feeCollector != address(0)) {
            token.safeTransfer(feeCollector, protocolFee);
            IFeeCollector(feeCollector).notifyFeeReceived(address(token), protocolFee);
        }

        if (interestPayment > 0) {
            emit BorrowInterestCollected(msg.sender, interestPayment, protocolFee, supplierShare);
        }

        emit BorrowRepaid(msg.sender, amount);
    }

    // ============== STAKING FUNCTIONS ==============

    /**
     * @notice Set the staking contract address
     * @param _stakingContract Address of the CVTStaking contract
     */
    function setStakingContract(address _stakingContract) external onlyAdmin {
        if (_stakingContract == address(0)) revert InvalidAddress();
        stakingContract = ICVTStaking(_stakingContract);
        emit StakingContractSet(_stakingContract);
    }

    /**
     * @notice Called by staking contract when user stakes CVT
     * @param user User who staked
     * @param amount Amount of CVT staked (= underlying amount)
     */
    function notifyStake(address user, uint256 amount) external onlyStaking {
        if (amount == 0) revert InvalidAmount();

        stakedAmounts[user] += amount;
        totalStakedLiquidity += amount;

        emit StakeNotified(user, amount);
    }

    /**
     * @notice Called by staking contract when user unstakes CVT
     * @param user User who unstaked
     * @param amount Amount of CVT unstaked (= underlying amount)
     */
    function notifyUnstake(address user, uint256 amount) external onlyStaking {
        if (amount == 0) revert InvalidAmount();
        if (stakedAmounts[user] < amount) revert InsufficientBalance();

        stakedAmounts[user] -= amount;
        totalStakedLiquidity -= amount;

        emit UnstakeNotified(user, amount);
    }

    // ============== CROSS-COLLATERAL FUNCTIONS ==============

    /**
     * @notice Set the CollateralManager contract address
     * @param _collateralManager Address of the CollateralManager contract
     */
    function setCollateralManager(address _collateralManager) external onlyAdmin {
        if (_collateralManager == address(0)) revert InvalidAddress();
        collateralManager = ICollateralManager(_collateralManager);
        emit CollateralManagerSet(_collateralManager);
    }

    /**
     * @notice Enable or disable cross-collateral borrowing
     * @param enabled True to enable, false to disable
     */
    function setCrossCollateralEnabled(bool enabled) external onlyAdmin {
        crossCollateralEnabled = enabled;
        emit CrossCollateralToggled(enabled);
    }

    /**
     * @notice Borrow using cross-collateral (collateral from ANY vault)
     * @param amount Amount to borrow from this vault
     * @dev CEI pattern: Checks -> Effects -> Interactions
     */
    function crossCollateralBorrow(uint256 amount) external nonReentrant whenNotPaused vaultActive {
        // ===== CHECKS =====
        if (!crossCollateralEnabled) revert VaultNotActive();
        if (amount == 0) revert InvalidAmount();
        if (address(collateralManager) == address(0)) revert InvalidAddress();

        // Check available liquidity in this vault
        if (vaultState.availableLiquidity < amount) {
            revert InsufficientLiquidity();
        }

        // Check utilization won't exceed MAX_UTILIZATION (95%)
        uint256 newTotalBorrowed = vaultState.totalBorrowed + amount;
        uint256 newUtilization = CantorVaultInterestModel.calculateUtilization(
            newTotalBorrowed,
            vaultState.totalSupplied
        );
        if (!CantorVaultInterestModel.isUtilizationSafe(newUtilization)) {
            revert UtilizationTooHigh();
        }

        // Check if user can borrow based on global collateral
        if (!collateralManager.canBorrow(msg.sender, vaultInfo.vaultId, amount)) {
            revert ExceedsMaxBorrow();
        }

        // Update interests before modifying position
        _updateInterests(msg.sender);
        _updateUserRewards(msg.sender);

        Position storage pos = positions[msg.sender];

        // If first borrow, initialize lastInterestUpdate
        if (pos.borrowedAmount == 0) {
            pos.lastInterestUpdate = block.timestamp;
        }

        // ===== EFFECTS (update state BEFORE external calls) =====
        // Record debt in local position for interest accrual and liquidation
        pos.borrowedAmount += amount;

        vaultState.totalBorrowed += amount;
        vaultState.availableLiquidity -= amount;
        _updateUtilization();

        // ===== INTERACTIONS (external calls AFTER state updates) =====
        // Record debt in CollateralManager for cross-vault tracking
        collateralManager.recordDebtIncrease(msg.sender, vaultInfo.vaultId, amount);

        // Transfer token to borrower
        token.safeTransfer(msg.sender, amount);

        emit CrossCollateralBorrow(msg.sender, amount);
    }

    /**
     * @notice Repay a cross-collateral borrow
     * @param amount Amount to repay
     */
    function repayCrossCollateralBorrow(uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) revert InvalidAmount();
        if (address(collateralManager) == address(0)) revert InvalidAddress();

        // Update interests before repayment
        _updateInterests(msg.sender);
        _updateUserRewards(msg.sender);

        Position storage pos = positions[msg.sender];

        // Cap at total debt (principal + interest) in local position
        uint256 totalLocalDebt = pos.borrowedAmount + pos.borrowInterestAccumulated;
        uint256 actualAmount = amount > totalLocalDebt ? totalLocalDebt : amount;

        // Transfer token from borrower to vault
        token.safeTransferFrom(msg.sender, address(this), actualAmount);

        // Calculate local interest and principal repayment
        uint256 interestPaid = 0;
        uint256 principalPaid = 0;

        // First repay accumulated interest from local position
        if (pos.borrowInterestAccumulated > 0 && actualAmount > 0) {
            interestPaid = actualAmount > pos.borrowInterestAccumulated
                ? pos.borrowInterestAccumulated
                : actualAmount;
            pos.borrowInterestAccumulated -= interestPaid;
            actualAmount -= interestPaid;

            // Track total interest collected
            vaultState.totalInterestCollected += interestPaid;
        }

        // Then repay principal from local position
        if (actualAmount > 0 && pos.borrowedAmount > 0) {
            principalPaid = actualAmount > pos.borrowedAmount
                ? pos.borrowedAmount
                : actualAmount;
            pos.borrowedAmount -= principalPaid;
        }

        // Record repayment in CollateralManager for cross-vault tracking
        collateralManager.recordDebtRepayment(
            msg.sender,
            vaultInfo.vaultId,
            interestPaid + principalPaid
        );

        // Handle interest (split between protocol and suppliers)
        if (interestPaid > 0) {
            uint256 protocolFee = (interestPaid * borrowFeeRate) / 10000;
            uint256 supplierShare = interestPaid - protocolFee;

            // Send protocol fee to FeeCollector
            if (protocolFee > 0 && feeCollector != address(0)) {
                token.safeTransfer(feeCollector, protocolFee);
                IFeeCollector(feeCollector).notifyFeeReceived(address(token), protocolFee);
            }

            // Distribute remaining interest to suppliers
            if (supplierShare > 0) {
                _distributeInterest(supplierShare);
            }

            emit BorrowInterestCollected(msg.sender, interestPaid, protocolFee, supplierShare);
        }

        // Update vault state for principal
        if (principalPaid > 0) {
            vaultState.totalBorrowed -= principalPaid;
        }

        // Update available liquidity (minus protocol fee)
        uint256 protocolFeeDeducted = (interestPaid * borrowFeeRate) / 10000;
        vaultState.availableLiquidity += (interestPaid + principalPaid - protocolFeeDeducted);
        _updateUtilization();

        emit BorrowRepaid(msg.sender, interestPaid + principalPaid);
    }

    // ============== CLAIM FUNCTIONS ==============

    /**
     * @notice Claim interest earnings (borrow interests + penalties)
     * @dev All supplier earnings flow through interestIndex
     */
    function claimInterest() external nonReentrant whenNotPaused {
        _updateUserRewards(msg.sender);

        Position storage pos = positions[msg.sender];
        uint256 amount = pos.interestPending;

        if (amount == 0) revert NothingToClaim();

        pos.interestPending = 0;
        pos.interestClaimed += amount;
        vaultState.availableLiquidity -= amount;

        token.safeTransfer(msg.sender, amount);

        emit InterestClaimed(msg.sender, amount);
    }

    // ============== LIQUIDATION ==============

    /**
     * @notice Liquidate an insolvent position
     * @param borrower Address of the borrower to liquidate
     * @dev CEI pattern: Checks -> Effects -> Interactions
     *      Liquidator receives a bonus (liquidationBonus) as incentive
     */
    function liquidate(address borrower) external nonReentrant whenNotPaused {
        // ===== CHECKS =====
        // Update borrower's rewards before liquidation to ensure correct accounting
        _updateUserRewards(borrower);
        _updateInterests(borrower);

        Position storage pos = positions[borrower];

        uint256 principal = pos.borrowedAmount;
        uint256 accumulatedInterest = pos.borrowInterestAccumulated;
        uint256 totalDebt = principal + accumulatedInterest;

        if (CantorVaultInterestModel.isSolvent(
            pos.amount,
            totalDebt,
            vaultInfo.liquidationThreshold
        )) {
            revert PositionSolvent();
        }

        uint256 collateral = pos.amount;
        uint256 surplusToReturn = 0;
        uint256 liquidatorBonus = 0;
        uint256 protocolProfit = 0;

        // Calculate liquidator bonus from collateral
        // liquidationBonus is in basis points (e.g., 500 = 5%)
        uint256 maxBonus = (collateral * vaultInfo.liquidationBonus) / 10000;

        // Tokens actually in vault from this user = collateral - principal
        uint256 userTokensInVault = collateral > principal ? collateral - principal : 0;

        if (collateral >= totalDebt) {
            // Collateral covers full debt
            uint256 available = collateral - totalDebt;

            // Liquidator gets their bonus first (capped by available and actual tokens)
            liquidatorBonus = available > maxBonus ? maxBonus : available;
            if (liquidatorBonus > userTokensInVault) {
                liquidatorBonus = userTokensInVault;
            }

            // Remaining goes to borrower as surplus
            surplusToReturn = available - liquidatorBonus;
            if (surplusToReturn > userTokensInVault - liquidatorBonus) {
                surplusToReturn = userTokensInVault - liquidatorBonus;
            }

            // Protocol gets accumulated interest
            protocolProfit = accumulatedInterest;
            if (protocolProfit > userTokensInVault - liquidatorBonus - surplusToReturn) {
                protocolProfit = userTokensInVault - liquidatorBonus - surplusToReturn;
            }
        } else {
            // Bad debt: collateral doesn't cover debt
            // Liquidator still gets a bonus to incentivize cleanup (from available tokens)
            liquidatorBonus = userTokensInVault > maxBonus ? maxBonus : userTokensInVault;
            protocolProfit = userTokensInVault > liquidatorBonus ? userTokensInVault - liquidatorBonus : 0;

            // Track bad debt = uncovered portion of debt
            uint256 badDebt = totalDebt - collateral;
            vaultState.totalBadDebt += badDebt;
        }

        // ===== EFFECTS (update ALL state BEFORE external calls) =====
        // Clear all pending amounts for liquidated borrower
        pos.interestPending = 0;
        pos.borrowedAmount = 0;
        pos.borrowInterestAccumulated = 0;
        pos.amount = 0;
        pos.cvtBalance = 0;

        // Update vault state BEFORE external calls
        vaultState.totalSupplied -= collateral;
        vaultState.totalBorrowed -= principal;

        // Pre-calculate available liquidity change
        // We'll transfer out: liquidatorBonus + surplusToReturn + protocolProfit (if to feeCollector)
        // The actual balance update happens after transfers, but we account for it here
        uint256 totalOutflow = liquidatorBonus + surplusToReturn;
        if (feeCollector != address(0)) {
            totalOutflow += protocolProfit;
        }

        // Calculate expected available liquidity after transfers
        // availableLiquidity = current balance - outflows
        // But we also removed collateral from totalSupplied, so we need to adjust
        uint256 currentBalance = token.balanceOf(address(this));
        uint256 expectedBalance = currentBalance - totalOutflow;
        vaultState.availableLiquidity = expectedBalance;

        // Distribute interest to suppliers if no feeCollector (updates interestIndex)
        // This must happen in EFFECTS because it updates state
        if (protocolProfit > 0 && feeCollector == address(0)) {
            _distributeInterest(protocolProfit);
        }

        _updateUtilization();

        // ===== INTERACTIONS (external calls AFTER state updates) =====
        // Burn CVT tokens (scaled to 18 decimals)
        uint256 cvtToBurn = _scaleToCVT(collateral);
        cvtToken.burn(borrower, cvtToBurn);

        // Pay liquidator bonus (incentive)
        if (liquidatorBonus > 0) {
            token.safeTransfer(msg.sender, liquidatorBonus);
        }

        // Return surplus to borrower if any
        if (surplusToReturn > 0) {
            token.safeTransfer(borrower, surplusToReturn);
        }

        // Send protocol profit to fee collector
        if (protocolProfit > 0 && feeCollector != address(0)) {
            token.safeTransfer(feeCollector, protocolProfit);
            IFeeCollector(feeCollector).notifyFeeReceived(address(token), protocolProfit);
        }

        emit Liquidated(msg.sender, borrower, totalDebt, collateral, liquidatorBonus);
    }

    // ============== INTERNAL FUNCTIONS ==============

    /**
     * @notice Update accumulated borrow interests for a position
     * @dev Only borrowers accumulate interest debt. Suppliers earn via interestIndex when borrowers repay.
     *      Always perform calculation to ensure accurate state.
     * @param user Address of the user
     */
    function _updateInterests(address user) internal {
        Position storage pos = positions[user];

        // Always update timestamp even if no borrow - prevents stale data
        uint256 lastUpdate = pos.lastInterestUpdate;
        pos.lastInterestUpdate = block.timestamp;

        // Skip interest calculation if no debt or vault inactive
        // Note: Using < 1 instead of == 0 to satisfy Slither's strict equality check
        // This is safe because borrowedAmount is always a positive integer when debt exists
        if (pos.borrowedAmount < 1 || !vaultInfo.isActive) {
            return;
        }

        uint256 timeElapsed = block.timestamp - lastUpdate;

        // Always calculate interest (even if small time elapsed)
        // Calculate borrow rate
        uint256 borrowRate = _calculateBorrowRate();

        // Calculate accumulated borrow interest (borrowers owe this)
        uint256 borrowInterest = CantorVaultInterestModel.calculateInterest(
            pos.borrowedAmount,
            borrowRate,
            timeElapsed
        );

        pos.borrowInterestAccumulated += borrowInterest;
    }

    /**
     * @notice Distribute interest to suppliers using global index (O(1))
     * @param amount Amount to distribute
     * @dev Always calculates even for small amounts to ensure precision
     */
    function _distributeInterest(uint256 amount) internal {
        // Skip only if there's literally nothing to distribute or no suppliers
        // Note: Using < 1 instead of == 0 to satisfy Slither's strict equality check
        // This is safe because totalSupplied is always a positive integer when suppliers exist
        if (vaultState.totalSupplied < 1) {
            return;
        }

        // Always calculate the index increase (even for small amounts)
        // This ensures precision and prevents rounding issues
        uint256 indexIncrease = (amount * INDEX_PRECISION) / vaultState.totalSupplied;
        interestIndex += indexIncrease;
    }

    /**
     * @notice Update user's pending interest based on index delta
     * @param user Address of the user
     */
    function _updateUserRewards(address user) internal {
        Position storage pos = positions[user];
        if (pos.amount == 0) return;

        // Calculate interest earned since last update
        uint256 indexDelta = interestIndex - pos.interestIndexSnapshot;
        if (indexDelta > 0) {
            uint256 interestEarned = (pos.amount * indexDelta) / INDEX_PRECISION;
            pos.interestPending += interestEarned;
        }

        // Update snapshot
        pos.interestIndexSnapshot = interestIndex;
    }

    /**
     * @notice Calculate variable borrow rate
     * @return borrowRate Current borrow rate in basis points
     */
    function _calculateBorrowRate() internal view returns (uint256) {
        return CantorVaultInterestModel.calculateBorrowRate(
            vaultInfo.borrowBaseRate,
            vaultInfo.borrowSlope,
            vaultState.utilizationRate
        );
    }

    /**
     * @notice Update utilization rate
     */
    function _updateUtilization() internal {
        vaultState.utilizationRate = CantorVaultInterestModel.calculateUtilization(
            vaultState.totalBorrowed,
            vaultState.totalSupplied
        );
    }

    // ============== VIEW FUNCTIONS ==============

    function getVaultInfo() external view returns (VaultInfo memory) {
        return vaultInfo;
    }

    function getVaultState() external view returns (VaultState memory) {
        return vaultState;
    }

    function getUserPosition(address user) external view returns (Position memory) {
        return positions[user];
    }

    function calculateBorrowRate() external view returns (uint256) {
        return _calculateBorrowRate();
    }

    function getUtilizationRate() external view returns (uint256) {
        return vaultState.utilizationRate;
    }

    function getSuppliersCount() external view returns (uint256) {
        return suppliers.length;
    }

    /**
     * @notice Check if a user position is liquidatable
     * @param user User address to check
     * @return True if position can be liquidated
     */
    function isLiquidatable(address user) external view returns (bool) {
        Position storage pos = positions[user];
        if (pos.amount == 0 || pos.borrowedAmount == 0) return false;

        // Calculate debt with interest
        uint256 totalDebt = pos.borrowedAmount + pos.borrowInterestAccumulated;
        uint256 maxLiquidatable = (pos.amount * vaultInfo.liquidationThreshold) / 10000;

        return totalDebt > maxLiquidatable;
    }

    // ============== CLIENT VIEW FUNCTIONS ==============

    /**
     * @notice Get user's health factor (10000 = 100% healthy, below = at risk)
     * @param user User address
     * @return healthFactor (10000 = safe, < maxBorrowRatio = at risk of liquidation)
     * @dev Fixed precision: multiply before divide to prevent precision loss
     */
    function getHealthFactor(address user) external view returns (uint256 healthFactor) {
        Position storage pos = positions[user];
        if (pos.borrowedAmount == 0) return type(uint256).max; // No debt = infinite health

        uint256 totalDebt = pos.borrowedAmount + pos.borrowInterestAccumulated;
        if (totalDebt == 0) return type(uint256).max;

        // Health = (collateral * liquidationThreshold * 10000) / (debt * 10000)
        // Multiply first to preserve precision: (collateral * liquidationThreshold) / totalDebt
        // This gives healthFactor directly in basis points
        healthFactor = (pos.amount * vaultInfo.liquidationThreshold) / totalDebt;
    }

    /**
     * @notice Get maximum amount user can borrow
     * @param user User address
     * @return maxBorrow Maximum borrowable amount
     * @dev Returns 0 if user has staked CVT (stakers cannot borrow)
     */
    function getMaxBorrow(address user) external view returns (uint256 maxBorrow) {
        Position storage pos = positions[user];
        if (pos.amount == 0) return 0;

        // Users with staked CVT cannot borrow - their collateral backs the protocol
        if (stakedAmounts[user] > 0) return 0;

        uint256 totalDebt = pos.borrowedAmount + pos.borrowInterestAccumulated;
        uint256 maxBorrowValue = (pos.amount * vaultInfo.maxBorrowRatio) / 10000;

        if (totalDebt >= maxBorrowValue) return 0;
        return maxBorrowValue - totalDebt;
    }

    /**
     * @notice Get user's total debt (principal + interest)
     * @param user User address
     * @return totalDebt Total debt amount
     */
    function getTotalDebt(address user) external view returns (uint256 totalDebt) {
        Position storage pos = positions[user];
        return pos.borrowedAmount + pos.borrowInterestAccumulated;
    }

    /**
     * @notice Get user's available withdrawal amount (considering borrow AND CVT balance)
     * @param user User address
     * @return withdrawable Amount that can be withdrawn
     */
    function getWithdrawable(address user) external view returns (uint256 withdrawable) {
        Position storage pos = positions[user];
        if (pos.amount == 0) return 0;

        // 1. Check user's actual CVT balance (not staked = available to burn)
        uint256 userCVTBalance = cvtToken.balanceOf(user);
        if (userCVTBalance == 0) return 0; // No CVT = can't withdraw anything

        // Convert CVT balance to underlying amount
        uint256 maxFromCVT = _scaleFromCVT(userCVTBalance);

        // 2. Calculate debt-based limit
        uint256 totalDebt = pos.borrowedAmount + pos.borrowInterestAccumulated;
        uint256 maxFromDebt;

        if (totalDebt == 0) {
            maxFromDebt = pos.amount;
        } else {
            // Required collateral = debt / maxLTV
            uint256 requiredCollateral = (totalDebt * 10000) / vaultInfo.maxBorrowRatio;
            if (pos.amount <= requiredCollateral) {
                maxFromDebt = 0;
            } else {
                maxFromDebt = pos.amount - requiredCollateral;
            }
        }

        // 3. Return the minimum of both limits
        return maxFromCVT < maxFromDebt ? maxFromCVT : maxFromDebt;
    }

    /**
     * @notice Get vault metrics for dashboard display
     * @return totalSupplied Total supplied to vault
     * @return totalBorrowed Total borrowed from vault
     * @return availableLiquidity Available for borrowing
     * @return utilizationRate Current utilization (bps)
     * @return borrowRate Current borrow APY (bps)
     * @return supplyRate Current supply APY (bps)
     */
    function getVaultMetrics() external view returns (
        uint256 totalSupplied,
        uint256 totalBorrowed,
        uint256 availableLiquidity,
        uint256 utilizationRate,
        uint256 borrowRate,
        uint256 supplyRate
    ) {
        totalSupplied = vaultState.totalSupplied;
        totalBorrowed = vaultState.totalBorrowed;
        availableLiquidity = vaultState.availableLiquidity;
        utilizationRate = vaultState.utilizationRate;
        borrowRate = _calculateBorrowRate();
        // Supply rate = borrow rate * utilization (simplified)
        supplyRate = (borrowRate * utilizationRate) / 10000;
    }

    /**
     * @notice Get comprehensive user summary for frontend
     * @param user User address
     * @return supplied User's supplied amount
     * @return borrowed User's borrowed amount (principal)
     * @return interest Accumulated interest
     * @return healthFactor Position health (10000 = 100%)
     * @return maxBorrow Maximum additional borrow
     * @return withdrawable Available for withdrawal (considers CVT balance!)
     * @return cvtBalance User's actual CVT token balance (what they can burn)
     * @dev Fixed precision: multiply before divide
     */
    function getUserSummary(address user) external view returns (
        uint256 supplied,
        uint256 borrowed,
        uint256 interest,
        uint256 healthFactor,
        uint256 maxBorrow,
        uint256 withdrawable,
        uint256 cvtBalance
    ) {
        Position storage pos = positions[user];
        supplied = pos.amount;
        borrowed = pos.borrowedAmount;
        interest = pos.borrowInterestAccumulated;

        // Real CVT balance (not staked = available to burn for withdrawal)
        cvtBalance = cvtToken.balanceOf(user);

        uint256 totalDebt = borrowed + interest;
        uint256 maxBorrowValue = (supplied * vaultInfo.maxBorrowRatio) / 10000;

        // Users with staked CVT cannot borrow - their collateral backs the protocol
        bool hasStaked = stakedAmounts[user] > 0;

        // Calculate debt-based withdrawable limit
        uint256 maxFromDebt;
        if (totalDebt == 0) {
            healthFactor = type(uint256).max;
            maxBorrow = hasStaked ? 0 : maxBorrowValue;
            maxFromDebt = supplied;
        } else {
            // Fixed precision: (supplied * liquidationThreshold) / totalDebt
            healthFactor = (supplied * vaultInfo.liquidationThreshold) / totalDebt;
            maxBorrow = hasStaked ? 0 : (totalDebt >= maxBorrowValue ? 0 : maxBorrowValue - totalDebt);

            uint256 requiredCollateral = (totalDebt * 10000) / vaultInfo.maxBorrowRatio;
            maxFromDebt = supplied <= requiredCollateral ? 0 : supplied - requiredCollateral;
        }

        // Withdrawable = minimum of (debt-based limit, CVT-based limit)
        uint256 maxFromCVT = cvtBalance > 0 ? _scaleFromCVT(cvtBalance) : 0;
        withdrawable = maxFromCVT < maxFromDebt ? maxFromCVT : maxFromDebt;
    }

    // ============== ADMIN CONFIG ==============

    /**
     * @notice Update max liquidity for the vault
     * @param newMaxLiquidity New maximum liquidity
     */
    function setMaxLiquidity(uint256 newMaxLiquidity) external onlyAdmin {
        vaultInfo.maxLiquidity = newMaxLiquidity;
        emit VaultConfigUpdated("maxLiquidity", newMaxLiquidity);
    }

    /**
     * @notice Update borrow rates
     * @param newBaseRate New base borrow rate (bps)
     * @param newSlope New borrow slope (bps)
     */
    function setBorrowRates(uint256 newBaseRate, uint256 newSlope) external onlyAdmin {
        vaultInfo.borrowBaseRate = newBaseRate;
        vaultInfo.borrowSlope = newSlope;
        emit VaultConfigUpdated("borrowBaseRate", newBaseRate);
        emit VaultConfigUpdated("borrowSlope", newSlope);
    }

    /**
     * @notice Update max borrow ratio (LTV)
     * @param newMaxBorrowRatio New max borrow ratio (bps, e.g. 7000 = 70%)
     */
    function setMaxBorrowRatio(uint256 newMaxBorrowRatio) external onlyAdmin {
        require(newMaxBorrowRatio <= 9000, "LTV too high");
        vaultInfo.maxBorrowRatio = newMaxBorrowRatio;
        emit VaultConfigUpdated("maxBorrowRatio", newMaxBorrowRatio);
    }

    /**
     * @notice Update liquidation threshold
     * @param newLiquidationThreshold New liquidation threshold (bps, e.g. 8000 = 80%)
     */
    function setLiquidationThreshold(uint256 newLiquidationThreshold) external onlyAdmin {
        require(newLiquidationThreshold <= 9500, "Threshold too high");
        require(newLiquidationThreshold >= vaultInfo.maxBorrowRatio, "Must be >= maxBorrowRatio");
        vaultInfo.liquidationThreshold = newLiquidationThreshold;
        emit VaultConfigUpdated("liquidationThreshold", newLiquidationThreshold);
    }

    /**
     * @notice Update liquidation bonus
     * @param newLiquidationBonus New bonus (bps, e.g. 500 = 5%)
     */
    function setLiquidationBonus(uint256 newLiquidationBonus) external onlyAdmin {
        require(newLiquidationBonus <= 2000, "Bonus too high");
        vaultInfo.liquidationBonus = newLiquidationBonus;
        emit VaultConfigUpdated("liquidationBonus", newLiquidationBonus);
    }

    // ============== EMERGENCY ==============

    function pause() external onlyAdmin {
        _pause();
    }

    function unpause() external onlyAdmin {
        _unpause();
    }

    // ============== UPGRADE ==============

    function _authorizeUpgrade(address newImplementation) internal override onlyAdmin {}
}
