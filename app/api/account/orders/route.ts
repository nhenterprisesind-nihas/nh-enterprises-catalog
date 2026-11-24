import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/requireUser";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { normalizeStatus } from "@/lib/order-status";

const noStoreHeaders = { "Cache-Control": "no-store" };
const pageSize = 10;

function noStoreJson<T>(data: T, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: noStoreHeaders,
  });
}

export async function GET(request: NextRequest) {
  const user = await requireUser();
  if (user instanceof NextResponse) {
    return user;
  }

  const pageParam = request.nextUrl.searchParams.get("page");
  const page = pageParam === null ? 1 : Number(pageParam);
  if (!Number.isSafeInteger(page) || page < 1) {
    return noStoreJson({ error: "Page must be a positive integer." }, 400);
  }

  try {
    const { data: orders, error, count } = await supabaseAdmin
      .from("orders")
      .select("order_no, status, grand_total, created_at", {
        count: "exact",
      })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) {
      console.error("Could not retrieve customer orders.");
      return noStoreJson({ error: "Unable to load your orders." }, 500);
    }

    const orderNumbers = (orders ?? []).map((order) => order.order_no);
    const itemCounts = new Map<string, number>();

    if (orderNumbers.length > 0) {
      const { data: orderItems, error: itemsError } = await supabaseAdmin
        .from("order_items")
        .select("order_no, quantity")
        .in("order_no", orderNumbers);

      if (itemsError) {
        console.error("Could not retrieve customer order item counts.");
        return noStoreJson({ error: "Unable to load your orders." }, 500);
      }

      for (const item of orderItems ?? []) {
        const quantity = Number(item.quantity);
        itemCounts.set(
          item.order_no,
          (itemCounts.get(item.order_no) ?? 0) +
            (Number.isFinite(quantity) ? quantity : 0)
        );
      }
    }

    return noStoreJson({
      orders: (orders ?? []).map((order) => ({
        ...order,
        status: normalizeStatus(order.status),
        item_count: itemCounts.get(order.order_no) ?? 0,
      })),
      page,
      pageSize,
      totalCount: count ?? 0,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
    });
  } catch {
    console.error("Customer order retrieval failed.");
    return noStoreJson({ error: "Unable to load your orders." }, 500);
  }
}
