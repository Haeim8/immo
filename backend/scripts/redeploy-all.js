const { ethers, upgrades } = require("hardhat");
const fs = require("fs");

/**
 * FULL REDEPLOYMENT - All contracts EXCEPT CantorFi Token (CVT)
 * Run: npx hardhat run scripts/redeploy-all.js --network baseSepolia
 */
async function main() {
  console.log("=".repeat(60));
  console.log("CantorFi Protocol - FULL REDEPLOYMENT");
  console.log("=".repeat(60));

  const [deployer] = await ethers.getSigners();
  console.log("\nDeployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  const chainId = (await ethers.provider.getNetwork()).chainId;
  if (chainId !== 84532n) {
    throw new Error("This script is for Base Sepolia only (chainId 84532)");
  }
  console.log("Chain ID:", chainId.toString());

  // ============================================
  // LOAD EXISTING DEPLOYMENT (for CVT and USDC)
  // ============================================
  const deploymentPath = "./deployments-sepolia.json";
  if (!fs.existsSync(deploymentPath)) {
    throw new Error("deployments-sepolia.json not found. Cannot get CVT address.");
  }
  const oldDeployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

  const CVT_ADDRESS = oldDeployment.cvt;
  const USDC_ADDRESS = oldDeployment.usdc;

  if (!CVT_ADDRESS) {
    throw new Error("CVT address not found in deployments-sepolia.json");
  }
  if (!USDC_ADDRESS) {
    throw new Error("USDC address not found in deployments-sepolia.json");
  }

  console.log("\n=== KEEPING EXISTING ===");
  console.log("CVT Token:", CVT_ADDRESS);
  console.log("USDC:", USDC_ADDRESS);

  // Get existing CVT contract
  const cvt = await ethers.getContractAt("CVT", CVT_ADDRESS);

  // ============================================
  // 1. Deploy CantorFiProtocol
  // ============================================
  console.log("\n--- 1/8 Deploying CantorFiProtocol ---");
  const CantorFiProtocol = await ethers.getContractFactory("CantorFiProtocol");
  const protocol = await upgrades.deployProxy(
    CantorFiProtocol,
    [deployer.address, deployer.address, 100, 1000, 1500],
    { initializer: "initialize", kind: "uups" }
  );
  await protocol.waitForDeployment();
  const protocolAddress = await protocol.getAddress();
  console.log("Protocol:", protocolAddress);

  // ============================================
  // 2. Deploy FeeCollector
  // ============================================
  console.log("\n--- 2/8 Deploying FeeCollector ---");
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
  // 3. Deploy PriceOracle
  // ============================================
  console.log("\n--- 3/8 Deploying PriceOracle ---");
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
  // 4. Deploy CollateralManager
  // ============================================
  console.log("\n--- 4/8 Deploying CollateralManager ---");
  const CollateralManager = await ethers.getContractFactory("CollateralManager");
  const collateralManager = await upgrades.deployProxy(
    CollateralManager,
    [priceOracleAddress, protocolAddress, deployer.address, 7000, 8000, 500],
    { initializer: "initialize", kind: "uups" }
  );
  await collateralManager.waitForDeployment();
  const collateralManagerAddress = await collateralManager.getAddress();
  console.log("CollateralManager:", collateralManagerAddress);

  // ============================================
  // 5. Deploy CantorVault Implementation
  // ============================================
  console.log("\n--- 5/8 Deploying CantorVault Implementation ---");
  const CantorVault = await ethers.getContractFactory("CantorVault");
  const vaultImpl = await CantorVault.deploy();
  await vaultImpl.waitForDeployment();
  const vaultImplAddress = await vaultImpl.getAddress();
  console.log("VaultImpl:", vaultImplAddress);

  // ============================================
  // 6. Deploy CantorAssetFactory
  // ============================================
  console.log("\n--- 6/8 Deploying CantorAssetFactory ---");
  const CantorAssetFactory = await ethers.getContractFactory("CantorAssetFactory");
  const factory = await upgrades.deployProxy(
    CantorAssetFactory,
    [vaultImplAddress, protocolAddress, CVT_ADDRESS, deployer.address, deployer.address],
    { initializer: "initialize", kind: "uups" }
  );
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("Factory:", factoryAddress);

  // Grant ADMIN_ROLE on CVT to new factory
  console.log("  Granting ADMIN_ROLE on CVT to new factory...");
  const adminRole = await cvt.ADMIN_ROLE();
  const hasRole = await cvt.hasRole(adminRole, factoryAddress);
  if (!hasRole) {
    await cvt.grantRole(adminRole, factoryAddress);
    console.log("  Factory has ADMIN_ROLE on CVT");
  } else {
    console.log("  Factory already has ADMIN_ROLE on CVT");
  }

  // ============================================
  // 7. Deploy CantorVaultReader
  // ============================================
  console.log("\n--- 7/8 Deploying CantorVaultReader ---");
  const CantorVaultReader = await ethers.getContractFactory("CantorVaultReader");
  const reader = await CantorVaultReader.deploy(protocolAddress);
  await reader.waitForDeployment();
  const readerAddress = await reader.getAddress();
  console.log("Reader:", readerAddress);

  // ============================================
  // 8. Configure contracts
  // ============================================
  console.log("\n--- 8/8 Configuring Contracts ---");

  await protocol.setFeeCollector(feeCollectorAddress);
  console.log("  Protocol: FeeCollector set");

  await protocol.addFactory(factoryAddress);
  console.log("  Protocol: Factory authorized");

  await feeCollector.addNotifier(factoryAddress);
  console.log("  FeeCollector: Factory authorized");

  // Set prices for common tokens
  await priceOracle.setManualPrice(USDC_ADDRESS, 100000000); // $1.00
  console.log("  PriceOracle: USDC = $1.00");

  // WETH on Base Sepolia
  const WETH_ADDRESS = "0x4200000000000000000000000000000000000006";
  try {
    await priceOracle.setManualPrice(WETH_ADDRESS, 350000000000); // $3500
    console.log("  PriceOracle: WETH = $3500");
  } catch (e) {
    console.log("  PriceOracle: WETH price set skipped");
  }

  // ============================================
  // Save deployment
  // ============================================
  const deployment = {
    timestamp: new Date().toISOString(),
    network: "baseSepolia",
    chainId: 84532,
    deployer: deployer.address,
    cvt: CVT_ADDRESS,
    protocol: protocolAddress,
    feeCollector: feeCollectorAddress,
    priceOracle: priceOracleAddress,
    collateralManager: collateralManagerAddress,
    vaultImplementation: vaultImplAddress,
    factory: factoryAddress,
    reader: readerAddress,
    usdc: USDC_ADDRESS
  };

  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log("\nSaved to deployments-sepolia.json");

  // ============================================
  // Summary
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("FULL REDEPLOYMENT COMPLETE");
  console.log("=".repeat(60));
  console.log(`
CVT (kept):        ${CVT_ADDRESS}
Protocol:          ${protocolAddress}
FeeCollector:      ${feeCollectorAddress}
PriceOracle:       ${priceOracleAddress}
CollateralManager: ${collateralManagerAddress}
VaultImpl:         ${vaultImplAddress}
Factory:           ${factoryAddress}
Reader:            ${readerAddress}
USDC:              ${USDC_ADDRESS}
`);

  console.log("\n" + "=".repeat(60));
  console.log("UPDATE lib/evm/constants.ts WITH:");
  console.log("=".repeat(60));
  console.log(`
// Contract Addresses (deployed ${new Date().toISOString().split('T')[0]})
export const PROTOCOL_ADDRESS = '${protocolAddress}' as const;
export const USDC_ADDRESS = '${USDC_ADDRESS}' as const;
export const FACTORY_ADDRESS = '${factoryAddress}' as const;
export const FEE_COLLECTOR_ADDRESS = '${feeCollectorAddress}' as const;
export const VAULT_IMPLEMENTATION_ADDRESS = '${vaultImplAddress}' as const;
export const PRICE_ORACLE_ADDRESS = '${priceOracleAddress}' as const;
export const COLLATERAL_MANAGER_ADDRESS = '${collateralManagerAddress}' as const;
export const READER_ADDRESS = '${readerAddress}' as const;

// Global CVT Token (shared across all vaults)
export const CVT_TOKEN_ADDRESS = '${CVT_ADDRESS}' as const;
`);

  console.log("\n" + "=".repeat(60));
  console.log("NEXT STEPS:");
  console.log("=".repeat(60));
  console.log(`
1. Update lib/evm/constants.ts with the addresses above
2. Create a new vault via admin dashboard
3. Deploy staking: npx hardhat run scripts/deploy-staking.js --network baseSepolia
`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
