const { ethers } = require("hardhat");
const fs = require("fs");

/**
 * Deploy new CantorVault implementation and update factory
 * The fix: getMaxBorrow() and getUserSummary() now return 0 for users with staked CVT
 */
async function main() {
  console.log("=".repeat(60));
  console.log("Deploy Fixed CantorVault Implementation");
  console.log("=".repeat(60));

  const [deployer] = await ethers.getSigners();
  console.log("\nDeployer:", deployer.address);

  // Load deployment info
  const deploymentPath = "./deployments-sepolia.json";
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

  const factoryAddress = deployment.factory;
  console.log("Factory:", factoryAddress);

  // Deploy new vault implementation
  console.log("\n--- Deploying new CantorVault Implementation ---");
  const CantorVault = await ethers.getContractFactory("CantorVault");
  const vaultImpl = await CantorVault.deploy();
  await vaultImpl.waitForDeployment();
  const newImplAddress = await vaultImpl.getAddress();
  console.log("New Implementation:", newImplAddress);

  // Update factory
  console.log("\n--- Updating Factory ---");
  const factory = await ethers.getContractAt("CantorAssetFactory", factoryAddress);

  const oldImpl = await factory.vaultImplementation();
  console.log("Old Implementation:", oldImpl);

  const tx = await factory.setVaultImplementation(newImplAddress);
  await tx.wait();
  console.log("Factory updated!");

  const currentImpl = await factory.vaultImplementation();
  console.log("Current Implementation:", currentImpl);

  // Update deployment file
  deployment.vaultImplementation = newImplAddress;
  deployment.vaultImplUpdatedAt = new Date().toISOString();
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log("\nUpdated deployments-sepolia.json");

  console.log("\n" + "=".repeat(60));
  console.log("IMPLEMENTATION UPGRADE COMPLETE");
  console.log("=".repeat(60));
  console.log("\n⚠️  NOTE: Existing vaults are NOT upgraded.");
  console.log("   Only NEW vaults will have the fix.");
  console.log("   For existing vault, you need to:");
  console.log("   1. Users withdraw their positions");
  console.log("   2. Admin creates a new vault");
  console.log("   3. Users supply to the new vault");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
