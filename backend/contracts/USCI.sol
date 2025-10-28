// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./USCINFT.sol";

/**
 * @title USCI
 * @notice Interactive place tokenization with puzzle pieces as ERC721 NFTs
 * @dev Enhanced security version with Pausable and rate limiting
 * @custom:security-contact security@usci.io
 */
contract USCI is ERC721, ReentrancyGuard, Pausable {
    // ============== STRUCTS ==============

    struct PlaceInfo {
        uint256 placeId;
        string assetType;
        string name;
        string city;
        string province;
        string country;
        uint256 totalPuzzles;
        uint256 puzzlePrice;
        uint256 puzzlesSold;
        uint256 saleStart;
        uint256 saleEnd;
        bool isActive;
        uint32 surface;
        uint8 rooms;
        uint32 expectedReturn;
        string placeType;
        uint16 yearBuilt;
        string imageCid;
        string metadataCid;
        bool votingEnabled;
    }

    struct Proposal {
        uint256 proposalId;
        string title;
        string description;
        address creator;
        uint256 createdAt;
        uint256 votingEndsAt;
        uint256 yesVotes;
        uint256 noVotes;
        bool isActive;
        bool isExecuted;
    }

    // ============== CONSTANTS ==============

    uint256 public constant CLAIM_COOLDOWN = 1 hours;
    uint256 public constant MIN_VOTING_DURATION = 1 days;
    uint256 public constant MAX_VOTING_DURATION = 30 days;

    // ============== STATE VARIABLES ==============

    address public factory;
    address public treasury;
    address public nftRenderer;
    PlaceInfo public info;

    // NFT tracking
    uint256 private _tokenIdCounter;
    mapping(uint256 => address) public originalMinter;

    // Rewards
    uint256 public totalRewardsDeposited;
    uint256 public totalRewardsClaimed;
    uint256 public rewardRemainder;
    uint256 public puzzlesSoldAtLastDeposit;
    mapping(uint256 => uint256) public rewardsClaimed;
    mapping(uint256 => uint256) public lastClaimTime; // 🔒 Rate limiting

    // Governance
    uint256 private _proposalIdCounter;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(uint256 => bool)) public hasVoted;

    // Completion
    bool public isCompleted;
    uint256 public completionAmount;
    uint256 public completionClaimed;

    // ============== EVENTS ==============

    event PuzzleTaken(address indexed buyer, uint256 indexed tokenId, uint256 price);
    event SaleClosed(uint256 puzzlesSold, uint256 totalPuzzles);
    event RewardsDeposited(uint256 amount, uint256 rewardPerPuzzle, uint256 remainder);
    event RewardsClaimed(uint256 indexed tokenId, address indexed owner, uint256 amount);
    event ProposalCreated(uint256 indexed proposalId, string title, uint256 votingEndsAt);
    event VoteCast(uint256 indexed proposalId, uint256 indexed tokenId, bool vote);
    event ProposalClosed(uint256 indexed proposalId, uint256 yesVotes, uint256 noVotes);
    event PlaceCompleted(uint256 amount);
    event CompletionClaimed(uint256 indexed tokenId, address indexed owner, uint256 amount);
    event EmergencyPaused(address indexed by);
    event EmergencyUnpaused(address indexed by);

    // ============== ERRORS ==============

    error SaleEnded();
    error PlaceInactive();
    error AllPuzzlesTaken();
    error IncorrectPayment();
    error NotOwner();
    error NoRewardsToClaim();
    error ClaimCooldownActive();
    error InvalidVotingDuration();
    error InvalidFactory();
    error InvalidRenderer();
    error InvalidTreasury();
    error InvalidPuzzleCount();
    error InvalidPrice();
    error TransferFailed();
    error SaleStillActive();
    error NoPuzzlesSold();
    error VotingDisabled();
    error ProposalInactive();
    error AlreadyVoted();
    error VotingEnded();
    error VotingStillActive();
    error NotAllPuzzlesTaken();
    error AlreadyCompleted();
    error InvalidAmount();
    error NotCompleted();
    error TokenDoesNotExist();
    error OnlyFactory();
    error NotAuthorized();

    // ============== MODIFIERS ==============

    modifier onlyFactory() {
        if (msg.sender != factory) revert OnlyFactory();
        _;
    }

    modifier onlyFactoryOrTeam() {
        if (
            msg.sender != factory &&
            !IUSCIFactory(factory).isTeamMember(msg.sender) &&
            msg.sender != IUSCIFactory(factory).admin()
        ) revert NotAuthorized();
        _;
    }

    // ============== CONSTRUCTOR ==============

    constructor(
        address _factory,
        address _nftRenderer,
        uint256 _placeId,
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
        bool _votingEnabled,
        address _treasury
    ) ERC721(
        string(abi.encodePacked("Puzzle NFT - ", _name)),
        string(abi.encodePacked("PUZZLE-", _name))
    ) {
        if (_factory == address(0)) revert InvalidFactory();
        if (_nftRenderer == address(0)) revert InvalidRenderer();
        if (_treasury == address(0)) revert InvalidTreasury();
        if (_totalPuzzles == 0) revert InvalidPuzzleCount();
        if (_puzzlePrice == 0) revert InvalidPrice();

        factory = _factory;
        nftRenderer = _nftRenderer;
        treasury = _treasury;

        info = PlaceInfo({
            placeId: _placeId,
            assetType: _assetType,
            name: _name,
            city: _city,
            province: _province,
            country: _country,
            totalPuzzles: _totalPuzzles,
            puzzlePrice: _puzzlePrice,
            puzzlesSold: 0,
            saleStart: block.timestamp,
            saleEnd: block.timestamp + _saleDuration,
            isActive: true,
            surface: _surface,
            rooms: _rooms,
            expectedReturn: _expectedReturn,
            placeType: _placeType,
            yearBuilt: _yearBuilt,
            imageCid: _imageCid,
            metadataCid: _metadataCid,
            votingEnabled: _votingEnabled
        });

        rewardRemainder = 0;
        puzzlesSoldAtLastDeposit = 0;
    }

    // ============== PUZZLE TAKING ==============

    /**
     * @notice Take a puzzle piece from the place
     * @dev Protected against reentrancy, state updated before transfer
     */
    function takePuzzle() external payable nonReentrant whenNotPaused {
        // Auto-close if deadline passed
        if (block.timestamp > info.saleEnd && info.isActive) {
            info.isActive = false;
            emit SaleClosed(info.puzzlesSold, info.totalPuzzles);
        }

        if (block.timestamp > info.saleEnd) revert SaleEnded();
        if (!info.isActive) revert PlaceInactive();
        if (info.puzzlesSold >= info.totalPuzzles) revert AllPuzzlesTaken();
        if (msg.value != info.puzzlePrice) revert IncorrectPayment();

        // Mint NFT
        uint256 tokenId = _tokenIdCounter;
        _mint(msg.sender, tokenId);
        originalMinter[tokenId] = msg.sender;

        // Update state before external call (CEI pattern)
        _tokenIdCounter++;
        info.puzzlesSold++;

        // Transfer payment to treasury
        (bool success, ) = treasury.call{value: msg.value}("");
        if (!success) revert TransferFailed();

        emit PuzzleTaken(msg.sender, tokenId, msg.value);

        // Auto-close if sold out
        if (info.puzzlesSold >= info.totalPuzzles) {
            info.isActive = false;
            emit SaleClosed(info.puzzlesSold, info.totalPuzzles);
        }
    }

    function closeSale() external onlyFactoryOrTeam {
        if (block.timestamp <= info.saleEnd) revert SaleStillActive();
        info.isActive = false;
        emit SaleClosed(info.puzzlesSold, info.totalPuzzles);
    }

    // ============== REWARDS ==============

    /**
     * @notice Deposit rewards with anti-dilution protection
     */
    function depositRewards() external payable onlyFactoryOrTeam whenNotPaused {
        if (msg.value == 0) revert InvalidAmount();
        if (info.isActive) revert SaleStillActive();
        if (info.puzzlesSold == 0) revert NoPuzzlesSold();

        // Snapshot puzzles sold to prevent dilution
        puzzlesSoldAtLastDeposit = info.puzzlesSold;

        // Calculate distribution with remainder
        uint256 totalToDistribute = msg.value + rewardRemainder;
        uint256 puzzlesSnapshot = info.puzzlesSold;
        uint256 rewardPerPuzzle = totalToDistribute / puzzlesSnapshot;
        uint256 distributed = rewardPerPuzzle * puzzlesSnapshot;
        uint256 newRemainder = totalToDistribute - distributed;

        rewardRemainder = newRemainder;
        totalRewardsDeposited += msg.value;

        emit RewardsDeposited(msg.value, rewardPerPuzzle, newRemainder);
    }

    /**
     * @notice Claim rewards with cooldown protection
     */
    function claimRewards(uint256 tokenId) external nonReentrant whenNotPaused {
        if (ownerOf(tokenId) != msg.sender) revert NotOwner();

        // 🔒 Rate limiting: 1 hour cooldown
        if (block.timestamp < lastClaimTime[tokenId] + CLAIM_COOLDOWN) {
            revert ClaimCooldownActive();
        }

        // Use snapshot to prevent dilution
        uint256 puzzlesSnapshot = puzzlesSoldAtLastDeposit;
        if (puzzlesSnapshot == 0) revert NoPuzzlesSold();

        uint256 rewardPerPuzzle = totalRewardsDeposited / puzzlesSnapshot;
        uint256 claimable = rewardPerPuzzle - rewardsClaimed[tokenId];
        if (claimable == 0) revert NoRewardsToClaim();

        // Update state before transfer (CEI pattern)
        rewardsClaimed[tokenId] += claimable;
        totalRewardsClaimed += claimable;
        lastClaimTime[tokenId] = block.timestamp;

        (bool success, ) = msg.sender.call{value: claimable}("");
        if (!success) revert TransferFailed();

        emit RewardsClaimed(tokenId, msg.sender, claimable);
    }

    // ============== GOVERNANCE ==============

    function createProposal(
        string memory _title,
        string memory _description,
        uint256 _votingDuration
    ) external onlyFactoryOrTeam whenNotPaused returns (uint256) {
        if (!info.votingEnabled) revert VotingDisabled();

        // 🔒 Validation de la durée
        if (_votingDuration < MIN_VOTING_DURATION || _votingDuration > MAX_VOTING_DURATION) {
            revert InvalidVotingDuration();
        }

        uint256 proposalId = _proposalIdCounter;

        proposals[proposalId] = Proposal({
            proposalId: proposalId,
            title: _title,
            description: _description,
            creator: msg.sender,
            createdAt: block.timestamp,
            votingEndsAt: block.timestamp + _votingDuration,
            yesVotes: 0,
            noVotes: 0,
            isActive: true,
            isExecuted: false
        });

        _proposalIdCounter++;

        emit ProposalCreated(proposalId, _title, block.timestamp + _votingDuration);

        return proposalId;
    }

    function castVote(uint256 proposalId, uint256 tokenId, bool vote) external whenNotPaused {
        Proposal storage proposal = proposals[proposalId];

        if (ownerOf(tokenId) != msg.sender) revert NotOwner();
        if (!proposal.isActive) revert ProposalInactive();
        if (hasVoted[proposalId][tokenId]) revert AlreadyVoted();

        // Auto-close if deadline passed
        if (block.timestamp > proposal.votingEndsAt && proposal.isActive) {
            proposal.isActive = false;
            emit ProposalClosed(proposalId, proposal.yesVotes, proposal.noVotes);
        }

        if (block.timestamp > proposal.votingEndsAt) revert VotingEnded();

        hasVoted[proposalId][tokenId] = true;

        if (vote) {
            proposal.yesVotes++;
        } else {
            proposal.noVotes++;
        }

        emit VoteCast(proposalId, tokenId, vote);
    }

    function closeProposal(uint256 proposalId) external onlyFactoryOrTeam {
        Proposal storage proposal = proposals[proposalId];
        if (block.timestamp <= proposal.votingEndsAt) revert VotingStillActive();
        proposal.isActive = false;
        emit ProposalClosed(proposalId, proposal.yesVotes, proposal.noVotes);
    }

    // ============== LIQUIDATION ==============

    function complete() external payable onlyFactoryOrTeam whenNotPaused {
        if (msg.value == 0) revert InvalidAmount();
        if (info.isActive) revert SaleStillActive();
        if (info.puzzlesSold != info.totalPuzzles) revert NotAllPuzzlesTaken();
        if (isCompleted) revert AlreadyCompleted();
        if (msg.value % info.totalPuzzles != 0) revert InvalidAmount();

        isCompleted = true;
        completionAmount = msg.value;

        emit PlaceCompleted(msg.value);
    }

    function claimCompletion(uint256 tokenId) external nonReentrant whenNotPaused {
        if (!isCompleted) revert NotCompleted();
        if (ownerOf(tokenId) != msg.sender) revert NotOwner();

        uint256 amountPerPuzzle = completionAmount / info.totalPuzzles;

        // Mark as claimed by burning the NFT
        _burn(tokenId);

        completionClaimed += amountPerPuzzle;

        (bool success, ) = msg.sender.call{value: amountPerPuzzle}("");
        if (!success) revert TransferFailed();

        emit CompletionClaimed(tokenId, msg.sender, amountPerPuzzle);
    }

    // ============== EMERGENCY ==============

    /**
     * @notice Pause contract in case of emergency
     */
    function pause() external onlyFactoryOrTeam {
        _pause();
        emit EmergencyPaused(msg.sender);
    }

    /**
     * @notice Unpause contract after emergency
     */
    function unpause() external onlyFactoryOrTeam {
        _unpause();
        emit EmergencyUnpaused(msg.sender);
    }

    // ============== VIEW FUNCTIONS ==============

    function getPlaceInfo() external view returns (PlaceInfo memory) {
        return info;
    }

    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        return proposals[proposalId];
    }

    function isOriginalMinter(uint256 tokenId) external view returns (bool) {
        return originalMinter[tokenId] == ownerOf(tokenId);
    }

    function canClaimRewards(uint256 tokenId) external view returns (bool) {
        if (ownerOf(tokenId) == address(0)) return false;
        if (block.timestamp < lastClaimTime[tokenId] + CLAIM_COOLDOWN) return false;

        uint256 puzzlesSnapshot = puzzlesSoldAtLastDeposit;
        if (puzzlesSnapshot == 0) return false;

        uint256 rewardPerPuzzle = totalRewardsDeposited / puzzlesSnapshot;
        uint256 claimable = rewardPerPuzzle - rewardsClaimed[tokenId];

        return claimable > 0;
    }

    // ============== ERC721 METADATA ==============

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (ownerOf(tokenId) == address(0)) revert TokenDoesNotExist();

        USCINFT.PlaceMetadata memory metadata = USCINFT.PlaceMetadata({
            placeId: info.placeId,
            assetType: info.assetType,
            name: info.name,
            city: info.city,
            province: info.province
        });

        return USCINFT(nftRenderer).generateTokenURI(
            tokenId,
            metadata,
            originalMinter[tokenId],
            ownerOf(tokenId)
        );
    }
}

// Interface for factory calls
interface IUSCIFactory {
    function admin() external view returns (address);
    function isTeamMember(address member) external view returns (bool);
}
