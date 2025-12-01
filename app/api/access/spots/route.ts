import { NextResponse } from "next/server";

const MAX_SPOTS = 2500;
const WAITLIST_KEY = "email-list";

// Check if Redis is configured
const isRedisConfigured = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

interface WaitlistEntry {
  id: string;
  email: string;
  evmAddress: string;
  createdAt: string;
}

// Lazy load Redis
async function getRedisClient() {
  if (!isRedisConfigured) return null;

  try {
    const { Redis } = await import("@upstash/redis");
    return new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    });
  } catch {
    return null;
  }
}

export async function GET() {
  const redis = await getRedisClient();

  // Return default values if Redis not configured
  if (!redis) {
    return NextResponse.json({
      spotsLeft: MAX_SPOTS,
      totalSpots: MAX_SPOTS,
      registered: 0,
    });
  }

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
    return NextResponse.json({
      spotsLeft: MAX_SPOTS,
      totalSpots: MAX_SPOTS,
      registered: 0,
    });
  }
}
