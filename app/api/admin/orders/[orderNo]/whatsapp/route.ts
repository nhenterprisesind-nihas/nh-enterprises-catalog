import { NextRequest, NextResponse } from "next/server";
import { ORDER_STATUS, normalizeStatus } from "@/lib/order-status";
import {
  buildConfirmationMessage,
  type OrderMessageItem,
} from "@/lib/orderMessages";
import { normalizeIndianMobileNumber } from "@/lib/indian-mobile";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { supabaseAdmin } from "@/lib/supabase-admin";

type RouteContext = { params: Promise<{ orderNo: string }> };

export const dynamic = "force-dynamic";

async function markConfirmationOpened(orderNo: string) {
  const openedAt = new Date().toISOString();
  const { data: updatedOrder, error: updateError } = await supabaseAdmin
    .from("orders")
    .update({ confirmation_opened_at: openedAt })
    .eq("order_no", orderNo)
    .is("confirmation_opened_at", null)
    .select("confirmation_opened_at")
    .maybeSingle();

  if (updateError) {
    throw updateError;
  }
  if (updatedOrder) {
    return { found: true, confirmationOpenedAt: updatedOrder.confirmation_opened_at };
  }

  const { data: existingOrder, error: lookupError } = await supabaseAdmin
    .from("orders")
    .select("confirmation_opened_at")
    .eq("order_no", orderNo)
    .maybeSingle();

  if (lookupError) {
    throw lookupError;
  }

  return {
    found: Boolean(existingOrder),
    confirmationOpenedAt: existingOrder?.confirmation_opened_at ?? null,
  };
}

export async function POST(
  _request: NextRequest,
  context: RouteContext
) {
  const authorizationError = await requireAdmin();
  if (authorizationError) {
    return authorizationError;
  }

  try {
    const { orderNo } = await context.params;
    const result = await markConfirmationOpened(orderNo);
    if (!result.found) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      { confirmationOpenedAt: result.confirmationOpenedAt },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    console.error("Could not record that the WhatsApp message was opened.");
    return NextResponse.json(
      { error: "Unable to record the message status." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  const authorizationError = await requireAdmin();
  if (authorizationError) {
    return authorizationError;
  }

  try {
    const { orderNo } = await context.params;
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("order_no", orderNo)
      .maybeSingle();

    if (orderError) {
      throw orderError;
    }
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const status = normalizeStatus(order.status);
    if (status !== ORDER_STATUS.PLACED) {
      return NextResponse.json(
        { error: "WhatsApp confirmation links are only available for placed orders." },
        { status: 400 }
      );
    }

    const phone = normalizeIndianMobileNumber(order.phone);
    if (!phone) {
      return NextResponse.json(
        { error: "The customer phone number is not a valid Indian mobile number." },
        { status: 400 }
      );
    }

    const { data: items, error: itemsError } = await supabaseAdmin
      .from("order_items")
      .select("product_name, quantity, amount")
      .eq("order_no", orderNo)
      .order("id", { ascending: true });

    if (itemsError) {
      throw itemsError;
    }

    const messageItems: OrderMessageItem[] = (items ?? []).map((item) => ({
      product_name: item.product_name,
      quantity: item.quantity,
      amount: item.amount,
    }));
    const message = buildConfirmationMessage(order, messageItems);
    const whatsappUrl = `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
    const response = NextResponse.redirect(whatsappUrl);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    console.error("Could not prepare the order WhatsApp message.");
    return NextResponse.json(
      { error: "Unable to prepare the customer message." },
      { status: 500 }
    );
  }
}
