const anchor = require("@coral-xyz/anchor");
const { Connection, Keypair, PublicKey, SystemProgram } = require("@solana/web3.js");
const fs = require("fs");
const path = require("path");

const DEVNET_RPC = "https://devnet.helius-rpc.com/?api-key=63dbbc9b-8494-47cd-a994-e46760e6db47";
const FACTORY_PROGRAM_ID = new PublicKey("H8S27aKztqdyCPZCPUvmAahSDBrTrw5ahCjQbJpzSECL");

async function main() {
  console.log("\n🚀 Initializing Factory on Devnet...\n");

  // Load wallet
  const walletPath = path.join(process.cwd(), ".walletkeypair1.json");
  const walletKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
  );

  console.log("Admin Wallet:", walletKeypair.publicKey.toBase58());
  console.log("RPC:", DEVNET_RPC);

  // Setup connection
  const connection = new Connection(DEVNET_RPC, "confirmed");

  // Check balance
  const balance = await connection.getBalance(walletKeypair.publicKey);
  console.log("Balance:", balance / 1e9, "SOL\n");

  // Derive Factory PDA
  const [factoryPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("factory")],
    FACTORY_PROGRAM_ID
  );

  console.log("Factory PDA:", factoryPDA.toBase58());

  // Check if factory already exists
  const factoryAccount = await connection.getAccountInfo(factoryPDA);
  if (factoryAccount) {
    console.log("\n✅ Factory already initialized!");
    return;
  }

  // Load IDL
  const idl = JSON.parse(fs.readFileSync(path.join(__dirname, "../lib/solana/idl.json"), "utf-8"));

  // Create provider
  const wallet = new anchor.Wallet(walletKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  const program = new anchor.Program(idl, provider);

  console.log("\n📝 Sending initialize transaction...");

  try {
    const tx = await program.methods
      .initialize(walletKeypair.publicKey) // admin as argument
      .accounts({
        factory: factoryPDA,
        treasury: walletKeypair.publicKey,
        payer: walletKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("\n✅ Factory initialized successfully!");
    console.log("Transaction:", tx);
    console.log("Factory PDA:", factoryPDA.toBase58());

    // Wait for confirmation
    await connection.confirmTransaction(tx, "confirmed");

    // Fetch factory data
    const factory = await program.account.factory.fetch(factoryPDA);
    console.log("\n📊 Factory Data:");
    console.log("   Admin:", factory.admin.toBase58());
    console.log("   Treasury:", factory.treasury.toBase58());
    console.log("   Property Count:", factory.propertyCount.toString());

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    if (error.logs) {
      console.error("\nProgram Logs:");
      error.logs.forEach(log => console.error("  ", log));
    }
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
