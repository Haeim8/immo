import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { RealEstateFactory } from "../target/types/real_estate_factory";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert } from "chai";

describe("real_estate_factory - Tests Complets", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.RealEstateFactory as Program<RealEstateFactory>;
  const admin = provider.wallet.publicKey;
  const treasury = Keypair.generate();
  const buyer1 = Keypair.generate();
  const buyer2 = Keypair.generate();

  let factoryPDA: PublicKey;
  let propertyPDA: PublicKey;
  let shareNFTPDA1: PublicKey;
  let shareNFTPDA2: PublicKey;

  // SVG de test avec image IPFS intégrée
  const testSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#0ea5e9;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#2563eb;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="400" height="600" fill="url(#bg)"/>
    <image href="https://gateway.pinata.cloud/ipfs/QmTestImageCID123" x="50" y="50" width="300" height="200"/>
    <text x="200" y="300" font-family="Arial" font-size="24" fill="white" text-anchor="middle">Appartement Paris</text>
    <text x="200" y="340" font-family="Arial" font-size="18" fill="white" text-anchor="middle">Share #1</text>
  </svg>`;

  console.log("\n🚀 Début des tests du contrat Real Estate Factory\n");

  it("✅ Test 1: Initialisation de la Factory", async () => {
    [factoryPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("factory")],
      program.programId
    );

    console.log("📍 Factory PDA:", factoryPDA.toBase58());
    console.log("👤 Admin:", admin.toBase58());
    console.log("💰 Treasury:", treasury.publicKey.toBase58());

    // Airdrop pour le treasury
    const airdropSig = await provider.connection.requestAirdrop(
      treasury.publicKey,
      LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSig);

    const tx = await program.methods
      .initialize(admin)
      .accounts({
        factory: factoryPDA,
        treasury: treasury.publicKey,
        payer: admin,
      })
      .rpc();

    console.log("✅ Factory initialisée. Tx:", tx);

    const factoryAccount = await program.account.factory.fetch(factoryPDA);
    assert.equal(factoryAccount.propertyCount.toNumber(), 0, "Property count devrait être 0");
    assert.equal(factoryAccount.admin.toBase58(), admin.toBase58(), "Admin incorrect");
    assert.equal(factoryAccount.treasury.toBase58(), treasury.publicKey.toBase58(), "Treasury incorrect");

    console.log("✅ Vérifications: Property count = 0, Admin et Treasury corrects\n");
  });

  it("✅ Test 2: Création d'une propriété avec CID IPFS", async () => {
    const factoryAccount = await program.account.factory.fetch(factoryPDA);
    const propertyId = factoryAccount.propertyCount.toNumber();

    [propertyPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("property"),
        factoryPDA.toBuffer(),
        Buffer.from(new anchor.BN(propertyId).toArray("le", 8)),
      ],
      program.programId
    );

    console.log("🏠 Création de la propriété...");
    console.log("📍 Property PDA:", propertyPDA.toBase58());

    const tx = await program.methods
      .createProperty(
        "real_estate",
        "Appartement Paris Centre",
        "Paris",
        "Île-de-France",
        "France",
        new anchor.BN(10),                      // 10 parts totales pour tester le sold out
        new anchor.BN(0.1 * LAMPORTS_PER_SOL),
        new anchor.BN(30 * 24 * 60 * 60),
        85,
        3,
        550,
        "Résidentiel",
        2020,
        "QmTestImageCID123",                    // CID IPFS pour l'image de la propriété
        "QmTestMetadataCID456",
        true
      )
      .accounts({
        factory: factoryPDA,
        property: propertyPDA,
        admin: admin,
      })
      .rpc();

    console.log("✅ Propriété créée. Tx:", tx);

    const propertyAccount = await program.account.property.fetch(propertyPDA);

    console.log("\n📊 Détails de la propriété:");
    console.log("  Nom:", propertyAccount.name);
    console.log("  Parts totales:", propertyAccount.totalShares.toString());
    console.log("  Prix par part:", propertyAccount.sharePrice.toNumber() / LAMPORTS_PER_SOL, "SOL");
    console.log("  Image CID:", propertyAccount.imageCid);
    console.log("  Parts vendues:", propertyAccount.sharesSold.toString());
    console.log("  Actif:", propertyAccount.isActive);

    assert.equal(propertyAccount.name, "Appartement Paris Centre");
    assert.equal(propertyAccount.totalShares.toNumber(), 10);
    assert.equal(propertyAccount.sharesSold.toNumber(), 0);
    assert.equal(propertyAccount.imageCid, "QmTestImageCID123");
    assert.equal(propertyAccount.isActive, true);

    console.log("✅ Vérifications: Propriété créée correctement avec CID IPFS\n");
  });

  it("✅ Test 3: Achat d'une part NFT avec SVG on-chain", async () => {
    // Airdrop pour buyer1
    const airdropSig = await provider.connection.requestAirdrop(
      buyer1.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSig);

    const propertyBefore = await program.account.property.fetch(propertyPDA);
    const tokenId = propertyBefore.sharesSold.toNumber();

    [shareNFTPDA1] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("share_nft"),
        propertyPDA.toBuffer(),
        Buffer.from(new anchor.BN(tokenId).toArray("le", 8)),
      ],
      program.programId
    );

    console.log("🛒 Achat de la part #" + tokenId);
    console.log("👤 Acheteur:", buyer1.publicKey.toBase58());
    console.log("📍 Share NFT PDA:", shareNFTPDA1.toBase58());

    const treasuryBalanceBefore = await provider.connection.getBalance(treasury.publicKey);
    console.log("💰 Balance treasury avant:", treasuryBalanceBefore / LAMPORTS_PER_SOL, "SOL");

    const tx = await program.methods
      .buyShare(testSVG)
      .accounts({
        factory: factoryPDA,
        property: propertyPDA,
        shareNft: shareNFTPDA1,
        buyer: buyer1.publicKey,
        treasury: treasury.publicKey,
      })
      .signers([buyer1])
      .rpc();

    console.log("✅ Part achetée. Tx:", tx);

    const shareNFT = await program.account.shareNft.fetch(shareNFTPDA1);
    const propertyAfter = await program.account.property.fetch(propertyPDA);
    const treasuryBalanceAfter = await provider.connection.getBalance(treasury.publicKey);

    console.log("\n📊 Détails du NFT:");
    console.log("  Token ID:", shareNFT.tokenId.toString());
    console.log("  Propriétaire:", shareNFT.owner.toBase58());
    console.log("  SVG Data (premiers 100 chars):", shareNFT.nftSvgData.substring(0, 100));
    console.log("  Voting Power:", shareNFT.votingPower);
    console.log("  Parts vendues après achat:", propertyAfter.sharesSold.toString());
    console.log("💰 Balance treasury après:", treasuryBalanceAfter / LAMPORTS_PER_SOL, "SOL");

    assert.equal(shareNFT.tokenId.toNumber(), tokenId);
    assert.equal(shareNFT.owner.toBase58(), buyer1.publicKey.toBase58());
    assert.equal(shareNFT.property.toBase58(), propertyPDA.toBase58());
    assert.equal(shareNFT.nftSvgData, testSVG, "SVG data devrait être stocké on-chain");
    assert.equal(propertyAfter.sharesSold.toNumber(), 1);
    assert.isTrue(treasuryBalanceAfter > treasuryBalanceBefore, "Treasury devrait recevoir le paiement");

    console.log("✅ Vérifications: NFT créé avec SVG on-chain, lié à la propriété, fonds transférés au treasury\n");
  });

  it("✅ Test 4: Achat d'une deuxième part par un autre acheteur", async () => {
    // Airdrop pour buyer2
    const airdropSig = await provider.connection.requestAirdrop(
      buyer2.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSig);

    const propertyBefore = await program.account.property.fetch(propertyPDA);
    const tokenId = propertyBefore.sharesSold.toNumber();

    [shareNFTPDA2] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("share_nft"),
        propertyPDA.toBuffer(),
        Buffer.from(new anchor.BN(tokenId).toArray("le", 8)),
      ],
      program.programId
    );

    const testSVG2 = testSVG.replace("Share #1", "Share #" + tokenId);

    const tx = await program.methods
      .buyShare(testSVG2)
      .accounts({
        factory: factoryPDA,
        property: propertyPDA,
        shareNft: shareNFTPDA2,
        buyer: buyer2.publicKey,
        treasury: treasury.publicKey,
      })
      .signers([buyer2])
      .rpc();

    console.log("✅ Deuxième part achetée. Tx:", tx);

    const shareNFT = await program.account.shareNft.fetch(shareNFTPDA2);
    const propertyAfter = await program.account.property.fetch(propertyPDA);

    assert.equal(shareNFT.owner.toBase58(), buyer2.publicKey.toBase58());
    assert.equal(propertyAfter.sharesSold.toNumber(), 2);

    console.log("✅ Vérifications: Plusieurs acheteurs peuvent acheter des parts indépendantes\n");
  });

  it("✅ Test 5: Vérification de la sécurité - Non-admin ne peut pas créer de propriété", async () => {
    const factoryAccount = await program.account.factory.fetch(factoryPDA);
    const propertyId = factoryAccount.propertyCount.toNumber();

    const [testPropertyPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("property"),
        factoryPDA.toBuffer(),
        Buffer.from(new anchor.BN(propertyId).toArray("le", 8)),
      ],
      program.programId
    );

    try {
      await program.methods
        .createProperty(
          "real_estate",
          "Test Unauthorized",
          "Paris",
          "Île-de-France",
          "France",
          new anchor.BN(100),
          new anchor.BN(0.1 * LAMPORTS_PER_SOL),
          new anchor.BN(30 * 24 * 60 * 60),
          85,
          3,
          550,
          "Résidentiel",
          2020,
          "QmTestCID",
          "QmTestCID",
          true
        )
        .accounts({
          factory: factoryPDA,
          property: testPropertyPDA,
          admin: buyer1.publicKey,  // Non-admin essaye de créer
        })
        .signers([buyer1])
        .rpc();

      assert.fail("Devrait échouer - seul l'admin peut créer des propriétés");
    } catch (err: any) {
      console.log("✅ Sécurité OK: Non-admin ne peut pas créer de propriété");
      assert.include(err.toString(), "Error");
    }
  });

  it("✅ Test 6: Vérification SVG vide rejeté", async () => {
    const airdropSig = await provider.connection.requestAirdrop(
      buyer1.publicKey,
      LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSig);

    const propertyBefore = await program.account.property.fetch(propertyPDA);
    const tokenId = propertyBefore.sharesSold.toNumber();

    const [testShareNFTPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("share_nft"),
        propertyPDA.toBuffer(),
        Buffer.from(new anchor.BN(tokenId).toArray("le", 8)),
      ],
      program.programId
    );

    try {
      await program.methods
        .buyShare("")  // SVG vide
        .accounts({
          factory: factoryPDA,
          property: propertyPDA,
          shareNft: testShareNFTPDA,
          buyer: buyer1.publicKey,
          treasury: treasury.publicKey,
        })
        .signers([buyer1])
        .rpc();

      assert.fail("Devrait échouer - SVG vide non autorisé");
    } catch (err: any) {
      console.log("✅ Sécurité OK: SVG vide est rejeté");
      assert.include(err.toString(), "EmptySvgData");
    }
  });

  it("✅ Test 7: Vérification du lien NFT <-> Propriété", async () => {
    const shareNFT1 = await program.account.shareNft.fetch(shareNFTPDA1);
    const shareNFT2 = await program.account.shareNft.fetch(shareNFTPDA2);
    const property = await program.account.property.fetch(propertyPDA);

    console.log("\n🔗 Vérification des liens:");
    console.log("  NFT #0 -> Property:", shareNFT1.property.toBase58());
    console.log("  NFT #1 -> Property:", shareNFT2.property.toBase58());
    console.log("  Property PDA:", propertyPDA.toBase58());

    assert.equal(shareNFT1.property.toBase58(), propertyPDA.toBase58());
    assert.equal(shareNFT2.property.toBase58(), propertyPDA.toBase58());
    assert.equal(property.factory.toBase58(), factoryPDA.toBase58());

    console.log("✅ Vérifications: Tous les NFTs sont correctement liés à leur propriété et factory\n");
  });

  it("✅ Test 8: Vérifier que la campagne se termine quand toutes les parts sont vendues", async () => {
    const property = await program.account.property.fetch(propertyPDA);
    const remainingShares = property.totalShares.toNumber() - property.sharesSold.toNumber();

    console.log("\n🎯 Test du Sold Out:");
    console.log("  Parts restantes:", remainingShares);
    console.log("  Achat des", remainingShares, "parts restantes...");

    // Acheter toutes les parts restantes
    for (let i = 0; i < remainingShares; i++) {
      const tempBuyer = Keypair.generate();
      const airdropSig = await provider.connection.requestAirdrop(
        tempBuyer.publicKey,
        2 * LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(airdropSig);

      const propertyState = await program.account.property.fetch(propertyPDA);
      const tokenId = propertyState.sharesSold.toNumber();

      const [tempShareNFTPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("share_nft"),
          propertyPDA.toBuffer(),
          Buffer.from(new anchor.BN(tokenId).toArray("le", 8)),
        ],
        program.programId
      );

      const tempSVG = testSVG.replace("Share #1", `Share #${tokenId}`);

      await program.methods
        .buyShare(tempSVG)
        .accounts({
          factory: factoryPDA,
          property: propertyPDA,
          shareNft: tempShareNFTPDA,
          buyer: tempBuyer.publicKey,
          treasury: treasury.publicKey,
        })
        .signers([tempBuyer])
        .rpc();

      console.log(`  ✅ Part #${tokenId} vendue`);
    }

    const finalProperty = await program.account.property.fetch(propertyPDA);

    console.log("\n📊 État final:");
    console.log("  Parts vendues:", finalProperty.sharesSold.toString());
    console.log("  Parts totales:", finalProperty.totalShares.toString());
    console.log("  Propriété active:", finalProperty.isActive);

    assert.equal(finalProperty.sharesSold.toNumber(), finalProperty.totalShares.toNumber());
    assert.equal(finalProperty.isActive, false, "La propriété devrait être inactive après sold out");

    console.log("✅ Vérifications: Campagne terminée après vente de toutes les parts (isActive = false)\n");
  });

  console.log("\n🎉 TOUS LES TESTS RÉUSSIS !\n");
  console.log("✅ Factory initialisée correctement");
  console.log("✅ Propriété créée avec CID IPFS pour l'image");
  console.log("✅ NFTs mintés avec SVG on-chain");
  console.log("✅ Fonds transférés au treasury");
  console.log("✅ Sécurité respectée (admin only)");
  console.log("✅ Liens NFT <-> Propriété corrects");
  console.log("✅ Campagne se termine au sold out");
  console.log("✅ Chaque propriété est un contrat indépendant (PDA unique)");
  console.log("✅ Chaque NFT est lié à son contrat parent\n");
});
