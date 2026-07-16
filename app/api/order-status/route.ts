import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function PATCH(request: NextRequest) {
  try {
    const { orderNo, status } = await request.json();

    const allowedStatus = [
      "Placed",
      "Accepted",
      "Dispatched",
      "Closed",
      "Cancelled",
    ];

    if (!allowedStatus.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status." },
        { status: 400 }
      );
    }

    const { data: currentOrder, error: fetchError } =
      await supabaseAdmin
        .from("orders")
        .select("status")
        .eq("order_no", orderNo)
        .single();

    if (fetchError || !currentOrder) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    const workflow: Record<string, string[]> = {
          Placed: ["Accepted", "Cancelled"],
          Accepted: ["Dispatched"],
          Dispatched: ["Closed"],
    };

    const allowedNext = workflow[currentOrder.status] || [];
    if (!allowedNext.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid workflow transition from ${currentOrder.status} to ${status}`,
        },
        {
          status: 400,
        }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("orders")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("order_no", orderNo)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      order: data,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Unable to update order status.",
      },
      {
        status: 500,
      }
    );
  }
}