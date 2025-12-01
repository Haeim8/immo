// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title FeeCollector
 * @notice Collects and distributes protocol fees
 * @dev Receives setup fees + performance fees from all vaults
 */
contract FeeCollector is
    Initializable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    using SafeERC20 for IERC20;

    // ============== ROLES ==============

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant NOTIFIER_ROLE = keccak256("NOTIFIER_ROLE");

    // ============== STATE VARIABLES ==============

    address public treasury;
    address public stakingContract;

    /// @notice Total fees collected per token
    mapping(address => uint256) public totalFeesCollected;

    /// @notice Total fees distributed per token
    mapping(address => uint256) public totalFeesDistributed;

    // ============== STORAGE GAP ==============

    /**
     * @dev Reserved storage space for future upgrades.
     * This allows adding new state variables without breaking storage layout.
     * See https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable#storage-gaps
     */
    uint256[50] private __gap;

    // ============== EVENTS ==============

    event FeesCollected(address indexed token, address indexed from, uint256 amount);
    event FeesDistributed(address indexed token, address indexed to, uint256 amount);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event StakingContractUpdated(address indexed oldStaking, address indexed newStaking);
    event Withdrawn(address indexed token, address indexed to, uint256 amount);

    // ============== ERRORS ==============

    error InvalidAddress();
    error InvalidAmount();
    error Unauthorized();
    error InsufficientBalance();

    // ============== MODIFIERS ==============

    modifier onlyAdmin() {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert Unauthorized();
        _;
    }

    // ============== CONSTRUCTOR ==============

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _admin,
        address _treasury
    ) external initializer {
        if (_admin == address(0)) revert InvalidAddress();
        if (_treasury == address(0)) revert InvalidAddress();

        __AccessControl_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(DISTRIBUTOR_ROLE, _admin);

        treasury = _treasury;
    }

    // ============== FEE COLLECTION ==============

    /**
     * @notice Notify that fees have been received via ERC20 transfer
     * @dev Only authorized contracts (vaults, factory) can call this
     * @param token Token address
     * @param amount Amount received
     */
    function notifyFeeReceived(address token, uint256 amount) external {
        if (!hasRole(NOTIFIER_ROLE, msg.sender) && !hasRole(ADMIN_ROLE, msg.sender)) {
            revert Unauthorized();
        }
        if (token == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();

        totalFeesCollected[token] += amount;

        emit FeesCollected(token, msg.sender, amount);
    }

    // ============== FEE DISTRIBUTION ==============

    /**
     * @notice Distribute fees to the staking contract
     * @param token Token address
     * @param amount Amount to distribute
     */
    function distributeFees(address token, uint256 amount) external nonReentrant whenNotPaused {
        if (!hasRole(DISTRIBUTOR_ROLE, msg.sender) && !hasRole(ADMIN_ROLE, msg.sender)) {
            revert Unauthorized();
        }
        if (token == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (stakingContract == address(0)) revert InvalidAddress();

        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance < amount) revert InsufficientBalance();

        totalFeesDistributed[token] += amount;

        IERC20(token).safeTransfer(stakingContract, amount);

        emit FeesDistributed(token, stakingContract, amount);
    }

    /**
     * @notice Distribute fees to the treasury
     * @param token Token address
     * @param amount Amount to distribute
     */
    function distributeToTreasury(address token, uint256 amount) external nonReentrant whenNotPaused {
        if (!hasRole(DISTRIBUTOR_ROLE, msg.sender) && !hasRole(ADMIN_ROLE, msg.sender)) {
            revert Unauthorized();
        }
        if (token == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();

        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance < amount) revert InsufficientBalance();

        totalFeesDistributed[token] += amount;

        IERC20(token).safeTransfer(treasury, amount);

        emit FeesDistributed(token, treasury, amount);
    }

    // ============== ADMIN FUNCTIONS ==============

    /**
     * @notice Update the treasury address
     * @param newTreasury New treasury address
     */
    function setTreasury(address newTreasury) external onlyAdmin {
        if (newTreasury == address(0)) revert InvalidAddress();

        address oldTreasury = treasury;
        treasury = newTreasury;

        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    /**
     * @notice Update the staking contract address
     * @param newStaking New staking contract address
     */
    function setStakingContract(address newStaking) external onlyAdmin {
        if (newStaking == address(0)) revert InvalidAddress();

        address oldStaking = stakingContract;
        stakingContract = newStaking;

        emit StakingContractUpdated(oldStaking, newStaking);
    }

    /**
     * @notice Withdraw any token (emergency)
     * @param token Token address
     * @param to Destination address
     * @param amount Amount to withdraw
     */
    function withdraw(address token, address to, uint256 amount) external onlyAdmin nonReentrant {
        if (token == address(0)) revert InvalidAddress();
        if (to == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();

        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance < amount) revert InsufficientBalance();

        IERC20(token).safeTransfer(to, amount);

        emit Withdrawn(token, to, amount);
    }

    /**
     * @notice Add a distributor
     * @param distributor Address to grant distributor role
     */
    function addDistributor(address distributor) external onlyAdmin {
        if (distributor == address(0)) revert InvalidAddress();
        _grantRole(DISTRIBUTOR_ROLE, distributor);
    }

    /**
     * @notice Remove a distributor
     * @param distributor Address to revoke distributor role
     */
    function removeDistributor(address distributor) external onlyAdmin {
        _revokeRole(DISTRIBUTOR_ROLE, distributor);
    }

    /**
     * @notice Add a notifier (vault or factory that can call notifyFeeReceived)
     * @param notifier Address to grant notifier role
     * @dev IMPORTANT: Grant this role to CantorAssetFactory and each CantorVault
     */
    function addNotifier(address notifier) external onlyAdmin {
        if (notifier == address(0)) revert InvalidAddress();
        _grantRole(NOTIFIER_ROLE, notifier);
    }

    /**
     * @notice Remove a notifier
     * @param notifier Address to revoke notifier role
     */
    function removeNotifier(address notifier) external onlyAdmin {
        _revokeRole(NOTIFIER_ROLE, notifier);
    }

    // ============== VIEW FUNCTIONS ==============

    /**
     * @notice Get available token balance
     * @param token Token address
     * @return balance Current token balance
     */
    function getAvailableBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    /**
     * @notice Get fee statistics for a token
     * @param token Token address
     * @return collected Total fees collected
     * @return distributed Total fees distributed
     * @return available Current available balance
     */
    function getFeeStats(address token) external view returns (uint256 collected, uint256 distributed, uint256 available) {
        return (
            totalFeesCollected[token],
            totalFeesDistributed[token],
            IERC20(token).balanceOf(address(this))
        );
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

    // ============== RECEIVE ==============

    /**
     * @notice Receive ETH (for gas fees if needed)
     */
    receive() external payable {}
}
