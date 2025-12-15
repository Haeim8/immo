const { ethers } = require("hardhat");

async function main() {
  const userAddr = "0xD9C228C0F84cb4DC2Fb37F5af496Ef16Ea94fd79";
  const vaultAddr = "0x7D2C4552E9332b6DDD74e0Ea7F153dAaA239650A";
  const stakingAddr = "0x63408BAf8a2a023315e17b457F68EaA50CDFA376";

  console.log("=== DEBUG STAKING SETUP ===\n");

  const vault = await ethers.getContractAt("CantorVault", vaultAddr);
  const staking = await ethers.getContractAt("CVTStaking", stakingAddr);

  // Check vault's staking contract address
  const vaultStakingContract = await vault.stakingContract();
  console.log("Vault's stakingContract:", vaultStakingContract);
  console.log("Expected staking addr:  ", stakingAddr);
  console.log("Match:", vaultStakingContract.toLowerCase() === stakingAddr.toLowerCase());

  // Check staking's vault address
  const stakingVault = await staking.vault();
  console.log("\nStaking's vault:", stakingVault);
  console.log("Expected vault: ", vaultAddr);
  console.log("Match:", stakingVault.toLowerCase() === vaultAddr.toLowerCase());

  // Check stakedAmounts in vault for user
  const stakedInVault = await vault.stakedAmounts(userAddr);
  console.log("\n=== USER DATA ===");
  console.log("stakedAmounts[user] in Vault:", ethers.formatUnits(stakedInVault, 6), "(underlying decimals)");

  // Check totalStakedLiquidity in vault
  const totalStakedLiq = await vault.totalStakedLiquidity();
  console.log("totalStakedLiquidity in Vault:", ethers.formatUnits(totalStakedLiq, 6));

  // Check staking contract data
  const stakingPos = await staking.getStakePosition(userAddr);
  console.log("\nStaking position amount:", ethers.formatUnits(stakingPos.amount, 18), "CVT");

  const totalStaked = await staking.totalStaked();
  console.log("Staking totalStaked:", ethers.formatUnits(totalStaked, 18), "CVT");

  // The issue: stakedAmounts should be in CVT decimals (18) but might be stored wrong
  console.log("\n=== ANALYSIS ===");
  if (stakedInVault == 0n && stakingPos.amount > 0n) {
    console.log("❌ BUG FOUND: User has staked in CVTStaking but vault.stakedAmounts is 0!");
    console.log("   This means notifyStake() was never called or failed.");
    console.log("\n   Possible causes:");
    console.log("   1. stakingContract not set in vault");
    console.log("   2. notifyStake() called but reverted");
    console.log("   3. Decimal mismatch in amount");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
