import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { RealEstateFactory } from "../target/types/real_estate_factory";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";

describe("real_estate_factory", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.RealEstateFactory as Program<RealEstateFactory>;
  const admin = provider.wallet.publicKey;
  const treasury = Keypair.generate();

  let factoryPDA: PublicKey;
  let propertyPDA: PublicKey;

  it("Initialize Factory", async () => {
    [factoryPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("factory")],
      program.programId
    );

    console.log("Factory PDA:", factoryPDA.toBase58());
    console.log("Admin:", admin.toBase58());
    console.log("Treasury:", treasury.publicKey.toBase58());

    const tx = await program.methods
      .initialize(admin)
      .accounts({
        factory: factoryPDA,
        treasury: treasury.publicKey,
        payer: admin,
      })
      .rpc();

    console.log("✅ Factory initialized. Tx:", tx);

    const factoryAccount = await program.account.factory.fetch(factoryPDA);
    console.log("Property count:", factoryAccount.propertyCount.toString());
  });

  it("Create Property", async () => {
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

    console.log("\nCreating property...");
    console.log("Property PDA:", propertyPDA.toBase58());

    const tx = await program.methods
      .createProperty(
        "real_estate",                          // asset_type
        "Appartement Paris Centre",             // name
        "Paris",                                // city
        "Île-de-France",                        // province
        "France",                               // country
        new anchor.BN(1000),                    // total_shares
        new anchor.BN(0.1 * LAMPORTS_PER_SOL),  // share_price (0.1 SOL)
        new anchor.BN(30 * 24 * 60 * 60),       // sale_duration (30 days)
        85,                                     // surface (85 m²)
        3,                                      // rooms
        550,                                    // expected_return (5.50%)
        "Résidentiel",                          // property_type
        2020,                                   // year_built
        "QmTestImageCID123",                    // image_cid
        "QmTestMetadataCID456",                 // metadata_cid
        true                                    // voting_enabled
      )
      .accounts({
        factory: factoryPDA,
        property: propertyPDA,
        admin: admin,
      })
      .rpc();

    console.log("✅ Property created. Tx:", tx);

    const propertyAccount = await program.account.property.fetch(propertyPDA);
    console.log("\n📊 Property Details:");
    console.log("  Name:", propertyAccount.name);
    console.log("  Type:", propertyAccount.assetType);
    console.log("  Location:", propertyAccount.city + ", " + propertyAccount.country);
    console.log("  Total Shares:", propertyAccount.totalShares.toString());
    console.log("  Share Price:", propertyAccount.sharePrice.toNumber() / LAMPORTS_PER_SOL, "SOL");
    console.log("  Surface:", propertyAccount.surface, "m²");
    console.log("  Rooms:", propertyAccount.rooms);
    console.log("  Expected Return:", propertyAccount.expectedReturn / 100, "%");
    console.log("  Year Built:", propertyAccount.yearBuilt);
    console.log("  Image CID:", propertyAccount.imageCid);
    console.log("  Metadata CID:", propertyAccount.metadataCid);
    console.log("  Voting Enabled:", propertyAccount.votingEnabled);
    console.log("  Is Active:", propertyAccount.isActive);
    console.log("  Shares Sold:", propertyAccount.sharesSold.toString());
  });
});
