import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { supabaseAdmin } from "@/lib/supabase-admin";

const noStoreHeaders = { "Cache-Control": "no-store" };

function noStoreJson<T>(data: T, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: noStoreHeaders,
  });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ orderNo: string }> }
) {
  const authorizationError = await requireAdmin();
  if (authorizationError) {
    return authorizationError;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ error: "Invalid customer update." }, 400);
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("customerUpdate" in body) ||
    typeof body.customerUpdate !== "string" ||
    body.customerUpdate.length > 500
  ) {
    return noStoreJson(
      { error: "Customer updates must be 500 characters or fewer." },
      400
    );
  }

  try {
    const { orderNo } = await context.params;
    const customerUpdate = body.customerUpdate.trim() || null;
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .update({ customer_update: customerUpdate })
      .eq("order_no", orderNo)
      .select("order_no, customer_update")
      .maybeSingle();

    if (error) {
      console.error("Could not save admin customer update.");
      return noStoreJson({ error: "Unable to save the customer update." }, 500);
    }
    if (!order) {
      return noStoreJson({ error: "Order not found." }, 404);
    }

    return noStoreJson({
      order_no: order.order_no,
      customer_update: order.customer_update,
    });
  } catch {
    console.error("Admin customer update failed.");
    return noStoreJson({ error: "Unable to save the customer update." }, 500);
  }
}
