// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title CantorToken
 * @notice Governance token for the CantorFi protocol
 * @dev ERC20 with mint/burn, pausable, upgradeable, multi-chain support
 */
contract CantorToken is
    Initializable,
    ERC20Upgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    // ============== ROLES ==============

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // ============== CONSTANTS ==============

    /// @notice Maximum supply: 9 billion CANTOR (18 decimals)
    uint256 public constant MAX_SUPPLY = 9_000_000_000 * 10**18;

    /// @notice Minimum tokens required for governance voting
    uint256 public constant GOVERNANCE_THRESHOLD = 750 * 10**18;

    /// @notice Minimum tokens required for boost benefits
    uint256 public constant BOOST_THRESHOLD = 15_000 * 10**18;

    // ============== STATE VARIABLES ==============

    /// @notice Maximum supply cap (0 = no cap)
    uint256 public maxSupply;

    // ============== STORAGE GAP ==============

    /**
     * @dev Reserved storage space for future upgrades.
     * This allows adding new state variables without breaking storage layout.
     * See https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable#storage-gaps
     */
    uint256[50] private __gap;

    // ============== EVENTS ==============

    event MaxSupplyUpdated(uint256 oldMaxSupply, uint256 newMaxSupply);
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);

    // ============== ERRORS ==============

    error Unauthorized();
    error InvalidAddress();
    error ExceedsMaxSupply();
    error InvalidAmount();

    // ============== MODIFIERS ==============

    modifier onlyAdmin() {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert Unauthorized();
        _;
    }

    modifier onlyMinter() {
        if (!hasRole(MINTER_ROLE, msg.sender)) revert Unauthorized();
        _;
    }

    // ============== CONSTRUCTOR ==============

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _admin,
        uint256 _initialSupply
    ) external initializer {
        if (_admin == address(0)) revert InvalidAddress();

        __ERC20_init("CantorFi", "CANTOR");
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(MINTER_ROLE, _admin);
        _grantRole(PAUSER_ROLE, _admin);

        // Max supply is fixed at 9 billion
        maxSupply = MAX_SUPPLY;

        // Mint initial supply to admin
        if (_initialSupply > 0) {
            if (_initialSupply > MAX_SUPPLY) {
                revert ExceedsMaxSupply();
            }
            _mint(_admin, _initialSupply);
        }
    }

    // ============== MINTING / BURNING ==============

    /**
     * @notice Mint tokens
     * @param to Address to receive the tokens
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyMinter whenNotPaused {
        if (to == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();

        // Check max supply
        if (maxSupply > 0) {
            if (totalSupply() + amount > maxSupply) {
                revert ExceedsMaxSupply();
            }
        }

        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @notice Burn tokens (from sender)
     * @param amount Amount to burn
     */
    function burn(uint256 amount) external whenNotPaused {
        if (amount == 0) revert InvalidAmount();

        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);
    }

    /**
     * @notice Burn tokens (from any address with allowance)
     * @param from Address to burn from
     * @param amount Amount to burn
     */
    function burnFrom(address from, uint256 amount) external whenNotPaused {
        if (from == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();

        _spendAllowance(from, msg.sender, amount);
        _burn(from, amount);
        emit TokensBurned(from, amount);
    }

    // ============== VIEW FUNCTIONS ==============

    /**
     * @notice Check if an address can vote in governance
     * @param account Address to check
     * @return True if balance >= 750 CANTOR
     */
    function canVote(address account) external view returns (bool) {
        return balanceOf(account) >= GOVERNANCE_THRESHOLD;
    }

    /**
     * @notice Check if an address has boost benefits
     * @param account Address to check
     * @return True if balance >= 15,000 CANTOR
     */
    function hasBoost(address account) external view returns (bool) {
        return balanceOf(account) >= BOOST_THRESHOLD;
    }

    /**
     * @notice Get the governance tier of an address
     * @param account Address to check
     * @return tier 0 = no rights, 1 = can vote, 2 = can vote + has boost
     */
    function getGovernanceTier(address account) external view returns (uint8 tier) {
        uint256 balance = balanceOf(account);
        if (balance >= BOOST_THRESHOLD) {
            return 2; // Full benefits: vote + boost
        } else if (balance >= GOVERNANCE_THRESHOLD) {
            return 1; // Can vote only
        }
        return 0; // No governance rights
    }

    // ============== ADMIN FUNCTIONS ==============

    /**
     * @notice Update the max supply
     * @param newMaxSupply New max supply (0 = no cap)
     */
    function setMaxSupply(uint256 newMaxSupply) external onlyAdmin {
        // If newMaxSupply > 0, verify it's >= current totalSupply
        if (newMaxSupply > 0 && newMaxSupply < totalSupply()) {
            revert ExceedsMaxSupply();
        }

        uint256 oldMaxSupply = maxSupply;
        maxSupply = newMaxSupply;

        emit MaxSupplyUpdated(oldMaxSupply, newMaxSupply);
    }

    /**
     * @notice Add a minter
     * @param minter Address to grant minter role
     */
    function addMinter(address minter) external onlyAdmin {
        if (minter == address(0)) revert InvalidAddress();
        _grantRole(MINTER_ROLE, minter);
    }

    /**
     * @notice Remove a minter
     * @param minter Address to revoke minter role
     */
    function removeMinter(address minter) external onlyAdmin {
        _revokeRole(MINTER_ROLE, minter);
    }

    // ============== EMERGENCY ==============

    function pause() external {
        if (!hasRole(PAUSER_ROLE, msg.sender)) revert Unauthorized();
        _pause();
    }

    function unpause() external onlyAdmin {
        _unpause();
    }

    // ============== OVERRIDES ==============

    function _update(address from, address to, uint256 value)
        internal
        override
        whenNotPaused
    {
        super._update(from, to, value);
    }

    // ============== UPGRADE ==============

    function _authorizeUpgrade(address newImplementation) internal override onlyAdmin {}
}
