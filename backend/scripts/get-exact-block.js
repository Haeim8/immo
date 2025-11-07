const hre = require("hardhat");

async function main() {
  const factoryAddress = "0x741b6692f19f64805ddC2e1DB4e724b12f77ff7a";

  console.log("🔍 Recherche du bloc EXACT de déploiement...");
  console.log("Factory:", factoryAddress);

  const currentBlock = await hre.ethers.provider.getBlockNumber();
  console.log("Bloc actuel:", currentBlock);

  // Binary search
  let low = currentBlock - 100; // Start from recent blocks
  let high = currentBlock;
  let deploymentBlock = null;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const code = await hre.ethers.provider.getCode(factoryAddress, mid);

    if (code === "0x" || code === "0x0") {
      low = mid + 1;
    } else {
      deploymentBlock = mid;
      high = mid - 1;
    }
  }

  console.log("\n✅ BLOC EXACT:", deploymentBlock);

  const block = await hre.ethers.provider.getBlock(deploymentBlock);
  console.log("Timestamp:", new Date(block.timestamp * 1000).toISOString());
  console.log("\n🔥 Mettez à jour avec:", deploymentBlock + "n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
