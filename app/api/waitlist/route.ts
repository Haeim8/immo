import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const MAX_MEMBERS = 2500;
const WAITLIST_FILE = path.join(process.cwd(), "data", "waitlist.json");

interface WaitlistEntry {
  id: string;
  email: string;
  evmAddress: string;
  createdAt: string;
}

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.join(process.cwd(), "data");
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Read waitlist from file
async function readWaitlist(): Promise<WaitlistEntry[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(WAITLIST_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Write waitlist to file
async function writeWaitlist(entries: WaitlistEntry[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(WAITLIST_FILE, JSON.stringify(entries, null, 2));
}

// GET - Retrieve all waitlist entries (for admin)
export async function GET() {
  try {
    const entries = await readWaitlist();
    return NextResponse.json({
      success: true,
      count: entries.length,
      maxMembers: MAX_MEMBERS,
      entries,
    });
  } catch (error) {
    console.error("Error reading waitlist:", error);
    return NextResponse.json(
      { success: false, error: "Failed to read waitlist" },
      { status: 500 }
    );
  }
}

// POST - Add new entry to waitlist
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, evmAddress } = body;

    // Validate inputs
    if (!email || !evmAddress) {
      return NextResponse.json(
        { success: false, error: "Email and EVM address are required" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Basic EVM address validation
    if (!evmAddress.startsWith("0x") || evmAddress.length !== 42) {
      return NextResponse.json(
        { success: false, error: "Invalid EVM address" },
        { status: 400 }
      );
    }

    const entries = await readWaitlist();

    // Check if waitlist is full
    if (entries.length >= MAX_MEMBERS) {
      return NextResponse.json(
        { success: false, error: "Waitlist is full (2500 members max)" },
        { status: 400 }
      );
    }

    // Check for duplicate email
    if (entries.some((e) => e.email.toLowerCase() === email.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: "This email is already registered" },
        { status: 400 }
      );
    }

    // Check for duplicate EVM address
    if (entries.some((e) => e.evmAddress.toLowerCase() === evmAddress.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: "This EVM address is already registered" },
        { status: 400 }
      );
    }

    // Add new entry
    const newEntry: WaitlistEntry = {
      id: crypto.randomUUID(),
      email,
      evmAddress,
      createdAt: new Date().toISOString(),
    };

    entries.push(newEntry);
    await writeWaitlist(entries);

    return NextResponse.json({
      success: true,
      message: "Successfully added to waitlist",
      count: entries.length,
      maxMembers: MAX_MEMBERS,
    });
  } catch (error) {
    console.error("Error adding to waitlist:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add to waitlist" },
      { status: 500 }
    );
  }
}
