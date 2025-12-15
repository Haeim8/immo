const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Configure PriceOracle with Chainlink feeds and manual prices
 *
 * Base Sepolia Chainlink feeds available:
 * - ETH/USD: 0xE2E1CECaF186D44A4B01f46D6A7EcaE2B89c8076
 * - BTC/USD: 0xd94e4C1C3bB697AAE92744FAA4E43B5c2Ef11f16
 *
 * No Chainlink feeds for: USDC, EURC, DAI, etc on Base Sepolia
 */

// Chainlink feeds on Base Sepolia (from docs.chain.link)
const CHAINLINK_FEEDS_BASE_SEPOLIA = {
  "ETH/USD": "0xE2E1CECaF186D44A4B01f46D6A7EcaE2B89c8076",
  "BTC/USD": "0xd94e4C1C3bB697AAE92744FAA4E43B5c2Ef11f16",
};

// Token symbol to Chainlink feed mapping
const TOKEN_TO_FEED = {
  "WETH": "ETH/USD",
  "ETH": "ETH/USD",
  "WBTC": "BTC/USD",
  "BTC": "BTC/USD",
};

// Manual prices for stablecoins (8 decimals like Chainlink)
// These need periodic updates but stablecoins are pegged
const STABLECOIN_PRICES = {
  "USDC": 100000000,  // $1.00
  "USDT": 100000000,  // $1.00
  "DAI": 100000000,   // $1.00
  "EURC": 105000000,  // ~$1.05 (EUR/USD rate approximation)
  "EUR": 105000000,   // ~$1.05
};

async function main() {
  console.log("\n=== PriceOracle Configuration ===\n");

  // Load deployment data
  const deploymentsPath = path.join(__dirname, "../deployments-sepolia.json");
  if (!fs.existsSync(deploymentsPath)) {
    throw new Error("deployments-sepolia.json not found! Run deploy first.");
  }
  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Network:", hre.network.name);
  console.log("PriceOracle:", deployments.priceOracle);
  console.log("Protocol:", deployments.protocol);

  // Get contracts
  const PriceOracle = await hre.ethers.getContractFactory("PriceOracle");
  const priceOracle = PriceOracle.attach(deployments.priceOracle);

  const Protocol = await hre.ethers.getContractFactory("CantorFiProtocol");
  const protocol = Protocol.attach(deployments.protocol);

  // Get ERC20 interface for reading token info
  const ERC20_ABI = [
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function name() view returns (string)",
  ];

  // Vault interface
  const VAULT_ABI = [
    "function token() view returns (address)",
  ];

  // Get all vaults from protocol
  const vaultCount = await protocol.vaultCount();
  console.log(`\nFound ${vaultCount} vaults in protocol`);

  // Collect unique tokens from all vaults
  const tokensToProcess = new Map(); // address -> { symbol, decimals }

  for (let i = 0; i < vaultCount; i++) {
    const vaultAddress = await protocol.vaults(i);
    const vault = new hre.ethers.Contract(vaultAddress, VAULT_ABI, deployer);
    const tokenAddress = await vault.token();

    if (!tokensToProcess.has(tokenAddress)) {
      const token = new hre.ethers.Contract(tokenAddress, ERC20_ABI, deployer);
      const symbol = await token.symbol();
      const decimals = await token.decimals();
      tokensToProcess.set(tokenAddress, { symbol, decimals, vaultId: i });
      console.log(`  Vault ${i}: ${symbol} (${tokenAddress})`);
    }
  }

  // Also check native ETH/WETH if exists
  console.log("\n--- Configuring Price Feeds ---\n");

  // Track configured tokens
  const configuredChainlink = [];
  const configuredManual = [];
  const notConfigured = [];

  // Step 1: Increase stale price threshold for testnet (24h instead of 1h)
  // This prevents manual prices from expiring quickly on testnet
  const currentThreshold = await priceOracle.stalePriceThreshold();
  const newThreshold = 86400; // 24 hours in seconds
  if (currentThreshold < newThreshold) {
    console.log(`Updating stale price threshold: ${currentThreshold}s -> ${newThreshold}s`);
    const tx = await priceOracle.setStalePriceThreshold(newThreshold);
    await tx.wait();
    console.log("  Threshold updated!");
  }

  // Step 2: Configure each token
  for (const [tokenAddress, tokenInfo] of tokensToProcess) {
    const { symbol } = tokenInfo;
    console.log(`\nProcessing: ${symbol} (${tokenAddress})`);

    // Check if Chainlink feed exists for this token
    const feedName = TOKEN_TO_FEED[symbol.toUpperCase()];

    if (feedName && CHAINLINK_FEEDS_BASE_SEPOLIA[feedName]) {
      // Use Chainlink feed
      const feedAddress = CHAINLINK_FEEDS_BASE_SEPOLIA[feedName];
      console.log(`  Setting Chainlink feed: ${feedName} -> ${feedAddress}`);

      try {
        const tx = await priceOracle.setPriceFeed(tokenAddress, feedAddress);
        await tx.wait();
        configuredChainlink.push({ symbol, feedName, tokenAddress, feedAddress });
        console.log("  Chainlink feed configured!");
      } catch (error) {
        console.error(`  Error setting feed: ${error.message}`);
        notConfigured.push({ symbol, tokenAddress, reason: error.message });
      }
    } else {
      // Check if it's a known stablecoin
      const manualPrice = STABLECOIN_PRICES[symbol.toUpperCase()];

      if (manualPrice) {
        console.log(`  Setting manual price for stablecoin: $${(manualPrice / 1e8).toFixed(2)}`);

        try {
          const tx = await priceOracle.setManualPrice(tokenAddress, manualPrice);
          await tx.wait();
          configuredManual.push({ symbol, tokenAddress, price: manualPrice / 1e8 });
          console.log("  Manual price configured!");
        } catch (error) {
          console.error(`  Error setting price: ${error.message}`);
          notConfigured.push({ symbol, tokenAddress, reason: error.message });
        }
      } else {
        console.log(`  WARNING: No Chainlink feed or manual price for ${symbol}`);
        notConfigured.push({ symbol, tokenAddress, reason: "Unknown token" });
      }
    }
  }

  // Step 3: Summary
  console.log("\n=== Configuration Summary ===\n");

  if (configuredChainlink.length > 0) {
    console.log("Chainlink Feeds Configured:");
    for (const item of configuredChainlink) {
      console.log(`  - ${item.symbol}: ${item.feedName} (${item.feedAddress})`);
    }
  }

  if (configuredManual.length > 0) {
    console.log("\nManual Prices Configured (stablecoins):");
    for (const item of configuredManual) {
      console.log(`  - ${item.symbol}: $${item.price.toFixed(2)}`);
    }
  }

  if (notConfigured.length > 0) {
    console.log("\nNOT Configured:");
    for (const item of notConfigured) {
      console.log(`  - ${item.symbol}: ${item.reason}`);
    }
  }

  // Step 4: Verify prices
  console.log("\n=== Verifying Prices ===\n");

  for (const [tokenAddress, tokenInfo] of tokensToProcess) {
    const { symbol } = tokenInfo;
    try {
      const price = await priceOracle.getPrice(tokenAddress);
      const priceUSD = Number(price) / 1e8;
      console.log(`${symbol}: $${priceUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    } catch (error) {
      console.log(`${symbol}: ERROR - ${error.reason || error.message}`);
    }
  }

  console.log("\n=== Oracle Configuration Complete ===\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
