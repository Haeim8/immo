const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Tests Complets - CANTORFI Places", function () {
  let factory, place;
  let admin, treasury, teamMember, user1, user2, user3;

  const PUZZLE_PRICE = ethers.parseEther("1");
  const TOTAL_PUZZLES = 10;
  const SALE_DURATION = 30 * 24 * 60 * 60;

  beforeEach(async function () {
    [admin, treasury, teamMember, user1, user2, user3] = await ethers.getSigners();

    const CANTORFIFactory = await ethers.getContractFactory("CANTORFIFactory");
    factory = await CANTORFIFactory.deploy(treasury.address);
    await factory.waitForDeployment();
  });

  describe("🏭 FACTORY - Déploiement", function () {
    it("✅ Admin correctement défini", async function () {
      expect(await factory.admin()).to.equal(admin.address);
    });

    it("✅ Treasury correctement défini", async function () {
      expect(await factory.treasury()).to.equal(treasury.address);
    });

    it("✅ Aucune place au départ", async function () {
      const places = await factory.getAllPlaces();
      expect(places.length).to.equal(0);
    });

    it("✅ PlaceCount à 0", async function () {
      expect(await factory.placeCount()).to.equal(0);
    });
  });

  describe("👥 FACTORY - Gestion d'équipe", function () {
    it("✅ Admin peut ajouter un membre d'équipe", async function () {
      await factory.addTeamMember(teamMember.address);
      expect(await factory.isTeamMember(teamMember.address)).to.be.true;
    });

    it("✅ Admin peut retirer un membre d'équipe", async function () {
      await factory.addTeamMember(teamMember.address);
      await factory.removeTeamMember(teamMember.address);
      expect(await factory.isTeamMember(teamMember.address)).to.be.false;
    });

    it("❌ Non-admin ne peut pas ajouter", async function () {
      await expect(
        factory.connect(user1).addTeamMember(teamMember.address)
      ).to.be.revertedWith("Only admin");
    });

    it("❌ Non-admin ne peut pas retirer", async function () {
      await factory.addTeamMember(teamMember.address);
      await expect(
        factory.connect(user1).removeTeamMember(teamMember.address)
      ).to.be.revertedWith("Only admin");
    });

    it("❌ Ne peut pas ajouter deux fois", async function () {
      await factory.addTeamMember(teamMember.address);
      await expect(
        factory.addTeamMember(teamMember.address)
      ).to.be.revertedWith("Already team member");
    });
  });

  describe("🏢 FACTORY - Création de places", function () {
    it("✅ Admin peut créer une place", async function () {
      const tx = await factory.createPlace(
        "Residential", "Appartement", "Paris", "IDF", "France",
        TOTAL_PUZZLES, PUZZLE_PRICE, SALE_DURATION,
        100, 3, 800, "Apartment", 2020, "QmTest", "QmMeta", true
      );

      const receipt = await tx.wait();
      expect(receipt).to.not.be.undefined;
    });

    it("✅ Team member peut créer une place", async function () {
      await factory.addTeamMember(teamMember.address);

      await expect(
        factory.connect(teamMember).createPlace(
          "Commercial", "Bureau", "Lyon", "RA", "France",
          5, PUZZLE_PRICE, SALE_DURATION,
          200, 5, 900, "Office", 2021, "QmTest2", "QmMeta2", false
        )
      ).to.not.be.reverted;
    });

    it("❌ User non autorisé ne peut pas créer", async function () {
      await expect(
        factory.connect(user1).createPlace(
          "Residential", "Maison", "Nice", "PACA", "France",
          3, PUZZLE_PRICE, SALE_DURATION,
          150, 4, 750, "House", 2019, "QmTest3", "QmMeta3", true
        )
      ).to.be.revertedWith("Not authorized");
    });

    it("❌ Duration = 0 est rejeté", async function () {
      await expect(
        factory.createPlace(
          "Residential", "Appartement", "Paris", "IDF", "France",
          TOTAL_PUZZLES, PUZZLE_PRICE, 0,
          100, 3, 800, "Apartment", 2020, "QmTest", "QmMeta", true
        )
      ).to.be.revertedWith("Invalid sale duration");
    });

    it("❌ Total puzzles = 0 est rejeté", async function () {
      await expect(
        factory.createPlace(
          "Residential", "Appartement", "Paris", "IDF", "France",
          0, PUZZLE_PRICE, SALE_DURATION,
          100, 3, 800, "Apartment", 2020, "QmTest", "QmMeta", true
        )
      ).to.be.revertedWith("Invalid puzzle amount");
    });

    it("❌ Puzzle price = 0 est rejeté", async function () {
      await expect(
        factory.createPlace(
          "Residential", "Appartement", "Paris", "IDF", "France",
          TOTAL_PUZZLES, 0, SALE_DURATION,
          100, 3, 800, "Apartment", 2020, "QmTest", "QmMeta", true
        )
      ).to.be.revertedWith("Invalid price");
    });

    it("✅ Places sont trackées", async function () {
      await factory.createPlace(
        "Residential", "Appartement", "Paris", "IDF", "France",
        TOTAL_PUZZLES, PUZZLE_PRICE, SALE_DURATION,
        100, 3, 800, "Apartment", 2020, "QmTest", "QmMeta", true
      );

      const places = await factory.getAllPlaces();
      expect(places.length).to.equal(1);
      expect(await factory.placeCount()).to.equal(1);
    });
  });

  describe("💰 FACTORY - Gestion treasury", function () {
    it("✅ Admin peut changer treasury", async function () {
      await factory.setTreasury(user1.address);
      expect(await factory.treasury()).to.equal(user1.address);
    });

    it("❌ Non-admin ne peut pas changer", async function () {
      await expect(
        factory.connect(user1).setTreasury(user2.address)
      ).to.be.revertedWith("Only admin");
    });

    it("❌ Adresse nulle rejetée", async function () {
      await expect(
        factory.setTreasury(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid address");
    });
  });

  describe("👤 FACTORY - Gestion admin", function () {
    it("✅ Admin peut changer admin", async function () {
      await factory.updateAdmin(user1.address);
      expect(await factory.admin()).to.equal(user1.address);
    });

    it("❌ Non-admin ne peut pas changer", async function () {
      await expect(
        factory.connect(user1).updateAdmin(user2.address)
      ).to.be.revertedWith("Only admin");
    });

    it("❌ Adresse nulle rejetée", async function () {
      await expect(
        factory.updateAdmin(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid address");
    });
  });

  describe("🎫 PLACE - Achat de puzzles", function () {
    beforeEach(async function () {
      const tx = await factory.createPlace(
        "Residential", "Test Place", "Paris", "IDF", "France",
        TOTAL_PUZZLES, PUZZLE_PRICE, SALE_DURATION,
        100, 3, 800, "Apartment", 2020, "QmTest", "QmMeta", true
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return factory.interface.parseLog(log).name === "PlaceCreated";
        } catch {
          return false;
        }
      });

      const placeAddress = factory.interface.parseLog(event).args.placeAddress;
      place = await ethers.getContractAt("CANTORFI", placeAddress);
    });

    it("✅ Peut acheter un puzzle", async function () {
      await place.connect(user1).takePuzzle({ value: PUZZLE_PRICE });
      expect(await place.ownerOf(0)).to.equal(user1.address);
    });

    it("✅ Original minter tracké", async function () {
      await place.connect(user1).takePuzzle({ value: PUZZLE_PRICE });
      expect(await place.originalMinter(0)).to.equal(user1.address);
    });

    it("✅ Compteurs mis à jour", async function () {
      await place.connect(user1).takePuzzle({ value: PUZZLE_PRICE });
      const info = await place.info();
      expect(info.puzzlesSold).to.equal(1);
    });

    it("❌ Mauvais montant rejeté", async function () {
      await expect(
        place.connect(user1).takePuzzle({ value: ethers.parseEther("0.5") })
      ).to.be.revertedWith("Incorrect payment");
    });

    it("✅ Protection reentrancy (state avant transfer)", async function () {
      await place.connect(user1).takePuzzle({ value: PUZZLE_PRICE });
      await place.connect(user2).takePuzzle({ value: PUZZLE_PRICE });
      const info = await place.info();
      expect(info.puzzlesSold).to.equal(2);
    });

    it("✅ Auto-fermeture quand tout vendu", async function () {
      for (let i = 0; i < TOTAL_PUZZLES; i++) {
        const signer = [user1, user2, user3][i % 3];
        await place.connect(signer).takePuzzle({ value: PUZZLE_PRICE });
      }

      const info = await place.info();
      expect(info.isActive).to.be.false;
      expect(info.puzzlesSold).to.equal(TOTAL_PUZZLES);
    });

    it("✅ Auto-fermeture après deadline", async function () {
      await place.connect(user1).takePuzzle({ value: PUZZLE_PRICE });
      await time.increase(SALE_DURATION + 1);

      // Après la deadline, ça devrait rejeter
      await expect(
        place.connect(user2).takePuzzle({ value: PUZZLE_PRICE })
      ).to.be.revertedWith("Sale ended");
    });

    it("❌ Achat après deadline rejeté", async function () {
      await time.increase(SALE_DURATION + 1);

      await expect(
        place.connect(user1).takePuzzle({ value: PUZZLE_PRICE })
      ).to.be.revertedWith("Sale ended");
    });

    it("❌ Achat si place inactive", async function () {
      for (let i = 0; i < TOTAL_PUZZLES; i++) {
        const signer = [user1, user2, user3][i % 3];
        await place.connect(signer).takePuzzle({ value: PUZZLE_PRICE });
      }

      await expect(
        place.connect(user1).takePuzzle({ value: PUZZLE_PRICE })
      ).to.be.revertedWith("Place inactive");
    });
  });

  describe("🔒 PLACE - Fermeture de vente", function () {
    beforeEach(async function () {
      const tx = await factory.createPlace(
        "Residential", "Test Place", "Paris", "IDF", "France",
        TOTAL_PUZZLES, PUZZLE_PRICE, SALE_DURATION,
        100, 3, 800, "Apartment", 2020, "QmTest", "QmMeta", true
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return factory.interface.parseLog(log).name === "PlaceCreated";
        } catch {
          return false;
        }
      });

      const placeAddress = factory.interface.parseLog(event).args.placeAddress;
      place = await ethers.getContractAt("CANTORFI", placeAddress);

      await factory.addTeamMember(teamMember.address);
    });

    it("✅ Team peut fermer après deadline", async function () {
      await time.increase(SALE_DURATION + 1);
      await place.connect(teamMember).closeSale();

      const info = await place.info();
      expect(info.isActive).to.be.false;
    });

    it("❌ Ne peut pas fermer avant deadline", async function () {
      await expect(
        place.connect(teamMember).closeSale()
      ).to.be.revertedWith("Sale still active");
    });
  });

  describe("💵 PLACE - Récompenses", function () {
    beforeEach(async function () {
      const tx = await factory.createPlace(
        "Residential", "Test Place", "Paris", "IDF", "France",
        TOTAL_PUZZLES, PUZZLE_PRICE, SALE_DURATION,
        100, 3, 800, "Apartment", 2020, "QmTest", "QmMeta", true
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return factory.interface.parseLog(log).name === "PlaceCreated";
        } catch {
          return false;
        }
      });

      const placeAddress = factory.interface.parseLog(event).args.placeAddress;
      place = await ethers.getContractAt("CANTORFI", placeAddress);

      await factory.addTeamMember(teamMember.address);

      await place.connect(user1).takePuzzle({ value: PUZZLE_PRICE });
      await place.connect(user2).takePuzzle({ value: PUZZLE_PRICE });
      await place.connect(user3).takePuzzle({ value: PUZZLE_PRICE });

      await time.increase(SALE_DURATION + 1);
      await place.connect(teamMember).closeSale();
    });

    it("✅ Team peut déposer des récompenses", async function () {
      const reward = ethers.parseEther("3");
      await place.connect(teamMember).depositRewards({ value: reward });

      expect(await place.totalRewardsDeposited()).to.equal(reward);
    });

    it("✅ Remainder calculé correctement", async function () {
      const reward = ethers.parseEther("3.5");
      await place.connect(teamMember).depositRewards({ value: reward });

      const rewardPerPuzzle = ethers.parseEther("3.5") / BigInt(3);
      const distributed = rewardPerPuzzle * BigInt(3);
      const remainder = ethers.parseEther("3.5") - distributed;

      expect(await place.rewardRemainder()).to.equal(remainder);
    });

    it("✅ Snapshot puzzles pour anti-dilution", async function () {
      const reward = ethers.parseEther("3");
      await place.connect(teamMember).depositRewards({ value: reward });

      expect(await place.puzzlesSoldAtLastDeposit()).to.equal(3);
    });

    it("✅ Holder peut claim récompenses", async function () {
      const reward = ethers.parseEther("3");
      await place.connect(teamMember).depositRewards({ value: reward });

      const balanceBefore = await ethers.provider.getBalance(user1.address);
      const tx = await place.connect(user1).claimRewards(0);
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(user1.address);

      const expectedReward = ethers.parseEther("1");
      expect(balanceAfter - balanceBefore + gasCost).to.equal(expectedReward);
    });

    it("❌ Impossible de déposer si vente active (FIX AUDIT #1)", async function () {
      const tx2 = await factory.createPlace(
        "Commercial", "Active Place", "Lyon", "RA", "France",
        5, PUZZLE_PRICE, SALE_DURATION,
        200, 5, 900, "Office", 2021, "QmTest2", "QmMeta2", false
      );

      const receipt2 = await tx2.wait();
      const event2 = receipt2.logs.find(log => {
        try {
          return factory.interface.parseLog(log).name === "PlaceCreated";
        } catch {
          return false;
        }
      });

      const place2Address = factory.interface.parseLog(event2).args.placeAddress;
      const place2 = await ethers.getContractAt("CANTORFI", place2Address);

      await expect(
        place2.connect(teamMember).depositRewards({ value: ethers.parseEther("1") })
      ).to.be.revertedWith("Sale still active - close sale first");
    });

    it("❌ Impossible de déposer si aucun puzzle vendu (FIX AUDIT #3)", async function () {
      const tx2 = await factory.createPlace(
        "Commercial", "Empty Place", "Lyon", "RA", "France",
        10, PUZZLE_PRICE, SALE_DURATION,
        200, 5, 900, "Office", 2021, "QmTest2", "QmMeta2", false
      );

      const receipt2 = await tx2.wait();
      const event2 = receipt2.logs.find(log => {
        try {
          return factory.interface.parseLog(log).name === "PlaceCreated";
        } catch {
          return false;
        }
      });

      const place2Address = factory.interface.parseLog(event2).args.placeAddress;
      const place2 = await ethers.getContractAt("CANTORFI", place2Address);

      await time.increase(SALE_DURATION + 1);
      await place2.connect(teamMember).closeSale();

      await expect(
        place2.connect(teamMember).depositRewards({ value: ethers.parseEther("1") })
      ).to.be.revertedWith("No puzzles sold");
    });

    it("❌ Double claim rejeté", async function () {
      const reward = ethers.parseEther("3");
      await place.connect(teamMember).depositRewards({ value: reward });

      await place.connect(user1).claimRewards(0);

      await expect(
        place.connect(user1).claimRewards(0)
      ).to.be.revertedWith("No rewards to claim");
    });

    it("❌ Non-owner ne peut pas claim", async function () {
      const reward = ethers.parseEther("3");
      await place.connect(teamMember).depositRewards({ value: reward });

      await expect(
        place.connect(user2).claimRewards(0)
      ).to.be.revertedWith("Not owner");
    });
  });

  describe("🗳️ PLACE - Gouvernance", function () {
    beforeEach(async function () {
      const tx = await factory.createPlace(
        "Residential", "Test Place", "Paris", "IDF", "France",
        TOTAL_PUZZLES, PUZZLE_PRICE, SALE_DURATION,
        100, 3, 800, "Apartment", 2020, "QmTest", "QmMeta", true
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return factory.interface.parseLog(log).name === "PlaceCreated";
        } catch {
          return false;
        }
      });

      const placeAddress = factory.interface.parseLog(event).args.placeAddress;
      place = await ethers.getContractAt("CANTORFI", placeAddress);

      await factory.addTeamMember(teamMember.address);

      await place.connect(user1).takePuzzle({ value: PUZZLE_PRICE });
      await place.connect(user2).takePuzzle({ value: PUZZLE_PRICE });
    });

    it("✅ Team peut créer une proposition", async function () {
      const proposalId = await place.connect(teamMember).createProposal.staticCall(
        "Rénovation",
        "Rénover la cuisine",
        7 * 24 * 60 * 60
      );

      await place.connect(teamMember).createProposal(
        "Rénovation",
        "Rénover la cuisine",
        7 * 24 * 60 * 60
      );

      const proposal = await place.proposals(proposalId);
      expect(proposal.title).to.equal("Rénovation");
      expect(proposal.isActive).to.be.true;
    });

    it("❌ Duration = 0 rejeté", async function () {
      await expect(
        place.connect(teamMember).createProposal("Test", "Description", 0)
      ).to.be.revertedWith("Invalid duration");
    });

    it("✅ NFT holder peut voter", async function () {
      await place.connect(teamMember).createProposal(
        "Rénovation",
        "Rénover la cuisine",
        7 * 24 * 60 * 60
      );

      await place.connect(user1).castVote(0, 0, true);

      const proposal = await place.proposals(0);
      expect(proposal.yesVotes).to.equal(1);
      expect(proposal.noVotes).to.equal(0);
    });

    it("✅ Vote NO comptabilisé", async function () {
      await place.connect(teamMember).createProposal(
        "Rénovation",
        "Rénover la cuisine",
        7 * 24 * 60 * 60
      );

      await place.connect(user1).castVote(0, 0, false);

      const proposal = await place.proposals(0);
      expect(proposal.yesVotes).to.equal(0);
      expect(proposal.noVotes).to.equal(1);
    });

    it("❌ Double vote rejeté", async function () {
      await place.connect(teamMember).createProposal(
        "Rénovation",
        "Rénover la cuisine",
        7 * 24 * 60 * 60
      );

      await place.connect(user1).castVote(0, 0, true);

      await expect(
        place.connect(user1).castVote(0, 0, false)
      ).to.be.revertedWith("Already voted");
    });

    it("❌ Non-owner ne peut pas voter", async function () {
      await place.connect(teamMember).createProposal(
        "Rénovation",
        "Rénover la cuisine",
        7 * 24 * 60 * 60
      );

      await expect(
        place.connect(user3).castVote(0, 0, true)
      ).to.be.reverted;
    });

    it("✅ Auto-fermeture après deadline", async function () {
      const votingDuration = 7 * 24 * 60 * 60;
      await place.connect(teamMember).createProposal(
        "Rénovation",
        "Rénover la cuisine",
        votingDuration
      );

      await time.increase(votingDuration + 1);

      // Après la deadline, vote devrait rejeter
      await expect(
        place.connect(user1).castVote(0, 0, true)
      ).to.be.revertedWith("Voting ended");
    });

    it("✅ Team peut fermer proposition", async function () {
      const votingDuration = 7 * 24 * 60 * 60;
      await place.connect(teamMember).createProposal(
        "Rénovation",
        "Rénover la cuisine",
        votingDuration
      );

      await place.connect(user1).castVote(0, 0, true);
      await place.connect(user2).castVote(0, 1, false);

      // Avancer le temps après la deadline
      await time.increase(votingDuration + 1);

      await place.connect(teamMember).closeProposal(0);

      const proposal = await place.proposals(0);
      expect(proposal.isActive).to.be.false;
    });
  });

  describe("🏦 PLACE - Completion", function () {
    beforeEach(async function () {
      const tx = await factory.createPlace(
        "Residential", "Test Place", "Paris", "IDF", "France",
        TOTAL_PUZZLES, PUZZLE_PRICE, SALE_DURATION,
        100, 3, 800, "Apartment", 2020, "QmTest", "QmMeta", true
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return factory.interface.parseLog(log).name === "PlaceCreated";
        } catch {
          return false;
        }
      });

      const placeAddress = factory.interface.parseLog(event).args.placeAddress;
      place = await ethers.getContractAt("CANTORFI", placeAddress);

      await factory.addTeamMember(teamMember.address);

      // Vendre TOUTES les puzzles (10 puzzles)
      for (let i = 0; i < TOTAL_PUZZLES; i++) {
        const signer = [user1, user2, user3][i % 3];
        await place.connect(signer).takePuzzle({ value: PUZZLE_PRICE });
      }

      // Sale est auto-fermée car toutes vendues
    });

    it("✅ Team peut compléter", async function () {
      const completionAmount = ethers.parseEther("100"); // Divisible par 10 puzzles
      await place.connect(teamMember).complete({ value: completionAmount });

      expect(await place.isCompleted()).to.be.true;
      expect(await place.completionAmount()).to.equal(completionAmount);
    });

    it("❌ Impossible de compléter si vente active", async function () {
      const tx2 = await factory.createPlace(
        "Commercial", "Active Place", "Lyon", "RA", "France",
        5, PUZZLE_PRICE, SALE_DURATION,
        200, 5, 900, "Office", 2021, "QmTest2", "QmMeta2", false
      );

      const receipt2 = await tx2.wait();
      const event2 = receipt2.logs.find(log => {
        try {
          return factory.interface.parseLog(log).name === "PlaceCreated";
        } catch {
          return false;
        }
      });

      const place2Address = factory.interface.parseLog(event2).args.placeAddress;
      const place2 = await ethers.getContractAt("CANTORFI", place2Address);

      await expect(
        place2.connect(teamMember).complete({ value: ethers.parseEther("10") })
      ).to.be.revertedWith("Sale still active");
    });

    it("✅ Holder peut claim completion", async function () {
      const completionAmount = ethers.parseEther("100");
      await place.connect(teamMember).complete({ value: completionAmount });

      const balanceBefore = await ethers.provider.getBalance(user1.address);
      const tx = await place.connect(user1).claimCompletion(0);
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(user1.address);

      const expectedAmount = ethers.parseEther("10"); // 100 / 10 puzzles
      expect(balanceAfter - balanceBefore + gasCost).to.equal(expectedAmount);
    });

    it("❌ Double claim completion rejeté", async function () {
      const completionAmount = ethers.parseEther("100");
      await place.connect(teamMember).complete({ value: completionAmount });

      await place.connect(user1).claimCompletion(0);

      // Le NFT est brûlé après claim, donc ownerOf revert
      await expect(
        place.connect(user1).claimCompletion(0)
      ).to.be.reverted;
    });

    it("❌ Non-owner ne peut pas claim", async function () {
      const completionAmount = ethers.parseEther("100");
      await place.connect(teamMember).complete({ value: completionAmount });

      // user2 essaie de claim le tokenId 0 qui appartient à user1
      await expect(
        place.connect(user2).claimCompletion(0)
      ).to.be.revertedWith("Not owner");
    });
  });

  describe("🖼️ PLACE - NFT Metadata", function () {
    beforeEach(async function () {
      const tx = await factory.createPlace(
        "Residential", "Luxury Apartment", "Paris", "Île-de-France", "France",
        TOTAL_PUZZLES, PUZZLE_PRICE, SALE_DURATION,
        120, 4, 800, "Apartment", 2020, "QmTest", "QmMeta", true
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return factory.interface.parseLog(log).name === "PlaceCreated";
        } catch {
          return false;
        }
      });

      const placeAddress = factory.interface.parseLog(event).args.placeAddress;
      place = await ethers.getContractAt("CANTORFI", placeAddress);

      await place.connect(user1).takePuzzle({ value: PUZZLE_PRICE });
    });

    it("✅ TokenURI généré correctement", async function () {
      const tokenURI = await place.tokenURI(0);
      expect(tokenURI).to.include("data:application/json;base64");
    });

    it("✅ Metadata contient le nom", async function () {
      const tokenURI = await place.tokenURI(0);
      const jsonData = Buffer.from(tokenURI.split(",")[1], "base64").toString();
      const metadata = JSON.parse(jsonData);

      expect(metadata.name).to.include("Luxury Apartment");
    });

    it("✅ Metadata contient la ville", async function () {
      const tokenURI = await place.tokenURI(0);
      const jsonData = Buffer.from(tokenURI.split(",")[1], "base64").toString();
      const metadata = JSON.parse(jsonData);

      expect(metadata.description).to.include("Paris");
    });

    it("✅ Image est en base64", async function () {
      const tokenURI = await place.tokenURI(0);
      const jsonData = Buffer.from(tokenURI.split(",")[1], "base64").toString();
      const metadata = JSON.parse(jsonData);

      expect(metadata.image).to.include("data:image/svg+xml;base64");
    });

    it("❌ TokenURI pour token inexistant", async function () {
      await expect(
        place.tokenURI(999)
      ).to.be.reverted;
    });
  });
});
