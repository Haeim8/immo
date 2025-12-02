// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./interfaces/IAggregatorV3.sol";

/**
 * @title PriceOracle
 * @notice Provides USD prices for tokens using Chainlink price feeds
 * @dev Supports both Chainlink feeds and manual price setting for tokens without feeds
 */
contract PriceOracle is
    Initializable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    // ============== ROLES ==============

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant PRICE_UPDATER_ROLE = keccak256("PRICE_UPDATER_ROLE");

    // ============== STATE VARIABLES ==============

    /// @notice Chainlink price feed for each token
    mapping(address => address) public priceFeeds;

    /// @notice Manual price for tokens without Chainlink feeds (8 decimals, like Chainlink)
    mapping(address => uint256) public manualPrices;

    /// @notice Last update timestamp for manual prices
    mapping(address => uint256) public lastManualUpdate;

    /// @notice Stale price threshold (default 1 hour)
    uint256 public stalePriceThreshold;

    /// @notice Price precision (8 decimals like Chainlink)
    uint256 public constant PRICE_PRECISION = 1e8;

    // ============== STORAGE GAP ==============

    uint256[50] private __gap;

    // ============== EVENTS ==============

    event PriceFeedSet(address indexed token, address indexed feed);
    event ManualPriceSet(address indexed token, uint256 price);
    event StalePriceThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);

    // ============== ERRORS ==============

    error InvalidAddress();
    error InvalidPrice();
    error PriceNotAvailable();
    error StalePrice();

    // ============== CONSTRUCTOR ==============

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _admin) external initializer {
        if (_admin == address(0)) revert InvalidAddress();

        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(PRICE_UPDATER_ROLE, _admin);

        stalePriceThreshold = 1 hours;
    }

    // ============== PRICE FUNCTIONS ==============

    /**
     * @notice Get the USD price of a token (8 decimals)
     * @param token Token address
     * @return price USD price with 8 decimals
     */
    function getPrice(address token) external view returns (uint256 price) {
        // Try Chainlink feed first
        address feed = priceFeeds[token];
        if (feed != address(0)) {
            return _getChainlinkPrice(feed);
        }

        // Fall back to manual price
        uint256 manualPrice = manualPrices[token];
        if (manualPrice == 0) revert PriceNotAvailable();

        // Check staleness for manual prices
        if (block.timestamp - lastManualUpdate[token] > stalePriceThreshold) {
            revert StalePrice();
        }

        return manualPrice;
    }

    /**
     * @notice Get the USD value of a token amount
     * @param token Token address
     * @param amount Token amount (in token decimals)
     * @param tokenDecimals Token decimals
     * @return value USD value with 8 decimals
     */
    function getUSDValue(
        address token,
        uint256 amount,
        uint8 tokenDecimals
    ) external view returns (uint256 value) {
        uint256 price = this.getPrice(token);

        // Normalize to 18 decimals first, then apply price
        // value = amount * price / 10^tokenDecimals
        // Result has 8 decimals (from price)
        return (amount * price) / (10 ** tokenDecimals);
    }

    /**
     * @notice Convert USD value to token amount
     * @param token Token address
     * @param usdValue USD value (8 decimals)
     * @param tokenDecimals Token decimals
     * @return amount Token amount in token decimals
     */
    function getTokenAmount(
        address token,
        uint256 usdValue,
        uint8 tokenDecimals
    ) external view returns (uint256 amount) {
        uint256 price = this.getPrice(token);
        if (price == 0) revert InvalidPrice();

        // amount = usdValue * 10^tokenDecimals / price
        return (usdValue * (10 ** tokenDecimals)) / price;
    }

    // ============== INTERNAL FUNCTIONS ==============

    function _getChainlinkPrice(address feed) internal view returns (uint256) {
        IAggregatorV3 priceFeed = IAggregatorV3(feed);

        (
            /* uint80 roundId */,
            int256 answer,
            /* uint256 startedAt */,
            uint256 updatedAt,
            /* uint80 answeredInRound */
        ) = priceFeed.latestRoundData();

        if (answer <= 0) revert InvalidPrice();
        if (block.timestamp - updatedAt > stalePriceThreshold) revert StalePrice();

        // Normalize to 8 decimals (PRICE_PRECISION)
        uint8 feedDecimals = priceFeed.decimals();
        if (feedDecimals == 8) {
            return uint256(answer);
        } else if (feedDecimals > 8) {
            // Scale down (e.g., 18 decimals -> 8 decimals)
            return uint256(answer) / (10 ** (feedDecimals - 8));
        } else {
            // Scale up (e.g., 6 decimals -> 8 decimals)
            return uint256(answer) * (10 ** (8 - feedDecimals));
        }
    }

    // ============== ADMIN FUNCTIONS ==============

    /**
     * @notice Set Chainlink price feed for a token
     * @param token Token address
     * @param feed Chainlink aggregator address
     */
    function setPriceFeed(address token, address feed) external onlyRole(ADMIN_ROLE) {
        if (token == address(0)) revert InvalidAddress();
        // feed can be address(0) to remove the feed

        priceFeeds[token] = feed;
        emit PriceFeedSet(token, feed);
    }

    /**
     * @notice Set manual price for a token (for tokens without Chainlink feeds)
     * @param token Token address
     * @param price Price in USD with 8 decimals
     */
    function setManualPrice(address token, uint256 price) external onlyRole(PRICE_UPDATER_ROLE) {
        if (token == address(0)) revert InvalidAddress();
        if (price == 0) revert InvalidPrice();

        manualPrices[token] = price;
        lastManualUpdate[token] = block.timestamp;

        emit ManualPriceSet(token, price);
    }

    /**
     * @notice Batch set manual prices
     * @param tokens Array of token addresses
     * @param prices Array of prices (8 decimals)
     */
    function setManualPrices(
        address[] calldata tokens,
        uint256[] calldata prices
    ) external onlyRole(PRICE_UPDATER_ROLE) {
        require(tokens.length == prices.length, "Length mismatch");

        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] == address(0)) revert InvalidAddress();
            if (prices[i] == 0) revert InvalidPrice();

            manualPrices[tokens[i]] = prices[i];
            lastManualUpdate[tokens[i]] = block.timestamp;

            emit ManualPriceSet(tokens[i], prices[i]);
        }
    }

    /**
     * @notice Update stale price threshold
     * @param newThreshold New threshold in seconds
     */
    function setStalePriceThreshold(uint256 newThreshold) external onlyRole(ADMIN_ROLE) {
        uint256 oldThreshold = stalePriceThreshold;
        stalePriceThreshold = newThreshold;
        emit StalePriceThresholdUpdated(oldThreshold, newThreshold);
    }

    // ============== VIEW FUNCTIONS ==============

    /**
     * @notice Check if a token has a price available
     * @param token Token address
     * @return hasPrice True if price is available
     */
    function hasPriceAvailable(address token) external view returns (bool) {
        if (priceFeeds[token] != address(0)) return true;
        if (manualPrices[token] > 0) {
            return block.timestamp - lastManualUpdate[token] <= stalePriceThreshold;
        }
        return false;
    }

    // ============== UPGRADE ==============

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(ADMIN_ROLE) {}
}
