const { ethers, upgrades } = require("hardhat");
const fs = require("fs");

/**
 * Deploy CVTStaking contract
 *
 * NOTE: CVTStaking requires an existing vault because it needs:
 * - vault.cvtToken() for the CVT token address
 * - vault.token() for the underlying token address
 *
 * This means you need to create a vault FIRST, then deploy staking for that vault.
 */
async function main() {
  console.log("=".repeat(60));
  console.log("CVTStaking Deployment");
  console.log("=".repeat(60));

  const [deployer] = await ethers.getSigners();
  console.log("\nDeployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // Load existing deployment
  let deployment;
  try {
    deployment = JSON.parse(fs.readFileSync("./deployments.json", "utf8"));
    console.log("\nLoaded existing deployment from deployments.json");
  } catch (e) {
    console.error("Error: deployments.json not found. Run deploy.js first.");
    process.exit(1);
  }

  // Check if protocol is deployed
  const protocolAddress = deployment.contracts.CantorFiProtocol;
  if (!protocolAddress) {
    console.error("Error: CantorFiProtocol not deployed");
    process.exit(1);
  }
  console.log("Protocol:", protocolAddress);

  // Get protocol to find vaults
  const protocol = await ethers.getContractAt("CantorFiProtocol", protocolAddress);
  const vaultCount = await protocol.vaultCount();
  console.log("Vault count:", vaultCount.toString());

  if (vaultCount === 0n) {
    console.error("\nError: No vaults exist yet. Create a vault first, then deploy staking.");
    console.log("\nTo create a vault, use the admin interface or call factory.createVault()");
    process.exit(1);
  }

  // Get first vault address
  const vaultAddress = await protocol.getVaultAddress(0);
  console.log("\nUsing Vault #0:", vaultAddress);

  // Get vault info
  const vault = await ethers.getContractAt("CantorVault", vaultAddress);

  let cvtTokenAddress, underlyingTokenAddress;
  try {
    cvtTokenAddress = await vault.cvtToken();
    underlyingTokenAddress = await vault.token();
    console.log("CVT Token:", cvtTokenAddress);
    console.log("Underlying Token:", underlyingTokenAddress);
  } catch (e) {
    console.error("Error: Could not get vault tokens. The vault may not be properly initialized.");
    console.error(e.message);
    process.exit(1);
  }

  if (cvtTokenAddress === ethers.ZeroAddress) {
    console.error("\nError: Vault has no CVT token. The vault needs to be initialized first.");
    process.exit(1);
  }

  // Deploy CVTStaking
  console.log("\n--- Deploying CVTStaking ---");

  const CVTStaking = await ethers.getContractFactory("CVTStaking");
  const staking = await upgrades.deployProxy(
    CVTStaking,
    [
      vaultAddress,          // vault
      deployer.address,      // admin
      6000                   // maxProtocolBorrowRatio: 60%
    ],
    { initializer: "initialize", kind: "uups" }
  );
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log("CVTStaking deployed:", stakingAddress);

  // Configure vault to use staking
  console.log("\n--- Configuring Vault ---");

  try {
    await vault.setStakingContract(stakingAddress);
    console.log("Vault: Staking contract set");
  } catch (e) {
    console.log("Warning: Could not set staking contract on vault:", e.message);
  }

  // Configure FeeCollector to send rewards to staking
  const feeCollectorAddress = deployment.contracts.FeeCollector;
  if (feeCollectorAddress) {
    try {
      const feeCollector = await ethers.getContractAt("FeeCollector", feeCollectorAddress);
      await feeCollector.setStakingContract(stakingAddress);
      console.log("FeeCollector: Staking contract set");
    } catch (e) {
      console.log("Warning: Could not set staking on FeeCollector:", e.message);
    }
  }

  // Update deployment file
  deployment.contracts.CVTStaking = stakingAddress;
  deployment.contracts.CVTStaking_Vault = vaultAddress;
  fs.writeFileSync("./deployments.json", JSON.stringify(deployment, null, 2));
  console.log("\nDeployment info updated in deployments.json");

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("CVTStaking DEPLOYMENT COMPLETE");
  console.log("=".repeat(60));
  console.log("\nCVTStaking:", stakingAddress);
  console.log("For Vault:", vaultAddress);
  console.log("\nAdd this to your admin .env.local:");
  console.log(`NEXT_PUBLIC_STAKING_ADDRESS=${stakingAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
