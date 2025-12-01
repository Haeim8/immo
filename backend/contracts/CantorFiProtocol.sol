// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title CantorFiProtocol
 * @notice Central registry for the CantorFi protocol
 * @dev Stores all vaults, global parameters, and permissions
 */
contract CantorFiProtocol is
    Initializable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    // ============== ROLES ==============

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant FACTORY_ROLE = keccak256("FACTORY_ROLE");

    // ============== STATE VARIABLES ==============

    /// @notice Mapping vaultId => vault address
    mapping(uint256 => address) public vaults;

    /// @notice Counter of created vaults
    uint256 public vaultCount;

    /// @notice Global setup fee (in basis points: 100 = 1%)
    uint256 public setupFee;

    /// @notice Global performance fee (in basis points: 1000 = 10%)
    uint256 public performanceFee;

    /// @notice Global borrow fee rate - spread on borrow interest (in basis points: 1500 = 15%)
    uint256 public borrowFeeRate;

    /// @notice Treasury address (receives fees)
    address public treasury;

    /// @notice FeeCollector address
    address public feeCollector;

    // ============== STORAGE GAP ==============

    /**
     * @dev Reserved storage space for future upgrades.
     * This allows adding new state variables without breaking storage layout.
     * See https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable#storage-gaps
     */
    uint256[50] private __gap;

    // ============== EVENTS ==============

    event VaultRegistered(uint256 indexed vaultId, address indexed vaultAddress);
    event SetupFeeUpdated(uint256 oldFee, uint256 newFee);
    event PerformanceFeeUpdated(uint256 oldFee, uint256 newFee);
    event BorrowFeeRateUpdated(uint256 oldFee, uint256 newFee);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event FeeCollectorUpdated(address indexed oldCollector, address indexed newCollector);

    // ============== ERRORS ==============

    error InvalidAddress();
    error InvalidFee();
    error VaultAlreadyExists();
    error VaultNotFound();
    error Unauthorized();

    // ============== MODIFIERS ==============

    modifier onlyAdmin() {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert Unauthorized();
        _;
    }

    modifier onlyFactory() {
        if (!hasRole(FACTORY_ROLE, msg.sender)) revert Unauthorized();
        _;
    }

    // ============== CONSTRUCTOR ==============

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _admin,
        address _treasury,
        uint256 _setupFee,
        uint256 _performanceFee,
        uint256 _borrowFeeRate
    ) external initializer {
        if (_admin == address(0)) revert InvalidAddress();
        if (_treasury == address(0)) revert InvalidAddress();
        if (_setupFee > 1000) revert InvalidFee(); // Max 10%
        if (_performanceFee > 5000) revert InvalidFee(); // Max 50%
        if (_borrowFeeRate > 5000) revert InvalidFee(); // Max 50%

        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(PAUSER_ROLE, _admin);

        treasury = _treasury;
        setupFee = _setupFee;
        performanceFee = _performanceFee;
        borrowFeeRate = _borrowFeeRate;
        vaultCount = 0;
    }

    // ============== VAULT REGISTRATION ==============

    /**
     * @notice Register a new vault (called by Factory)
     * @param vaultAddress Address of the created vault
     * @return vaultId The ID assigned to the new vault
     */
    function registerVault(address vaultAddress) external onlyFactory whenNotPaused returns (uint256) {
        if (vaultAddress == address(0)) revert InvalidAddress();

        uint256 vaultId = vaultCount;
        vaults[vaultId] = vaultAddress;
        vaultCount++;

        emit VaultRegistered(vaultId, vaultAddress);

        return vaultId;
    }

    // ============== VIEW FUNCTIONS ==============

    /**
     * @notice Get a vault address by its ID
     * @param vaultId The vault ID
     * @return vaultAddress The vault contract address
     */
    function getVaultAddress(uint256 vaultId) external view returns (address) {
        address vaultAddress = vaults[vaultId];
        if (vaultAddress == address(0)) revert VaultNotFound();
        return vaultAddress;
    }

    /**
     * @notice Check if a vault exists
     * @param vaultId The vault ID to check
     * @return exists True if the vault exists
     */
    function vaultExists(uint256 vaultId) external view returns (bool) {
        return vaults[vaultId] != address(0);
    }

    /**
     * @notice Get all vaults (paginated)
     * @param offset Starting index
     * @param limit Maximum number of vaults to return
     * @return result Array of vault addresses
     */
    function getAllVaults(uint256 offset, uint256 limit)
        external
        view
        returns (address[] memory)
    {
        uint256 total = vaultCount;
        if (offset >= total) {
            return new address[](0);
        }

        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }

        uint256 length = end - offset;
        address[] memory result = new address[](length);

        for (uint256 i = 0; i < length; i++) {
            result[i] = vaults[offset + i];
        }

        return result;
    }

    // ============== ADMIN FUNCTIONS ==============

    /**
     * @notice Update the setup fee
     * @param newFee New setup fee in basis points
     */
    function setSetupFee(uint256 newFee) external onlyAdmin {
        if (newFee > 1000) revert InvalidFee(); // Max 10%

        uint256 oldFee = setupFee;
        setupFee = newFee;

        emit SetupFeeUpdated(oldFee, newFee);
    }

    /**
     * @notice Update the performance fee
     * @param newFee New performance fee in basis points
     */
    function setPerformanceFee(uint256 newFee) external onlyAdmin {
        if (newFee > 5000) revert InvalidFee(); // Max 50%

        uint256 oldFee = performanceFee;
        performanceFee = newFee;

        emit PerformanceFeeUpdated(oldFee, newFee);
    }

    /**
     * @notice Update the borrow fee rate (spread on borrow interest)
     * @param newFee New borrow fee rate in basis points
     */
    function setBorrowFeeRate(uint256 newFee) external onlyAdmin {
        if (newFee > 5000) revert InvalidFee(); // Max 50%

        uint256 oldFee = borrowFeeRate;
        borrowFeeRate = newFee;

        emit BorrowFeeRateUpdated(oldFee, newFee);
    }

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
     * @notice Update the FeeCollector address
     * @param newCollector New fee collector address
     */
    function setFeeCollector(address newCollector) external onlyAdmin {
        if (newCollector == address(0)) revert InvalidAddress();

        address oldCollector = feeCollector;
        feeCollector = newCollector;

        emit FeeCollectorUpdated(oldCollector, newCollector);
    }

    /**
     * @notice Add an authorized Factory
     * @param factory Factory address to authorize
     * @dev IMPORTANT: This MUST be called after deploying CantorAssetFactory
     *      Deployment order:
     *      1. Deploy CantorFiProtocol
     *      2. Deploy CantorAssetFactory (with protocol address)
     *      3. Call protocol.addFactory(factoryAddress)
     *      Without this step, createVault will fail on registerVault
     */
    function addFactory(address factory) external onlyAdmin {
        if (factory == address(0)) revert InvalidAddress();
        _grantRole(FACTORY_ROLE, factory);
    }

    /**
     * @notice Remove a Factory authorization
     * @param factory Factory address to remove
     */
    function removeFactory(address factory) external onlyAdmin {
        _revokeRole(FACTORY_ROLE, factory);
    }

    // ============== EMERGENCY ==============

    function pause() external {
        if (!hasRole(PAUSER_ROLE, msg.sender)) revert Unauthorized();
        _pause();
    }

    function unpause() external onlyAdmin {
        _unpause();
    }

    // ============== UPGRADE ==============

    function _authorizeUpgrade(address newImplementation) internal override onlyAdmin {}
}
