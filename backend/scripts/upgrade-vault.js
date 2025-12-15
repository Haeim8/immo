const { ethers, upgrades } = require("hardhat");

/**
 * Upgrade CantorVault implementation
 * This fixes the getMaxBorrow() and getUserSummary() functions to return 0 for users with staked CVT
 */
async function main() {
  const vaultProxyAddress = "0x7D2C4552E9332b6DDD74e0Ea7F153dAaA239650A";

  console.log("=".repeat(60));
  console.log("Upgrade CantorVault");
  console.log("=".repeat(60));

  const [deployer] = await ethers.getSigners();
  console.log("\nDeployer:", deployer.address);
  console.log("Vault Proxy:", vaultProxyAddress);

  // Get current implementation
  const implSlot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
  const currentImpl = await ethers.provider.getStorage(vaultProxyAddress, implSlot);
  console.log("\nCurrent Implementation:", "0x" + currentImpl.slice(-40));

  // Upgrade
  console.log("\n--- Upgrading CantorVault ---");
  const CantorVault = await ethers.getContractFactory("CantorVault");

  const upgraded = await upgrades.upgradeProxy(vaultProxyAddress, CantorVault);
  await upgraded.waitForDeployment();

  // Get new implementation
  const newImpl = await ethers.provider.getStorage(vaultProxyAddress, implSlot);
  console.log("New Implementation:", "0x" + newImpl.slice(-40));

  // Verify fix
  console.log("\n--- Verifying Fix ---");
  const vault = await ethers.getContractAt("CantorVault", vaultProxyAddress);

  const testUser = "0xD9C228C0F84cb4DC2Fb37F5af496Ef16Ea94fd79";
  const maxBorrow = await vault.getMaxBorrow(testUser);
  console.log("getMaxBorrow for staker:", ethers.formatUnits(maxBorrow, 6), "USDC");

  if (maxBorrow == 0n) {
    console.log("✅ FIX VERIFIED: Stakers correctly cannot borrow");
  } else {
    console.log("❌ FIX NOT WORKING: Stakers can still see borrow amount");
  }

  console.log("\n" + "=".repeat(60));
  console.log("UPGRADE COMPLETE");
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
