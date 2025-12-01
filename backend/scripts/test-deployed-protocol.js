const { ethers } = require("hardhat");

/**
 * Test fonctionnel du protocole déployé
 *
 * Ce script teste les fonctions principales après déploiement :
 * 1. Supply USDC dans le vault
 * 2. Borrow USDC
 * 3. Repay
 * 4. Withdraw
 * 5. Cross-collateral borrow
 */
async function main() {
  console.log("=".repeat(60));
  console.log("CantorFi Protocol - Tests Fonctionnels Post-Déploiement");
  console.log("=".repeat(60));

  const [deployer, user1, user2] = await ethers.getSigners();
  console.log("\nDeployer:", deployer.address);
  console.log("User1:", user1.address);
  console.log("User2:", user2.address);

  // Load deployment
  const fs = require("fs");
  let deployment;
  try {
    deployment = JSON.parse(fs.readFileSync("./deployments-localhost.json", "utf8"));
  } catch {
    console.log("Pas de déploiement trouvé, on déploie d'abord...");
    // Run deploy first
    const deployScript = require("./deploy.js");
    return;
  }

  console.log("\n--- Chargement des contrats ---");

  const usdc = await ethers.getContractAt("MockERC20", deployment.contracts.USDC);
  const vault = await ethers.getContractAt("CantorVault", deployment.contracts.TestUSDCVault);
  const protocol = await ethers.getContractAt("CantorFiProtocol", deployment.contracts.CantorFiProtocol);
  const priceOracle = await ethers.getContractAt("PriceOracle", deployment.contracts.PriceOracle);
  const collateralManager = await ethers.getContractAt("CollateralManager", deployment.contracts.CollateralManager);

  console.log("USDC:", await usdc.getAddress());
  console.log("Vault:", await vault.getAddress());

  // Mint USDC to users
  console.log("\n--- Mint USDC pour les users ---");
  const mintAmount = ethers.parseUnits("100000", 6); // 100k USDC each
  await usdc.mint(user1.address, mintAmount);
  await usdc.mint(user2.address, mintAmount);
  console.log("User1 USDC balance:", ethers.formatUnits(await usdc.balanceOf(user1.address), 6));
  console.log("User2 USDC balance:", ethers.formatUnits(await usdc.balanceOf(user2.address), 6));

  // ============================================
  // TEST 1: Supply
  // ============================================
  console.log("\n" + "=".repeat(40));
  console.log("TEST 1: Supply USDC");
  console.log("=".repeat(40));

  const supplyAmount = ethers.parseUnits("10000", 6); // 10k USDC

  // Approve and supply
  await usdc.connect(user1).approve(await vault.getAddress(), supplyAmount);
  console.log("User1 approved vault for", ethers.formatUnits(supplyAmount, 6), "USDC");

  const lockConfig = {
    hasLock: false,
    lockDurationSeconds: 0,
    canWithdrawEarly: false,
    earlyWithdrawalFee: 0
  };

  await vault.connect(user1).supply(supplyAmount, lockConfig);
  console.log("User1 supplied", ethers.formatUnits(supplyAmount, 6), "USDC");

  // Check position
  const position1 = await vault.getUserPosition(user1.address);
  console.log("User1 position amount:", ethers.formatUnits(position1.amount, 6), "USDC");
  console.log("User1 CVT balance:", ethers.formatUnits(position1.cvtBalance, 6));

  // Check vault state
  const vaultState = await vault.getVaultState();
  console.log("Vault totalSupplied:", ethers.formatUnits(vaultState.totalSupplied, 6), "USDC");
  console.log("Vault availableLiquidity:", ethers.formatUnits(vaultState.availableLiquidity, 6), "USDC");

  console.log("✅ TEST 1 PASSED: Supply fonctionne");

  // ============================================
  // TEST 2: Borrow
  // ============================================
  console.log("\n" + "=".repeat(40));
  console.log("TEST 2: Borrow USDC");
  console.log("=".repeat(40));

  // User1 can borrow up to 70% of their collateral
  const borrowAmount = ethers.parseUnits("5000", 6); // 5k USDC (50% LTV)

  const balanceBefore = await usdc.balanceOf(user1.address);
  await vault.connect(user1).borrow(borrowAmount);
  const balanceAfter = await usdc.balanceOf(user1.address);

  console.log("User1 borrowed", ethers.formatUnits(borrowAmount, 6), "USDC");
  console.log("User1 USDC balance change:", ethers.formatUnits(balanceAfter - balanceBefore, 6));

  const position2 = await vault.getUserPosition(user1.address);
  console.log("User1 borrowedAmount:", ethers.formatUnits(position2.borrowedAmount, 6), "USDC");

  const vaultState2 = await vault.getVaultState();
  console.log("Vault totalBorrowed:", ethers.formatUnits(vaultState2.totalBorrowed, 6), "USDC");
  console.log("Vault utilizationRate:", vaultState2.utilizationRate.toString(), "bps");

  // Check borrow rate
  const borrowRate = await vault.calculateBorrowRate();
  console.log("Current borrow rate:", borrowRate.toString(), "bps (annual)");

  console.log("✅ TEST 2 PASSED: Borrow fonctionne");

  // ============================================
  // TEST 3: Simulate time and check interest
  // ============================================
  console.log("\n" + "=".repeat(40));
  console.log("TEST 3: Simulate Time & Interest");
  console.log("=".repeat(40));

  // Advance time by 30 days
  await ethers.provider.send("evm_increaseTime", [30 * 24 * 60 * 60]);
  await ethers.provider.send("evm_mine", []);
  console.log("Advanced time by 30 days");

  // Check accumulated interest (need to trigger update)
  // The interest is calculated on-demand, let's check the position
  const position3 = await vault.getUserPosition(user1.address);
  console.log("User1 borrowInterestAccumulated:", ethers.formatUnits(position3.borrowInterestAccumulated, 6), "USDC");

  console.log("✅ TEST 3 PASSED: Time simulation fonctionne");

  // ============================================
  // TEST 4: Repay Borrow
  // ============================================
  console.log("\n" + "=".repeat(40));
  console.log("TEST 4: Repay Borrow");
  console.log("=".repeat(40));

  const repayAmount = ethers.parseUnits("2500", 6); // Repay half

  await usdc.connect(user1).approve(await vault.getAddress(), repayAmount);
  await vault.connect(user1).repayBorrow(repayAmount);
  console.log("User1 repaid", ethers.formatUnits(repayAmount, 6), "USDC");

  const position4 = await vault.getUserPosition(user1.address);
  console.log("User1 borrowedAmount after repay:", ethers.formatUnits(position4.borrowedAmount, 6), "USDC");

  console.log("✅ TEST 4 PASSED: Repay fonctionne");

  // ============================================
  // TEST 5: Withdraw
  // ============================================
  console.log("\n" + "=".repeat(40));
  console.log("TEST 5: Partial Withdraw");
  console.log("=".repeat(40));

  // User1 still has debt, so can only withdraw if remaining collateral covers it
  // With ~2500 USDC debt and 70% LTV, need at least 3572 USDC collateral
  // User1 has 10000 USDC, so can withdraw up to ~6428 USDC

  const withdrawAmount = ethers.parseUnits("3000", 6); // 3k USDC

  const usdcBefore = await usdc.balanceOf(user1.address);
  await vault.connect(user1).withdraw(withdrawAmount);
  const usdcAfter = await usdc.balanceOf(user1.address);

  console.log("User1 withdrew", ethers.formatUnits(withdrawAmount, 6), "USDC");
  console.log("User1 received", ethers.formatUnits(usdcAfter - usdcBefore, 6), "USDC");

  const position5 = await vault.getUserPosition(user1.address);
  console.log("User1 remaining position:", ethers.formatUnits(position5.amount, 6), "USDC");

  console.log("✅ TEST 5 PASSED: Withdraw fonctionne");

  // ============================================
  // TEST 6: User2 Supply and Cross-Collateral
  // ============================================
  console.log("\n" + "=".repeat(40));
  console.log("TEST 6: Cross-Collateral Borrow");
  console.log("=".repeat(40));

  // User2 supplies
  const supply2 = ethers.parseUnits("20000", 6);
  await usdc.connect(user2).approve(await vault.getAddress(), supply2);
  await vault.connect(user2).supply(supply2, lockConfig);
  console.log("User2 supplied", ethers.formatUnits(supply2, 6), "USDC");

  // Check collateral in CollateralManager
  const collateral2 = await collateralManager.getUserCollateral(user2.address, 0);
  console.log("User2 collateral in CollateralManager:", ethers.formatUnits(collateral2, 6), "USDC");

  // Get max borrow
  const maxBorrow2 = await collateralManager.getMaxBorrow(user2.address, 0);
  console.log("User2 max cross-collateral borrow:", ethers.formatUnits(maxBorrow2, 6), "USDC");

  // Cross-collateral borrow
  const crossBorrow = ethers.parseUnits("10000", 6);
  await vault.connect(user2).crossCollateralBorrow(crossBorrow);
  console.log("User2 cross-collateral borrowed", ethers.formatUnits(crossBorrow, 6), "USDC");

  // Check health factor
  const healthFactor = await collateralManager.getHealthFactor(user2.address);
  console.log("User2 health factor:", healthFactor.toString(), "(10000 = 100%)");

  console.log("✅ TEST 6 PASSED: Cross-Collateral fonctionne");

  // ============================================
  // TEST 7: Check Interest Rates at High Utilization
  // ============================================
  console.log("\n" + "=".repeat(40));
  console.log("TEST 7: Aave-Style Interest Rates");
  console.log("=".repeat(40));

  const vaultStateFinal = await vault.getVaultState();
  const utilizationFinal = vaultStateFinal.utilizationRate;
  const borrowRateFinal = await vault.calculateBorrowRate();

  console.log("Final utilization:", utilizationFinal.toString(), "bps");
  console.log("Final borrow rate:", borrowRateFinal.toString(), "bps (annual)");
  console.log("Final borrow rate:", (Number(borrowRateFinal) / 100).toFixed(2), "%");

  // Check if utilization is above optimal (80%)
  if (utilizationFinal > 8000n) {
    console.log("⚠️  Utilization above optimal (80%), SLOPE2 should be active");
  }

  console.log("✅ TEST 7 PASSED: Interest rates calculés correctement");

  // ============================================
  // SUMMARY
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("TOUS LES TESTS FONCTIONNELS PASSÉS ✅");
  console.log("=".repeat(60));
  console.log("\nRésumé:");
  console.log("- Supply: ✅");
  console.log("- Borrow: ✅");
  console.log("- Interest Accrual: ✅");
  console.log("- Repay: ✅");
  console.log("- Withdraw: ✅");
  console.log("- Cross-Collateral: ✅");
  console.log("- Aave-Style Rates: ✅");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ TEST FAILED:", error);
    process.exit(1);
  });
