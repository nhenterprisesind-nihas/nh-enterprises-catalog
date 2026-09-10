import { NextResponse } from "next/server";

const VERIFY_TOKEN_ENV = "WHATSAPP_WEBHOOK_VERIFY_TOKEN";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const verifyToken = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  const expectedToken = process.env[VERIFY_TOKEN_ENV];

  if (!expectedToken) {
    console.error(`${VERIFY_TOKEN_ENV} is not configured.`);
    return NextResponse.json(
      { error: "Webhook verification is not configured." },
      { status: 500 },
    );
  }

  if (mode === "subscribe" && verifyToken === expectedToken && challenge) {
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json({ error: "Verification failed." }, { status: 403 });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const entryCount = Array.isArray(payload?.entry) ? payload.entry.length : 0;

  console.info("WhatsApp webhook received.", {
    object: payload?.object,
    entryCount,
  });

  return NextResponse.json({ received: true }, { status: 200 });
}
