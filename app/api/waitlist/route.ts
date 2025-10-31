import { NextResponse } from "next/server";
import { getWaitlist, addToWaitlist } from "@/lib/waitlist";

// GET - Retrieve all waitlist entries from Redis (for admin)
export async function GET() {
  try {
    const data = await getWaitlist();
    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error("Error reading waitlist from Redis:", error);
    return NextResponse.json(
      { success: false, error: "Failed to read waitlist" },
      { status: 500 }
    );
  }
}

// POST - Add a new entry to the waitlist
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, evmAddress } = body;

    if (!email || !evmAddress) {
      return NextResponse.json(
        { success: false, error: "Email and EVM address are required" },
        { status: 400 }
      );
    }

    const result = await addToWaitlist(email, evmAddress);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      count: result.count,
    });
  } catch (error) {
    console.error("Error adding to waitlist:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add to waitlist" },
      { status: 500 }
    );
  }
}
