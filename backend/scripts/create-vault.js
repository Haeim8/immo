const { ethers } = require("hardhat");
const deployments = require("../deployments-sepolia.json");

async function main() {
  const [deployer] = await ethers.getSigners();
  const factory = await ethers.getContractAt("CantorAssetFactory", deployments.factory);

  const tx = await factory.createVault({
    token: deployments.usdc,
    maxLiquidity: ethers.parseUnits("1000000", 6),
    borrowBaseRate: 200,
    borrowSlope: 1500,
    maxBorrowRatio: 7000,
    liquidationThreshold: 8000,
    liquidationBonus: 500,
  });
  const receipt = await tx.wait();

  const event = receipt.logs.find(l => {
    try { return factory.interface.parseLog(l)?.name === "VaultCreated"; } catch { return false; }
  });
  const parsed = factory.interface.parseLog(event);
  console.log("Vault created! ID:", parsed.args.vaultId.toString(), "Address:", parsed.args.vaultAddress);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
