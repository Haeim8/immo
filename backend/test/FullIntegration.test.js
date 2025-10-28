const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("🎯 TESTS COMPLETS - INTÉGRATION FULL STACK", function () {
  let factory, place;
  let admin, treasury, teamMember, user1, user2, user3, user4;

  const PUZZLE_PRICE = ethers.parseEther("0.1"); // 0.1 ETH par puzzle
  const TOTAL_PUZZLES = 10;
  const SALE_DURATION = 30 * 24 * 60 * 60; // 30 jours

  beforeEach(async function () {
    [admin, treasury, teamMember, user1, user2, user3, user4] = await ethers.getSigners();

    // Deploy Factory
    const USCIFactory = await ethers.getContractFactory("USCIFactory");
    factory = await USCIFactory.deploy(treasury.address);
    await factory.waitForDeployment();
  });

  describe("💼 1. FLOW ADMIN COMPLET", function () {
    it("✅ Admin peut créer une place", async function () {
      const tx = await factory.createPlace(
        "Residential",
        "Appartement Paris Centre",
        "Paris",
        "Île-de-France",
        "France",
        TOTAL_PUZZLES,
        PUZZLE_PRICE,
        SALE_DURATION,
        85, // 85m²
        3, // 3 pièces
        550, // 5.50% rendement
        "Apartment",
        2022,
        "QmTest123",
        "QmMeta456",
        true // Voting enabled
      );

      const receipt = await tx.wait();
      expect(receipt).to.not.be.undefined;

      // Vérifier que la place a été créée
      const placeAddress = await factory.getPlaceAddress(0);
      expect(placeAddress).to.not.equal(ethers.ZeroAddress);

      // Vérifier le compteur
      expect(await factory.placeCount()).to.equal(1);
    });

    it("✅ Admin peut ajouter un membre d'équipe", async function () {
      await factory.addTeamMember(teamMember.address);

      expect(await factory.isTeamMember(teamMember.address)).to.be.true;
      expect(await factory.teamMembers(teamMember.address)).to.be.true;

      // Vérifier le rôle
      const TEAM_ROLE = ethers.keccak256(ethers.toUtf8Bytes("TEAM_ROLE"));
      expect(await factory.hasRole(TEAM_ROLE, teamMember.address)).to.be.true;
    });

    it("✅ Admin peut retirer un membre d'équipe", async function () {
      await factory.addTeamMember(teamMember.address);
      await factory.removeTeamMember(teamMember.address);

      expect(await factory.teamMembers(teamMember.address)).to.be.false;

      // Vérifier le rôle retiré
      const TEAM_ROLE = ethers.keccak256(ethers.toUtf8Bytes("TEAM_ROLE"));
      expect(await factory.hasRole(TEAM_ROLE, teamMember.address)).to.be.false;
    });

    it("✅ Admin peut changer la treasury", async function () {
      const newTreasury = user4.address;
      await factory.setTreasury(newTreasury);

      expect(await factory.treasury()).to.equal(newTreasury);
    });

    it("✅ Admin peut pause/unpause la factory", async function () {
      await factory.pause();
      expect(await factory.paused()).to.be.true;

      // Création impossible quand paused
      await expect(
        factory.createPlace(
          "Residential", "Test", "Paris", "IDF", "France",
          10, PUZZLE_PRICE, SALE_DURATION,
          85, 3, 550, "Apartment", 2022, "QmTest", "QmMeta", true
        )
      ).to.be.revertedWithCustomError(factory, "EnforcedPause");

      // Unpause
      await factory.unpause();
      expect(await factory.paused()).to.be.false;
    });
  });

  describe("💰 2. FLOW ARGENT - TREASURY", function () {
    let placeAddress;

    beforeEach(async function () {
      // Créer une place
      await factory.createPlace(
        "Residential", "Appartement Test", "Paris", "IDF", "France",
        TOTAL_PUZZLES, PUZZLE_PRICE, SALE_DURATION,
        85, 3, 550, "Apartment", 2022, "QmTest", "QmMeta", true
      );

      placeAddress = await factory.getPlaceAddress(0);
      place = await ethers.getContractAt("USCI", placeAddress);
    });

    it("✅ Treasury reçoit l'argent des achats de puzzles", async function () {
      const treasuryBalanceBefore = await ethers.provider.getBalance(treasury.address);

      // User1 achète 1 puzzle
      await place.connect(user1).takePuzzle({ value: PUZZLE_PRICE });

      const treasuryBalanceAfter = await ethers.provider.getBalance(treasury.address);

      // Treasury a reçu exactement PUZZLE_PRICE
      expect(treasuryBalanceAfter - treasuryBalanceBefore).to.equal(PUZZLE_PRICE);
    });

    it("✅ Treasury reçoit l'argent de TOUS les achats", async function () {
      const treasuryBalanceBefore = await ethers.provider.getBalance(treasury.address);

      // 5 users achètent chacun 1 puzzle
      await place.connect(user1).takePuzzle({ value: PUZZLE_PRICE });
      await place.connect(user2).takePuzzle({ value: PUZZLE_PRICE });
      await place.connect(user3).takePuzzle({ value: PUZZLE_PRICE });
      await place.connect(user4).takePuzzle({ value: PUZZLE_PRICE });
      await place.connect(admin).takePuzzle({ value: PUZZLE_PRICE });

      const treasuryBalanceAfter = await ethers.provider.getBalance(treasury.address);

      // Treasury a reçu 5 * PUZZLE_PRICE
      const totalReceived = treasuryBalanceAfter - treasuryBalanceBefore;
      expect(totalReceived).to.equal(PUZZLE_PRICE * 5n);
    });

    it("✅ Les rewards sont distribués aux holders (pas à la treasury)", async function () {
      // User1 achète un puzzle
      await place.connect(user1).takePuzzle({ value: PUZZLE_PRICE });

      // Fermer la vente
      await time.increase(SALE_DURATION + 1);
      await place.closeSale();

      // Admin dépose des rewards (10 ETH)
      const rewardAmount = ethers.parseEther("10");
      await place.depositRewards({ value: rewardAmount });

      // Vérifier que le contrat place a reçu les rewards
      const placeBalance = await ethers.provider.getBalance(placeAddress);
      expect(placeBalance).to.be.gte(rewardAmount);

      // User1 claim ses rewards
      const user1BalanceBefore = await ethers.provider.getBalance(user1.address);
      const tx = await place.connect(user1).claimRewards(0);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const user1BalanceAfter = await ethers.provider.getBalance(user1.address);

      // User1 a reçu les rewards (10 ETH - gas)
      const received = user1BalanceAfter - user1BalanceBefore + gasUsed;
      expect(received).to.equal(rewardAmount);
    });

    it("✅ Liquidation distribue l'argent aux holders", async function () {
      // Acheter tous les puzzles
      for (let i = 0; i < TOTAL_PUZZLES; i++) {
        await place.connect(user1).takePuzzle({ value: PUZZLE_PRICE });
      }

      await time.increase(SALE_DURATION + 1);

      // Liquidation avec 100 ETH
      const liquidationAmount = ethers.parseEther("100");
      await place.complete({ value: liquidationAmount });

      // User1 claim liquidation pour le NFT #0
      const user1BalanceBefore = await ethers.provider.getBalance(user1.address);
      const tx = await place.connect(user1).claimCompletion(0);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const user1BalanceAfter = await ethers.provider.getBalance(user1.address);

      // User1 reçoit 10 ETH (100 / 10 puzzles)
      const received = user1BalanceAfter - user1BalanceBefore + gasUsed;
      expect(received).to.equal(ethers.parseEther("10"));
    });
  });

  describe("🖼️  3. GÉNÉRATION NFT + MÉTADONNÉES", function () {
    beforeEach(async function () {
      await factory.createPlace(
        "Residential", "Villa Luxueuse", "Nice", "PACA", "France",
        TOTAL_PUZZLES, PUZZLE_PRICE, SALE_DURATION,
        150, 5, 650, "Villa", 2023, "QmImageCID", "QmMetaCID", true
      );

      const placeAddress = await factory.getPlaceAddress(0);
      place = await ethers.getContractAt("USCI", placeAddress);
    });

    it("✅ NFT est minté avec le bon owner", async function () {
      await place.connect(user1).takePuzzle({ value: PUZZLE_PRICE });

      expect(await place.ownerOf(0)).to.equal(user1.address);
    });

    it("✅ TokenId s'incrémente correctement", async function () {
      await place.connect(user1).takePuzzle({ value: PUZZLE_PRICE });
      await place.connect(user2).takePuzzle({ value: PUZZLE_PRICE });
      await place.connect(user3).takePuzzle({ value: PUZZLE_PRICE });

      expect(await place.ownerOf(0)).to.equal(user1.address);
      expect(await place.ownerOf(1)).to.equal(user2.address);
      expect(await place.ownerOf(2)).to.equal(user3.address);
    });

    it("✅ tokenURI génère du SVG on-chain", async function () {
      await place.connect(user1).takePuzzle({ value: PUZZLE_PRICE });

      const tokenURI = await place.tokenURI(0);

      // Vérifier que c'est du base64 JSON
      expect(tokenURI).to.include("data:application/json;base64");

      // Décoder le JSON
      const base64Data = tokenURI.split(",")[1];
      const jsonString = Buffer.from(base64Data, "base64").toString();
      const metadata = JSON.parse(jsonString);

      // Vérifier les champs
      expect(metadata.name).to.include("Puzzle #0");
      expect(metadata.name).to.include("Villa Luxueuse");
      expect(metadata.description).to.include("Nice");
      expect(metadata.image).to.include("data:image/svg+xml;base64");

      // Vérifier les attributs
      expect(metadata.attributes).to.be.an("array");
      expect(metadata.attributes.length).to.be.gte(5);

      console.log("      📄 Métadonnées NFT :", JSON.stringify(metadata, null, 2));
    });

    it("✅ SVG contient les bonnes informations", async function () {
      await place.connect(user1).takePuzzle({ value: PUZZLE_PRICE });

      const tokenURI = await place.tokenURI(0);
      const base64Data = tokenURI.split(",")[1];
      const jsonString = Buffer.from(base64Data, "base64").toString();
      const metadata = JSON.parse(jsonString);

      // Décoder le SVG
      const svgBase64 = metadata.image.split(",")[1];
      const svg = Buffer.from(svgBase64, "base64").toString();

      // Vérifier le contenu du SVG
      expect(svg).to.include("Villa Luxueuse");
      expect(svg).to.include("Nice");
      expect(svg).to.include("PACA");
      expect(svg).to.include("#0");

      console.log("      🎨 SVG:", svg.substring(0, 200) + "...");
    });

    it("✅ Chaque NFT a un URI unique", async function () {
      await place.connect(user1).takePuzzle({ value: PUZZLE_PRICE });
      await place.connect(user2).takePuzzle({ value: PUZZLE_PRICE });

      const uri0 = await place.tokenURI(0);
      const uri1 = await place.tokenURI(1);

      // Les URIs sont différents (car token ID différent)
      expect(uri0).to.not.equal(uri1);

      // Décoder pour vérifier le contenu
      const base64Data0 = uri0.split(",")[1];
      const json0 = Buffer.from(base64Data0, "base64").toString();
      const metadata0 = JSON.parse(json0);

      const base64Data1 = uri1.split(",")[1];
      const json1 = Buffer.from(base64Data1, "base64").toString();
      const metadata1 = JSON.parse(json1);

      // Même place, tokens différents
      expect(metadata0.name).to.include("Villa Luxueuse");
      expect(metadata1.name).to.include("Villa Luxueuse");
      expect(metadata0.name).to.include("#0");
      expect(metadata1.name).to.include("#1");
    });
  });

  describe("👥 4. DROITS TEAM = ADMIN", function () {
    beforeEach(async function () {
      // Ajouter teamMember
      await factory.addTeamMember(teamMember.address);
    });

    it("✅ Team peut créer une place", async function () {
      await expect(
        factory.connect(teamMember).createPlace(
          "Commercial", "Bureau Lyon", "Lyon", "Rhône-Alpes", "France",
          20, PUZZLE_PRICE, SALE_DURATION,
          200, 10, 700, "Office", 2024, "QmTest", "QmMeta", false
        )
      ).to.not.be.reverted;

      expect(await factory.placeCount()).to.equal(1);
    });

    it("✅ Team peut distribuer des rewards", async function () {
      // Admin crée une place
      await factory.createPlace(
        "Residential", "Test", "Paris", "IDF", "France",
        10, PUZZLE_PRICE, SALE_DURATION,
        85, 3, 550, "Apartment", 2022, "QmTest", "QmMeta", true
      );

      const placeAddress = await factory.getPlaceAddress(0);
      place = await ethers.getContractAt("USCI", placeAddress);

      // User1 achète
      await place.connect(user1).takePuzzle({ value: PUZZLE_PRICE });

      // Fermer vente
      await time.increase(SALE_DURATION + 1);
      await place.closeSale();

      // Team distribue des rewards
      await expect(
        place.connect(teamMember).depositRewards({ value: ethers.parseEther("5") })
      ).to.not.be.reverted;

      expect(await place.totalRewardsDeposited()).to.equal(ethers.parseEther("5"));
    });

    it("✅ Team peut créer des propositions de gouvernance", async function () {
      await factory.createPlace(
        "Residential", "Test", "Paris", "IDF", "France",
        10, PUZZLE_PRICE, SALE_DURATION,
        85, 3, 550, "Apartment", 2022, "QmTest", "QmMeta", true
      );

      const placeAddress = await factory.getPlaceAddress(0);
      place = await ethers.getContractAt("USCI", placeAddress);

      // Team crée une proposition
      await expect(
        place.connect(teamMember).createProposal(
          "Rénovation de la cuisine",
          "Proposition de rénovation complète de la cuisine pour 15,000€",
          7 * 24 * 60 * 60 // 7 jours
        )
      ).to.not.be.reverted;

      const proposal = await place.getProposal(0);
      expect(proposal.title).to.equal("Rénovation de la cuisine");
    });

    it("✅ Team peut fermer une vente", async function () {
      await factory.createPlace(
        "Residential", "Test", "Paris", "IDF", "France",
        10, PUZZLE_PRICE, SALE_DURATION,
        85, 3, 550, "Apartment", 2022, "QmTest", "QmMeta", true
      );

      const placeAddress = await factory.getPlaceAddress(0);
      place = await ethers.getContractAt("USCI", placeAddress);

      await time.increase(SALE_DURATION + 1);

      await expect(
        place.connect(teamMember).closeSale()
      ).to.not.be.reverted;

      const info = await place.getPlaceInfo();
      expect(info.isActive).to.be.false;
    });

    it("✅ Team peut pause/unpause une place", async function () {
      await factory.createPlace(
        "Residential", "Test", "Paris", "IDF", "France",
        10, PUZZLE_PRICE, SALE_DURATION,
        85, 3, 550, "Apartment", 2022, "QmTest", "QmMeta", true
      );

      const placeAddress = await factory.getPlaceAddress(0);
      place = await ethers.getContractAt("USCI", placeAddress);

      // Team pause
      await expect(place.connect(teamMember).pause()).to.not.be.reverted;
      expect(await place.paused()).to.be.true;

      // Team unpause
      await expect(place.connect(teamMember).unpause()).to.not.be.reverted;
      expect(await place.paused()).to.be.false;
    });

    it("✅ Team peut effectuer la liquidation", async function () {
      await factory.createPlace(
        "Residential", "Test", "Paris", "IDF", "France",
        10, PUZZLE_PRICE, SALE_DURATION,
        85, 3, 550, "Apartment", 2022, "QmTest", "QmMeta", true
      );

      const placeAddress = await factory.getPlaceAddress(0);
      place = await ethers.getContractAt("USCI", placeAddress);

      // Vendre tous les puzzles
      for (let i = 0; i < 10; i++) {
        await place.connect(user1).takePuzzle({ value: PUZZLE_PRICE });
      }

      await time.increase(SALE_DURATION + 1);

      // Team effectue la liquidation
      await expect(
        place.connect(teamMember).complete({ value: ethers.parseEther("50") })
      ).to.not.be.reverted;

      expect(await place.isCompleted()).to.be.true;
    });
  });

  describe("🔄 5. MARCHÉ SECONDAIRE - TRACKING originalMinter", function () {
    beforeEach(async function () {
      await factory.createPlace(
        "Residential", "Test", "Paris", "IDF", "France",
        10, PUZZLE_PRICE, SALE_DURATION,
        85, 3, 550, "Apartment", 2022, "QmTest", "QmMeta", true
      );

      const placeAddress = await factory.getPlaceAddress(0);
      place = await ethers.getContractAt("USCI", placeAddress);
    });

    it("✅ originalMinter est set correctement à l'achat", async function () {
      await place.connect(user1).takePuzzle({ value: PUZZLE_PRICE });

      expect(await place.originalMinter(0)).to.equal(user1.address);
    });

    it("✅ isOriginalMinter retourne true pour le premier acheteur", async function () {
      await place.connect(user1).takePuzzle({ value: PUZZLE_PRICE });

      expect(await place.isOriginalMinter(0)).to.be.true;
    });

    it("✅ Après transfert, isOriginalMinter retourne false", async function () {
      await place.connect(user1).takePuzzle({ value: PUZZLE_PRICE });

      // User1 transfère le NFT à User2
      await place.connect(user1).transferFrom(user1.address, user2.address, 0);

      // Nouveau owner
      expect(await place.ownerOf(0)).to.equal(user2.address);

      // Mais pas original minter
      expect(await place.isOriginalMinter(0)).to.be.false;
      expect(await place.originalMinter(0)).to.equal(user1.address);
    });

    it("✅ Plusieurs transferts conservent l'originalMinter", async function () {
      await place.connect(user1).takePuzzle({ value: PUZZLE_PRICE });

      // Chaîne de transferts: user1 → user2 → user3 → user4
      await place.connect(user1).transferFrom(user1.address, user2.address, 0);
      await place.connect(user2).transferFrom(user2.address, user3.address, 0);
      await place.connect(user3).transferFrom(user3.address, user4.address, 0);

      // Owner final est user4
      expect(await place.ownerOf(0)).to.equal(user4.address);

      // Mais originalMinter est toujours user1
      expect(await place.originalMinter(0)).to.equal(user1.address);
      expect(await place.isOriginalMinter(0)).to.be.false;
    });

    it("✅ TokenURI affiche 'Original Minter' dans les attributs", async function () {
      await place.connect(user1).takePuzzle({ value: PUZZLE_PRICE });

      // Vérifier avant transfert
      let tokenURI = await place.tokenURI(0);
      let base64Data = tokenURI.split(",")[1];
      let jsonString = Buffer.from(base64Data, "base64").toString();
      let metadata = JSON.parse(jsonString);

      const originalAttr = metadata.attributes.find(a => a.trait_type === "Original Minter");
      expect(originalAttr.value).to.equal("true");

      // Transférer
      await place.connect(user1).transferFrom(user1.address, user2.address, 0);

      // Vérifier après transfert
      tokenURI = await place.tokenURI(0);
      base64Data = tokenURI.split(",")[1];
      jsonString = Buffer.from(base64Data, "base64").toString();
      metadata = JSON.parse(jsonString);

      const secondaryAttr = metadata.attributes.find(a => a.trait_type === "Original Minter");
      expect(secondaryAttr.value).to.equal("false");
    });
  });

  describe("🗳️  6. GOUVERNANCE COMPLÈTE", function () {
    beforeEach(async function () {
      await factory.createPlace(
        "Residential", "Copropriété Test", "Paris", "IDF", "France",
        10, PUZZLE_PRICE, SALE_DURATION,
        85, 3, 550, "Apartment", 2022, "QmTest", "QmMeta", true
      );

      const placeAddress = await factory.getPlaceAddress(0);
      place = await ethers.getContractAt("USCI", placeAddress);

      // 3 users achètent des puzzles
      await place.connect(user1).takePuzzle({ value: PUZZLE_PRICE });
      await place.connect(user2).takePuzzle({ value: PUZZLE_PRICE });
      await place.connect(user3).takePuzzle({ value: PUZZLE_PRICE });
    });

    it("✅ Création de proposition", async function () {
      const proposalTx = await place.createProposal(
        "Travaux de rénovation",
        "Installation de panneaux solaires pour 20,000€",
        14 * 24 * 60 * 60 // 14 jours
      );

      await proposalTx.wait();

      const proposal = await place.getProposal(0);
      expect(proposal.title).to.equal("Travaux de rénovation");
      expect(proposal.isActive).to.be.true;
      expect(proposal.yesVotes).to.equal(0);
      expect(proposal.noVotes).to.equal(0);
    });

    it("✅ Vote YES fonctionne", async function () {
      await place.createProposal("Test", "Test description", 7 * 24 * 60 * 60);

      // User1 vote YES
      await place.connect(user1).castVote(0, 0, true);

      const proposal = await place.getProposal(0);
      expect(proposal.yesVotes).to.equal(1);
      expect(proposal.noVotes).to.equal(0);
    });

    it("✅ Vote NO fonctionne", async function () {
      await place.createProposal("Test", "Test description", 7 * 24 * 60 * 60);

      // User2 vote NO
      await place.connect(user2).castVote(0, 1, false);

      const proposal = await place.getProposal(0);
      expect(proposal.yesVotes).to.equal(0);
      expect(proposal.noVotes).to.equal(1);
    });

    it("✅ Plusieurs votes sont comptés", async function () {
      await place.createProposal("Test", "Test description", 7 * 24 * 60 * 60);

      // 3 users votent
      await place.connect(user1).castVote(0, 0, true);  // YES
      await place.connect(user2).castVote(0, 1, true);  // YES
      await place.connect(user3).castVote(0, 2, false); // NO

      const proposal = await place.getProposal(0);
      expect(proposal.yesVotes).to.equal(2);
      expect(proposal.noVotes).to.equal(1);
    });

    it("❌ Ne peut pas voter deux fois avec le même NFT", async function () {
      await place.createProposal("Test", "Test description", 7 * 24 * 60 * 60);

      await place.connect(user1).castVote(0, 0, true);

      await expect(
        place.connect(user1).castVote(0, 0, false)
      ).to.be.revertedWith("Already voted");
    });

    it("❌ Ne peut pas voter avec un NFT qu'on ne possède pas", async function () {
      await place.createProposal("Test", "Test description", 7 * 24 * 60 * 60);

      // User1 essaie de voter avec le NFT de User2
      await expect(
        place.connect(user1).castVote(0, 1, true)
      ).to.be.revertedWithCustomError(place, "NotOwner");
    });

    it("✅ Admin peut fermer une proposition après deadline", async function () {
      await place.createProposal("Test", "Test description", 7 * 24 * 60 * 60);

      // Avancer dans le temps
      await time.increase(8 * 24 * 60 * 60); // 8 jours

      await place.closeProposal(0);

      const proposal = await place.getProposal(0);
      expect(proposal.isActive).to.be.false;
    });

    it("❌ Ne peut pas fermer une proposition avant deadline", async function () {
      await place.createProposal("Test", "Test description", 7 * 24 * 60 * 60);

      await expect(
        place.closeProposal(0)
      ).to.be.revertedWith("Voting still active");
    });
  });

  describe("🔥 7. LIQUIDATION COMPLÈTE", function () {
    beforeEach(async function () {
      await factory.createPlace(
        "Residential", "Appartement Liquidation", "Paris", "IDF", "France",
        5, PUZZLE_PRICE, SALE_DURATION,
        85, 3, 550, "Apartment", 2022, "QmTest", "QmMeta", true
      );

      const placeAddress = await factory.getPlaceAddress(0);
      place = await ethers.getContractAt("USCI", placeAddress);

      // 3 users achètent tous les puzzles
      await place.connect(user1).takePuzzle({ value: PUZZLE_PRICE });
      await place.connect(user1).takePuzzle({ value: PUZZLE_PRICE });
      await place.connect(user2).takePuzzle({ value: PUZZLE_PRICE });
      await place.connect(user3).takePuzzle({ value: PUZZLE_PRICE });
      await place.connect(user3).takePuzzle({ value: PUZZLE_PRICE });

      await time.increase(SALE_DURATION + 1);
    });

    it("✅ Admin peut effectuer la liquidation", async function () {
      const liquidationAmount = ethers.parseEther("25"); // 25 ETH / 5 puzzles = 5 ETH each

      await expect(
        place.complete({ value: liquidationAmount })
      ).to.not.be.reverted;

      expect(await place.isCompleted()).to.be.true;
      expect(await place.completionAmount()).to.equal(liquidationAmount);
    });

    it("✅ Holders peuvent claim leur part de liquidation", async function () {
      await place.complete({ value: ethers.parseEther("25") });

      // User1 a 2 NFTs (#0 et #1)
      const user1BalanceBefore = await ethers.provider.getBalance(user1.address);

      // Claim NFT #0
      const tx1 = await place.connect(user1).claimCompletion(0);
      const receipt1 = await tx1.wait();
      const gas1 = receipt1.gasUsed * receipt1.gasPrice;

      // Claim NFT #1
      const tx2 = await place.connect(user1).claimCompletion(1);
      const receipt2 = await tx2.wait();
      const gas2 = receipt2.gasUsed * receipt2.gasPrice;

      const user1BalanceAfter = await ethers.provider.getBalance(user1.address);

      // User1 reçoit 10 ETH (2 * 5 ETH)
      const received = user1BalanceAfter - user1BalanceBefore + gas1 + gas2;
      expect(received).to.equal(ethers.parseEther("10"));
    });

    it("✅ NFT est brûlé après claim liquidation", async function () {
      await place.complete({ value: ethers.parseEther("25") });

      // NFT existe
      expect(await place.ownerOf(0)).to.equal(user1.address);

      // Claim
      await place.connect(user1).claimCompletion(0);

      // NFT brûlé
      await expect(place.ownerOf(0)).to.be.reverted;
    });

    it("✅ Tous les holders peuvent claim", async function () {
      await place.complete({ value: ethers.parseEther("25") });

      // User1: 2 NFTs
      await place.connect(user1).claimCompletion(0);
      await place.connect(user1).claimCompletion(1);

      // User2: 1 NFT
      await place.connect(user2).claimCompletion(2);

      // User3: 2 NFTs
      await place.connect(user3).claimCompletion(3);
      await place.connect(user3).claimCompletion(4);

      // Vérifier total claimed
      expect(await place.completionClaimed()).to.equal(ethers.parseEther("25"));
    });
  });

  describe("📊 8. STATISTIQUES & VIEW FUNCTIONS", function () {
    beforeEach(async function () {
      await factory.createPlace(
        "Residential", "Stats Test", "Paris", "IDF", "France",
        10, PUZZLE_PRICE, SALE_DURATION,
        85, 3, 550, "Apartment", 2022, "QmTest", "QmMeta", true
      );

      const placeAddress = await factory.getPlaceAddress(0);
      place = await ethers.getContractAt("USCI", placeAddress);
    });

    it("✅ getPlaceInfo retourne toutes les infos", async function () {
      const info = await place.getPlaceInfo();

      expect(info.name).to.equal("Stats Test");
      expect(info.city).to.equal("Paris");
      expect(info.province).to.equal("IDF");
      expect(info.totalPuzzles).to.equal(10);
      expect(info.puzzlePrice).to.equal(PUZZLE_PRICE);
      expect(info.puzzlesSold).to.equal(0);
      expect(info.isActive).to.be.true;
      expect(info.surface).to.equal(85);
      expect(info.rooms).to.equal(3);
      expect(info.expectedReturn).to.equal(550);
    });

    it("✅ getAllPlaces retourne toutes les places créées", async function () {
      // Créer 2 autres places
      await factory.createPlace(
        "Commercial", "Place 2", "Lyon", "RA", "France",
        5, PUZZLE_PRICE, SALE_DURATION,
        100, 4, 600, "Office", 2023, "QmTest2", "QmMeta2", false
      );

      await factory.createPlace(
        "Industrial", "Place 3", "Marseille", "PACA", "France",
        15, PUZZLE_PRICE, SALE_DURATION,
        500, 1, 450, "Warehouse", 2021, "QmTest3", "QmMeta3", false
      );

      const allPlaces = await factory.getAllPlaces();
      expect(allPlaces.length).to.equal(3);
      expect(allPlaces[0]).to.not.equal(ethers.ZeroAddress);
      expect(allPlaces[1]).to.not.equal(ethers.ZeroAddress);
      expect(allPlaces[2]).to.not.equal(ethers.ZeroAddress);
    });

    it("✅ canClaimRewards retourne correctement", async function () {
      await place.connect(user1).takePuzzle({ value: PUZZLE_PRICE });

      // Pas encore de rewards
      expect(await place.canClaimRewards(0)).to.be.false;

      // Fermer vente et déposer rewards
      await time.increase(SALE_DURATION + 1);
      await place.closeSale();
      await place.depositRewards({ value: ethers.parseEther("5") });

      // Maintenant claimable
      expect(await place.canClaimRewards(0)).to.be.true;

      // Après claim, plus claimable
      await place.connect(user1).claimRewards(0);
      expect(await place.canClaimRewards(0)).to.be.false;
    });
  });
});
