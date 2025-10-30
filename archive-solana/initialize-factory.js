const fs = require("fs");
const path = require("path");
const { PublicKey, Connection, Transaction, SystemProgram, clusterApiUrl, TransactionInstruction, Keypair } = require("@solana/web3.js");

async function main() {
const PROGRAM_ID = new PublicKey("HZp9dtYNuCC7AUapf8FZmdU83S5UH8AU21ffbpTTXQ6J");
  const factorySeed = Buffer.from("factory");

  const walletPath =
    process.env.WALLET_PATH ||
    path.resolve(process.env.HOME || "", ".config/solana/id.json");

  if (!fs.existsSync(walletPath)) {
    throw new Error(`Wallet file not found at ${walletPath}`);
  }

  const secret = JSON.parse(fs.readFileSync(walletPath, "utf8"));
  const payer = Keypair.fromSecretKey(new Uint8Array(secret));

  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  const [factoryPDA] = PublicKey.findProgramAddressSync([factorySeed], PROGRAM_ID);
  const adminPubkey = new PublicKey(process.env.ADMIN_PUBKEY || payer.publicKey.toBase58());
  const treasury = new PublicKey(process.env.TREASURY_PUBKEY || payer.publicKey.toBase58());

  console.log("Using wallet:", payer.publicKey.toBase58());
  console.log("Factory PDA:", factoryPDA.toBase58());
  console.log("Admin:", adminPubkey.toBase58());
  console.log("Treasury:", treasury.toBase58());

  try {
    const accountInfo = await connection.getAccountInfo(factoryPDA);
    if (accountInfo) {
      console.log("Factory already initialized.");
      return;
    }
  } catch (err) {
    console.error("Error checking factory account:", err);
  }

  const discriminator = Buffer.from([175, 175, 109, 31, 13, 152, 155, 237]);
  const data = Buffer.concat([discriminator, adminPubkey.toBuffer()]);

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: factoryPDA, isSigner: false, isWritable: true },
      { pubkey: treasury, isSigner: false, isWritable: false },
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });

  const tx = new Transaction().add(ix);

  const sig = await connection.sendTransaction(tx, [payer]);
  console.log("Initialize transaction signature:", sig);
  const confirmation = await connection.confirmTransaction(sig, "confirmed");
  if (confirmation.value.err) {
    console.error("Transaction failed:", confirmation.value.err);
  } else {
    console.log("Factory initialized successfully.");
  }
}

main()
  .then(() => {
    console.log("Done.");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
