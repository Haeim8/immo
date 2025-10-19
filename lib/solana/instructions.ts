import {
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Connection,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { AnchorProvider, Program, BN, Wallet } from "@coral-xyz/anchor";
import {
  FACTORY_PROGRAM_ID,
  CreatePropertyParams,
  Property,
  ShareNFT,
  Factory,
} from "./types";
import IDL from "./idl.json";

// Type for the Anchor Program
export type RealEstateFactoryProgram = Program<typeof IDL>;

// Create program instance
export function getProgram(provider: AnchorProvider): RealEstateFactoryProgram {
  return new Program(IDL as any, provider) as RealEstateFactoryProgram;
}

// Helper to create a read-only wallet for queries
function createReadOnlyWallet(): Wallet {
  return {
    publicKey: PublicKey.default,
    signTransaction: async (tx: Transaction) => tx,
    signAllTransactions: async (txs: Transaction[]) => txs,
  };
}

// PDA helpers
export function getFactoryPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("factory")],
    FACTORY_PROGRAM_ID
  );
}

export function getPropertyPDA(
  factoryPubkey: PublicKey,
  propertyId: number
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("property"),
      factoryPubkey.toBuffer(),
      new BN(propertyId).toArray("le", 8),
    ],
    FACTORY_PROGRAM_ID
  );
}

export function getShareNFTPDA(
  propertyPubkey: PublicKey,
  tokenId: number
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("share_nft"),
      propertyPubkey.toBuffer(),
      new BN(tokenId).toArray("le", 8),
    ],
    FACTORY_PROGRAM_ID
  );
}

// Initialize factory (admin only)
export async function initializeFactory(
  program: RealEstateFactoryProgram,
  admin: PublicKey,
  treasury: PublicKey,
  payer: PublicKey
): Promise<string> {
  const [factoryPDA] = getFactoryPDA();

  const tx = await program.methods
    .initialize(admin)
    .accounts({
      factory: factoryPDA,
      treasury: treasury,
      payer: payer,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return tx;
}

// Create a new property
export async function createProperty(
  connection: Connection,
  params: CreatePropertyParams,
  admin: PublicKey
): Promise<{ transaction: Transaction; propertyPDA: PublicKey; propertyId: number }> {
  const provider = new AnchorProvider(connection, createReadOnlyWallet(), {});
  const program = getProgram(provider);

  const [factoryPDA] = getFactoryPDA();

  // Fetch factory to get property count
  const factoryAccount = await program.account.factory.fetch(factoryPDA);
  const propertyId = factoryAccount.propertyCount.toNumber();

  const [propertyPDA] = getPropertyPDA(factoryPDA, propertyId);

  const instruction = await program.methods
    .createProperty(
      params.assetType,
      params.name,
      params.city,
      params.province,
      params.country,
      new BN(params.totalShares),
      new BN(params.sharePrice),
      new BN(params.saleDuration),
      params.surface,
      params.rooms,
      params.expectedReturn,
      params.propertyType,
      params.yearBuilt,
      params.imageCid,
      params.metadataCid,
      params.votingEnabled
    )
    .accounts({
      factory: factoryPDA,
      property: propertyPDA,
      admin: admin,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  const transaction = new Transaction().add(instruction);

  return { transaction, propertyPDA, propertyId };
}

/**
 * Buy a share NFT with on-chain SVG data
 * This is the main function to use for buying shares
 */
export async function buyShare(
  connection: Connection,
  propertyPDA: PublicKey,
  buyer: PublicKey,
  nftSvgData: string
): Promise<{ transaction: Transaction; shareNFTPDA: PublicKey; tokenId: number }> {
  const provider = new AnchorProvider(connection, createReadOnlyWallet(), {});
  const program = getProgram(provider);

  const [factoryPDA] = getFactoryPDA();

  // Fetch property to get shares sold and treasury
  const propertyAccount = await program.account.property.fetch(propertyPDA);
  const tokenId = propertyAccount.sharesSold.toNumber();

  // Fetch factory to get treasury
  const factoryAccount = await program.account.factory.fetch(factoryPDA);
  const treasury = factoryAccount.treasury;

  const [shareNFTPDA] = getShareNFTPDA(propertyPDA, tokenId);

  const instruction = await program.methods
    .buyShare(nftSvgData)
    .accounts({
      factory: factoryPDA,
      property: propertyPDA,
      shareNft: shareNFTPDA,
      buyer: buyer,
      treasury: treasury,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  // Use versioned transaction (v0) for better size optimization
  const { blockhash } = await connection.getLatestBlockhash();

  const messageV0 = new TransactionMessage({
    payerKey: buyer,
    recentBlockhash: blockhash,
    instructions: [instruction],
  }).compileToV0Message();

  const transaction = new VersionedTransaction(messageV0);

  return { transaction: transaction as any, shareNFTPDA, tokenId };
}

// Deposit dividends (admin only)
export async function depositDividends(
  connection: Connection,
  propertyPDA: PublicKey,
  amount: number,
  admin: PublicKey
): Promise<Transaction> {
  const provider = new AnchorProvider(connection, createReadOnlyWallet(), {});
  const program = getProgram(provider);

  const [factoryPDA] = getFactoryPDA();

  const instruction = await program.methods
    .depositDividends(new BN(amount))
    .accounts({
      factory: factoryPDA,
      property: propertyPDA,
      admin: admin,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  const transaction = new Transaction().add(instruction);

  return transaction;
}

// Claim dividends
export async function claimDividends(
  connection: Connection,
  shareNFTPDA: PublicKey,
  owner: PublicKey
): Promise<{ transaction: Transaction; claimableAmount: number }> {
  const provider = new AnchorProvider(connection, createReadOnlyWallet(), {});
  const program = getProgram(provider);

  // Fetch share NFT to get property
  const shareNFTAccount = await program.account.shareNft.fetch(shareNFTPDA);
  const propertyPDA = shareNFTAccount.property;

  // Fetch property to calculate claimable amount
  const propertyAccount = await program.account.property.fetch(propertyPDA);
  const totalShares = propertyAccount.sharesSold.toNumber();
  const totalDividends = propertyAccount.totalDividendsDeposited.toNumber();
  const dividendsClaimed = shareNFTAccount.dividendsClaimed.toNumber();

  const dividendsPerShare = Math.floor(totalDividends / totalShares);
  const claimableAmount = dividendsPerShare - dividendsClaimed;

  const instruction = await program.methods
    .claimDividends()
    .accounts({
      property: propertyPDA,
      shareNft: shareNFTPDA,
      owner: owner,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  const transaction = new Transaction().add(instruction);

  return { transaction, claimableAmount };
}

// Helper to convert lamports to SOL
export function lamportsToSOL(lamports: number | BN): number {
  if (BN.isBN(lamports)) {
    return lamports.toNumber() / LAMPORTS_PER_SOL;
  }
  return lamports / LAMPORTS_PER_SOL;
}

// Helper to convert SOL to lamports
export function solToLamports(sol: number): number {
  return Math.floor(sol * LAMPORTS_PER_SOL);
}

// Fetch factory
export async function fetchFactory(
  connection: Connection
): Promise<{ publicKey: PublicKey; account: Factory } | null> {
  try {
    const provider = new AnchorProvider(connection, createReadOnlyWallet(), {});
    const program = getProgram(provider);
    const [factoryPDA] = getFactoryPDA();
    const account = await program.account.factory.fetch(factoryPDA);
    return { publicKey: factoryPDA, account: account as any };
  } catch {
    return null;
  }
}

// Fetch property by PDA
export async function fetchProperty(
  connection: Connection,
  propertyPDA: PublicKey
): Promise<Property | null> {
  try {
    const provider = new AnchorProvider(connection, createReadOnlyWallet(), {});
    const program = getProgram(provider);
    const account = await program.account.property.fetch(propertyPDA);
    return account as any;
  } catch {
    return null;
  }
}

// Fetch all properties
export async function fetchAllProperties(
  connection: Connection
): Promise<Array<{ publicKey: PublicKey; account: Property }>> {
  try {
    const provider = new AnchorProvider(connection, createReadOnlyWallet(), {});
    const program = getProgram(provider);

    // First check if factory exists
    const [factoryPDA] = getFactoryPDA();
    try {
      await program.account.factory.fetch(factoryPDA);
    } catch (err) {
      console.log("Factory not initialized yet - no properties available");
      return [];
    }

    const properties = await program.account.property.all();
    return properties.map((p: any) => ({
      publicKey: p.publicKey,
      account: p.account as any,
    }));
  } catch (err) {
    console.error("Error fetching properties:", err);
    return [];
  }
}

// Fetch share NFT
export async function fetchShareNFT(
  connection: Connection,
  shareNFTPDA: PublicKey
): Promise<ShareNFT | null> {
  try {
    const provider = new AnchorProvider(connection, createReadOnlyWallet(), {});
    const program = getProgram(provider);
    const account = await program.account.shareNft.fetch(shareNFTPDA);
    return account as any;
  } catch {
    return null;
  }
}

// Fetch all share NFTs owned by user
export async function fetchUserShareNFTs(
  connection: Connection,
  userPubkey: PublicKey
): Promise<Array<{ publicKey: PublicKey; account: ShareNFT }>> {
  try {
    const provider = new AnchorProvider(connection, createReadOnlyWallet(), {});
    const program = getProgram(provider);
    const shareNFTs = await program.account.shareNft.all([
      {
        memcmp: {
          offset: 8 + 32, // discriminator + property pubkey
          bytes: userPubkey.toBase58(),
        },
      },
    ]);
    return shareNFTs.map((s: any) => ({
      publicKey: s.publicKey,
      account: s.account as any,
    }));
  } catch (err) {
    console.error("Error fetching user share NFTs:", err);
    return [];
  }
}
