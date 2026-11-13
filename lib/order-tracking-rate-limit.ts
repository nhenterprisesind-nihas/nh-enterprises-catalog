import "server-only";
import { createHash } from "node:crypto";
import { createClient } from "redis";
import {
  isOrderLookupRateLimited,
  ORDER_LOOKUP_MAX_ATTEMPTS,
  ORDER_LOOKUP_WINDOW_SECONDS,
} from "@/lib/order-tracking";

const RATE_LIMIT_SCRIPT = `
local attempts = redis.call('INCR', KEYS[1])
if attempts == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return attempts
`;

const localAttempts = new Map<string, { count: number; expiresAt: number }>();
let redisClientPromise: ReturnType<typeof connectRedis> | null = null;

async function connectRedis() {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("Order tracking rate limiting is not configured.");
  }

  const client = createClient({
    url,
    socket: {
      connectTimeout: 3000,
      reconnectStrategy: false,
    },
  });
  client.on("error", () => {
    console.error("Order tracking rate-limit Redis connection failed.");
  });

  await client.connect();
  return client;
}

async function getRedisClient() {
  if (!redisClientPromise) {
    redisClientPromise = connectRedis().catch((error: unknown) => {
      redisClientPromise = null;
      throw error;
    });
  }

  return redisClientPromise;
}

function getHashedRateLimitKey(clientAddress: string): string {
  const addressHash = createHash("sha256").update(clientAddress).digest("hex");
  return `track-order:${addressHash}`;
}

function incrementLocalAttempt(key: string): number {
  const now = Date.now();
  const current = localAttempts.get(key);
  if (!current || current.expiresAt <= now) {
    localAttempts.set(key, {
      count: 1,
      expiresAt: now + ORDER_LOOKUP_WINDOW_SECONDS * 1000,
    });
    return 1;
  }

  current.count += 1;
  return current.count;
}

export async function isTrackOrderRequestRateLimited(
  clientAddress: string
): Promise<boolean> {
  const key = getHashedRateLimitKey(clientAddress);

  if (!process.env.REDIS_URL) {
    if (process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "test") {
      throw new Error("Order tracking rate limiting is not configured.");
    }

    return isOrderLookupRateLimited(incrementLocalAttempt(key));
  }

  const client = await getRedisClient();
  const count = Number(
    await client.eval(RATE_LIMIT_SCRIPT, {
      keys: [key],
      arguments: [String(ORDER_LOOKUP_WINDOW_SECONDS)],
    })
  );
  if (!Number.isSafeInteger(count) || count < 1) {
    throw new Error("Order tracking rate limiter returned an invalid count.");
  }

  return isOrderLookupRateLimited(count);
}
