import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const MAX_SPOTS = 2500;
const REGISTERED_USERS_KEY = "access-registered";

const redis = new Redis({
  url: process.env.KV_REST_API_URL || "",
  token: process.env.KV_REST_API_TOKEN || "",
});

export async function GET() {
  try {
    const registeredUsers = await redis.get<string[]>(REGISTERED_USERS_KEY);
    const registered = registeredUsers?.length || 0;
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
