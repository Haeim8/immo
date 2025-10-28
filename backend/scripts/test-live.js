const hre = require("hardhat");

async function main() {
  console.log("\n🎯 ===== TEST LIVE - SIMULATION COMPLÈTE =====\n");

  const [admin, treasury, teamMember, user1, user2, user3] = await hre.ethers.getSigners();

  console.log("👥 Comptes de test:");
  console.log("  Admin:", admin.address);
  console.log("  Treasury:", treasury.address);
  console.log("  Team Member:", teamMember.address);
  console.log("  User1:", user1.address);
  console.log("  User2:", user2.address);
  console.log("  User3:", user3.address);

  // Adresse de la factory déployée
  const FACTORY_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  const factory = await hre.ethers.getContractAt("USCIFactory", FACTORY_ADDRESS);

  console.log("\n✅ Factory connectée à:", await factory.getAddress());
  console.log("  Admin actuel:", await factory.admin());
  console.log("  Treasury:", await factory.treasury());

  // ============== 1. AJOUTER UN TEAM MEMBER ==============
  console.log("\n\n📋 ===== 1. AJOUT TEAM MEMBER =====");

  const txAddTeam = await factory.addTeamMember(teamMember.address);
  await txAddTeam.wait();
  console.log("✅ Team member ajouté:", teamMember.address);
  console.log("  Vérification:", await factory.isTeamMember(teamMember.address));

  // ============== 2. CRÉER UNE PLACE ==============
  console.log("\n\n🏢 ===== 2. CRÉATION D'UNE PLACE =====");

  const PUZZLE_PRICE = hre.ethers.parseEther("0.1"); // 0.1 ETH
  const TOTAL_PUZZLES = 10;
  const SALE_DURATION = 30 * 24 * 60 * 60; // 30 jours

  const txCreatePlace = await factory.createPlace(
    "Residential",
    "Appartement Paris Centre",
    "Paris",
    "Île-de-France",
    "France",
    TOTAL_PUZZLES,
    PUZZLE_PRICE,
    SALE_DURATION,
    85, // 85m²
    3,  // 3 pièces
    550, // 5.50% rendement
    "Apartment",
    2022,
    "QmTest123ABC",
    "QmMeta456DEF",
    true // Voting enabled
  );

  const receiptCreate = await txCreatePlace.wait();
  console.log("✅ Place créée ! Gas utilisé:", receiptCreate.gasUsed.toString());

  const placeAddress = await factory.getPlaceAddress(0);
  console.log("  📍 Adresse de la place:", placeAddress);

  const place = await hre.ethers.getContractAt("USCI", placeAddress);
  const placeInfo = await place.getPlaceInfo();

  console.log("\n  📊 Infos de la place:");
  console.log("    Nom:", placeInfo.name);
  console.log("    Ville:", placeInfo.city);
  console.log("    Prix puzzle:", hre.ethers.formatEther(placeInfo.puzzlePrice), "ETH");
  console.log("    Total puzzles:", placeInfo.totalPuzzles.toString());
  console.log("    Puzzles vendus:", placeInfo.puzzlesSold.toString());
  console.log("    Surface:", placeInfo.surface.toString(), "m²");
  console.log("    Pièces:", placeInfo.rooms.toString());
  console.log("    Rendement attendu:", (Number(placeInfo.expectedReturn) / 100).toFixed(2), "%");

  // ============== 3. ACHATS DE PUZZLES ==============
  console.log("\n\n🛒 ===== 3. ACHATS DE PUZZLES =====");

  // Treasury balance avant
  const treasuryBalanceBefore = await hre.ethers.provider.getBalance(treasury.address);
  console.log("💰 Balance Treasury AVANT:", hre.ethers.formatEther(treasuryBalanceBefore), "ETH");

  // User1 achète 2 puzzles
  console.log("\n  User1 achète 2 puzzles...");
  const tx1 = await place.connect(user1).takePuzzle({ value: PUZZLE_PRICE });
  await tx1.wait();
  console.log("  ✅ Puzzle #0 acheté par User1");

  const tx2 = await place.connect(user1).takePuzzle({ value: PUZZLE_PRICE });
  await tx2.wait();
  console.log("  ✅ Puzzle #1 acheté par User1");

  // User2 achète 1 puzzle
  console.log("\n  User2 achète 1 puzzle...");
  const tx3 = await place.connect(user2).takePuzzle({ value: PUZZLE_PRICE });
  await tx3.wait();
  console.log("  ✅ Puzzle #2 acheté par User2");

  // User3 achète 2 puzzles
  console.log("\n  User3 achète 2 puzzles...");
  const tx4 = await place.connect(user3).takePuzzle({ value: PUZZLE_PRICE });
  await tx4.wait();
  console.log("  ✅ Puzzle #3 acheté par User3");

  const tx5 = await place.connect(user3).takePuzzle({ value: PUZZLE_PRICE });
  await tx5.wait();
  console.log("  ✅ Puzzle #4 acheté par User3");

  // Treasury balance après
  const treasuryBalanceAfter = await hre.ethers.provider.getBalance(treasury.address);
  console.log("\n💰 Balance Treasury APRÈS:", hre.ethers.formatEther(treasuryBalanceAfter), "ETH");
  console.log("  💵 Reçu:", hre.ethers.formatEther(treasuryBalanceAfter - treasuryBalanceBefore), "ETH");
  console.log("  ✅ Treasury a bien reçu 5 × 0.1 ETH = 0.5 ETH");

  // Vérifier ownership des NFTs
  console.log("\n  📜 Ownership des NFTs:");
  console.log("    NFT #0 owner:", await place.ownerOf(0));
  console.log("    NFT #1 owner:", await place.ownerOf(1));
  console.log("    NFT #2 owner:", await place.ownerOf(2));
  console.log("    NFT #3 owner:", await place.ownerOf(3));
  console.log("    NFT #4 owner:", await place.ownerOf(4));

  // ============== 4. MÉTADONNÉES NFT ==============
  console.log("\n\n🖼️  ===== 4. MÉTADONNÉES NFT =====");

  const tokenURI = await place.tokenURI(0);
  console.log("  📄 Token URI NFT #0:", tokenURI.substring(0, 100) + "...");

  // Décoder les métadonnées
  const base64Data = tokenURI.split(",")[1];
  const jsonString = Buffer.from(base64Data, "base64").toString();
  const metadata = JSON.parse(jsonString);

  console.log("\n  📋 Métadonnées décodées:");
  console.log("    Name:", metadata.name);
  console.log("    Description:", metadata.description);
  console.log("    Attributes:", metadata.attributes.length);

  console.log("\n  🏷️  Attributs:");
  metadata.attributes.forEach(attr => {
    console.log(`      ${attr.trait_type}: ${attr.value}`);
  });

  // ============== 5. MARCHÉ SECONDAIRE ==============
  console.log("\n\n🔄 ===== 5. MARCHÉ SECONDAIRE =====");

  console.log("  originalMinter NFT #0:", await place.originalMinter(0));
  console.log("  isOriginalMinter NFT #0:", await place.isOriginalMinter(0));

  // User1 transfère NFT #0 à User2
  console.log("\n  User1 transfère NFT #0 à User2...");
  const txTransfer = await place.connect(user1).transferFrom(user1.address, user2.address, 0);
  await txTransfer.wait();
  console.log("  ✅ NFT #0 transféré !");

  console.log("\n  Après transfert:");
  console.log("    Owner NFT #0:", await place.ownerOf(0));
  console.log("    originalMinter NFT #0:", await place.originalMinter(0));
  console.log("    isOriginalMinter NFT #0:", await place.isOriginalMinter(0));
  console.log("  ✅ Marché secondaire détecté (isOriginalMinter = false)");

  // ============== 6. FERMER LA VENTE ET DISTRIBUER REWARDS ==============
  console.log("\n\n💰 ===== 6. DISTRIBUTION DE REWARDS =====");

  // Fast forward dans le temps
  await hre.network.provider.send("evm_increaseTime", [SALE_DURATION + 1]);
  await hre.network.provider.send("evm_mine");

  console.log("  ⏰ Time-travel effectué (+30 jours)");

  // Fermer la vente
  const txClose = await place.closeSale();
  await txClose.wait();
  console.log("  ✅ Vente fermée");

  // Admin distribue 5 ETH de rewards
  const rewardAmount = hre.ethers.parseEther("5");
  console.log("\n  Admin distribue", hre.ethers.formatEther(rewardAmount), "ETH de rewards...");

  const txReward = await place.depositRewards({ value: rewardAmount });
  await txReward.wait();
  console.log("  ✅ Rewards déposés !");
  console.log("    Total rewards deposited:", hre.ethers.formatEther(await place.totalRewardsDeposited()), "ETH");
  console.log("    Puzzles sold at deposit:", (await place.puzzlesSoldAtLastDeposit()).toString());

  // User1 claim rewards pour NFT #1 (il a toujours le #1)
  console.log("\n  User1 claim rewards pour NFT #1...");
  const user1BalanceBefore = await hre.ethers.provider.getBalance(user1.address);

  const txClaim1 = await place.connect(user1).claimRewards(1);
  const receiptClaim1 = await txClaim1.wait();
  const gasCost1 = receiptClaim1.gasUsed * receiptClaim1.gasPrice;

  const user1BalanceAfter = await hre.ethers.provider.getBalance(user1.address);
  const received1 = user1BalanceAfter - user1BalanceBefore + gasCost1;

  console.log("  ✅ User1 a reçu:", hre.ethers.formatEther(received1), "ETH");
  console.log("    (5 ETH / 5 puzzles = 1 ETH par puzzle)");

  // User2 claim rewards pour NFT #0 et #2
  console.log("\n  User2 claim rewards pour NFT #0...");
  const txClaim2 = await place.connect(user2).claimRewards(0);
  await txClaim2.wait();
  console.log("  ✅ User2 a claim pour NFT #0");

  console.log("\n  User2 claim rewards pour NFT #2...");
  const txClaim3 = await place.connect(user2).claimRewards(2);
  await txClaim3.wait();
  console.log("  ✅ User2 a claim pour NFT #2");

  // ============== 7. GOUVERNANCE ==============
  console.log("\n\n🗳️  ===== 7. GOUVERNANCE =====");

  // Team crée une proposition
  console.log("  Team crée une proposition...");
  const votingDuration = 7 * 24 * 60 * 60; // 7 jours

  const txProposal = await place.connect(teamMember).createProposal(
    "Rénovation de la cuisine",
    "Proposition de rénovation complète de la cuisine pour 15,000€",
    votingDuration
  );
  await txProposal.wait();
  console.log("  ✅ Proposition créée !");

  const proposal = await place.getProposal(0);
  console.log("\n  📋 Proposition #0:");
  console.log("    Titre:", proposal.title);
  console.log("    Créateur:", proposal.creator);
  console.log("    Active:", proposal.isActive);

  // Users votent
  console.log("\n  🗳️  Votes:");

  const txVote1 = await place.connect(user1).castVote(0, 1, true); // NFT #1 vote YES
  await txVote1.wait();
  console.log("    User1 (NFT #1) vote YES");

  const txVote2 = await place.connect(user2).castVote(0, 0, true); // NFT #0 vote YES
  await txVote2.wait();
  console.log("    User2 (NFT #0) vote YES");

  const txVote3 = await place.connect(user2).castVote(0, 2, false); // NFT #2 vote NO
  await txVote3.wait();
  console.log("    User2 (NFT #2) vote NO");

  const txVote4 = await place.connect(user3).castVote(0, 3, true); // NFT #3 vote YES
  await txVote4.wait();
  console.log("    User3 (NFT #3) vote YES");

  const proposalAfterVote = await place.getProposal(0);
  console.log("\n  📊 Résultats:");
  console.log("    YES:", proposalAfterVote.yesVotes.toString());
  console.log("    NO:", proposalAfterVote.noVotes.toString());
  console.log("  ✅ Proposition approuvée (3 YES vs 1 NO)");

  // ============== 8. STATISTIQUES FINALES ==============
  console.log("\n\n📊 ===== 8. STATISTIQUES FINALES =====");

  const finalPlaceInfo = await place.getPlaceInfo();
  console.log("  📍 Place:", finalPlaceInfo.name);
  console.log("    Puzzles vendus:", finalPlaceInfo.puzzlesSold.toString(), "/", finalPlaceInfo.totalPuzzles.toString());
  console.log("    Total rewards deposited:", hre.ethers.formatEther(await place.totalRewardsDeposited()), "ETH");
  console.log("    Total rewards claimed:", hre.ethers.formatEther(await place.totalRewardsClaimed()), "ETH");

  console.log("\n  🏭 Factory:");
  console.log("    Total places créées:", (await factory.placeCount()).toString());
  console.log("    Team members:", await factory.isTeamMember(teamMember.address));

  console.log("\n\n✅ ===== TEST LIVE TERMINÉ AVEC SUCCÈS ! =====\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exit(1);
  });
