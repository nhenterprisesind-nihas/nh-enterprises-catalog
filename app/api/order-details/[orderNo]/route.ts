import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { orderNo: string } }
) {
  try {
    const orderNo = params.orderNo;

    // Get Order Header
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("order_no", orderNo)
      .single();

    if (orderError) {
      return NextResponse.json(
        { error: orderError.message },
        { status: 500 }
      );
    }

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