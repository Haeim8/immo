const { ethers, upgrades } = require("hardhat");
const fs = require("fs");

/**
 * Deploy CantorFi protocol to Base Sepolia
 */
async function main() {
  console.log("=".repeat(60));
  console.log("CantorFi Protocol Deployment - Base Sepolia");
  console.log("=".repeat(60));

  const [deployer] = await ethers.getSigners();
  console.log("\nDeployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  const chainId = (await ethers.provider.getNetwork()).chainId;
  if (chainId !== 84532n) {
    throw new Error("This script is for Base Sepolia only (chainId 84532)");
  }
  console.log("\nChain ID:", chainId.toString());

  // USDC on Base Sepolia
  const usdcAddress = "0x45f591C36B3506a881eD54638a9456607c2Eed84";
  console.log("USDC:", usdcAddress);

  // ============================================
  // 1. Deploy CVT Token
  // ============================================
  console.log("\n--- Deploying CVT Token ---");
  const CVT = await ethers.getContractFactory("CVT");
  const cvt = await CVT.deploy(deployer.address);
  await cvt.waitForDeployment();
  const cvtAddress = await cvt.getAddress();
  console.log("CVT:", cvtAddress);

  // ============================================
  // 2. Deploy CantorFiProtocol
  // ============================================
  console.log("\n--- Deploying CantorFiProtocol ---");
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
  // 3. Deploy FeeCollector
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
  // 4. Deploy PriceOracle
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
  // 5. Deploy CollateralManager
  // ============================================
  console.log("\n--- Deploying CollateralManager ---");
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
  // 6. Deploy CantorVault Implementation
  // ============================================
  console.log("\n--- Deploying CantorVault Implementation ---");
  const CantorVault = await ethers.getContractFactory("CantorVault");
  const vaultImpl = await CantorVault.deploy();
  await vaultImpl.waitForDeployment();
  const vaultImplAddress = await vaultImpl.getAddress();
  console.log("VaultImpl:", vaultImplAddress);

  // ============================================
  // 7. Deploy CantorAssetFactory
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
  console.log("Factory:", factoryAddress);

  // Grant ADMIN_ROLE on CVT to factory
  await cvt.grantRole(await cvt.ADMIN_ROLE(), factoryAddress);
  console.log("  Factory has ADMIN_ROLE on CVT");

  // ============================================
  // 8. Deploy CantorVaultReader
  // ============================================
  console.log("\n--- Deploying CantorVaultReader ---");
  const CantorVaultReader = await ethers.getContractFactory("CantorVaultReader");
  const reader = await CantorVaultReader.deploy(protocolAddress);
  await reader.waitForDeployment();
  const readerAddress = await reader.getAddress();
  console.log("Reader:", readerAddress);

  // ============================================
  // 9. Configure contracts
  // ============================================
  console.log("\n--- Configuring Contracts ---");
  await protocol.setFeeCollector(feeCollectorAddress);
  console.log("  Protocol: FeeCollector set");

  await protocol.addFactory(factoryAddress);
  console.log("  Protocol: Factory authorized");

  await feeCollector.addNotifier(factoryAddress);
  console.log("  FeeCollector: Factory authorized");

  await priceOracle.setManualPrice(usdcAddress, 100000000); // $1.00
  console.log("  PriceOracle: USDC = $1.00");

  // ============================================
  // Save deployment
  // ============================================
  const deployment = {
    timestamp: new Date().toISOString(),
    network: "baseSepolia",
    chainId: 84532,
    deployer: deployer.address,
    cvt: cvtAddress,
    protocol: protocolAddress,
    feeCollector: feeCollectorAddress,
    priceOracle: priceOracleAddress,
    collateralManager: collateralManagerAddress,
    vaultImplementation: vaultImplAddress,
    factory: factoryAddress,
    reader: readerAddress,
    usdc: usdcAddress
  };

  fs.writeFileSync("./deployments-sepolia.json", JSON.stringify(deployment, null, 2));
  console.log("\nSaved to deployments-sepolia.json");

  // ============================================
  // Summary
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT COMPLETE");
  console.log("=".repeat(60));
  console.log(`
CVT:               ${cvtAddress}
Protocol:          ${protocolAddress}
FeeCollector:      ${feeCollectorAddress}
PriceOracle:       ${priceOracleAddress}
CollateralManager: ${collateralManagerAddress}
VaultImpl:         ${vaultImplAddress}
Factory:           ${factoryAddress}
Reader:            ${readerAddress}
`);

  console.log("\n=== UPDATE constants.ts ===");
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
`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
