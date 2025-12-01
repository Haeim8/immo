const { ethers, upgrades } = require("hardhat");

/**
 * Deploy the full CantorFi protocol
 *
 * Deployment Order:
 * 1. Deploy mock tokens (USDC, WETH) for testing
 * 2. Deploy CantorFiProtocol (upgradeable)
 * 3. Deploy FeeCollector (upgradeable)
 * 4. Deploy PriceOracle (upgradeable)
 * 5. Deploy CollateralManager (upgradeable)
 * 6. Deploy CantorVault implementation (for cloning)
 * 7. Deploy CantorAssetFactory (upgradeable)
 * 8. Configure all contracts (roles, addresses)
 * 9. Create a test vault
 */
async function main() {
  console.log("=".repeat(60));
  console.log("CantorFi Protocol Deployment");
  console.log("=".repeat(60));

  const [deployer] = await ethers.getSigners();
  console.log("\nDeployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  const isLocalhost = (await ethers.provider.getNetwork()).chainId === 31337n;
  console.log("\nNetwork:", isLocalhost ? "localhost (Hardhat)" : "external");

  // Track deployed contracts
  const deployment = {
    timestamp: new Date().toISOString(),
    network: isLocalhost ? "localhost" : "external",
    deployer: deployer.address,
    contracts: {}
  };

  // ============================================
  // 1. Deploy Mock Tokens (only for localhost)
  // ============================================
  let usdc, weth;

  if (isLocalhost) {
    console.log("\n--- Deploying Mock Tokens ---");

    const MockERC20 = await ethers.getContractFactory("MockERC20");

    // Deploy Mock USDC (6 decimals)
    usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
    await usdc.waitForDeployment();
    console.log("Mock USDC deployed:", await usdc.getAddress());
    deployment.contracts.USDC = await usdc.getAddress();

    // Deploy Mock WETH (18 decimals)
    weth = await MockERC20.deploy("Wrapped Ether", "WETH", 18);
    await weth.waitForDeployment();
    console.log("Mock WETH deployed:", await weth.getAddress());
    deployment.contracts.WETH = await weth.getAddress();

    // Mint some tokens for testing
    const usdcAmount = ethers.parseUnits("10000000", 6); // 10M USDC
    const wethAmount = ethers.parseEther("1000"); // 1000 WETH

    await usdc.mint(deployer.address, usdcAmount);
    await weth.mint(deployer.address, wethAmount);
    console.log("Minted 10M USDC and 1000 WETH to deployer");
  }

  // ============================================
  // 2. Deploy CantorFiProtocol
  // ============================================
  console.log("\n--- Deploying CantorFiProtocol ---");

  const CantorFiProtocol = await ethers.getContractFactory("CantorFiProtocol");
  const protocol = await upgrades.deployProxy(
    CantorFiProtocol,
    [
      deployer.address,  // admin
      deployer.address,  // treasury (use deployer for testing)
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

  // Add Factory to Protocol (IMPORTANT: enables vault registration)
  await protocol.addFactory(factoryAddress);
  console.log("Protocol: Factory authorized");

  // Set manual prices in PriceOracle (for localhost testing)
  if (isLocalhost) {
    // USDC = $1.00 (8 decimals)
    await priceOracle.setManualPrice(await usdc.getAddress(), 100000000);
    console.log("PriceOracle: USDC price set to $1.00");

    // WETH = $2000.00 (8 decimals)
    await priceOracle.setManualPrice(await weth.getAddress(), 200000000000);
    console.log("PriceOracle: WETH price set to $2000.00");
  }

  // ============================================
  // 9. Create a Test Vault (localhost only)
  // ============================================
  if (isLocalhost) {
    console.log("\n--- Creating Test USDC Vault ---");

    const createVaultTx = await factory.createVault({
      token: await usdc.getAddress(),
      maxLiquidity: ethers.parseUnits("1000000", 6), // 1M USDC max
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
      console.log("Test USDC Vault created:", vaultAddress);
      deployment.contracts.TestUSDCVault = vaultAddress;

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
  }

  // ============================================
  // Summary
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT COMPLETE");
  console.log("=".repeat(60));
  console.log("\nDeployed Contracts:");
  for (const [name, address] of Object.entries(deployment.contracts)) {
    console.log(`  ${name}: ${address}`);
  }

  // Save deployment info
  const fs = require("fs");
  const deploymentPath = isLocalhost
    ? "./deployments-localhost.json"
    : "./deployments.json";

  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log(`\nDeployment info saved to ${deploymentPath}`);

  return deployment;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
