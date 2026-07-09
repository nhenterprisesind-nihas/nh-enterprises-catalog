import { NextResponse } from "next/server";
import { createClient } from "redis";

export const dynamic = "force-dynamic";

const client = createClient({
  url: process.env.REDIS_URL,
});

let connected = false;

async function getClient() {
  if (!connected) {
    await client.connect();
    connected = true;
  }
  return client;
}

export async function GET() {
  try {
    const redis = await getClient();

    const count = await redis.incr("website_visitors");

    return NextResponse.json({ count });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Redis connection failed" },
      { status: 500 }
    );
  }
}