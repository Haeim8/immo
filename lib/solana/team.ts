import {
  PublicKey,
  SystemProgram,
  Connection,
  Transaction,
} from "@solana/web3.js";
import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { FACTORY_PROGRAM_ID, TeamMember } from "./types";
import IDL from "./idl.json";
import { getProgram } from "./instructions";

// Re-export TeamMember type for convenience
export type { TeamMember } from "./types";

// Helper to create a read-only wallet for queries
function createReadOnlyWallet(): Wallet {
  return {
    publicKey: PublicKey.default,
    signTransaction: async (tx: Transaction) => tx,
    signAllTransactions: async (txs: Transaction[]) => txs,
  };
}

// Get Factory PDA
export function getFactoryPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("factory")],
    FACTORY_PROGRAM_ID
  );
}

// Get TeamMember PDA
export function getTeamMemberPDA(
  factoryPubkey: PublicKey,
  walletPubkey: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("team_member"),
      factoryPubkey.toBuffer(),
      walletPubkey.toBuffer(),
    ],
    FACTORY_PROGRAM_ID
  );
}

// Add team member (admin only)
export async function addTeamMember(
  connection: Connection,
  walletAddress: string,
  adminPubkey: PublicKey
): Promise<{ transaction: Transaction; teamMemberPDA: PublicKey }> {
  const provider = new AnchorProvider(connection, createReadOnlyWallet(), {});
  const program = getProgram(provider);

  const [factoryPDA] = getFactoryPDA();
  const walletPubkey = new PublicKey(walletAddress);
  const [teamMemberPDA] = getTeamMemberPDA(factoryPDA, walletPubkey);

  const instruction = await program.methods
    .addTeamMember(walletPubkey)
    .accounts({
      factory: factoryPDA,
      teamMember: teamMemberPDA,
      wallet: walletPubkey,
      admin: adminPubkey,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  const transaction = new Transaction().add(instruction);

  return { transaction, teamMemberPDA };
}

// Remove team member (admin only)
export async function removeTeamMember(
  connection: Connection,
  teamMemberAddress: string,
  adminPubkey: PublicKey
): Promise<Transaction> {
  const provider = new AnchorProvider(connection, createReadOnlyWallet(), {});
  const program = getProgram(provider);

  const [factoryPDA] = getFactoryPDA();
  const walletPubkey = new PublicKey(teamMemberAddress);
  const [teamMemberPDA] = getTeamMemberPDA(factoryPDA, walletPubkey);

  const instruction = await program.methods
    .removeTeamMember()
    .accounts({
      factory: factoryPDA,
      teamMember: teamMemberPDA,
      admin: adminPubkey,
    })
    .instruction();

  const transaction = new Transaction().add(instruction);

  return transaction;
}

// Fetch all team members
export async function getAllTeamMembers(
  connection: Connection
): Promise<{ publicKey: PublicKey; account: TeamMember }[]> {
  // TODO: TeamMember account type is not yet in the IDL
  // This will be implemented when the contract is updated
  console.warn("getAllTeamMembers: TeamMember account not yet implemented in contract");
  return [];
}

// Check if wallet is team member
export async function isTeamMember(
  connection: Connection,
  walletAddress: string
): Promise<boolean> {
  // Validate wallet address first
  if (!walletAddress || typeof walletAddress !== 'string') {
    return false;
  }

  try {
    // TODO: TeamMember account type is not yet in the IDL
    // For now, always return false
    console.warn("isTeamMember: TeamMember account not yet implemented in contract");
    return false;
  } catch (err) {
    // Invalid address or account doesn't exist = not a team member
    return false;
  }
}
