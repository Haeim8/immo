const hre = require("hardhat");

async function main() {
  console.log("🚀 Déploiement des contrats CANTORFI...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  console.log("💰 Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // 1. Deploy CANTORFINFT (NFT Renderer)
  console.log("1️⃣  Déploiement de CANTORFINFT (NFT Renderer)...");
  const CANTORFINFT = await hre.ethers.getContractFactory("CANTORFINFT");
  const nftRenderer = await CANTORFINFT.deploy();
  await nftRenderer.waitForDeployment();
  const nftRendererAddress = await nftRenderer.getAddress();
  console.log("   ✅ CANTORFINFT déployé à:", nftRendererAddress);

  // 2. Deploy CANTORFI Implementation (for cloning)
  console.log("\n2️⃣  Déploiement de CANTORFI Implementation...");
  const CANTORFI = await hre.ethers.getContractFactory("CANTORFI");
  // Deploy with dummy parameters (will be initialized by clones)
  const cantorfiImplementation = await CANTORFI.deploy();
  await cantorfiImplementation.waitForDeployment();
  const cantorfiImplementationAddress = await cantorfiImplementation.getAddress();
  console.log("   ✅ CANTORFI Implementation déployé à:", cantorfiImplementationAddress);

  // 3. Deploy Factory
  console.log("\n3️⃣  Déploiement de CANTORFIFactory...");
  const treasury = deployer.address; // À changer avec votre trésorerie
  const CANTORFIFactory = await hre.ethers.getContractFactory("CANTORFIFactory");
  const factory = await CANTORFIFactory.deploy(treasury, nftRendererAddress, cantorfiImplementationAddress);
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();
  console.log("   ✅ CANTORFIFactory déployée à:", factoryAddress);
  console.log("   💰 Treasury:", treasury);

  console.log("\n📋 RÉSUMÉ DU DÉPLOIEMENT:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🎨 CANTORFINFT:            ", nftRendererAddress);
  console.log("📄 CANTORFI Implementation:", cantorfiImplementationAddress);
  console.log("🏭 CANTORFIFactory:        ", factoryAddress);
  console.log("💰 Treasury:           ", treasury);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  console.log("\n📋 Next steps:");
  console.log("1. Update frontend with factory address:", factoryAddress);
  console.log("2. Add team members if needed");
  console.log("3. Créez votre première place/puzzle tokenisé");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
