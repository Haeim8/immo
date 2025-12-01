const { ethers, upgrades } = require("hardhat");

/**
 * Deploy the full CantorFi protocol on Base fork
 *
 * This script uses real Base addresses for USDC
 * Run with: npx hardhat run scripts/deploy-base-fork.js --network localhost
 * After starting a Base fork: npx hardhat node --fork https://mainnet.base.org
 */

// Base Mainnet Addresses
const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // USDC on Base
const BASE_WETH = "0x4200000000000000000000000000000000000006"; // WETH on Base

// Chainlink Price Feeds on Base
const USDC_USD_FEED = "0x7e860098F58bBFC8648a4311b374B1D669a2bc6B"; // USDC/USD
const ETH_USD_FEED = "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70";  // ETH/USD

async function main() {
  console.log("=".repeat(60));
  console.log("CantorFi Protocol Deployment - BASE FORK");
  console.log("=".repeat(60));

  const [deployer] = await ethers.getSigners();
  console.log("\nDeployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  const chainId = (await ethers.provider.getNetwork()).chainId;
  console.log("Chain ID:", chainId);

  // Track deployed contracts
  const deployment = {
    timestamp: new Date().toISOString(),
    network: "base-fork",
    deployer: deployer.address,
    contracts: {}
  };

  // ============================================
  // 1. Use existing tokens on Base
  // ============================================
  console.log("\n--- Using Base Mainnet Tokens ---");
  console.log("USDC:", BASE_USDC);
  console.log("WETH:", BASE_WETH);
  deployment.contracts.USDC = BASE_USDC;
  deployment.contracts.WETH = BASE_WETH;

  // ============================================
  // 2. Deploy CantorFiProtocol
  // ============================================
  console.log("\n--- Deploying CantorFiProtocol ---");

  const CantorFiProtocol = await ethers.getContractFactory("CantorFiProtocol");
  const protocol = await upgrades.deployProxy(
    CantorFiProtocol,
    [
      deployer.address,  // admin
      deployer.address,  // treasury
      100,               // setupFee: 1%
      1000,              // performanceFee: 10%
      1500               // borrowFeeRate: 15%
    ],
    { initializer: "initialize", kind: "uups" }
  );
  await protocol.waitForDeployment();
  const protocolAddress = await protocol.getAddress();
  console.log("CantorFiProtocol deployed:", protocolAddress);
  deployment.contracts.CantorFiProtocol = protocolAddress;

  // ============================================
  // 3. Deploy FeeCollector
  // ============================================
  console.log("\n--- Deploying FeeCollector ---");

  const FeeCollector = await ethers.getContractFactory("FeeCollector");
  const feeCollector = await upgrades.deployProxy(
    FeeCollector,
    [
      deployer.address,  // admin
      deployer.address   // treasury
    ],
    { initializer: "initialize", kind: "uups" }
  );
  await feeCollector.waitForDeployment();
  const feeCollectorAddress = await feeCollector.getAddress();
  console.log("FeeCollector deployed:", feeCollectorAddress);
  deployment.contracts.FeeCollector = feeCollectorAddress;

  // ============================================
  // 4. Deploy PriceOracle
  // ============================================
  console.log("\n--- Deploying PriceOracle ---");

  const PriceOracle = await ethers.getContractFactory("PriceOracle");
  const priceOracle = await upgrades.deployProxy(
    PriceOracle,
    [deployer.address],  // admin
    { initializer: "initialize", kind: "uups" }
  );
  await priceOracle.waitForDeployment();
  const priceOracleAddress = await priceOracle.getAddress();
  console.log("PriceOracle deployed:", priceOracleAddress);
  deployment.contracts.PriceOracle = priceOracleAddress;

  // ============================================
  // 5. Deploy CollateralManager
  // ============================================
  console.log("\n--- Deploying CollateralManager ---");

  const CollateralManager = await ethers.getContractFactory("CollateralManager");
  const collateralManager = await upgrades.deployProxy(
    CollateralManager,
    [
      priceOracleAddress,   // priceOracle
      protocolAddress,      // protocol
      deployer.address,     // admin
      7000,                 // maxLTV: 70%
      8000,                 // liquidationThreshold: 80%
      500                   // liquidationBonus: 5%
    ],
    { initializer: "initialize", kind: "uups" }
  );
  await collateralManager.waitForDeployment();
  const collateralManagerAddress = await collateralManager.getAddress();
  console.log("CollateralManager deployed:", collateralManagerAddress);
  deployment.contracts.CollateralManager = collateralManagerAddress;

  // ============================================
  // 6. Deploy CantorVault Implementation
  // ============================================
  console.log("\n--- Deploying CantorVault Implementation ---");

  const CantorVault = await ethers.getContractFactory("CantorVault");
  const vaultImpl = await CantorVault.deploy();
  await vaultImpl.waitForDeployment();
  const vaultImplAddress = await vaultImpl.getAddress();
  console.log("CantorVault Implementation deployed:", vaultImplAddress);
  deployment.contracts.CantorVaultImplementation = vaultImplAddress;

  // ============================================
  // 7. Deploy CantorAssetFactory
  // ============================================
  console.log("\n--- Deploying CantorAssetFactory ---");

  const CantorAssetFactory = await ethers.getContractFactory("CantorAssetFactory");
  const factory = await upgrades.deployProxy(
    CantorAssetFactory,
    [
      vaultImplAddress,    // vault implementation
      protocolAddress,     // protocol
      deployer.address,    // admin
      deployer.address     // treasury
    ],
    { initializer: "initialize", kind: "uups" }
  );
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("CantorAssetFactory deployed:", factoryAddress);
  deployment.contracts.CantorAssetFactory = factoryAddress;

  // ============================================
  // 8. Configure Contracts
  // ============================================
  console.log("\n--- Configuring Contracts ---");

  // Set FeeCollector in Protocol
  await protocol.setFeeCollector(feeCollectorAddress);
  console.log("Protocol: FeeCollector set");

  // Add Factory to Protocol
  await protocol.addFactory(factoryAddress);
  console.log("Protocol: Factory authorized");

  // Configure Chainlink price feeds
  console.log("\n--- Configuring Chainlink Price Feeds ---");
  await priceOracle.setPriceFeed(BASE_USDC, USDC_USD_FEED);
  console.log("PriceOracle: USDC/USD Chainlink feed set");

  await priceOracle.setPriceFeed(BASE_WETH, ETH_USD_FEED);
  console.log("PriceOracle: ETH/USD Chainlink feed set");

  // ============================================
  // 9. Create a USDC Vault
  // ============================================
  console.log("\n--- Creating USDC Vault ---");

  const createVaultTx = await factory.createVault({
    token: BASE_USDC,
    maxLiquidity: ethers.parseUnits("10000000", 6), // 10M USDC max
    borrowBaseRate: 200,      // 2% base rate
    borrowSlope: 1000,        // 10% slope
    maxBorrowRatio: 7000,     // 70% LTV
    liquidationBonus: 500     // 5% bonus
  });

  const receipt = await createVaultTx.wait();

  // Get vault address from event
  const vaultCreatedEvent = receipt.logs.find(
    log => log.fragment && log.fragment.name === 'VaultCreated'
  );

  if (vaultCreatedEvent) {
    const vaultAddress = vaultCreatedEvent.args.vaultAddress;
    console.log("USDC Vault created:", vaultAddress);
    deployment.contracts.USDCVault = vaultAddress;

    // Add vault to CollateralManager
    await collateralManager.addVault(vaultAddress);
    console.log("CollateralManager: Vault authorized");

    // Add vault as notifier in FeeCollector
    await feeCollector.addNotifier(vaultAddress);
    console.log("FeeCollector: Vault authorized as notifier");

    // Configure vault with CollateralManager
    const vault = await ethers.getContractAt("CantorVault", vaultAddress);
    await vault.setCollateralManager(collateralManagerAddress);
    await vault.setCrossCollateralEnabled(true);
    console.log("Vault: CollateralManager configured, cross-collateral enabled");
  }

  // ============================================
  // Summary
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT COMPLETE ON BASE FORK");
  console.log("=".repeat(60));
  console.log("\nDeployed Contracts:");
  for (const [name, address] of Object.entries(deployment.contracts)) {
    console.log(`  ${name}: ${address}`);
  }

  // Save deployment info
  const fs = require("fs");
  fs.writeFileSync("./deployments-base-fork.json", JSON.stringify(deployment, null, 2));
  console.log("\nDeployment info saved to ./deployments-base-fork.json");

  // Verify prices work
  console.log("\n--- Verifying Chainlink Prices ---");
  try {
    const usdcPrice = await priceOracle.getPrice(BASE_USDC);
    console.log("USDC Price:", ethers.formatUnits(usdcPrice, 8), "USD");

    const wethPrice = await priceOracle.getPrice(BASE_WETH);
    console.log("WETH Price:", ethers.formatUnits(wethPrice, 8), "USD");
  } catch (error) {
    console.log("Price verification failed (expected on non-fork):", error.message);
  }

  return deployment;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
