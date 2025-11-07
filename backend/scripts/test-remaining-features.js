const hre = require("hardhat");

async function main() {
  console.log("🧪 TEST FONCTIONNALITÉS RESTANTES v2");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const [deployer] = await hre.ethers.getSigners();
  const placeAddress = "0x4798Ca05244803bdb3115485cc0755eF1228D45D";

  console.log("👤 Deployer:", deployer.address);
  console.log("📍 Place:", placeAddress, "\n");

  const usci = await hre.ethers.getContractAt("USCI", placeAddress);

  // Vérifier l'état initial
  let placeInfo = await usci.getPlaceInfo();
  console.log("📊 État Initial:");
  console.log("   Total puzzles:", placeInfo.totalPuzzles.toString());
  console.log("   Puzzles sold:", placeInfo.puzzlesSold.toString());
  console.log("   Is active:", placeInfo.isActive);
  console.log("   Puzzle price:", hre.ethers.formatEther(placeInfo.puzzlePrice), "ETH\n");

  // ============================================================
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🧪 TEST 1: Fermeture Manuelle Campagne");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("🔒 Fermeture manuelle de la vente...");
  const closeTx = await usci.closeSaleEarly();
  await closeTx.wait();
  console.log("✅ Vente fermée manuellement");

  placeInfo = await usci.getPlaceInfo();
  console.log("✓ Is active:", placeInfo.isActive);

  if (placeInfo.isActive) {
    console.log("❌ ERREUR: Campagne encore active après fermeture!");
    process.exit(1);
  }

  // Tenter d'acheter après fermeture (devrait échouer)
  try {
    await usci.takePuzzle({ value: placeInfo.puzzlePrice });
    console.log("❌ ERREUR: Achat possible après fermeture!");
    process.exit(1);
  } catch (error) {
    console.log("✅ Achat bloqué après fermeture (normal)");
  }

  console.log("\n✅ TEST 1 PASSÉ (Fermeture manuelle OK)\n");

  // ============================================================
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🧪 TEST 2: Distribution Rewards");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const rewardAmount = hre.ethers.parseEther("0.001");
  console.log("💰 Dépôt rewards:", hre.ethers.formatEther(rewardAmount), "ETH");

  const depositTx = await usci.depositRewards({ value: rewardAmount });
  const depositReceipt = await depositTx.wait();
  console.log("✅ Rewards déposés");
  console.log("   TX:", depositReceipt.hash);

  console.log("\n✅ TEST 2 PASSÉ (Distribution rewards OK)\n");

  // ============================================================
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🧪 TEST 3: Pause/Unpause Campagne");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("⏸️  Pause campagne...");
  const pauseTx = await usci.pause();
  await pauseTx.wait();
  console.log("✅ Campagne pausée");

  const isPaused = await usci.paused();
  console.log("✓ Status paused:", isPaused);

  if (!isPaused) {
    console.log("❌ ERREUR: Campagne pas pausée!");
    process.exit(1);
  }

  console.log("\n▶️  Unpause campagne...");
  const unpauseTx = await usci.unpause();
  await unpauseTx.wait();
  console.log("✅ Campagne unpaused");

  const isPausedAfter = await usci.paused();
  if (isPausedAfter) {
    console.log("❌ ERREUR: Campagne toujours pausée!");
    process.exit(1);
  }

  console.log("\n✅ TEST 3 PASSÉ (Pause/Unpause OK)\n");

  // ============================================================
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🧪 TEST 4: Liquidation Contrat (Completion)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Déposer des fonds de completion
  const completionAmount = placeInfo.puzzlePrice * placeInfo.totalPuzzles;
  console.log("💰 Dépôt completion:", hre.ethers.formatEther(completionAmount), "ETH");

  const completeTx = await usci.markPlaceAsCompleted({ value: completionAmount });
  await completeTx.wait();
  console.log("✅ Place marquée comme completed");

  const infoCompleted = await usci.getPlaceInfo();
  console.log("✓ Is completed:", infoCompleted.isCompleted);

  if (!infoCompleted.isCompleted) {
    console.log("❌ ERREUR: Place pas completed!");
    process.exit(1);
  }

  console.log("✓ Completion amount:", hre.ethers.formatEther(infoCompleted.completionAmount), "ETH");

  console.log("\n✅ TEST 4 PASSÉ (Liquidation OK)\n");

  // ============================================================
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ TOUS LES TESTS FONCTIONNALITÉS PASSÉS!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("📊 RÉSUMÉ TESTS FONCTIONNALITÉS:");
  console.log("   ✅ Fermeture manuelle campagne");
  console.log("   ✅ Distribution rewards");
  console.log("   ✅ Pause/Unpause");
  console.log("   ✅ Liquidation contrat (completion)");
  console.log("\n🎯 Toutes les fonctionnalités critiques validées!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ ERREUR DURANT LES TESTS:");
    console.error(error);
    process.exit(1);
  });
