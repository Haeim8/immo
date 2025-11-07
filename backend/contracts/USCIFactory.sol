// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./USCI.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

/**
 * @title USCIFactory
 * @notice Factory contract to create and manage interactive place tokenization
 * @dev Enhanced security with AccessControl and Pausable
 * @custom:security-contact security@usci.io
 */
contract USCIFactory is AccessControl, Pausable {
    // ============== ROLES ==============

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant TEAM_ROLE = keccak256("TEAM_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // ============== CONSTANTS ==============

    uint256 public constant MIN_PUZZLES = 5;
    uint256 public constant MAX_PUZZLES = 100_000; // Increased for high-value assets
    uint256 public constant MIN_SALE_DURATION = 1 days;
    uint256 public constant MAX_SALE_DURATION = 365 days;

    // ============== STATE VARIABLES ==============

    address public admin;  // Kept for backwards compatibility
    address public treasury;
    address public immutable nftRenderer;  // USCINFT contract (never changes)
    address public immutable usciImplementation;  // USCI implementation for cloning
    uint256 public placeCount;

    // Team management
    mapping(address => bool) public teamMembers;
    mapping(address => uint256) public teamMemberAddedAt;

    // Place tracking
    mapping(uint256 => address) public places;
    mapping(address => bool) public isPlaceContract;  // 🔒 Whitelist des places

    // ============== EVENTS ==============

    event PlaceCreated(
        uint256 indexed placeId,
        address indexed placeAddress,
        string name,
        uint256 totalPuzzles,
        uint256 puzzlePrice
    );

    event TeamMemberAdded(address indexed member, address indexed addedBy);
    event TeamMemberRemoved(address indexed member, address indexed removedBy);
    event AdminUpdated(address indexed oldAdmin, address indexed newAdmin);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event EmergencyPaused(address indexed by);
    event EmergencyUnpaused(address indexed by);

    // ============== ERRORS ==============

    error InvalidAddress();
    error InvalidPuzzleCount();
    error InvalidPrice();
    error InvalidSaleDuration();
    error AlreadyTeamMember();
    error NotATeamMember();
    error Unauthorized();

    // ============== MODIFIERS ==============

    modifier onlyAdmin() {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert Unauthorized();
        _;
    }

    modifier onlyAdminOrTeam() {
        if (!hasRole(ADMIN_ROLE, msg.sender) && !hasRole(TEAM_ROLE, msg.sender)) {
            revert Unauthorized();
        }
        _;
    }

    // ============== CONSTRUCTOR ==============

    constructor(address _treasury, address _nftRenderer, address _usciImplementation) {
        if (_treasury == address(0)) revert InvalidAddress();
        if (_nftRenderer == address(0)) revert InvalidAddress();
        if (_usciImplementation == address(0)) revert InvalidAddress();

        admin = msg.sender;
        treasury = _treasury;
        nftRenderer = _nftRenderer;
        usciImplementation = _usciImplementation;
        placeCount = 0;

        // Setup roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    // ============== PLACE MANAGEMENT ==============

    /**
     * @notice Create a new interactive tokenized place
     * @dev Enhanced parameter validation
     */
    function createPlace(
        string memory assetType,
        string memory name,
        string memory city,
        string memory province,
        string memory country,
        uint256 totalPuzzles,
        uint256 puzzlePrice,
        uint256 saleDuration,
        uint32 surface,
        uint8 rooms,
        uint32 expectedReturn,
        string memory placeType,
        uint16 yearBuilt,
        string memory imageCid,
        string memory metadataCid,
        bool votingEnabled
    ) external onlyAdminOrTeam whenNotPaused returns (address placeAddress) {
        // 🔒 Enhanced validation
        if (totalPuzzles < MIN_PUZZLES || totalPuzzles > MAX_PUZZLES) {
            revert InvalidPuzzleCount();
        }
        if (puzzlePrice == 0) revert InvalidPrice();
        if (saleDuration < MIN_SALE_DURATION || saleDuration > MAX_SALE_DURATION) {
            revert InvalidSaleDuration();
        }

        // Clone USCI implementation (EIP-1167 Minimal Proxy)
        placeAddress = Clones.clone(usciImplementation);

        // Update state BEFORE external call (CEI pattern)
        places[placeCount] = placeAddress;
        isPlaceContract[placeAddress] = true;  // 🔒 Whitelist

        uint256 currentPlaceId = placeCount;
        placeCount++;

        // Initialize the clone (external call AFTER state changes)
        USCI(placeAddress).initialize(
            address(this),
            nftRenderer,
            currentPlaceId,
            assetType,
            name,
            city,
            province,
            country,
            totalPuzzles,
            puzzlePrice,
            saleDuration,
            surface,
            rooms,
            expectedReturn,
            placeType,
            yearBuilt,
            imageCid,
            metadataCid,
            votingEnabled,
            treasury
        );

        emit PlaceCreated(
            currentPlaceId,
            placeAddress,
            name,
            totalPuzzles,
            puzzlePrice
        );
    }

    // ============== TEAM MANAGEMENT ==============

    /**
     * @notice Add a team member with TEAM_ROLE
     */
    function addTeamMember(address member) external onlyAdmin {
        if (member == address(0)) revert InvalidAddress();
        if (teamMembers[member]) revert AlreadyTeamMember();

        teamMembers[member] = true;
        teamMemberAddedAt[member] = block.timestamp;

        // Grant TEAM_ROLE
        grantRole(TEAM_ROLE, member);

        emit TeamMemberAdded(member, msg.sender);
    }

    /**
     * @notice Remove a team member
     */
    function removeTeamMember(address member) external onlyAdmin {
        if (!teamMembers[member]) revert NotATeamMember();

        teamMembers[member] = false;

        // Revoke TEAM_ROLE
        revokeRole(TEAM_ROLE, member);

        emit TeamMemberRemoved(member, msg.sender);
    }

    function isTeamMember(address member) external view returns (bool) {
        return teamMembers[member] || hasRole(TEAM_ROLE, member);
    }

    // ============== ADMIN ==============

    /**
     * @notice Update admin with role transfer
     */
    function updateAdmin(address newAdmin) external onlyAdmin {
        if (newAdmin == address(0)) revert InvalidAddress();

        address oldAdmin = admin;
        admin = newAdmin;

        // Transfer roles
        grantRole(ADMIN_ROLE, newAdmin);
        grantRole(DEFAULT_ADMIN_ROLE, newAdmin);
        revokeRole(ADMIN_ROLE, oldAdmin);

        emit AdminUpdated(oldAdmin, newAdmin);
    }

    /**
     * @notice Update treasury address
     */
    function setTreasury(address newTreasury) external onlyAdmin {
        if (newTreasury == address(0)) revert InvalidAddress();

        address oldTreasury = treasury;
        treasury = newTreasury;

        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    // ============== EMERGENCY ==============

    /**
     * @notice Pause factory (no new places)
     */
    function pause() external {
        if (!hasRole(PAUSER_ROLE, msg.sender)) revert Unauthorized();
        _pause();
        emit EmergencyPaused(msg.sender);
    }

    /**
     * @notice Unpause factory
     */
    function unpause() external onlyAdmin {
        _unpause();
        emit EmergencyUnpaused(msg.sender);
    }

    // ============== VIEW FUNCTIONS ==============

    function getPlaceAddress(uint256 placeId) external view returns (address) {
        return places[placeId];
    }

    function isValidPlace(address place) external view returns (bool) {
        return isPlaceContract[place];
    }
}
