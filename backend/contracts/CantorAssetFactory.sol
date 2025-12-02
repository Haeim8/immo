// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./CantorVault.sol";
import "./CantorFiProtocol.sol";
import "./interfaces/IFeeCollector.sol";

/**
 * @title CantorAssetFactory
 * @notice Factory for creating and managing vaults
 * @dev Uses Clone pattern (EIP-1167) for deploying vaults
 */
contract CantorAssetFactory is
    Initializable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    using SafeERC20 for IERC20;

    // ============== ROLES ==============

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant CREATOR_ROLE = keccak256("CREATOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // ============== STATE VARIABLES ==============

    address public vaultImplementation;
    CantorFiProtocol public protocol;
    address public treasury;

    // ============== STORAGE GAP ==============

    /**
     * @dev Reserved storage space for future upgrades.
     * This allows adding new state variables without breaking storage layout.
     * See https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable#storage-gaps
     */
    uint256[50] private __gap;

    // ============== EVENTS ==============

    event VaultCreated(
        uint256 indexed vaultId,
        address indexed vaultAddress,
        address indexed token,
        uint256 maxLiquidity
    );

    event VaultImplementationUpdated(address indexed oldImpl, address indexed newImpl);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    // ============== ERRORS ==============

    error InvalidAddress();
    error InvalidAmount();
    error Unauthorized();

    // ============== MODIFIERS ==============

    modifier onlyAdmin() {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert Unauthorized();
        _;
    }

    modifier onlyCreator() {
        if (!hasRole(CREATOR_ROLE, msg.sender) && !hasRole(ADMIN_ROLE, msg.sender)) {
            revert Unauthorized();
        }
        _;
    }

    // ============== CONSTRUCTOR ==============

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _vaultImplementation,
        address _protocol,
        address _admin,
        address _treasury
    ) external initializer {
        if (_vaultImplementation == address(0)) revert InvalidAddress();
        if (_protocol == address(0)) revert InvalidAddress();
        if (_admin == address(0)) revert InvalidAddress();
        if (_treasury == address(0)) revert InvalidAddress();

        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(CREATOR_ROLE, _admin);
        _grantRole(PAUSER_ROLE, _admin);

        vaultImplementation = _vaultImplementation;
        protocol = CantorFiProtocol(_protocol);
        treasury = _treasury;
    }

    // ============== VAULT CREATION ==============

    struct CreateVaultParams {
        address token;
        uint256 maxLiquidity;
        uint256 borrowBaseRate;
        uint256 borrowSlope;
        uint256 maxBorrowRatio;
        uint256 liquidationBonus;
    }

    /**
     * @notice Create a new vault
     * @param params Vault parameters
     * @return vaultAddress Address of the created vault
     * @return vaultId ID of the vault
     */
    function createVault(CreateVaultParams calldata params)
        external
        onlyCreator
        whenNotPaused
        returns (address vaultAddress, uint256 vaultId)
    {
        // Validation
        if (params.token == address(0)) revert InvalidAddress();
        if (params.maxLiquidity == 0) revert InvalidAmount();
        if (params.borrowBaseRate > 10000) revert InvalidAmount();
        if (params.borrowSlope > 50000) revert InvalidAmount(); // Max 500% slope to prevent overflow
        if (params.maxBorrowRatio > 10000) revert InvalidAmount();
        if (params.liquidationBonus > 2000) revert InvalidAmount(); // Max 20% bonus

        // Clone vault implementation
        vaultAddress = Clones.clone(vaultImplementation);

        // Get fees from protocol
        uint256 setupFee = protocol.setupFee();
        uint256 performanceFee = protocol.performanceFee();
        uint256 borrowFeeRate = protocol.borrowFeeRate();
        address feeCollector = protocol.feeCollector();

        vaultId = protocol.vaultCount();

        // Initialize vault with the token chosen by creator
        CantorVault(vaultAddress).initialize(
            address(protocol),
            params.token,
            msg.sender, // vault admin = creator
            treasury,
            feeCollector,
            vaultId,
            params.maxLiquidity,
            params.borrowBaseRate,
            params.borrowSlope,
            params.maxBorrowRatio,
            params.liquidationBonus,
            setupFee,
            performanceFee,
            borrowFeeRate
        );

        // Register in protocol
        protocol.registerVault(vaultAddress);

        emit VaultCreated(vaultId, vaultAddress, params.token, params.maxLiquidity);

        return (vaultAddress, vaultId);
    }

    // ============== ADMIN FUNCTIONS ==============

    /**
     * @notice Update the vault implementation
     * @param newImplementation New implementation address
     */
    function setVaultImplementation(address newImplementation) external onlyAdmin {
        if (newImplementation == address(0)) revert InvalidAddress();

        address oldImpl = vaultImplementation;
        vaultImplementation = newImplementation;

        emit VaultImplementationUpdated(oldImpl, newImplementation);
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
     * @notice Add a creator
     * @param creator Address to grant creator role
     */
    function addCreator(address creator) external onlyAdmin {
        if (creator == address(0)) revert InvalidAddress();
        _grantRole(CREATOR_ROLE, creator);
    }

    /**
     * @notice Remove a creator
     * @param creator Address to revoke creator role
     */
    function removeCreator(address creator) external onlyAdmin {
        _revokeRole(CREATOR_ROLE, creator);
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

    // ============== VIEW FUNCTIONS ==============

    /**
     * @notice Get a vault address by its ID
     * @param vaultId The vault ID
     * @return vaultAddress The vault contract address
     */
    function getVaultAddress(uint256 vaultId) external view returns (address) {
        return protocol.getVaultAddress(vaultId);
    }

    /**
     * @notice Get the total number of vaults created
     * @return count Number of vaults
     */
    function getVaultCount() external view returns (uint256) {
        return protocol.vaultCount();
    }
}
