"use server";

interface WaitlistEntry {
  id: string;
  email: string;
  evmAddress: string;
  createdAt: string;
}

const WAITLIST_KEY = "email-list";
const MAX_MEMBERS = 2500;

// Check if Redis is configured
const isRedisConfigured = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

// Lazy load Redis only when needed (avoids warnings at import time)
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

export const getWaitlist = async (): Promise<{
  entries: WaitlistEntry[];
  count: number;
  maxMembers: number;
}> => {
  const redis = await getRedisClient();

  // Return empty if Redis not configured
  if (!redis) {
    return {
      entries: [],
      count: 0,
      maxMembers: MAX_MEMBERS,
    };
  }

  try {
    const entries = await redis.get<WaitlistEntry[]>(WAITLIST_KEY);
    const waitlist = entries || [];

    return {
      entries: waitlist,
      count: waitlist.length,
      maxMembers: MAX_MEMBERS,
    };
  } catch (error) {
    console.error("Error fetching waitlist from Redis:", error);
    return {
      entries: [],
      count: 0,
      maxMembers: MAX_MEMBERS,
    };
  }
};

export const exportWaitlistCSV = async (): Promise<string> => {
  const { entries } = await getWaitlist();

  const csv = [
    ["Email", "EVM Address", "Joined At"],
    ...entries.map((e) => [
      e.email,
      e.evmAddress,
      new Date(e.createdAt).toLocaleString(),
    ]),
  ]
    .map((row) => row.join(","))
    .join("\n");

  return csv;
};

export const addToWaitlist = async (
  email: string,
  evmAddress: string
): Promise<{ success: boolean; error?: string; message?: string; count?: number }> => {
  const redis = await getRedisClient();

  // Return error if Redis not configured
  if (!redis) {
    return {
      success: false,
      error: "Waitlist is temporarily unavailable"
    };
  }

  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: "Invalid email format" };
    }

    // Validate EVM address format (0x followed by 40 hex characters)
    const evmRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!evmRegex.test(evmAddress)) {
      return { success: false, error: "Invalid EVM address format" };
    }

    const entries = await redis.get<WaitlistEntry[]>(WAITLIST_KEY);
    const waitlist = entries || [];

    // Check for duplicate email
    if (waitlist.some((e) => e.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: "This email is already registered" };
    }

    // Check for duplicate EVM address
    if (waitlist.some((e) => e.evmAddress.toLowerCase() === evmAddress.toLowerCase())) {
      return { success: false, error: "This EVM address is already registered" };
    }

    // Check 2500 limit
    if (waitlist.length >= MAX_MEMBERS) {
      return { success: false, error: "Waitlist is full (2500 members max)" };
    }

    const newEntry: WaitlistEntry = {
      id: crypto.randomUUID(),
      email,
      evmAddress,
      createdAt: new Date().toISOString(),
    };

    await redis.set(WAITLIST_KEY, [...waitlist, newEntry]);

    return {
      success: true,
      message: "Thank you for joining the waitlist!",
      count: waitlist.length + 1,
    };
  } catch (error) {
    console.error("Error adding to waitlist:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error subscribing to waitlist",
    };
  }
};
