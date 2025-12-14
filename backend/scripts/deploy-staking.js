const { ethers, upgrades } = require("hardhat");
const fs = require("fs");

/**
 * Deploy CVTStaking for an existing vault
 * Usage: npx hardhat run scripts/deploy-staking.js --network baseSepolia
 */
async function main() {
  console.log("=".repeat(60));
  console.log("Deploy CVTStaking Contract");
  console.log("=".repeat(60));

  const [deployer] = await ethers.getSigners();
  console.log("\nDeployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // Load deployment info
  const deploymentPath = "./deployments-sepolia.json";
  if (!fs.existsSync(deploymentPath)) {
    throw new Error("deployments-sepolia.json not found. Run deploy.js first.");
  }
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  console.log("\nLoaded deployment from:", deploymentPath);

  const cvtAddress = deployment.cvt;
  const readerAddress = deployment.reader;

  console.log("CVT Token:", cvtAddress);
  console.log("Reader:", readerAddress);

  // Get vault from reader
  const reader = await ethers.getContractAt("CantorVaultReader", readerAddress);
  const vaults = await reader.getVaults(0, 10);

  if (vaults.length === 0) {
    throw new Error("No vaults found. Create a vault first.");
  }

  console.log(`\nFound ${vaults.length} vault(s)`);

  // Use first vault
  const vault = vaults[0];
  const vaultAddress = vault.vaultAddress;
  const underlyingToken = vault.underlyingToken;

  console.log("\nVault:", vaultAddress);
  console.log("Underlying Token:", underlyingToken);

  // Check if staking already exists
  const vaultContract = await ethers.getContractAt("CantorVault", vaultAddress);
  const existingStaking = await vaultContract.stakingContract();

  if (existingStaking !== "0x0000000000000000000000000000000000000000") {
    console.log("\nStaking already deployed:", existingStaking);
    return;
  }

  // Deploy CVTStaking
  console.log("\n--- Deploying CVTStaking ---");
  const CVTStaking = await ethers.getContractFactory("CVTStaking");
  const staking = await upgrades.deployProxy(
    CVTStaking,
    [
      cvtAddress,           // Global CVT token
      underlyingToken,      // Underlying token for rewards (USDC)
      vaultAddress,         // Vault for protocol borrowing
      deployer.address,     // Admin
      6000                  // maxProtocolBorrowRatio: 60%
    ],
    { initializer: "initialize", kind: "uups" }
  );
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log("CVTStaking:", stakingAddress);

  // Link staking to vault
  console.log("\n--- Linking Staking to Vault ---");
  await vaultContract.setStakingContract(stakingAddress);
  console.log("Vault linked to Staking");

  // Update deployment file
  deployment.staking = stakingAddress;
  deployment.stakingDeployedAt = new Date().toISOString();
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log("\nUpdated deployments-sepolia.json");

  console.log("\n" + "=".repeat(60));
  console.log("STAKING DEPLOYMENT COMPLETE");
  console.log("=".repeat(60));
  console.log("\nStaking:", stakingAddress);
  console.log("Vault:", vaultAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
