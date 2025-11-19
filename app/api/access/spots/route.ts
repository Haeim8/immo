import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const MAX_SPOTS = 2500;
const WAITLIST_KEY = "email-list";

const redis = new Redis({
  url: process.env.KV_REST_API_URL || "",
  token: process.env.KV_REST_API_TOKEN || "",
});

interface WaitlistEntry {
  id: string;
  email: string;
  evmAddress: string;
  createdAt: string;
}

export async function GET() {
  try {
    const entries = await redis.get<WaitlistEntry[]>(WAITLIST_KEY);
    const registered = entries?.length || 0;
    const spotsLeft = Math.max(0, MAX_SPOTS - registered);

    return NextResponse.json({
      spotsLeft,
      totalSpots: MAX_SPOTS,
      registered,
    });
  } catch (error) {
    console.error("Error fetching available spots:", error);
    return NextResponse.json(
      { error: "Failed to fetch spots", spotsLeft: 0 },
      { status: 500 }
    );
  }
}
