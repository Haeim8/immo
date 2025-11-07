const hre = require("hardhat");

async function main() {
  const factoryAddress = "0xf44C9E702E36234cD1D72760D88861F257Ed1c35";

  console.log("Recherche du bloc de déploiement pour:", factoryAddress);

  // Get current block
  const currentBlock = await hre.ethers.provider.getBlockNumber();
  console.log("Bloc actuel:", currentBlock);

  // Binary search for deployment block
  let low = 15000000; // Start from a known lower bound on Base Sepolia
  let high = currentBlock;
  let deploymentBlock = null;

  console.log("\nRecherche binaire du bloc de déploiement...");

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    console.log(`Vérification du bloc ${mid}...`);

    const code = await hre.ethers.provider.getCode(factoryAddress, mid);

    if (code === "0x" || code === "0x0") {
      // No code at this block, deployment is later
      low = mid + 1;
    } else {
      // Code exists, deployment is at or before this block
      deploymentBlock = mid;
      high = mid - 1;
    }
  }

  if (deploymentBlock) {
    console.log("\n✅ Bloc de déploiement trouvé:", deploymentBlock);
    console.log("\nMettez à jour FACTORY_DEPLOYMENT_BLOCK avec:", deploymentBlock + "n");

    // Get block details
    const block = await hre.ethers.provider.getBlock(deploymentBlock);
    console.log("\nDétails du bloc:");
    console.log("  Timestamp:", new Date(block.timestamp * 1000).toISOString());
    console.log("  Hash:", block.hash);
  } else {
    console.log("\n❌ Bloc de déploiement non trouvé");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
