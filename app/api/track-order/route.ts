import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  verifyTrackingRequest,
  type TrackingOrderRecord,
} from "@/lib/order-tracking";
import { isTrackOrderRequestRateLimited } from "@/lib/order-tracking-rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, private, max-age=0, must-revalidate",
  "Pragma": "no-cache",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

const NO_MATCH_MESSAGE =
  "We could not find an order matching these details. Please verify your order number and mobile number.";

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
  extraHeaders: Record<string, string> = {}
) {
  return NextResponse.json(body, {
    status,
    headers: { ...NO_STORE_HEADERS, ...extraHeaders },
  });
}

function getClientAddress(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  try {
    let rateLimited: boolean;
    try {
      rateLimited = await isTrackOrderRequestRateLimited(
        getClientAddress(request)
      );
    } catch (error) {
      console.error(
        "Order tracking rate limiter unavailable.",
        error instanceof Error ? error.name : "UnknownError"
      );
      return jsonResponse(
        { error: "Order tracking is temporarily unavailable. Please try again later." },
        503
      );
    }

    if (rateLimited) {
      return jsonResponse(
        { error: "Too many attempts. Please try again later." },
        429,
        { "Retry-After": "900" }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonResponse(
        { error: "Enter your order number and registered mobile number." },
        400
      );
    }

    const details =
      typeof body === "object" && body !== null
        ? (body as Record<string, unknown>)
        : {};

    const result = await verifyTrackingRequest(
      details.orderNumber,
      details.mobileNumber,
      async (orderNumber) => {
        const { data, error } = await supabaseAdmin
          .from("orders")
          .select("order_no, phone, status, created_at")
          .eq("order_no", orderNumber)
          .maybeSingle();

        return {
          order: data
            ? ({
                order_no: data.order_no,
                phone: data.phone,
                status: data.status,
                created_at: data.created_at,
              } satisfies TrackingOrderRecord)
            : null,
          error,
        };
      }
    );

    if (result.kind === "invalid") {
      return jsonResponse(
        {
          error:
            result.field === "orderNumber"
              ? "Enter a valid order number."
              : "Enter a valid registered mobile number.",
        },
        400
      );
    }

    if (result.kind === "not-found") {
      return jsonResponse({ error: NO_MATCH_MESSAGE }, 404);
    }

    if (result.kind === "database-error") {
      console.error("Order tracking database lookup failed.");
      return jsonResponse(
        { error: "Order tracking is temporarily unavailable. Please try again later." },
        503
      );
    }

    return jsonResponse({ order: result.order });
  } catch (error) {
    console.error(
      "Order tracking request failed.",
      error instanceof Error ? error.name : "UnknownError"
    );
    return jsonResponse(
      { error: "Order tracking is temporarily unavailable. Please try again later." },
      503
    );
  }
}
