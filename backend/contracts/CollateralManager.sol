// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "./PriceOracle.sol";
import "./CantorFiProtocol.sol";
import "./CantorVault.sol";

/**
 * @title CollateralManager
 * @notice Manages cross-collateral positions across all vaults
 * @dev Tracks user collateral value and debt value across multiple tokens
 */
contract CollateralManager is
    Initializable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    // ============== ROLES ==============

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VAULT_ROLE = keccak256("VAULT_ROLE");

    // ============== STATE VARIABLES ==============

    PriceOracle public priceOracle;
    CantorFiProtocol public protocol;

    /// @notice Global max LTV ratio (7000 = 70%)
    uint256 public maxLTV;

    /// @notice Liquidation threshold (8000 = 80% - when position becomes liquidatable)
    uint256 public liquidationThreshold;

    /// @notice Liquidation bonus for liquidators (500 = 5%)
    uint256 public liquidationBonus;

    /// @notice User's collateral deposits per vault
    /// user => vaultId => amount (in token decimals)
    mapping(address => mapping(uint256 => uint256)) public userCollateral;

    /// @notice User's debt per vault
    /// user => vaultId => amount (in token decimals)
    mapping(address => mapping(uint256 => uint256)) public userDebt;

    /// @notice User's accumulated interest per vault
    /// user => vaultId => amount (in token decimals)
    mapping(address => mapping(uint256 => uint256)) public userDebtInterest;

    /// @notice Last interest update timestamp per user per vault
    mapping(address => mapping(uint256 => uint256)) public lastInterestUpdate;

    /// @notice List of vaults where user has collateral
    mapping(address => uint256[]) public userCollateralVaults;

    /// @notice List of vaults where user has debt
    mapping(address => uint256[]) public userDebtVaults;

    // ============== STORAGE GAP ==============

    uint256[50] private __gap;

    // ============== EVENTS ==============

    event CollateralDeposited(address indexed user, uint256 indexed vaultId, uint256 amount);
    event CollateralWithdrawn(address indexed user, uint256 indexed vaultId, uint256 amount);
    event DebtIncurred(address indexed user, uint256 indexed vaultId, uint256 amount);
    event DebtRepaid(address indexed user, uint256 indexed vaultId, uint256 amount);
    event PositionLiquidated(
        address indexed liquidator,
        address indexed user,
        uint256 debtRepaid,
        uint256 collateralSeized
    );
    event MaxLTVUpdated(uint256 oldLTV, uint256 newLTV);
    event LiquidationThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);

    // ============== ERRORS ==============

    error InvalidAddress();
    error InvalidAmount();
    error ExceedsMaxLTV();
    error InsufficientCollateral();
    error PositionHealthy();
    error PositionNotHealthy();
    error Unauthorized();

    // ============== MODIFIERS ==============

    modifier onlyAdmin() {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert Unauthorized();
        _;
    }

    modifier onlyVault() {
        if (!hasRole(VAULT_ROLE, msg.sender)) revert Unauthorized();
        _;
    }

    // ============== CONSTRUCTOR ==============

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _priceOracle,
        address _protocol,
        address _admin,
        uint256 _maxLTV,
        uint256 _liquidationThreshold,
        uint256 _liquidationBonus
    ) external initializer {
        if (_priceOracle == address(0)) revert InvalidAddress();
        if (_protocol == address(0)) revert InvalidAddress();
        if (_admin == address(0)) revert InvalidAddress();
        if (_maxLTV > 9000) revert InvalidAmount(); // Max 90%
        if (_liquidationThreshold > 9500) revert InvalidAmount(); // Max 95%
        if (_liquidationThreshold <= _maxLTV) revert InvalidAmount();

        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);

        priceOracle = PriceOracle(_priceOracle);
        protocol = CantorFiProtocol(_protocol);
        maxLTV = _maxLTV;
        liquidationThreshold = _liquidationThreshold;
        liquidationBonus = _liquidationBonus;
    }

    // ============== COLLATERAL FUNCTIONS ==============

    /**
     * @notice Record collateral deposit (called by vault)
     * @param user User address
     * @param vaultId Vault ID where collateral is deposited
     * @param amount Amount deposited (in token decimals)
     */
    function recordCollateralDeposit(
        address user,
        uint256 vaultId,
        uint256 amount
    ) external onlyVault whenNotPaused {
        if (userCollateral[user][vaultId] == 0) {
            userCollateralVaults[user].push(vaultId);
        }
        userCollateral[user][vaultId] += amount;

        emit CollateralDeposited(user, vaultId, amount);
    }

    /**
     * @notice Record collateral withdrawal (called by vault)
     * @param user User address
     * @param vaultId Vault ID
     * @param amount Amount to withdraw
     */
    function recordCollateralWithdrawal(
        address user,
        uint256 vaultId,
        uint256 amount
    ) external onlyVault whenNotPaused {
        if (userCollateral[user][vaultId] < amount) revert InsufficientCollateral();

        userCollateral[user][vaultId] -= amount;

        // Check if withdrawal would make position unhealthy
        if (!_isHealthy(user)) revert ExceedsMaxLTV();

        emit CollateralWithdrawn(user, vaultId, amount);
    }

    /**
     * @notice Check if user can borrow (called by vault before borrow)
     * @param user User address
     * @param vaultId Vault ID to borrow from
     * @param amount Amount to borrow
     * @return canBorrow True if borrow is allowed
     */
    function canBorrow(
        address user,
        uint256 vaultId,
        uint256 amount
    ) external view returns (bool) {
        uint256 totalCollateralUSD = getTotalCollateralValueUSD(user);
        uint256 currentDebtUSD = getTotalDebtValueUSD(user);

        // Calculate new debt value
        address vaultAddress = protocol.getVaultAddress(vaultId);
        CantorVault vault = CantorVault(vaultAddress);
        address token = address(vault.token());
        uint8 decimals = IERC20Metadata(token).decimals();

        uint256 newDebtUSD = priceOracle.getUSDValue(token, amount, decimals);
        uint256 totalDebtAfter = currentDebtUSD + newDebtUSD;

        // Check LTV
        uint256 maxBorrowUSD = (totalCollateralUSD * maxLTV) / 10000;

        return totalDebtAfter <= maxBorrowUSD;
    }

    /**
     * @notice Record debt increase (called by vault on borrow)
     * @param user User address
     * @param vaultId Vault ID
     * @param amount Amount borrowed
     */
    function recordDebtIncrease(
        address user,
        uint256 vaultId,
        uint256 amount
    ) external onlyVault whenNotPaused {
        // Update interest first
        _updateUserInterest(user, vaultId);

        if (userDebt[user][vaultId] == 0) {
            userDebtVaults[user].push(vaultId);
        }
        userDebt[user][vaultId] += amount;

        // Verify LTV is still OK
        if (!_isWithinLTV(user)) revert ExceedsMaxLTV();

        emit DebtIncurred(user, vaultId, amount);
    }

    /**
     * @notice Record debt repayment (called by vault on repay)
     * @param user User address
     * @param vaultId Vault ID
     * @param amount Amount repaid (covers interest first, then principal)
     * @return interestPaid Amount that went to interest
     * @return principalPaid Amount that went to principal
     */
    function recordDebtRepayment(
        address user,
        uint256 vaultId,
        uint256 amount
    ) external onlyVault whenNotPaused returns (uint256 interestPaid, uint256 principalPaid) {
        _updateUserInterest(user, vaultId);

        uint256 interest = userDebtInterest[user][vaultId];
        uint256 principal = userDebt[user][vaultId];

        // Pay interest first
        if (amount <= interest) {
            userDebtInterest[user][vaultId] -= amount;
            return (amount, 0);
        }

        // Pay all interest, remainder goes to principal
        interestPaid = interest;
        userDebtInterest[user][vaultId] = 0;

        uint256 remaining = amount - interest;
        principalPaid = remaining > principal ? principal : remaining;
        userDebt[user][vaultId] -= principalPaid;

        emit DebtRepaid(user, vaultId, amount);

        return (interestPaid, principalPaid);
    }

    // ============== LIQUIDATION ==============

    /**
     * @notice Check if a position can be liquidated
     * @param user User address
     * @return canLiquidate True if position is liquidatable
     */
    function isLiquidatable(address user) external view returns (bool) {
        uint256 totalCollateralUSD = getTotalCollateralValueUSD(user);
        uint256 totalDebtUSD = getTotalDebtValueUSD(user);

        if (totalDebtUSD == 0) return false;

        // Position is liquidatable if debt > collateral * liquidationThreshold
        uint256 maxDebtAllowed = (totalCollateralUSD * liquidationThreshold) / 10000;
        return totalDebtUSD > maxDebtAllowed;
    }

    /**
     * @notice Get liquidation info for a user
     * @param user User address
     * @return totalCollateralUSD Total collateral in USD (8 decimals)
     * @return totalDebtUSD Total debt in USD (8 decimals)
     * @return healthFactor Health factor (10000 = 100%)
     * @return canLiquidate Whether position can be liquidated
     */
    function getLiquidationInfo(address user) external view returns (
        uint256 totalCollateralUSD,
        uint256 totalDebtUSD,
        uint256 healthFactor,
        bool canLiquidate
    ) {
        totalCollateralUSD = getTotalCollateralValueUSD(user);
        totalDebtUSD = getTotalDebtValueUSD(user);

        if (totalDebtUSD == 0) {
            healthFactor = type(uint256).max;
            canLiquidate = false;
        } else {
            // healthFactor = (collateral * liquidationThreshold) / debt
            healthFactor = (totalCollateralUSD * liquidationThreshold) / totalDebtUSD;
            canLiquidate = healthFactor < 10000;
        }
    }

    // ============== VIEW FUNCTIONS ==============

    /**
     * @notice Get total collateral value in USD for a user
     * @param user User address
     * @return totalUSD Total collateral value (8 decimals)
     */
    function getTotalCollateralValueUSD(address user) public view returns (uint256 totalUSD) {
        uint256[] memory vaultIds = userCollateralVaults[user];

        for (uint256 i = 0; i < vaultIds.length; i++) {
            uint256 vaultId = vaultIds[i];
            uint256 amount = userCollateral[user][vaultId];

            if (amount > 0) {
                address vaultAddress = protocol.getVaultAddress(vaultId);
                CantorVault vault = CantorVault(vaultAddress);
                address token = address(vault.token());
                uint8 decimals = IERC20Metadata(token).decimals();

                totalUSD += priceOracle.getUSDValue(token, amount, decimals);
            }
        }
    }

    /**
     * @notice Get total debt value in USD for a user (including accrued interest)
     * @param user User address
     * @return totalUSD Total debt value (8 decimals)
     */
    function getTotalDebtValueUSD(address user) public view returns (uint256 totalUSD) {
        uint256[] memory vaultIds = userDebtVaults[user];

        for (uint256 i = 0; i < vaultIds.length; i++) {
            uint256 vaultId = vaultIds[i];
            uint256 principal = userDebt[user][vaultId];
            uint256 interest = userDebtInterest[user][vaultId];

            // Add pending interest
            interest += _calculatePendingInterest(user, vaultId);

            uint256 totalDebt = principal + interest;

            if (totalDebt > 0) {
                address vaultAddress = protocol.getVaultAddress(vaultId);
                CantorVault vault = CantorVault(vaultAddress);
                address token = address(vault.token());
                uint8 decimals = IERC20Metadata(token).decimals();

                totalUSD += priceOracle.getUSDValue(token, totalDebt, decimals);
            }
        }
    }

    /**
     * @notice Get maximum borrow amount for a user in a specific token
     * @param user User address
     * @param vaultId Vault to borrow from
     * @return maxBorrow Maximum borrowable amount in token decimals
     */
    function getMaxBorrow(address user, uint256 vaultId) external view returns (uint256 maxBorrow) {
        uint256 totalCollateralUSD = getTotalCollateralValueUSD(user);
        uint256 currentDebtUSD = getTotalDebtValueUSD(user);

        uint256 maxDebtUSD = (totalCollateralUSD * maxLTV) / 10000;

        if (currentDebtUSD >= maxDebtUSD) return 0;

        uint256 availableBorrowUSD = maxDebtUSD - currentDebtUSD;

        // Convert to token amount
        address vaultAddress = protocol.getVaultAddress(vaultId);
        CantorVault vault = CantorVault(vaultAddress);
        address token = address(vault.token());
        uint8 decimals = IERC20Metadata(token).decimals();

        return priceOracle.getTokenAmount(token, availableBorrowUSD, decimals);
    }

    /**
     * @notice Get health factor for a user
     * @param user User address
     * @return healthFactor Health factor (10000 = 100%, < 10000 = liquidatable)
     */
    function getHealthFactor(address user) external view returns (uint256 healthFactor) {
        uint256 totalDebtUSD = getTotalDebtValueUSD(user);

        if (totalDebtUSD == 0) return type(uint256).max;

        uint256 totalCollateralUSD = getTotalCollateralValueUSD(user);
        return (totalCollateralUSD * liquidationThreshold) / totalDebtUSD;
    }

    /**
     * @notice Get user's collateral in a specific vault
     * @param user User address
     * @param vaultId Vault ID
     * @return amount Collateral amount in token decimals
     */
    function getUserCollateral(address user, uint256 vaultId) external view returns (uint256) {
        return userCollateral[user][vaultId];
    }

    /**
     * @notice Get user's debt in a specific vault (principal + interest)
     * @param user User address
     * @param vaultId Vault ID
     * @return principal Principal amount
     * @return interest Interest amount
     */
    function getUserDebt(address user, uint256 vaultId) external view returns (
        uint256 principal,
        uint256 interest
    ) {
        principal = userDebt[user][vaultId];
        interest = userDebtInterest[user][vaultId] + _calculatePendingInterest(user, vaultId);
    }

    // ============== INTERNAL FUNCTIONS ==============

    function _isHealthy(address user) internal view returns (bool) {
        uint256 totalDebtUSD = getTotalDebtValueUSD(user);
        if (totalDebtUSD == 0) return true;

        uint256 totalCollateralUSD = getTotalCollateralValueUSD(user);
        uint256 maxDebtAllowed = (totalCollateralUSD * liquidationThreshold) / 10000;

        return totalDebtUSD <= maxDebtAllowed;
    }

    function _isWithinLTV(address user) internal view returns (bool) {
        uint256 totalDebtUSD = getTotalDebtValueUSD(user);
        if (totalDebtUSD == 0) return true;

        uint256 totalCollateralUSD = getTotalCollateralValueUSD(user);
        uint256 maxDebtAllowed = (totalCollateralUSD * maxLTV) / 10000;

        return totalDebtUSD <= maxDebtAllowed;
    }

    function _updateUserInterest(address user, uint256 vaultId) internal {
        uint256 pending = _calculatePendingInterest(user, vaultId);
        if (pending > 0) {
            userDebtInterest[user][vaultId] += pending;
        }
        lastInterestUpdate[user][vaultId] = block.timestamp;
    }

    function _calculatePendingInterest(address user, uint256 vaultId) internal view returns (uint256) {
        uint256 principal = userDebt[user][vaultId];
        // Skip if no principal debt
        if (principal == 0) return 0;

        uint256 lastUpdate = lastInterestUpdate[user][vaultId];
        // Skip if never updated (no borrow yet)
        if (lastUpdate == 0) return 0;

        uint256 timeElapsed = block.timestamp - lastUpdate;
        // Always calculate interest even for small time elapsed
        // This ensures precision and catches all accrued interest

        // Get borrow rate from vault
        address vaultAddress = protocol.getVaultAddress(vaultId);
        CantorVault vault = CantorVault(vaultAddress);
        uint256 borrowRate = vault.calculateBorrowRate(); // in basis points (annual)

        // Calculate interest: principal * rate * time / (365 days * 10000)
        return (principal * borrowRate * timeElapsed) / (365 days * 10000);
    }

    // ============== ADMIN FUNCTIONS ==============

    /**
     * @notice Add a vault to the allowed list
     * @param vaultAddress Vault address
     */
    function addVault(address vaultAddress) external onlyAdmin {
        if (vaultAddress == address(0)) revert InvalidAddress();
        _grantRole(VAULT_ROLE, vaultAddress);
    }

    /**
     * @notice Remove a vault from the allowed list
     * @param vaultAddress Vault address
     */
    function removeVault(address vaultAddress) external onlyAdmin {
        _revokeRole(VAULT_ROLE, vaultAddress);
    }

    /**
     * @notice Update max LTV
     * @param newMaxLTV New max LTV in basis points
     */
    function setMaxLTV(uint256 newMaxLTV) external onlyAdmin {
        if (newMaxLTV > 9000) revert InvalidAmount();
        if (newMaxLTV >= liquidationThreshold) revert InvalidAmount();

        uint256 oldLTV = maxLTV;
        maxLTV = newMaxLTV;
        emit MaxLTVUpdated(oldLTV, newMaxLTV);
    }

    /**
     * @notice Update liquidation threshold
     * @param newThreshold New threshold in basis points
     */
    function setLiquidationThreshold(uint256 newThreshold) external onlyAdmin {
        if (newThreshold > 9500) revert InvalidAmount();
        if (newThreshold <= maxLTV) revert InvalidAmount();

        uint256 oldThreshold = liquidationThreshold;
        liquidationThreshold = newThreshold;
        emit LiquidationThresholdUpdated(oldThreshold, newThreshold);
    }

    /**
     * @notice Update price oracle
     * @param newOracle New oracle address
     */
    function setPriceOracle(address newOracle) external onlyAdmin {
        if (newOracle == address(0)) revert InvalidAddress();
        priceOracle = PriceOracle(newOracle);
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
