import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/requireUser";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { normalizeStatus } from "@/lib/order-status";

const noStoreHeaders = { "Cache-Control": "no-store" };

function noStoreJson<T>(data: T, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: noStoreHeaders,
  });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ orderNo: string }> }
) {
  const user = await requireUser();
  if (user instanceof NextResponse) {
    return user;
  }

  try {
    const { orderNo } = await context.params;
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select(
        "order_no, status, created_at, subtotal, shipping, grand_total, customer_name, phone, address, pincode, customer_update"
      )
      .eq("order_no", orderNo)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Could not retrieve customer order details.");
      return noStoreJson({ error: "Unable to load this order." }, 500);
    }
    if (!order) {
      return noStoreJson({ error: "Order not found." }, 404);
    }

    const { data: items, error: itemsError } = await supabaseAdmin
      .from("order_items")
      .select("product_name, quantity, price, amount")
      .eq("order_no", order.order_no)
      .order("id", { ascending: true });

    if (itemsError) {
      console.error("Could not retrieve customer order items.");
      return noStoreJson({ error: "Unable to load this order." }, 500);
    }

    return noStoreJson({
      order: {
        ...order,
        status: normalizeStatus(order.status),
      },
      items: items ?? [],
    });
  } catch {
    console.error("Customer order detail retrieval failed.");
    return noStoreJson({ error: "Unable to load this order." }, 500);
  }
}
