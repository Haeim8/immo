const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Script to upgrade all CantorVault contracts to fix CVT scaling
 * Usage: npx hardhat run scripts/upgrade-vaults.js --network baseSepolia
 */
async function main() {
  console.log("=".repeat(60));
  console.log("CantorVault Upgrade Script - CVT Scaling Fix");
  console.log("=".repeat(60));

  const [deployer] = await ethers.getSigners();
  console.log(`\nDeployer: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // Load deployment data
  const network = hre.network.name;
  // Map network name to deployment file (baseSepolia -> sepolia)
  const deploymentNetwork = network === 'baseSepolia' ? 'sepolia' : network;
  const deploymentsFile = path.join(__dirname, `../deployments-${deploymentNetwork}.json`);

  if (!fs.existsSync(deploymentsFile)) {
    console.error(`❌ Deployments file not found: ${deploymentsFile}`);
    process.exit(1);
  }

  const deployments = JSON.parse(fs.readFileSync(deploymentsFile, "utf8"));

  // Get vaults from Factory if not in deployments file
  let vaults = deployments.vaults || [];

  if (vaults.length === 0) {
    console.log("📋 Fetching vaults from Factory contract...");

    const factoryABI = [
      "function getVaultCount() view returns (uint256)",
      "function getVaultAddress(uint256) view returns (address)"
    ];

    const factory = new ethers.Contract(deployments.factory, factoryABI, deployer);
    const vaultCount = await factory.getVaultCount();

    console.log(`Found ${vaultCount} vaults in Factory\n`);

    for (let vaultId = 0; vaultId < vaultCount; vaultId++) {
      const vaultAddress = await factory.getVaultAddress(vaultId);
      vaults.push({
        vaultId: vaultId,
        vaultAddress: vaultAddress
      });
    }
  }

  if (vaults.length === 0) {
    console.log("⚠️  No vaults found");
    return;
  }

  console.log(`Found ${vaults.length} vaults to upgrade\n`);

  // Get the new implementation
  console.log("📦 Compiling new CantorVault implementation...");
  const CantorVault = await ethers.getContractFactory("CantorVault");

  for (let i = 0; i < vaults.length; i++) {
    const vault = vaults[i];
    console.log("-".repeat(60));
    console.log(`Upgrading Vault ${i + 1}/${vaults.length}`);
    console.log(`  Vault ID: ${vault.vaultId}`);
    console.log(`  Proxy: ${vault.vaultAddress}`);

    try {
      // Upgrade the vault
      console.log("  🔄 Upgrading...");
      const upgraded = await upgrades.upgradeProxy(vault.vaultAddress, CantorVault);
      await upgraded.waitForDeployment();

      const newImplAddress = await upgrades.erc1967.getImplementationAddress(vault.vaultAddress);
      console.log(`  ✅ Upgraded successfully!`);
      console.log(`  New implementation: ${newImplAddress}`);

      // Update deployment file with new implementation address
      vault.implementationAddress = newImplAddress;
      vault.upgradedAt = new Date().toISOString();

    } catch (error) {
      console.error(`  ❌ Failed to upgrade vault ${vault.vaultId}:`);
      console.error(`  ${error.message}`);
      continue;
    }
  }

  // Save updated deployments with vaults list
  deployments.vaults = vaults;
  fs.writeFileSync(deploymentsFile, JSON.stringify(deployments, null, 2));
  console.log("\n" + "=".repeat(60));
  console.log("✅ All vaults upgraded successfully!");
  console.log(`📝 Updated deployments file: ${deploymentsFile}`);
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
