import { NextResponse } from "next/server";

// Access code should be set via environment variable for security
const ACCESS_CODE = process.env.ACCESS_CODE || "010126";
const REGISTERED_USERS_KEY = "access-registered";
const AUTH_TOKENS_KEY = "access-tokens";

// Check if Redis is configured
const isRedisConfigured = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { success: false, message: "Code is required" },
        { status: 400 }
      );
    }

    // Verify the code
    if (code !== ACCESS_CODE) {
      return NextResponse.json(
        { success: false, message: "Invalid code" },
        { status: 401 }
      );
    }

    // Generate auth token
    const token = crypto.randomUUID();

    const redis = await getRedisClient();

    // If Redis is configured, store the token
    if (redis) {
      try {
        // Store token in Redis with 24h expiration
        await redis.setex(
          `${AUTH_TOKENS_KEY}:${token}`,
          86400, // 24 hours in seconds
          JSON.stringify({ createdAt: new Date().toISOString() })
        );

        // Add to registered users
        const registeredUsers = await redis.get<string[]>(REGISTERED_USERS_KEY);
        const users = registeredUsers || [];

        if (!users.includes(token)) {
          await redis.set(REGISTERED_USERS_KEY, [...users, token]);
        }
      } catch (redisError) {
        console.error("Redis error (non-fatal):", redisError);
      }
    }

    return NextResponse.json({
      success: true,
      token,
      message: "Access granted",
    });
  } catch (error) {
    console.error("Error verifying access code:", error);
    return NextResponse.json(
      { success: false, message: "Error verifying code" },
      { status: 500 }
    );
  }
}
