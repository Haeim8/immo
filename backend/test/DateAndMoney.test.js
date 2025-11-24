const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("📅💰 TESTS DATES + FLOW ARGENT DÉTAILLÉ", function () {
  let factory, place;
  let admin, treasury, teamMember, user1, user2, user3;

  const PUZZLE_PRICE = ethers.parseEther("0.1");
  const TOTAL_PUZZLES = 5;
  const SALE_DURATION = 30 * 24 * 60 * 60; // 30 jours

  beforeEach(async function () {
    [admin, treasury, teamMember, user1, user2, user3] = await ethers.getSigners();

    const CANTORFIFactory = await ethers.getContractFactory("CANTORFIFactory");
    factory = await CANTORFIFactory.deploy(treasury.address);
    await factory.waitForDeployment();

    // Créer une place
    await factory.createPlace(
      "Residential", "Test Place", "Paris", "IDF", "France",
      TOTAL_PUZZLES, PUZZLE_PRICE, SALE_DURATION,
      85, 3, 550, "Apartment", 2022, "QmTest", "QmMeta", true
    );

    const placeAddress = await factory.getPlaceAddress(0);
    place = await ethers.getContractAt("CANTORFI", placeAddress);
  });

  describe("📅 1. DATES DE CLÔTURE - VENTE DE PUZZLES", function () {
    it("✅ Sale Start est set correctement", async function () {
      const info = await place.getPlaceInfo();
      const currentBlock = await time.latest();

      console.log("      Current timestamp:", currentBlock);
      console.log("      Sale start:", info.saleStart.toString());
      console.log("      Sale end:", info.saleEnd.toString());

      // Sale start devrait être maintenant
      expect(info.saleStart).to.be.closeTo(currentBlock, 5);
    });

    it("✅ Sale End = Sale Start + Duration", async function () {
      const info = await place.getPlaceInfo();

      const expectedEnd = info.saleStart + BigInt(SALE_DURATION);
      expect(info.saleEnd).to.equal(expectedEnd);

      console.log("      Sale duration:", SALE_DURATION, "seconds (30 jours)");
      console.log("      Expected end:", expectedEnd.toString());
      console.log("      Actual end:", info.saleEnd.toString());
    });

    it("✅ Peut acheter AVANT la deadline", async function () {
      const info = await place.getPlaceInfo();
      const currentTime = await time.latest();

      console.log("      Current time:", currentTime);
      console.log("      Sale end:", info.saleEnd.toString());
      console.log("      Time remaining:", (Number(info.saleEnd) - currentTime), "seconds");

      await expect(
        place.connect(user1).takePuzzle({ value: PUZZLE_PRICE })
      ).to.not.be.reverted;
    });

    it("❌ NE PEUT PAS acheter APRÈS la deadline", async function () {
      const info = await place.getPlaceInfo();

      // Avancer jusqu'à après la deadline
      await time.increaseTo(info.saleEnd + 1n);

      const currentTime = await time.latest();
      console.log("      Sale end:", info.saleEnd.toString());
      console.log("      Current time:", currentTime);
      console.log("      Deadline dépassée de:", currentTime - Number(info.saleEnd), "seconds");

      await expect(
        place.connect(user1).takePuzzle({ value: PUZZLE_PRICE })
      ).to.be.revertedWithCustomError(place, "SaleEnded");
    });

    it("✅ Auto-close fonctionne à la deadline", async function () {
      const infoBefore = await place.getPlaceInfo();
      expect(infoBefore.isActive).to.be.true;

      // Avancer jusqu'à après la deadline
      await time.increaseTo(infoBefore.saleEnd + 1n);

      // Tenter un achat (va trigger l'auto-close)
      await expect(
        place.connect(user1).takePuzzle({ value: PUZZLE_PRICE })
      ).to.be.revertedWithCustomError(place, "SaleEnded");

      // Vérifier que isActive est maintenant false
      const infoAfter = await place.getPlaceInfo();
      expect(infoAfter.isActive).to.be.false;
    });

    it("✅ Peut fermer manuellement APRÈS la deadline", async function () {
      const info = await place.getPlaceInfo();

      // Avancer jusqu'à après la deadline
      await time.increaseTo(info.saleEnd + 1n);

      await expect(place.closeSale()).to.not.be.reverted;

      const infoAfter = await place.getPlaceInfo();
      expect(infoAfter.isActive).to.be.false;
    });

    it("❌ NE PEUT PAS fermer AVANT la deadline", async function () {
      const info = await place.getPlaceInfo();
      const currentTime = await time.latest();

      console.log("      Current time:", currentTime);
      console.log("      Sale end:", info.saleEnd.toString());

      await expect(
        place.closeSale()
      ).to.be.revertedWith("Sale still active");
    });
  });

  describe("📅 2. DATES DE CLÔTURE - VOTES", function () {
    beforeEach(async function () {
      // Acheter des puzzles
      await place.connect(user1).takePuzzle({ value: PUZZLE_PRICE });
      await place.connect(user2).takePuzzle({ value: PUZZLE_PRICE });
    });

    it("✅ Voting End = Created At + Duration", async function () {
      const votingDuration = 7 * 24 * 60 * 60; // 7 jours

      const tx = await place.createProposal(
        "Test Proposal",
        "Test Description",
        votingDuration
      );
      await tx.wait();

      const proposal = await place.getProposal(0);
      const expectedEnd = proposal.createdAt + BigInt(votingDuration);

      console.log("      Created at:", proposal.createdAt.toString());
      console.log("      Voting duration:", votingDuration, "seconds (7 jours)");
      console.log("      Expected voting end:", expectedEnd.toString());
      console.log("      Actual voting end:", proposal.votingEndsAt.toString());

      expect(proposal.votingEndsAt).to.equal(expectedEnd);
    });

    it("✅ Peut voter AVANT la deadline", async function () {
      const votingDuration = 7 * 24 * 60 * 60;

      await place.createProposal("Test", "Test", votingDuration);

      const proposal = await place.getProposal(0);
      const currentTime = await time.latest();

      console.log("      Current time:", currentTime);
      console.log("      Voting ends at:", proposal.votingEndsAt.toString());
      console.log("      Time remaining:", (Number(proposal.votingEndsAt) - currentTime), "seconds");

      await expect(
        place.connect(user1).castVote(0, 0, true)
      ).to.not.be.reverted;
    });

    it("❌ NE PEUT PAS voter APRÈS la deadline", async function () {
      const votingDuration = 7 * 24 * 60 * 60;

      await place.createProposal("Test", "Test", votingDuration);

      const proposal = await place.getProposal(0);

      // Avancer jusqu'à après la deadline
      await time.increaseTo(proposal.votingEndsAt + 1n);

      const currentTime = await time.latest();
      console.log("      Voting end:", proposal.votingEndsAt.toString());
      console.log("      Current time:", currentTime);
      console.log("      Deadline dépassée de:", currentTime - Number(proposal.votingEndsAt), "seconds");

      await expect(
        place.connect(user1).castVote(0, 0, true)
      ).to.be.revertedWith("Voting ended");
    });

    it("✅ Peut fermer proposition APRÈS deadline", async function () {
      const votingDuration = 7 * 24 * 60 * 60;

      await place.createProposal("Test", "Test", votingDuration);

      const proposal = await place.getProposal(0);

      // Avancer jusqu'à après la deadline
      await time.increaseTo(proposal.votingEndsAt + 1n);

      await expect(place.closeProposal(0)).to.not.be.reverted;

      const proposalAfter = await place.getProposal(0);
      expect(proposalAfter.isActive).to.be.false;
    });

    it("❌ NE PEUT PAS fermer proposition AVANT deadline", async function () {
      const votingDuration = 7 * 24 * 60 * 60;

      await place.createProposal("Test", "Test", votingDuration);

      await expect(
        place.closeProposal(0)
      ).to.be.revertedWith("Voting still active");
    });

    it("✅ Validation: Durée minimum 1 jour", async function () {
      const tooShort = 23 * 60 * 60; // 23 heures

      await expect(
        place.createProposal("Test", "Test", tooShort)
      ).to.be.revertedWithCustomError(place, "InvalidVotingDuration");
    });

    it("✅ Validation: Durée maximum 30 jours", async function () {
      const tooLong = 31 * 24 * 60 * 60; // 31 jours

      await expect(
        place.createProposal("Test", "Test", tooLong)
      ).to.be.revertedWithCustomError(place, "InvalidVotingDuration");
    });
  });

  describe("💰 3. FLOW ARGENT DÉTAILLÉ - ACHATS", function () {
    it("✅ Treasury reçoit EXACTEMENT le prix du puzzle", async function () {
      console.log("\n      💰 AVANT ACHAT:");
      const treasuryBefore = await ethers.provider.getBalance(treasury.address);
      const user1Before = await ethers.provider.getBalance(user1.address);
      const placeBefore = await ethers.provider.getBalance(await place.getAddress());

      console.log("        Treasury:", ethers.formatEther(treasuryBefore), "ETH");
      console.log("        User1:", ethers.formatEther(user1Before), "ETH");
      console.log("        Place Contract:", ethers.formatEther(placeBefore), "ETH");

      // User1 achète
      const tx = await place.connect(user1).takePuzzle({ value: PUZZLE_PRICE });
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;

      console.log("\n      💸 TRANSACTION:");
      console.log("        Prix puzzle:", ethers.formatEther(PUZZLE_PRICE), "ETH");
      console.log("        Gas utilisé:", receipt.gasUsed.toString());
      console.log("        Gas cost:", ethers.formatEther(gasCost), "ETH");

      console.log("\n      💰 APRÈS ACHAT:");
      const treasuryAfter = await ethers.provider.getBalance(treasury.address);
      const user1After = await ethers.provider.getBalance(user1.address);
      const placeAfter = await ethers.provider.getBalance(await place.getAddress());

      console.log("        Treasury:", ethers.formatEther(treasuryAfter), "ETH");
      console.log("        User1:", ethers.formatEther(user1After), "ETH");
      console.log("        Place Contract:", ethers.formatEther(placeAfter), "ETH");

      console.log("\n      📊 DIFFÉRENCES:");
      const treasuryDiff = treasuryAfter - treasuryBefore;
      const user1Diff = user1After - user1Before;
      const placeDiff = placeAfter - placeBefore;

      console.log("        Treasury +:", ethers.formatEther(treasuryDiff), "ETH");
      console.log("        User1 -:", ethers.formatEther(user1Diff + gasCost), "ETH");
      console.log("        Place Contract +:", ethers.formatEther(placeDiff), "ETH");

      // Vérifications
      expect(treasuryDiff).to.equal(PUZZLE_PRICE);
      expect(placeDiff).to.equal(0n); // Le contrat ne garde RIEN
      expect(user1Diff + gasCost).to.equal(-PUZZLE_PRICE); // User1 perd le prix + gas
    });

    it("✅ TOUS les achats vont à la treasury (pas au contrat)", async function () {
      const treasuryBefore = await ethers.provider.getBalance(treasury.address);
      const placeBefore = await ethers.provider.getBalance(await place.getAddress());

      console.log("\n      💰 AVANT 3 ACHATS:");
      console.log("        Treasury:", ethers.formatEther(treasuryBefore), "ETH");
      console.log("        Place Contract:", ethers.formatEther(placeBefore), "ETH");

      // 3 users achètent
      await place.connect(user1).takePuzzle({ value: PUZZLE_PRICE });
      await place.connect(user2).takePuzzle({ value: PUZZLE_PRICE });
      await place.connect(user3).takePuzzle({ value: PUZZLE_PRICE });

      const treasuryAfter = await ethers.provider.getBalance(treasury.address);
      const placeAfter = await ethers.provider.getBalance(await place.getAddress());

      console.log("\n      💰 APRÈS 3 ACHATS:");
      console.log("        Treasury:", ethers.formatEther(treasuryAfter), "ETH");
      console.log("        Place Contract:", ethers.formatEther(placeAfter), "ETH");

      const treasuryDiff = treasuryAfter - treasuryBefore;
      const placeDiff = placeAfter - placeBefore;

      console.log("\n      📊 TOTAL REÇU:");
      console.log("        Treasury +:", ethers.formatEther(treasuryDiff), "ETH (3 × 0.1 = 0.3 ETH)");
      console.log("        Place Contract +:", ethers.formatEther(placeDiff), "ETH");

      expect(treasuryDiff).to.equal(PUZZLE_PRICE * 3n);
      expect(placeDiff).to.equal(0n); // Le contrat ne garde RIEN !
    });
  });

  describe("💰 4. FLOW ARGENT DÉTAILLÉ - REWARDS", function () {
    beforeEach(async function () {
      // 3 users achètent
      await place.connect(user1).takePuzzle({ value: PUZZLE_PRICE });
      await place.connect(user2).takePuzzle({ value: PUZZLE_PRICE });
      await place.connect(user3).takePuzzle({ value: PUZZLE_PRICE });

      // Fermer la vente
      await time.increase(SALE_DURATION + 1);
      await place.closeSale();
    });

    it("✅ Rewards vont AU CONTRAT (pas à la treasury)", async function () {
      const rewardAmount = ethers.parseEther("3"); // 3 ETH

      console.log("\n      💰 AVANT DÉPÔT REWARDS:");
      const treasuryBefore = await ethers.provider.getBalance(treasury.address);
      const placeBefore = await ethers.provider.getBalance(await place.getAddress());
      const adminBefore = await ethers.provider.getBalance(admin.address);

      console.log("        Treasury:", ethers.formatEther(treasuryBefore), "ETH");
      console.log("        Place Contract:", ethers.formatEther(placeBefore), "ETH");
      console.log("        Admin:", ethers.formatEther(adminBefore), "ETH");

      // Admin dépose rewards
      const tx = await place.depositRewards({ value: rewardAmount });
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;

      console.log("\n      💰 APRÈS DÉPÔT REWARDS:");
      const treasuryAfter = await ethers.provider.getBalance(treasury.address);
      const placeAfter = await ethers.provider.getBalance(await place.getAddress());
      const adminAfter = await ethers.provider.getBalance(admin.address);

      console.log("        Treasury:", ethers.formatEther(treasuryAfter), "ETH");
      console.log("        Place Contract:", ethers.formatEther(placeAfter), "ETH");
      console.log("        Admin:", ethers.formatEther(adminAfter), "ETH");

      const treasuryDiff = treasuryAfter - treasuryBefore;
      const placeDiff = placeAfter - placeBefore;
      const adminDiff = adminAfter - adminBefore;

      console.log("\n      📊 DIFFÉRENCES:");
      console.log("        Treasury +:", ethers.formatEther(treasuryDiff), "ETH");
      console.log("        Place Contract +:", ethers.formatEther(placeDiff), "ETH");
      console.log("        Admin -:", ethers.formatEther(adminDiff + gasCost), "ETH");

      // Vérifications
      expect(treasuryDiff).to.equal(0n); // Treasury ne reçoit RIEN
      expect(placeDiff).to.equal(rewardAmount); // Le contrat reçoit TOUT
      expect(adminDiff + gasCost).to.equal(-rewardAmount); // Admin perd les rewards
    });

    it("✅ Claims prennent l'argent DU CONTRAT vers les users", async function () {
      const rewardAmount = ethers.parseEther("3"); // 3 ETH / 3 puzzles = 1 ETH each

      // Admin dépose rewards
      await place.depositRewards({ value: rewardAmount });

      console.log("\n      💰 AVANT CLAIMS:");
      const user1Before = await ethers.provider.getBalance(user1.address);
      const placeBefore = await ethers.provider.getBalance(await place.getAddress());

      console.log("        User1:", ethers.formatEther(user1Before), "ETH");
      console.log("        Place Contract:", ethers.formatEther(placeBefore), "ETH");

      // User1 claim
      const tx = await place.connect(user1).claimRewards(0);
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;

      console.log("\n      💰 APRÈS CLAIM USER1:");
      const user1After = await ethers.provider.getBalance(user1.address);
      const placeAfter = await ethers.provider.getBalance(await place.getAddress());

      console.log("        User1:", ethers.formatEther(user1After), "ETH");
      console.log("        Place Contract:", ethers.formatEther(placeAfter), "ETH");

      const user1Diff = user1After - user1Before;
      const placeDiff = placeAfter - placeBefore;

      console.log("\n      📊 DIFFÉRENCES:");
      console.log("        User1 +:", ethers.formatEther(user1Diff + gasCost), "ETH");
      console.log("        Place Contract -:", ethers.formatEther(placeDiff), "ETH");

      // 3 ETH / 3 puzzles = 1 ETH per puzzle
      const expectedReward = ethers.parseEther("1");

      expect(user1Diff + gasCost).to.equal(expectedReward);
      expect(placeDiff).to.equal(-expectedReward); // Le contrat perd 1 ETH
    });

    it("✅ TOUS les claims vident le contrat (PAS la treasury)", async function () {
      const rewardAmount = ethers.parseEther("3");

      await place.depositRewards({ value: rewardAmount });

      const treasuryBefore = await ethers.provider.getBalance(treasury.address);
      const placeBefore = await ethers.provider.getBalance(await place.getAddress());

      console.log("\n      💰 AVANT TOUS LES CLAIMS:");
      console.log("        Treasury:", ethers.formatEther(treasuryBefore), "ETH");
      console.log("        Place Contract:", ethers.formatEther(placeBefore), "ETH");

      // 3 users claim
      await place.connect(user1).claimRewards(0);
      await place.connect(user2).claimRewards(1);
      await place.connect(user3).claimRewards(2);

      const treasuryAfter = await ethers.provider.getBalance(treasury.address);
      const placeAfter = await ethers.provider.getBalance(await place.getAddress());

      console.log("\n      💰 APRÈS TOUS LES CLAIMS:");
      console.log("        Treasury:", ethers.formatEther(treasuryAfter), "ETH");
      console.log("        Place Contract:", ethers.formatEther(placeAfter), "ETH");

      const treasuryDiff = treasuryAfter - treasuryBefore;
      const placeDiff = placeAfter - placeBefore;

      console.log("\n      📊 TOTAL:");
      console.log("        Treasury changement:", ethers.formatEther(treasuryDiff), "ETH");
      console.log("        Place Contract -:", ethers.formatEther(placeDiff), "ETH");

      expect(treasuryDiff).to.equal(0n); // Treasury ne bouge PAS
      expect(placeDiff).to.equal(-rewardAmount); // Contrat a tout distribué
    });
  });

  describe("💰 5. RÉSUMÉ FLOW COMPLET", function () {
    it("📊 Flow complet: Achat → Rewards → Claims", async function () {
      console.log("\n      ====== FLOW COMPLET ======\n");

      // Balances initiales
      const treasuryInit = await ethers.provider.getBalance(treasury.address);
      const user1Init = await ethers.provider.getBalance(user1.address);
      const user2Init = await ethers.provider.getBalance(user2.address);
      const placeInit = await ethers.provider.getBalance(await place.getAddress());

      console.log("      💰 BALANCES INITIALES:");
      console.log("        Treasury:", ethers.formatEther(treasuryInit), "ETH");
      console.log("        User1:", ethers.formatEther(user1Init), "ETH");
      console.log("        User2:", ethers.formatEther(user2Init), "ETH");
      console.log("        Place Contract:", ethers.formatEther(placeInit), "ETH");

      // PHASE 1: Achats
      console.log("\n      📍 PHASE 1: ACHATS");
      const tx1 = await place.connect(user1).takePuzzle({ value: PUZZLE_PRICE });
      const r1 = await tx1.wait();
      const gas1 = r1.gasUsed * r1.gasPrice;

      const tx2 = await place.connect(user2).takePuzzle({ value: PUZZLE_PRICE });
      const r2 = await tx2.wait();
      const gas2 = r2.gasUsed * r2.gasPrice;

      const treasuryPhase1 = await ethers.provider.getBalance(treasury.address);
      const placePhase1 = await ethers.provider.getBalance(await place.getAddress());

      console.log("        Treasury +:", ethers.formatEther(treasuryPhase1 - treasuryInit), "ETH");
      console.log("        Place Contract +:", ethers.formatEther(placePhase1 - placeInit), "ETH");

      // PHASE 2: Fermeture + Rewards
      console.log("\n      📍 PHASE 2: FERMETURE + REWARDS");
      await time.increase(SALE_DURATION + 1);
      await place.closeSale();

      const rewardAmount = ethers.parseEther("2"); // 2 ETH
      await place.depositRewards({ value: rewardAmount });

      const placePhase2 = await ethers.provider.getBalance(await place.getAddress());

      console.log("        Place Contract +:", ethers.formatEther(placePhase2 - placePhase1), "ETH");

      // PHASE 3: Claims
      console.log("\n      📍 PHASE 3: CLAIMS");
      await place.connect(user1).claimRewards(0);
      await place.connect(user2).claimRewards(1);

      const treasuryFinal = await ethers.provider.getBalance(treasury.address);
      const user1Final = await ethers.provider.getBalance(user1.address);
      const user2Final = await ethers.provider.getBalance(user2.address);
      const placeFinal = await ethers.provider.getBalance(await place.getAddress());

      console.log("\n      💰 BALANCES FINALES:");
      console.log("        Treasury:", ethers.formatEther(treasuryFinal), "ETH");
      console.log("        User1:", ethers.formatEther(user1Final), "ETH");
      console.log("        User2:", ethers.formatEther(user2Final), "ETH");
      console.log("        Place Contract:", ethers.formatEther(placeFinal), "ETH");

      console.log("\n      📊 RÉSUMÉ COMPLET:");
      console.log("        Treasury NET +:", ethers.formatEther(treasuryFinal - treasuryInit), "ETH (ACHATS)");
      console.log("        User1 NET -:", ethers.formatEther(user1Init - user1Final - gas1), "ETH (achat - rewards)");
      console.log("        User2 NET -:", ethers.formatEther(user2Init - user2Final - gas2), "ETH (achat - rewards)");
      console.log("        Place Contract NET:", ethers.formatEther(placeFinal - placeInit), "ETH");

      // Vérifications
      expect(treasuryFinal - treasuryInit).to.equal(PUZZLE_PRICE * 2n); // Treasury: +0.2 ETH (achats)
      expect(placeFinal).to.be.closeTo(placeInit, ethers.parseEther("0.01")); // Contrat: ~0 ETH
    });
  });
});
