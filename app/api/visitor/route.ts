import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

export async function GET() {
  const count = await kv.incr("website_visitors");

  return NextResponse.json({
    count,
  });
}