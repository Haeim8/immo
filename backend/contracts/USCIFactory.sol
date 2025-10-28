// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./USCI.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

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
    uint256 public constant MAX_PUZZLES = 10000;
    uint256 public constant MIN_SALE_DURATION = 1 days;
    uint256 public constant MAX_SALE_DURATION = 365 days;

    // ============== STATE VARIABLES ==============

    address public admin;  // Kept for backwards compatibility
    address public treasury;
    address public nftRenderer;  // USCINFT contract
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

    constructor(address _treasury, address _nftRenderer) {
        if (_treasury == address(0)) revert InvalidAddress();
        if (_nftRenderer == address(0)) revert InvalidAddress();

        admin = msg.sender;
        treasury = _treasury;
        nftRenderer = _nftRenderer;
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
        string memory _assetType,
        string memory _name,
        string memory _city,
        string memory _province,
        string memory _country,
        uint256 _totalPuzzles,
        uint256 _puzzlePrice,
        uint256 _saleDuration,
        uint32 _surface,
        uint8 _rooms,
        uint32 _expectedReturn,
        string memory _placeType,
        uint16 _yearBuilt,
        string memory _imageCid,
        string memory _metadataCid,
        bool _votingEnabled
    ) external onlyAdminOrTeam whenNotPaused returns (address placeAddress) {
        // 🔒 Enhanced validation
        if (_totalPuzzles < MIN_PUZZLES || _totalPuzzles > MAX_PUZZLES) {
            revert InvalidPuzzleCount();
        }
        if (_puzzlePrice == 0) revert InvalidPrice();
        if (_saleDuration < MIN_SALE_DURATION || _saleDuration > MAX_SALE_DURATION) {
            revert InvalidSaleDuration();
        }

        // Deploy new place contract
        USCI newPlace = new USCI(
            address(this),
            nftRenderer,
            placeCount,
            _assetType,
            _name,
            _city,
            _province,
            _country,
            _totalPuzzles,
            _puzzlePrice,
            _saleDuration,
            _surface,
            _rooms,
            _expectedReturn,
            _placeType,
            _yearBuilt,
            _imageCid,
            _metadataCid,
            _votingEnabled,
            treasury
        );

        placeAddress = address(newPlace);
        places[placeCount] = placeAddress;
        isPlaceContract[placeAddress] = true;  // 🔒 Whitelist

        emit PlaceCreated(
            placeCount,
            placeAddress,
            _name,
            _totalPuzzles,
            _puzzlePrice
        );

        placeCount++;
    }

    // ============== TEAM MANAGEMENT ==============

    /**
     * @notice Add a team member with TEAM_ROLE
     */
    function addTeamMember(address _member) external onlyAdmin {
        if (_member == address(0)) revert InvalidAddress();
        if (teamMembers[_member]) revert AlreadyTeamMember();

        teamMembers[_member] = true;
        teamMemberAddedAt[_member] = block.timestamp;

        // Grant TEAM_ROLE
        grantRole(TEAM_ROLE, _member);

        emit TeamMemberAdded(_member, msg.sender);
    }

    /**
     * @notice Remove a team member
     */
    function removeTeamMember(address _member) external onlyAdmin {
        if (!teamMembers[_member]) revert NotATeamMember();

        teamMembers[_member] = false;

        // Revoke TEAM_ROLE
        revokeRole(TEAM_ROLE, _member);

        emit TeamMemberRemoved(_member, msg.sender);
    }

    function isTeamMember(address _member) external view returns (bool) {
        return teamMembers[_member] || hasRole(TEAM_ROLE, _member);
    }

    // ============== ADMIN ==============

    /**
     * @notice Update admin with role transfer
     */
    function updateAdmin(address _newAdmin) external onlyAdmin {
        if (_newAdmin == address(0)) revert InvalidAddress();

        address oldAdmin = admin;
        admin = _newAdmin;

        // Transfer roles
        grantRole(ADMIN_ROLE, _newAdmin);
        grantRole(DEFAULT_ADMIN_ROLE, _newAdmin);
        revokeRole(ADMIN_ROLE, oldAdmin);

        emit AdminUpdated(oldAdmin, _newAdmin);
    }

    /**
     * @notice Update treasury address
     */
    function setTreasury(address _newTreasury) external onlyAdmin {
        if (_newTreasury == address(0)) revert InvalidAddress();

        address oldTreasury = treasury;
        treasury = _newTreasury;

        emit TreasuryUpdated(oldTreasury, _newTreasury);
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

    function getPlaceAddress(uint256 _placeId) external view returns (address) {
        return places[_placeId];
    }

    function isValidPlace(address _place) external view returns (bool) {
        return isPlaceContract[_place];
    }
}
