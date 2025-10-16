import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import fs from "fs";
import path from "path";
import IDL from "../lib/solana/idl.json";

// Try multiple RPC endpoints (public devnet can be slow)
const DEVNET_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
const FACTORY_PROGRAM_ID = new PublicKey("FHJRtDYhehFJ6Xmh3iCXHQr94YHiYZgdNcZLKf7gXYho");

async function initializeFactory() {
  console.log("\n🚀 Initializing Factory on Devnet...\n");

  // Load wallet
  const walletPath = path.join(process.cwd(), ".walletkeypair1.json");
  const walletKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
  );

  console.log("Admin Wallet:", walletKeypair.publicKey.toBase58());

  // Setup connection and provider
  const connection = new Connection(DEVNET_RPC, "confirmed");
  const wallet = new Wallet(walletKeypair);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });

  // Get program
  const program = new Program(IDL as any, provider);

  // Derive Factory PDA
  const [factoryPDA, factoryBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("factory")],
    FACTORY_PROGRAM_ID
  );

  console.log("Factory PDA:", factoryPDA.toBase58());

  try {
    // Check if factory already exists
    const factoryAccount = await connection.getAccountInfo(factoryPDA);
    if (factoryAccount) {
      console.log("\n✅ Factory already initialized!");
      const factory = await program.account.factory.fetch(factoryPDA);
      console.log("   Admin:", factory.admin.toBase58());
      console.log("   Treasury:", factory.treasury.toBase58());
      console.log("   Property Count:", factory.propertyCount.toString());
      return;
    }

    // Initialize factory
    console.log("\n📝 Sending initialize transaction...");
    const tx = await program.methods
      .initialize()
      .accounts({
        factory: factoryPDA,
        admin: walletKeypair.publicKey,
        treasury: walletKeypair.publicKey, // Using same wallet as treasury
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("\n✅ Factory initialized successfully!");
    console.log("   Transaction:", tx);
    console.log("   Factory PDA:", factoryPDA.toBase58());
    console.log("   Admin:", walletKeypair.publicKey.toBase58());

    // Fetch and display factory data
    const factory = await program.account.factory.fetch(factoryPDA);
    console.log("\n📊 Factory Data:");
    console.log("   Admin:", factory.admin.toBase58());
    console.log("   Treasury:", factory.treasury.toBase58());
    console.log("   Property Count:", factory.propertyCount.toString());
    console.log("   Bump:", factory.bump);

  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    if (error.logs) {
      console.error("\nProgram Logs:");
      error.logs.forEach((log: string) => console.error("  ", log));
    }
  }
}

initializeFactory().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
