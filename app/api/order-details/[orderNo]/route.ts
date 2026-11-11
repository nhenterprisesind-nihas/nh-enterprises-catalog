import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { normalizeStatus } from "@/lib/order-status";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNo: string }> }
) {
  try {
    const {orderNo} = await params;

    // Get Order Header
    const { data: fetchedOrder, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("order_no", orderNo)
      .single();

    if (orderError || !fetchedOrder) {
      return NextResponse.json(
        { error: orderError?.message ?? "Order not found." },
        { status: orderError ? 500 : 404 }
      );
    }
    const order = {
      ...fetchedOrder,
      status: normalizeStatus(fetchedOrder.status),
    };

    // Get Order Items
    const { data: items, error: itemsError } = await supabaseAdmin
      .from("order_items")
      .select("*")
      .eq("order_no", orderNo)
      .order("id", { ascending: true });

    if (itemsError) {
      return NextResponse.json(
        { error: itemsError.message },
        { status: 500 }
      );
    }

  console.log("ORDER DETAILS:", orderNo, order?.status);
  
    return NextResponse.json(
  {
    order,
    items,
  },
  {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  }
);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Unable to fetch order details.",
      },
      {
        status: 500,
      }
    );
  }
}