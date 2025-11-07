const hre = require("hardhat");

async function main() {
  console.log("🚀 Déploiement des contrats USCI...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  console.log("💰 Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // 1. Deploy USCINFT (NFT Renderer)
  console.log("1️⃣  Déploiement de USCINFT (NFT Renderer)...");
  const USCINFT = await hre.ethers.getContractFactory("USCINFT");
  const nftRenderer = await USCINFT.deploy();
  await nftRenderer.waitForDeployment();
  const nftRendererAddress = await nftRenderer.getAddress();
  console.log("   ✅ USCINFT déployé à:", nftRendererAddress);

  // 2. Deploy USCI Implementation (for cloning)
  console.log("\n2️⃣  Déploiement de USCI Implementation...");
  const USCI = await hre.ethers.getContractFactory("USCI");
  // Deploy with dummy parameters (will be initialized by clones)
  const usciImplementation = await USCI.deploy();
  await usciImplementation.waitForDeployment();
  const usciImplementationAddress = await usciImplementation.getAddress();
  console.log("   ✅ USCI Implementation déployé à:", usciImplementationAddress);

  // 3. Deploy Factory
  console.log("\n3️⃣  Déploiement de USCIFactory...");
  const treasury = deployer.address; // À changer avec votre trésorerie
  const USCIFactory = await hre.ethers.getContractFactory("USCIFactory");
  const factory = await USCIFactory.deploy(treasury, nftRendererAddress, usciImplementationAddress);
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();
  console.log("   ✅ USCIFactory déployée à:", factoryAddress);
  console.log("   💰 Treasury:", treasury);

  console.log("\n📋 RÉSUMÉ DU DÉPLOIEMENT:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🎨 USCINFT:            ", nftRendererAddress);
  console.log("📄 USCI Implementation:", usciImplementationAddress);
  console.log("🏭 USCIFactory:        ", factoryAddress);
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
