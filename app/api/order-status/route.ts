import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  normalizeStatus,
  ORDER_STATUS,
  type OrderStatus,
} from "@/lib/order-status";

export async function PATCH(request: NextRequest) {
  try {
    const { orderNo, status } = await request.json();

    const allowedStatus = Object.values(ORDER_STATUS);

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

    const workflow: Record<string, OrderStatus[]> = {
      [ORDER_STATUS.PLACED]: [
        ORDER_STATUS.ACCEPTED,
        ORDER_STATUS.CANCELLED,
      ],
      [ORDER_STATUS.ACCEPTED]: [ORDER_STATUS.DISPATCHED],
      [ORDER_STATUS.DISPATCHED]: [ORDER_STATUS.COMPLETE],
    };

    const currentStatus = normalizeStatus(currentOrder.status);
    const allowedNext = workflow[currentStatus] || [];
    if (!allowedNext.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid workflow transition from ${currentStatus} to ${status}`,
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
      order: data && { ...data, status: normalizeStatus(data.status) },
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