/**
 * Script de test pour créer une place/campagne
 * Simule EXACTEMENT ce que fait le formulaire frontend
 */

const hre = require("hardhat");

async function main() {
  console.log("\n🧪 ===== TEST CRÉATION DE PLACE =====\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("👤 Wallet:", deployer.address);
  console.log("💰 Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Adresse du contrat Factory déployé
  const FACTORY_ADDRESS = "0x0BF94931d6c63EA092d91Ce7d67D46325B912349";

  const factory = await hre.ethers.getContractAt("USCIFactory", FACTORY_ADDRESS);

  console.log("📍 Factory connectée:", FACTORY_ADDRESS);
  console.log("👑 Admin:", await factory.admin());
  console.log("💰 Treasury:", await factory.treasury());

  // Vérifier que le wallet connecté est admin ou team member
  const isAdmin = await factory.isAdmin(deployer.address);
  const isTeamMember = await factory.isTeamMember(deployer.address);

  console.log("🔐 Est Admin:", isAdmin);
  console.log("🔐 Est Team Member:", isTeamMember);

  if (!isAdmin && !isTeamMember) {
    console.error("\n❌ ERREUR: Ce wallet n'est ni admin ni team member!");
    console.error("   Vous devez être ajouté en tant que team member pour créer une place.");
    process.exit(1);
  }

  console.log("\n✅ Permissions OK, création de la place...\n");

  // ===== DONNÉES DE TEST =====
  // Ces valeurs simulent EXACTEMENT ce que l'utilisateur remplit dans le formulaire

  const formData = {
    assetType: "house",              // Type d'actif
    placeType: "residential",         // Type d'exploitation
    name: "Villa Test Hardhat",       // Nom
    city: "Paris",                    // Ville
    province: "Île-de-France",        // Province
    country: "FR",                    // Pays (code ISO)
    totalRaiseUsd: 500000,           // Montant à lever en USD
    totalShares: 1000,               // Nombre de parts
    durationDays: 30,                // Durée de vente en jours
    expectedReturnPct: 5.5,          // Rendement attendu en %
    surface: 120,                    // Surface en m²
    rooms: 4,                        // Nombre de pièces
    yearBuilt: 2020,                 // Année de construction
    description: "Belle villa avec piscine et jardin",
    longDescription: "Cette magnifique villa offre un cadre de vie exceptionnel avec ses 120m² habitables.",
    features: "Piscine,Garage,Jardin,Terrasse",
    votingEnabled: true,             // Gouvernance activée
    imageCid: "QmTestImageCID123456789",
    metadataCid: "QmTestMetadataCID987654321"
  };

  // ===== CALCULS (comme dans le frontend) =====

  const sharePriceUsd = formData.totalRaiseUsd / formData.totalShares;
  console.log("💵 Prix par part (USD):", sharePriceUsd);

  // Conversion USD -> ETH (on simule un prix ETH à 3000 USD)
  const ETH_PRICE_USD = 3000;
  const sharePriceEth = sharePriceUsd / ETH_PRICE_USD;
  const puzzlePriceWei = hre.ethers.parseEther(sharePriceEth.toString());

  console.log("💎 Prix par part (ETH):", sharePriceEth.toFixed(6));
  console.log("💎 Prix par part (Wei):", puzzlePriceWei.toString());

  const saleDurationSeconds = formData.durationDays * 86400;
  const expectedReturnBps = Math.round(formData.expectedReturnPct * 100);

  console.log("⏱️  Durée de vente (secondes):", saleDurationSeconds);
  console.log("📊 Rendement attendu (bps):", expectedReturnBps);

  // ===== PARAMÈTRES POUR LA TRANSACTION =====

  console.log("\n📋 Paramètres de la transaction:");
  console.log("  assetType:", formData.assetType);
  console.log("  name:", formData.name);
  console.log("  city:", formData.city);
  console.log("  province:", formData.province);
  console.log("  country:", formData.country);
  console.log("  totalPuzzles:", formData.totalShares);
  console.log("  puzzlePrice:", puzzlePriceWei.toString());
  console.log("  saleDurationSeconds:", saleDurationSeconds);
  console.log("  surface:", formData.surface);
  console.log("  rooms:", formData.rooms);
  console.log("  expectedReturnBps:", expectedReturnBps);
  console.log("  placeType:", formData.placeType);
  console.log("  yearBuilt:", formData.yearBuilt);
  console.log("  imageCid:", formData.imageCid);
  console.log("  metadataCid:", formData.metadataCid);
  console.log("  votingEnabled:", formData.votingEnabled);

  console.log("\n🚀 Envoi de la transaction...\n");

  try {
    const tx = await factory.createPlace(
      formData.assetType,
      formData.name,
      formData.city,
      formData.province,
      formData.country,
      BigInt(formData.totalShares),
      puzzlePriceWei,
      BigInt(saleDurationSeconds),
      formData.surface,
      formData.rooms,
      expectedReturnBps,
      formData.placeType,
      formData.yearBuilt,
      formData.imageCid,
      formData.metadataCid,
      formData.votingEnabled
    );

    console.log("⏳ Transaction envoyée:", tx.hash);
    console.log("   Attente de confirmation...");

    const receipt = await tx.wait();

    console.log("\n✅ ===== SUCCÈS =====");
    console.log("📍 Transaction confirmée!");
    console.log("   Hash:", receipt.hash);
    console.log("   Block:", receipt.blockNumber);
    console.log("   Gas utilisé:", receipt.gasUsed.toString());

    // Récupérer l'adresse de la place créée
    const placeCount = await factory.placeCount();
    const placeAddress = await factory.getPlaceAddress(placeCount - 1n);

    console.log("\n🏠 Place créée:");
    console.log("   Adresse:", placeAddress);
    console.log("   Index:", (placeCount - 1n).toString());
    console.log("   Explorer:", `https://sepolia.basescan.org/address/${placeAddress}`);

    // Vérifier les infos de la place
    const place = await hre.ethers.getContractAt("USCI", placeAddress);
    const placeInfo = await place.getPlaceInfo();

    console.log("\n📊 Informations de la place:");
    console.log("   Nom:", placeInfo.name);
    console.log("   Ville:", placeInfo.city);
    console.log("   Prix puzzle:", hre.ethers.formatEther(placeInfo.puzzlePrice), "ETH");
    console.log("   Total puzzles:", placeInfo.totalPuzzles.toString());
    console.log("   Surface:", placeInfo.surface.toString(), "m²");
    console.log("   Pièces:", placeInfo.rooms.toString());

    console.log("\n✅ ===== TEST TERMINÉ AVEC SUCCÈS =====\n");

  } catch (error) {
    console.error("\n❌ ===== ERREUR LORS DE LA CRÉATION =====");
    console.error("Message:", error.message);

    if (error.data) {
      console.error("Data:", error.data);
    }

    if (error.reason) {
      console.error("Reason:", error.reason);
    }

    // Décoder l'erreur custom du contrat si possible
    if (error.data && error.data.startsWith('0x')) {
      console.error("\n🔍 Tentative de décodage de l'erreur custom...");
      try {
        const iface = factory.interface;
        const decodedError = iface.parseError(error.data);
        console.error("Erreur décodée:", decodedError);
      } catch (decodeError) {
        console.error("Impossible de décoder l'erreur custom");
      }
    }

    console.error("\n💡 Vérifications à faire:");
    console.error("  1. Le wallet est-il admin ou team member?");
    console.error("  2. Les valeurs sont-elles valides (surface > 0, rooms <= 255, etc.)?");
    console.error("  3. Le prix du puzzle est-il > 0?");
    console.error("  4. La durée de vente est-elle > 0?");

    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
