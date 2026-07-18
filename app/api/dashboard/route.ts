import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const range = searchParams.get("range") ?? "today";
    const status = searchParams.get("status") ?? "All";

    const now = new Date();

    let fromDate = new Date();

    switch (range) {
      case "today":
        fromDate.setHours(0, 0, 0, 0);
        break;

      case "yesterday":
        fromDate.setDate(fromDate.getDate() - 1);
        fromDate.setHours(0, 0, 0, 0);

        now.setDate(now.getDate() - 1);
        now.setHours(23, 59, 59, 999);
        break;

      case "last7days":
        fromDate.setDate(fromDate.getDate() - 6);
        fromDate.setHours(0, 0, 0, 0);
        break;

      case "thisMonth":
        fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;

      default:
        fromDate.setHours(0, 0, 0, 0);
    }

    const { data: allOrders, error } = await supabaseAdmin
      .from("orders")
      .select(
        "order_no, customer_name, phone, grand_total, status, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const orders = allOrders ?? [];

    const todayOrders = orders.filter((o) => {
      const d = new Date(o.created_at);
      return d >= fromDate && d <= now;
    });

    const filteredOrders =
    status === "All"
    ? orders
    : orders.filter((o) => o.status === status);

    const statusCounts: Record<string, number> = {};

    orders.forEach((o) => {
      const status = o.status?.trim() || "Unknown";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const todayRevenue = todayOrders
      .filter((o) => o.status?.trim().toLowerCase() !== "cancelled")
      .reduce((sum, o) => sum + Number(o.grand_total), 0);

    const totalRevenue = orders
      .filter((o) => o.status?.trim().toLowerCase() !== "cancelled")
      .reduce((sum, o) => sum + Number(o.grand_total), 0);

    return NextResponse.json({
      summary: {
        todayOrders: todayOrders.length,
        totalOrders: orders.length,
        todayRevenue,
        totalRevenue,
      },

      statusCounts,

      orders: filteredOrders,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        error: "Unable to load dashboard.",
      },
      {
        status: 500,
      }
    );
  }
}