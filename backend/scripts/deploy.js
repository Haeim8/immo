const { ethers, upgrades } = require("hardhat");
const fs = require("fs");

/**
 * Deploy the full CantorFi protocol
 * Works on localhost (Hardhat) and Base Sepolia
 */
async function main() {
  console.log("=".repeat(60));
  console.log("CantorFi Protocol Deployment");
  console.log("=".repeat(60));

  const [deployer] = await ethers.getSigners();
  console.log("\nDeployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  const chainId = (await ethers.provider.getNetwork()).chainId;
  const isLocalhost = chainId === 31337n;
  const isBaseSepolia = chainId === 84532n;

  console.log("\nChain ID:", chainId.toString());
  console.log("Network:", isLocalhost ? "localhost" : isBaseSepolia ? "Base Sepolia" : "unknown");

  // USDC address (existing on Base Sepolia, mock on localhost)
  const USDC_BASE_SEPOLIA = "0x45f591C36B3506a881eD54638a9456607c2Eed84";

  let usdcAddress;
  let wethAddress;

  // ============================================
  // 1. Deploy Mock Tokens (localhost only)
  // ============================================
  if (isLocalhost) {
    console.log("\n--- Deploying Mock Tokens ---");

    const MockERC20 = await ethers.getContractFactory("MockERC20");

    const usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
    await usdc.waitForDeployment();
    usdcAddress = await usdc.getAddress();
    console.log("Mock USDC:", usdcAddress);

    const weth = await MockERC20.deploy("Wrapped Ether", "WETH", 18);
    await weth.waitForDeployment();
    wethAddress = await weth.getAddress();
    console.log("Mock WETH:", wethAddress);

    await usdc.mint(deployer.address, ethers.parseUnits("10000000", 6));
    await weth.mint(deployer.address, ethers.parseEther("1000"));
    console.log("Minted 10M USDC and 1000 WETH to deployer");
  } else if (isBaseSepolia) {
    usdcAddress = USDC_BASE_SEPOLIA;
    console.log("\nUsing existing USDC:", usdcAddress);
  }

  // ============================================
  // 2. Deploy Global CVT Token
  // ============================================
  console.log("\n--- Deploying Global CVT Token ---");

  const CVT = await ethers.getContractFactory("CVT");
  const cvt = await CVT.deploy(deployer.address);
  await cvt.waitForDeployment();
  const cvtAddress = await cvt.getAddress();
  console.log("CVT Token:", cvtAddress);

  // ============================================
  // 3. Deploy CantorFiProtocol
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
  console.log("CantorFiProtocol:", protocolAddress);

  // ============================================
  // 4. Deploy FeeCollector
  // ============================================
  console.log("\n--- Deploying FeeCollector ---");

  const FeeCollector = await ethers.getContractFactory("FeeCollector");
  const feeCollector = await upgrades.deployProxy(
    FeeCollector,
    [deployer.address, deployer.address],
    { initializer: "initialize", kind: "uups" }
  );
  await feeCollector.waitForDeployment();
  const feeCollectorAddress = await feeCollector.getAddress();
  console.log("FeeCollector:", feeCollectorAddress);

  // ============================================
  // 5. Deploy PriceOracle
  // ============================================
  console.log("\n--- Deploying PriceOracle ---");

  const PriceOracle = await ethers.getContractFactory("PriceOracle");
  const priceOracle = await upgrades.deployProxy(
    PriceOracle,
    [deployer.address],
    { initializer: "initialize", kind: "uups" }
  );
  await priceOracle.waitForDeployment();
  const priceOracleAddress = await priceOracle.getAddress();
  console.log("PriceOracle:", priceOracleAddress);

  // ============================================
  // 6. Deploy CollateralManager
  // ============================================
  console.log("\n--- Deploying CollateralManager ---");

  const CollateralManager = await ethers.getContractFactory("CollateralManager");
  const collateralManager = await upgrades.deployProxy(
    CollateralManager,
    [
      priceOracleAddress,
      protocolAddress,
      deployer.address,
      7000,  // maxLTV: 70%
      8000,  // liquidationThreshold: 80%
      500    // liquidationBonus: 5%
    ],
    { initializer: "initialize", kind: "uups" }
  );
  await collateralManager.waitForDeployment();
  const collateralManagerAddress = await collateralManager.getAddress();
  console.log("CollateralManager:", collateralManagerAddress);

  // ============================================
  // 7. Deploy CantorVault Implementation
  // ============================================
  console.log("\n--- Deploying CantorVault Implementation ---");

  const CantorVault = await ethers.getContractFactory("CantorVault");
  const vaultImpl = await CantorVault.deploy();
  await vaultImpl.waitForDeployment();
  const vaultImplAddress = await vaultImpl.getAddress();
  console.log("CantorVault Implementation:", vaultImplAddress);

  // ============================================
  // 8. Deploy CantorAssetFactory (with global CVT)
  // ============================================
  console.log("\n--- Deploying CantorAssetFactory ---");

  const CantorAssetFactory = await ethers.getContractFactory("CantorAssetFactory");
  const factory = await upgrades.deployProxy(
    CantorAssetFactory,
    [vaultImplAddress, protocolAddress, cvtAddress, deployer.address, deployer.address],
    { initializer: "initialize", kind: "uups" }
  );
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("CantorAssetFactory:", factoryAddress);

  // Grant factory ADMIN_ROLE on CVT so it can addMinter for new vaults
  await cvt.grantRole(await cvt.ADMIN_ROLE(), factoryAddress);
  console.log("  Granted ADMIN_ROLE on CVT to Factory");

  // ============================================
  // 9. Deploy CantorVaultReader
  // ============================================
  console.log("\n--- Deploying CantorVaultReader ---");

  const CantorVaultReader = await ethers.getContractFactory("CantorVaultReader");
  const reader = await CantorVaultReader.deploy(protocolAddress);
  await reader.waitForDeployment();
  const readerAddress = await reader.getAddress();
  console.log("CantorVaultReader:", readerAddress);

  // ============================================
  // 10. Configure Contracts
  // ============================================
  console.log("\n--- Configuring Contracts ---");

  await protocol.setFeeCollector(feeCollectorAddress);
  console.log("  Protocol: FeeCollector set");

  await protocol.addFactory(factoryAddress);
  console.log("  Protocol: Factory authorized");

  await feeCollector.addNotifier(factoryAddress);
  console.log("  FeeCollector: Factory authorized as notifier");

  // Set USDC price
  if (usdcAddress) {
    await priceOracle.setManualPrice(usdcAddress, 100000000); // $1.00
    console.log("  PriceOracle: USDC price set to $1.00");
  }

  if (isLocalhost && wethAddress) {
    await priceOracle.setManualPrice(wethAddress, 200000000000); // $2000
    console.log("  PriceOracle: WETH price set to $2000.00");
  }

  // ============================================
  // 11. Create Test Vault + Staking
  // ============================================
  let testVaultAddress;
  let stakingAddress;

  if (usdcAddress) {
    console.log("\n--- Creating USDC Vault ---");

    const createVaultTx = await factory.createVault({
      token: usdcAddress,
      maxLiquidity: ethers.parseUnits("1000000", 6),
      borrowBaseRate: 200,
      borrowSlope: 1000,
      maxBorrowRatio: 7000,
      liquidationBonus: 500
    });

    const receipt = await createVaultTx.wait();
    const vaultCreatedEvent = receipt.logs.find(
      log => log.fragment && log.fragment.name === 'VaultCreated'
    );

    if (vaultCreatedEvent) {
      testVaultAddress = vaultCreatedEvent.args.vaultAddress;
      console.log("USDC Vault:", testVaultAddress);

      await collateralManager.addVault(testVaultAddress);
      await feeCollector.addNotifier(testVaultAddress);

      const vault = await ethers.getContractAt("CantorVault", testVaultAddress);
      await vault.setCollateralManager(collateralManagerAddress);
      await vault.setCrossCollateralEnabled(true);
      console.log("  Vault configured");

      // Deploy CVTStaking with global CVT
      console.log("\n--- Deploying CVTStaking ---");

      const CVTStaking = await ethers.getContractFactory("CVTStaking");
      const staking = await upgrades.deployProxy(
        CVTStaking,
        [
          cvtAddress,           // Global CVT
          usdcAddress,          // Underlying token for rewards
          testVaultAddress,     // Vault for protocol borrowing
          deployer.address,     // Admin
          6000                  // maxProtocolBorrowRatio: 60%
        ],
        { initializer: "initialize", kind: "uups" }
      );
      await staking.waitForDeployment();
      stakingAddress = await staking.getAddress();
      console.log("CVTStaking:", stakingAddress);

      // Configure vault to know about staking contract
      await vault.setStakingContract(stakingAddress);
      console.log("  Vault: Staking contract set");
    }
  }

  // ============================================
  // Save deployment
  // ============================================
  const deployment = {
    timestamp: new Date().toISOString(),
    network: isLocalhost ? "localhost" : isBaseSepolia ? "baseSepolia" : "unknown",
    chainId: Number(chainId),
    deployer: deployer.address,
    cvt: cvtAddress,
    protocol: protocolAddress,
    feeCollector: feeCollectorAddress,
    priceOracle: priceOracleAddress,
    collateralManager: collateralManagerAddress,
    vaultImplementation: vaultImplAddress,
    factory: factoryAddress,
    reader: readerAddress,
    usdc: usdcAddress || null
  };

  if (wethAddress) deployment.weth = wethAddress;
  if (testVaultAddress) deployment.testVault = testVaultAddress;
  if (stakingAddress) deployment.staking = stakingAddress;

  const deploymentPath = isLocalhost
    ? "./deployments-localhost.json"
    : "./deployments-sepolia.json";

  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log(`\nDeployment saved to ${deploymentPath}`);

  // ============================================
  // Summary
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT COMPLETE");
  console.log("=".repeat(60));
  console.log("\nAddresses:");
  console.log("  CVT:               ", cvtAddress);
  console.log("  Protocol:          ", protocolAddress);
  console.log("  FeeCollector:      ", feeCollectorAddress);
  console.log("  PriceOracle:       ", priceOracleAddress);
  console.log("  CollateralManager: ", collateralManagerAddress);
  console.log("  VaultImplementation:", vaultImplAddress);
  console.log("  Factory:           ", factoryAddress);
  console.log("  Reader:            ", readerAddress);
  if (usdcAddress) console.log("  USDC:              ", usdcAddress);
  if (stakingAddress) console.log("  Staking:           ", stakingAddress);

  if (!isLocalhost) {
    console.log("\n" + "=".repeat(60));
    console.log("UPDATE constants.ts:");
    console.log("=".repeat(60));
    console.log(`
export const PROTOCOL_ADDRESS = '${protocolAddress}' as const;
export const CVT_TOKEN_ADDRESS = '${cvtAddress}' as const;
export const USDC_ADDRESS = '${usdcAddress}' as const;
export const FACTORY_ADDRESS = '${factoryAddress}' as const;
export const FEE_COLLECTOR_ADDRESS = '${feeCollectorAddress}' as const;
export const VAULT_IMPLEMENTATION_ADDRESS = '${vaultImplAddress}' as const;
export const PRICE_ORACLE_ADDRESS = '${priceOracleAddress}' as const;
export const COLLATERAL_MANAGER_ADDRESS = '${collateralManagerAddress}' as const;
export const READER_ADDRESS = '${readerAddress}' as const;
${stakingAddress ? `export const STAKING_ADDRESS = '${stakingAddress}' as const;` : ''}
`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
