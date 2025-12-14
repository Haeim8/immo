// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface ICantorVault {
    function cvtToken() external view returns (address);
    function token() external view returns (address);
    function notifyStake(address user, uint256 amount) external;
    function notifyUnstake(address user, uint256 amount) external;
}

/**
 * @title CVTStaking
 * @notice Staking contract for CVT tokens
 * @dev Users stake CVT to allow protocol to borrow their underlying liquidity
 *      Stakers earn rewards from protocol repayments
 */
contract CVTStaking is
    Initializable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    using SafeERC20 for IERC20;

    // ============== ROLES ==============

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // ============== STRUCTS ==============

    struct StakePosition {
        uint256 amount;           // CVT amount staked
        uint256 lockEndTime;      // When lock expires
        uint256 rewardIndexSnapshot; // For reward calculation
        uint256 pendingRewards;   // Rewards waiting to be claimed
    }

    // ============== STATE VARIABLES ==============

    ICantorVault public vault;
    IERC20 public cvtToken;
    IERC20 public underlyingToken;

    mapping(address => StakePosition) public stakes;
    address[] private stakers;
    mapping(address => bool) private isStaker;

    uint256 public totalStaked;
    uint256 public maxProtocolBorrowRatio; // In basis points (6000 = 60%)

    // Reward distribution via index (O(1))
    uint256 public rewardIndex;
    uint256 private constant INDEX_PRECISION = 1e18;

    // ============== STORAGE GAP ==============

    uint256[50] private __gap;

    // ============== EVENTS ==============

    event Staked(address indexed user, uint256 amount, uint256 lockDuration);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardsDistributed(uint256 amount);
    event MaxProtocolBorrowRatioUpdated(uint256 oldRatio, uint256 newRatio);

    // ============== ERRORS ==============

    error InvalidAddress();
    error InvalidAmount();
    error LockNotExpired();
    error NothingStaked();
    error NothingToClaim();

    // ============== MODIFIERS ==============

    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "Not admin");
        _;
    }

    // ============== CONSTRUCTOR ==============

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _cvtToken,
        address _underlyingToken,
        address _vault,
        address _admin,
        uint256 _maxProtocolBorrowRatio
    ) external initializer {
        if (_cvtToken == address(0)) revert InvalidAddress();
        if (_underlyingToken == address(0)) revert InvalidAddress();
        if (_vault == address(0)) revert InvalidAddress();
        if (_admin == address(0)) revert InvalidAddress();
        if (_maxProtocolBorrowRatio > 10000) revert InvalidAmount();

        __AccessControl_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);

        cvtToken = IERC20(_cvtToken);
        underlyingToken = IERC20(_underlyingToken);
        vault = ICantorVault(_vault);
        maxProtocolBorrowRatio = _maxProtocolBorrowRatio;
    }

    // ============== STAKING ==============

    /**
     * @notice Stake CVT tokens
     * @param amount Amount of CVT to stake
     * @param lockDuration Lock duration in seconds
     */
    function stake(uint256 amount, uint256 lockDuration) external nonReentrant whenNotPaused {
        if (amount == 0) revert InvalidAmount();

        // Update rewards before changing stake
        _updateUserRewards(msg.sender);

        // Transfer CVT from user
        cvtToken.safeTransferFrom(msg.sender, address(this), amount);

        StakePosition storage pos = stakes[msg.sender];

        // Add to stakers list if first time
        if (!isStaker[msg.sender]) {
            stakers.push(msg.sender);
            isStaker[msg.sender] = true;
            pos.rewardIndexSnapshot = rewardIndex;
        }

        // Update position
        pos.amount += amount;

        // Set lock end time (extend if already locked)
        uint256 newLockEnd = block.timestamp + lockDuration;
        if (newLockEnd > pos.lockEndTime) {
            pos.lockEndTime = newLockEnd;
        }

        // Update total staked
        totalStaked += amount;

        // Notify vault
        vault.notifyStake(msg.sender, amount);

        emit Staked(msg.sender, amount, lockDuration);
    }

    /**
     * @notice Unstake CVT tokens after lock expires
     */
    function unstake() external nonReentrant whenNotPaused {
        StakePosition storage pos = stakes[msg.sender];

        if (pos.amount == 0) revert NothingStaked();
        if (block.timestamp < pos.lockEndTime) revert LockNotExpired();

        // Update rewards before unstaking
        _updateUserRewards(msg.sender);

        uint256 amount = pos.amount;

        // Clear position
        pos.amount = 0;
        pos.lockEndTime = 0;

        // Update total staked
        totalStaked -= amount;

        // Notify vault
        vault.notifyUnstake(msg.sender, amount);

        // Transfer CVT back to user
        cvtToken.safeTransfer(msg.sender, amount);

        emit Unstaked(msg.sender, amount);
    }

    /**
     * @notice Claim pending staking rewards
     */
    function claimRewards() external nonReentrant whenNotPaused {
        _updateUserRewards(msg.sender);

        StakePosition storage pos = stakes[msg.sender];
        uint256 rewards = pos.pendingRewards;

        if (rewards == 0) revert NothingToClaim();

        pos.pendingRewards = 0;

        // Transfer rewards in underlying token
        underlyingToken.safeTransfer(msg.sender, rewards);

        emit RewardsClaimed(msg.sender, rewards);
    }

    // ============== REWARD DISTRIBUTION ==============

    /**
     * @notice Distribute rewards to stakers (called by vault on protocol repay)
     * @param amount Amount of rewards to distribute
     */
    function distributeRewards(uint256 amount) external nonReentrant {
        // Only vault can distribute rewards
        require(msg.sender == address(vault), "Only vault");
        if (amount == 0) return;
        if (totalStaked == 0) return;

        // Transfer rewards from vault
        underlyingToken.safeTransferFrom(msg.sender, address(this), amount);

        // Update global reward index
        rewardIndex += (amount * INDEX_PRECISION) / totalStaked;

        emit RewardsDistributed(amount);
    }

    // ============== INTERNAL ==============

    /**
     * @notice Update user's pending rewards
     * @param user User address
     */
    function _updateUserRewards(address user) internal {
        StakePosition storage pos = stakes[user];
        if (pos.amount == 0) return;

        uint256 indexDelta = rewardIndex - pos.rewardIndexSnapshot;
        if (indexDelta > 0) {
            uint256 earned = (pos.amount * indexDelta) / INDEX_PRECISION;
            pos.pendingRewards += earned;
        }

        pos.rewardIndexSnapshot = rewardIndex;
    }

    // ============== ADMIN ==============

    /**
     * @notice Update max protocol borrow ratio
     * @param newRatio New ratio in basis points
     */
    function setMaxProtocolBorrowRatio(uint256 newRatio) external onlyAdmin {
        if (newRatio > 10000) revert InvalidAmount();

        uint256 oldRatio = maxProtocolBorrowRatio;
        maxProtocolBorrowRatio = newRatio;

        emit MaxProtocolBorrowRatioUpdated(oldRatio, newRatio);
    }

    // ============== VIEW ==============

    /**
     * @notice Get max amount protocol can borrow
     * @return maxBorrow Maximum borrowable amount
     */
    function getMaxProtocolBorrow() external view returns (uint256) {
        return (totalStaked * maxProtocolBorrowRatio) / 10000;
    }

    /**
     * @notice Get user's stake position
     * @param user User address
     * @return position The stake position
     */
    function getStakePosition(address user) external view returns (StakePosition memory) {
        return stakes[user];
    }

    /**
     * @notice Get user's pending rewards
     * @param user User address
     * @return pending Pending rewards amount
     */
    function getPendingRewards(address user) external view returns (uint256) {
        StakePosition storage pos = stakes[user];
        if (pos.amount == 0) return pos.pendingRewards;

        uint256 indexDelta = rewardIndex - pos.rewardIndexSnapshot;
        uint256 newRewards = (pos.amount * indexDelta) / INDEX_PRECISION;
        return pos.pendingRewards + newRewards;
    }

    /**
     * @notice Check if user's lock has expired
     * @param user User address
     * @return expired True if lock expired
     */
    function isLockExpired(address user) external view returns (bool) {
        return block.timestamp >= stakes[user].lockEndTime;
    }

    /**
     * @notice Get total number of stakers
     * @return count Number of stakers
     */
    function getStakersCount() external view returns (uint256) {
        return stakers.length;
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
