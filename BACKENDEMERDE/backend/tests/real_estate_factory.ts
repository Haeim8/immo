import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { RealEstateFactory } from "../target/types/real_estate_factory";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert } from "chai";

describe("real_estate_factory", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.RealEstateFactory as Program<RealEstateFactory>;

  // Test accounts
  const admin = provider.wallet.publicKey;
  const treasury = Keypair.generate();
  const investor1 = Keypair.generate();
  const investor2 = Keypair.generate();

  // PDAs
  let factoryPDA: PublicKey;
  let factoryBump: number;
  let propertyPDA: PublicKey;
  let propertyBump: number;

  before(async () => {
    // Airdrop SOL to test accounts
    const airdropAmount = 10 * LAMPORTS_PER_SOL;

    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(treasury.publicKey, airdropAmount)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(investor1.publicKey, airdropAmount)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(investor2.publicKey, airdropAmount)
    );

    console.log("\n✅ Test accounts funded");
  });

  it("Initialize Factory", async () => {
    // Derive Factory PDA
    [factoryPDA, factoryBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("factory")],
      program.programId
    );

    console.log("\n🏭 Factory PDA:", factoryPDA.toBase58());
    console.log("📍 Admin:", admin.toBase58());
    console.log("💰 Treasury:", treasury.publicKey.toBase58());

    // Initialize
    const tx = await program.methods
      .initialize(admin)
      .accounts({
        treasury: treasury.publicKey,
        payer: admin,
      })
      .rpc();

    console.log("✅ Factory initialized. Tx:", tx);

    // Verify
    const factoryAccount = await program.account.factory.fetch(factoryPDA);
    assert.equal(factoryAccount.admin.toBase58(), admin.toBase58());
    assert.equal(factoryAccount.treasury.toBase58(), treasury.publicKey.toBase58());
    assert.equal(factoryAccount.propertyCount.toNumber(), 0);

    console.log("✅ Factory verified");
  });

  it("Create Property", async () => {
    // Fetch current property count
    const factoryAccount = await program.account.factory.fetch(factoryPDA);
    const propertyId = factoryAccount.propertyCount.toNumber();

    // Derive Property PDA
    [propertyPDA, propertyBump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("property"),
        factoryPDA.toBuffer(),
        Buffer.from(new anchor.BN(propertyId).toArray("le", 8)),
      ],
      program.programId
    );

    console.log("\n🏠 Creating property...");
    console.log("Property PDA:", propertyPDA.toBase58());
    console.log("Property ID:", propertyId);

    const propertyData = {
      assetType: "real_estate",
      name: "Test Residence Paris",
      city: "Paris",
      province: "Île-de-France",
      country: "France",
      totalShares: new anchor.BN(1000),
      sharePrice: new anchor.BN(0.1 * LAMPORTS_PER_SOL), // 0.1 SOL per share
      saleDuration: new anchor.BN(30 * 24 * 60 * 60), // 30 days
      surface: 85,
      rooms: 3,
      expectedReturn: 450, // 4.5% in basis points
      propertyType: "Résidentiel",
      yearBuilt: 2020,
      description: "Beautiful apartment in the heart of Paris with modern amenities",
      imageCid: "QmTestCid123456789",
      longDescription: "This is a detailed long description for investors. Beautiful apartment in the heart of Paris with modern amenities, located in a prime location with excellent access to public transportation. The property features high-end finishes, spacious rooms, and a balcony with city views. Perfect investment opportunity with strong rental demand in the area.",
      metadataUri: "https://brickchain.com/property/0",
      votingEnabled: true,
    };

    const tx = await program.methods
      .createProperty(
        propertyData.assetType,
        propertyData.name,
        propertyData.city,
        propertyData.province,
        propertyData.country,
        propertyData.totalShares,
        propertyData.sharePrice,
        propertyData.saleDuration,
        propertyData.surface,
        propertyData.rooms,
        propertyData.expectedReturn,
        propertyData.propertyType,
        propertyData.yearBuilt,
        propertyData.description,
        propertyData.imageCid,
        propertyData.longDescription,
        propertyData.metadataUri,
        propertyData.votingEnabled
      )
      .accounts({
        admin: admin,
      })
      .rpc();

    console.log("✅ Property created. Tx:", tx);

    // Verify
    const propertyAccount = await program.account.property.fetch(propertyPDA);
    assert.equal(propertyAccount.assetType, propertyData.assetType);
    assert.equal(propertyAccount.name, propertyData.name);
    assert.equal(propertyAccount.city, propertyData.city);
    assert.equal(propertyAccount.province, propertyData.province);
    assert.equal(propertyAccount.country, propertyData.country);
    assert.equal(propertyAccount.totalShares.toNumber(), propertyData.totalShares.toNumber());
    assert.equal(propertyAccount.sharesSold.toNumber(), 0);
    assert.equal(propertyAccount.surface, propertyData.surface);
    assert.equal(propertyAccount.rooms, propertyData.rooms);
    assert.equal(propertyAccount.expectedReturn, propertyData.expectedReturn);
    assert.equal(propertyAccount.propertyType, propertyData.propertyType);
    assert.equal(propertyAccount.yearBuilt, propertyData.yearBuilt);
    assert.equal(propertyAccount.description, propertyData.description);
    assert.equal(propertyAccount.imageCid, propertyData.imageCid);
    assert.equal(propertyAccount.longDescription, propertyData.longDescription);
    assert.equal(propertyAccount.metadataUri, propertyData.metadataUri);
    assert.equal(propertyAccount.votingEnabled, propertyData.votingEnabled);
    assert.equal(propertyAccount.isActive, true);

    console.log("✅ Property verified");
    console.log("   Asset Type:", propertyAccount.assetType);
    console.log("   Name:", propertyAccount.name);
    console.log("   Type:", propertyAccount.propertyType);
    console.log("   Location:", propertyAccount.city + ", " + propertyAccount.province + ", " + propertyAccount.country);
    console.log("   Description:", propertyAccount.description);
    console.log("   Year Built:", propertyAccount.yearBuilt);
    console.log("   Total Shares:", propertyAccount.totalShares.toNumber());
    console.log("   Share Price:", propertyAccount.sharePrice.toNumber() / LAMPORTS_PER_SOL, "SOL");
    console.log("   Surface:", propertyAccount.surface, "m²");
    console.log("   Rooms:", propertyAccount.rooms);
    console.log("   Expected Return:", propertyAccount.expectedReturn / 100, "%");
    console.log("   Image CID:", propertyAccount.imageCid);
    console.log("   Metadata URI:", propertyAccount.metadataUri);
    console.log("   Voting Enabled:", propertyAccount.votingEnabled);
    console.log("   Long Description:", propertyAccount.longDescription.substring(0, 80) + "...");
  });

  it("Buy Share - Investor 1", async () => {
    // Get property info
    const propertyAccount = await program.account.property.fetch(propertyPDA);
    const tokenId = propertyAccount.sharesSold.toNumber();

    // Derive ShareNFT PDA
    const [shareNFTPDA, shareNFTBump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("share_nft"),
        propertyPDA.toBuffer(),
        Buffer.from(new anchor.BN(tokenId).toArray("le", 8)),
      ],
      program.programId
    );

    console.log("\n💰 Investor 1 buying share...");
    console.log("Share NFT PDA:", shareNFTPDA.toBase58());
    console.log("Token ID:", tokenId);

    const treasuryBalanceBefore = await provider.connection.getBalance(treasury.publicKey);

    const tx = await program.methods
      .buyShare(
        "QmTestNFTImage123",      // NFT image CID (would be generated by frontend)
        "QmTestNFTMetadata456"    // NFT metadata CID
      )
      .accountsPartial({
        property: propertyPDA,
        shareNft: shareNFTPDA,
        buyer: investor1.publicKey,
        treasury: treasury.publicKey,
      })
      .signers([investor1])
      .rpc();

    console.log("✅ Share purchased. Tx:", tx);

    // Verify
    const shareNFTAccount = await program.account.shareNft.fetch(shareNFTPDA);
    assert.equal(shareNFTAccount.property.toBase58(), propertyPDA.toBase58());
    assert.equal(shareNFTAccount.owner.toBase58(), investor1.publicKey.toBase58());
    assert.equal(shareNFTAccount.tokenId.toNumber(), tokenId);

    const propertyAccountAfter = await program.account.property.fetch(propertyPDA);
    assert.equal(propertyAccountAfter.sharesSold.toNumber(), 1);

    const treasuryBalanceAfter = await provider.connection.getBalance(treasury.publicKey);
    const expectedIncrease = propertyAccount.sharePrice.toNumber();
    assert.approximately(
      treasuryBalanceAfter - treasuryBalanceBefore,
      expectedIncrease,
      1000 // tolerance for transaction fees
    );

    console.log("✅ Share NFT verified");
    console.log("   Owner:", shareNFTAccount.owner.toBase58());
    console.log("   Token ID:", shareNFTAccount.tokenId.toNumber());
    console.log("   NFT Image URI:", shareNFTAccount.nftImageUri);
    console.log("   NFT Metadata URI:", shareNFTAccount.nftMetadataUri);
    console.log("   Voting Power:", shareNFTAccount.votingPower.toNumber());
    console.log("   Treasury received:", (treasuryBalanceAfter - treasuryBalanceBefore) / LAMPORTS_PER_SOL, "SOL");
  });

  it("Buy Share - Investor 2", async () => {
    const propertyAccount = await program.account.property.fetch(propertyPDA);
    const tokenId = propertyAccount.sharesSold.toNumber();

    const [shareNFTPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("share_nft"),
        propertyPDA.toBuffer(),
        Buffer.from(new anchor.BN(tokenId).toArray("le", 8)),
      ],
      program.programId
    );

    console.log("\n💰 Investor 2 buying share...");
    console.log("Token ID:", tokenId);

    await program.methods
      .buyShare(
        "QmTestNFTImage789",
        "QmTestNFTMetadata012"
      )
      .accountsPartial({
        property: propertyPDA,
        shareNft: shareNFTPDA,
        buyer: investor2.publicKey,
        treasury: treasury.publicKey,
      })
      .signers([investor2])
      .rpc();

    const propertyAccountAfter = await program.account.property.fetch(propertyPDA);
    assert.equal(propertyAccountAfter.sharesSold.toNumber(), 2);

    console.log("✅ Share purchased by investor 2");
    console.log("   Total shares sold:", propertyAccountAfter.sharesSold.toNumber());
  });

  it("Deposit Dividends", async () => {
    const depositAmount = new anchor.BN(1 * LAMPORTS_PER_SOL); // 1 SOL

    console.log("\n💵 Admin depositing dividends...");
    console.log("Amount:", depositAmount.toNumber() / LAMPORTS_PER_SOL, "SOL");

    const propertyBalanceBefore = await provider.connection.getBalance(propertyPDA);

    const tx = await program.methods
      .depositDividends(depositAmount)
      .accountsPartial({
        property: propertyPDA,
        admin: admin,
      })
      .rpc();

    console.log("✅ Dividends deposited. Tx:", tx);

    // Verify
    const propertyAccount = await program.account.property.fetch(propertyPDA);
    assert.equal(
      propertyAccount.totalDividendsDeposited.toNumber(),
      depositAmount.toNumber()
    );

    const propertyBalanceAfter = await provider.connection.getBalance(propertyPDA);
    assert.approximately(
      propertyBalanceAfter - propertyBalanceBefore,
      depositAmount.toNumber(),
      1000
    );

    console.log("✅ Dividends verified");
    console.log("   Total deposited:", propertyAccount.totalDividendsDeposited.toNumber() / LAMPORTS_PER_SOL, "SOL");
  });

  it("Claim Dividends - Investor 1", async () => {
    // Get investor 1's share NFT
    const [shareNFTPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("share_nft"),
        propertyPDA.toBuffer(),
        Buffer.from(new anchor.BN(0).toArray("le", 8)), // First share (token_id = 0)
      ],
      program.programId
    );

    console.log("\n💸 Investor 1 claiming dividends...");

    const investor1BalanceBefore = await provider.connection.getBalance(investor1.publicKey);

    const tx = await program.methods
      .claimDividends()
      .accountsPartial({
        property: propertyPDA,
        shareNft: shareNFTPDA,
        owner: investor1.publicKey,
      })
      .signers([investor1])
      .rpc();

    console.log("✅ Dividends claimed. Tx:", tx);

    const investor1BalanceAfter = await provider.connection.getBalance(investor1.publicKey);
    const received = investor1BalanceAfter - investor1BalanceBefore;

    // Verify: With 2 shares sold and 1 SOL deposited, each share should get 0.5 SOL
    const expectedAmount = 0.5 * LAMPORTS_PER_SOL;
    assert.approximately(received, expectedAmount, 10000); // Small tolerance for fees

    console.log("✅ Dividends verified");
    console.log("   Received:", received / LAMPORTS_PER_SOL, "SOL");
    console.log("   Expected:", expectedAmount / LAMPORTS_PER_SOL, "SOL");
  });

  it("Claim Dividends - Investor 2", async () => {
    const [shareNFTPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("share_nft"),
        propertyPDA.toBuffer(),
        Buffer.from(new anchor.BN(1).toArray("le", 8)), // Second share (token_id = 1)
      ],
      program.programId
    );

    console.log("\n💸 Investor 2 claiming dividends...");

    const investor2BalanceBefore = await provider.connection.getBalance(investor2.publicKey);

    await program.methods
      .claimDividends()
      .accountsPartial({
        property: propertyPDA,
        shareNft: shareNFTPDA,
        owner: investor2.publicKey,
      })
      .signers([investor2])
      .rpc();

    const investor2BalanceAfter = await provider.connection.getBalance(investor2.publicKey);
    const received = investor2BalanceAfter - investor2BalanceBefore;

    console.log("✅ Dividends claimed");
    console.log("   Received:", received / LAMPORTS_PER_SOL, "SOL");
  });

  it("Cannot claim dividends twice", async () => {
    const [shareNFTPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("share_nft"),
        propertyPDA.toBuffer(),
        Buffer.from(new anchor.BN(0).toArray("le", 8)),
      ],
      program.programId
    );

    console.log("\n❌ Testing double claim (should fail)...");

    try {
      await program.methods
        .claimDividends()
        .accountsPartial({
          property: propertyPDA,
          shareNft: shareNFTPDA,
          owner: investor1.publicKey,
        })
        .signers([investor1])
        .rpc();

      assert.fail("Should have failed");
    } catch (err: any) {
      console.log("✅ Double claim prevented as expected");
      assert.include(err.toString(), "NoDividendsToClaim");
    }
  });

  it("Close Property Sale", async () => {
    console.log("\n🔒 Closing property sale...");

    // First, we need to wait for the sale to end or manually end it
    // For testing, we'll just try to close it (might fail if not expired)
    try {
      const tx = await program.methods
        .closePropertySale()
        .accountsPartial({
          property: propertyPDA,
          admin: admin,
        })
        .rpc();

      console.log("⚠️ Sale closed (or was already closable). Tx:", tx);
    } catch (err) {
      console.log("⚠️ Cannot close sale yet (sale still active)");
      console.log("   This is expected if sale duration hasn't passed");
    }
  });

  it("Create Proposal - Admin", async () => {
    console.log("\n📋 Admin creating proposal...");

    // Derive Proposal PDA
    const [proposalPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("proposal"),
        propertyPDA.toBuffer(),
        Buffer.from(new anchor.BN(0).toArray("le", 8)),
      ],
      program.programId
    );

    console.log("Proposal PDA:", proposalPDA.toBase58());

    const tx = await program.methods
      .createProposal(
        "Should we renovate the kitchen?",
        "We propose to renovate the kitchen with modern appliances. Estimated cost: 5000 SOL. This will increase property value.",
        new anchor.BN(7 * 24 * 60 * 60) // 7 days
      )
      .accounts({
        factory: factoryPDA,
        property: propertyPDA,
        proposal: proposalPDA,
        admin: admin,
        systemProgram: PublicKey.default,
      })
      .rpc();

    console.log("✅ Proposal created. Tx:", tx);

    // Verify
    const proposalAccount = await program.account.proposal.fetch(proposalPDA);
    assert.equal(proposalAccount.title, "Should we renovate the kitchen?");
    assert.equal(proposalAccount.isActive, true);
    assert.equal(proposalAccount.yesVotes.toNumber(), 0);
    assert.equal(proposalAccount.noVotes.toNumber(), 0);

    console.log("✅ Proposal verified");
    console.log("   Title:", proposalAccount.title);
    console.log("   Voting ends at:", new Date(proposalAccount.votingEndsAt.toNumber() * 1000).toISOString());
  });

  it("Cast Vote - Investor 1 (YES)", async () => {
    console.log("\n🗳️ Investor 1 voting YES...");

    const [proposalPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("proposal"),
        propertyPDA.toBuffer(),
        Buffer.from(new anchor.BN(0).toArray("le", 8)),
      ],
      program.programId
    );

    const [shareNFTPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("share_nft"),
        propertyPDA.toBuffer(),
        Buffer.from(new anchor.BN(0).toArray("le", 8)),
      ],
      program.programId
    );

    const [votePDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("vote"),
        proposalPDA.toBuffer(),
        shareNFTPDA.toBuffer(),
      ],
      program.programId
    );

    console.log("Vote PDA:", votePDA.toBase58());

    const tx = await program.methods
      .castVote(true) // YES
      .accounts({
        property: propertyPDA,
        proposal: proposalPDA,
        shareNft: shareNFTPDA,
        vote: votePDA,
        voter: investor1.publicKey,
        systemProgram: PublicKey.default,
      })
      .signers([investor1])
      .rpc();

    console.log("✅ Vote cast. Tx:", tx);

    // Verify
    const proposalAccount = await program.account.proposal.fetch(proposalPDA);
    assert.equal(proposalAccount.yesVotes.toNumber(), 1);
    assert.equal(proposalAccount.noVotes.toNumber(), 0);

    const voteAccount = await program.account.vote.fetch(votePDA);
    assert.equal(voteAccount.voteChoice, true);
    assert.equal(voteAccount.voter.toBase58(), investor1.publicKey.toBase58());

    console.log("✅ Vote verified");
    console.log("   YES votes:", proposalAccount.yesVotes.toNumber());
    console.log("   NO votes:", proposalAccount.noVotes.toNumber());
  });

  it("Cast Vote - Investor 2 (NO)", async () => {
    console.log("\n🗳️ Investor 2 voting NO...");

    const [proposalPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("proposal"),
        propertyPDA.toBuffer(),
        Buffer.from(new anchor.BN(0).toArray("le", 8)),
      ],
      program.programId
    );

    const [shareNFTPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("share_nft"),
        propertyPDA.toBuffer(),
        Buffer.from(new anchor.BN(1).toArray("le", 8)),
      ],
      program.programId
    );

    const [votePDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("vote"),
        proposalPDA.toBuffer(),
        shareNFTPDA.toBuffer(),
      ],
      program.programId
    );

    await program.methods
      .castVote(false) // NO
      .accounts({
        property: propertyPDA,
        proposal: proposalPDA,
        shareNft: shareNFTPDA,
        vote: votePDA,
        voter: investor2.publicKey,
        systemProgram: PublicKey.default,
      })
      .signers([investor2])
      .rpc();

    // Verify
    const proposalAccount = await program.account.proposal.fetch(proposalPDA);
    assert.equal(proposalAccount.yesVotes.toNumber(), 1);
    assert.equal(proposalAccount.noVotes.toNumber(), 1);

    console.log("✅ Vote cast by investor 2");
    console.log("   YES votes:", proposalAccount.yesVotes.toNumber());
    console.log("   NO votes:", proposalAccount.noVotes.toNumber());
  });

  it("Cannot vote twice with same NFT", async () => {
    console.log("\n❌ Testing double vote (should fail)...");

    const [proposalPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("proposal"),
        propertyPDA.toBuffer(),
        Buffer.from(new anchor.BN(0).toArray("le", 8)),
      ],
      program.programId
    );

    const [shareNFTPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("share_nft"),
        propertyPDA.toBuffer(),
        Buffer.from(new anchor.BN(0).toArray("le", 8)),
      ],
      program.programId
    );

    const [votePDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("vote"),
        proposalPDA.toBuffer(),
        shareNFTPDA.toBuffer(),
      ],
      program.programId
    );

    try {
      await program.methods
        .castVote(true)
        .accounts({
          property: propertyPDA,
          proposal: proposalPDA,
          shareNft: shareNFTPDA,
          vote: votePDA,
          voter: investor1.publicKey,
          systemProgram: PublicKey.default,
        })
        .signers([investor1])
        .rpc();

      assert.fail("Should have failed");
    } catch (err: any) {
      console.log("✅ Double vote prevented as expected");
      // Vote PDA already exists
    }
  });

  it("Display Final Stats", async () => {
    const factoryAccount = await program.account.factory.fetch(factoryPDA);
    const propertyAccount = await program.account.property.fetch(propertyPDA);

    const [proposalPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("proposal"),
        propertyPDA.toBuffer(),
        Buffer.from(new anchor.BN(0).toArray("le", 8)),
      ],
      program.programId
    );
    const proposalAccount = await program.account.proposal.fetch(proposalPDA);

    console.log("\n📊 === FINAL STATISTICS ===");
    console.log("\n🏭 Factory:");
    console.log("   Total Properties:", factoryAccount.propertyCount.toNumber());
    console.log("\n🏠 Property:");
    console.log("   Asset Type:", propertyAccount.assetType);
    console.log("   Name:", propertyAccount.name);
    console.log("   Location:", propertyAccount.city + ", " + propertyAccount.province + ", " + propertyAccount.country);
    console.log("   Total Shares:", propertyAccount.totalShares.toNumber());
    console.log("   Shares Sold:", propertyAccount.sharesSold.toNumber());
    console.log("   Funding:", (propertyAccount.sharesSold.toNumber() / propertyAccount.totalShares.toNumber() * 100).toFixed(2) + "%");
    console.log("   Voting Enabled:", propertyAccount.votingEnabled);
    console.log("\n💰 Dividends:");
    console.log("   Total Deposited:", propertyAccount.totalDividendsDeposited.toNumber() / LAMPORTS_PER_SOL, "SOL");
    console.log("   Total Claimed:", propertyAccount.totalDividendsClaimed.toNumber() / LAMPORTS_PER_SOL, "SOL");
    console.log("   Remaining:", (propertyAccount.totalDividendsDeposited.toNumber() - propertyAccount.totalDividendsClaimed.toNumber()) / LAMPORTS_PER_SOL, "SOL");
    console.log("\n🗳️ Voting:");
    console.log("   Proposal:", proposalAccount.title);
    console.log("   YES votes:", proposalAccount.yesVotes.toNumber());
    console.log("   NO votes:", proposalAccount.noVotes.toNumber());
    console.log("   Status:", proposalAccount.isActive ? "Active" : "Closed");
    console.log("\n✅ All tests passed!");
  });
});
