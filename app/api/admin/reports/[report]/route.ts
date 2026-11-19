import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import {
  getReportGroup,
  isReportDatabaseSetupError,
  noStoreJson,
  parseReportRange,
} from "@/lib/admin-reports";
import { supabaseAdmin } from "@/lib/supabase-admin";

type ReportTotals = {
  orders: number;
  revenue: number;
  complete_revenue: number;
  aov: number;
  items_sold: number;
  cancelled_orders: number;
  cancelled_value: number;
  shipping_total: number;
};
type ProductReportRow = {
  product_name: string;
  product_id: string | null;
  quantity: unknown;
  revenue: unknown;
  order_count: unknown;
};
type CategoryReportRow = {
  category: string;
  quantity: unknown;
  revenue: unknown;
};

type SalesReport = {
  totals: ReportTotals;
  previous_totals: ReportTotals;
  series: { period: string; orders: number; revenue: number }[];
};

function numberValue(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapTotals(totals: ReportTotals) {
  return {
    orders: numberValue(totals.orders),
    revenue: numberValue(totals.revenue),
    complete_revenue: numberValue(totals.complete_revenue),
    aov: numberValue(totals.aov),
    items_sold: numberValue(totals.items_sold),
    cancelled_orders: numberValue(totals.cancelled_orders),
    cancelled_value: numberValue(totals.cancelled_value),
    shipping_total: numberValue(totals.shipping_total),
  };
}

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ report: string }> }
) {
  const authorizationError = await requireAdmin();
  if (authorizationError) {
    return authorizationError;
  }

  const rangeResult = parseReportRange(request.nextUrl.searchParams);
  if (!rangeResult.ok) {
    return noStoreJson({ error: rangeResult.error }, 400);
  }
  const { range } = rangeResult;
  const { report } = await context.params;

  try {
    if (report === "sales") {
      const requestedGroup = request.nextUrl.searchParams.get("group") ?? "auto";
      if (!["auto", "day", "week", "month"].includes(requestedGroup)) {
        return noStoreJson({ error: "Invalid sales grouping." }, 400);
      }

      const group =
        requestedGroup === "auto"
          ? getReportGroup(range)
          : requestedGroup;
      const { data, error } = await supabaseAdmin.rpc("report_sales", {
        p_from: range.from,
        p_to: range.to,
        p_group: group,
      });
      if (error) throw error;
      if (!data) throw new Error("Sales report returned no data.");

      const result = data as SalesReport;
      return noStoreJson({
        totals: mapTotals(result.totals),
        previousTotals: mapTotals(result.previous_totals),
        series: (result.series ?? []).map((item) => ({
          period: item.period,
          orders: numberValue(item.orders),
          revenue: numberValue(item.revenue),
        })),
        group,
      });
    }

    if (report === "products") {
      const rawLimit = request.nextUrl.searchParams.get("limit") ?? "100";
      if (!/^\d+$/.test(rawLimit) || Number(rawLimit) < 1 || Number(rawLimit) > 500) {
        return noStoreJson({ error: "limit must be an integer from 1 to 500." }, 400);
      }

      const { data, error } = await supabaseAdmin.rpc("report_products", {
        p_from: range.from,
        p_to: range.to,
        p_limit: Number(rawLimit),
      });
      if (error) throw error;

      return noStoreJson({
        products: ((data ?? []) as ProductReportRow[]).map((item) => ({
          product_name: item.product_name,
          product_id: item.product_id,
          quantity: numberValue(item.quantity),
          revenue: numberValue(item.revenue),
          order_count: numberValue(item.order_count),
        })),
      });
    }

    if (report === "categories") {
      const { data, error } = await supabaseAdmin.rpc("report_categories", {
        p_from: range.from,
        p_to: range.to,
      });
      if (error) throw error;

      return noStoreJson({
        categories: ((data ?? []) as CategoryReportRow[]).map((item) => ({
          category: item.category,
          quantity: numberValue(item.quantity),
          revenue: numberValue(item.revenue),
        })),
      });
    }

    if (report === "operations") {
      const { data, error } = await supabaseAdmin.rpc("report_operations", {
        p_from: range.from,
        p_to: range.to,
      });
      if (error) throw error;
      if (!data) throw new Error("Operations report returned no data.");

      const result = data as {
        status_counts: Record<string, unknown>;
        cancellation_rate: unknown;
        stale_orders: {
          order_no: string;
          customer_name: string | null;
          status: string;
          age_hours: unknown;
          grand_total: unknown;
        }[];
      };

      return noStoreJson({
        statusCounts: {
          Placed: numberValue(result.status_counts.Placed),
          Accepted: numberValue(result.status_counts.Accepted),
          Dispatched: numberValue(result.status_counts.Dispatched),
          Complete: numberValue(result.status_counts.Complete),
          Cancelled: numberValue(result.status_counts.Cancelled),
        },
        cancellationRate: numberValue(result.cancellation_rate),
        staleOrders: (result.stale_orders ?? []).map((item) => ({
          order_no: item.order_no,
          customer_name: item.customer_name,
          status: item.status,
          age_hours: numberValue(item.age_hours),
          grand_total: numberValue(item.grand_total),
        })),
      });
    }

    if (report === "customers") {
      const { data, error } = await supabaseAdmin.rpc("report_customers", {
        p_from: range.from,
        p_to: range.to,
      });
      if (error) throw error;
      if (!data) throw new Error("Customers report returned no data.");

      const result = data as {
        new_customers: unknown;
        repeat_customers: unknown;
        total_customers: unknown;
        repeat_rate: unknown;
        customers: {
          phone: string;
          order_count: unknown;
          spend: unknown;
          last_order_date: string;
        }[];
        pincodes: {
          pincode: string;
          orders: unknown;
          revenue: unknown;
        }[];
      };

      return noStoreJson({
        newCustomers: numberValue(result.new_customers),
        repeatCustomers: numberValue(result.repeat_customers),
        totalCustomers: numberValue(result.total_customers),
        repeatRate: numberValue(result.repeat_rate),
        customers: (result.customers ?? []).map((item) => ({
          phone: item.phone,
          orderCount: numberValue(item.order_count),
          spend: numberValue(item.spend),
          lastOrderDate: item.last_order_date,
        })),
        pincodes: (result.pincodes ?? []).map((item) => ({
          pincode: item.pincode,
          orders: numberValue(item.orders),
          revenue: numberValue(item.revenue),
        })),
      });
    }

    return noStoreJson({ error: "Unknown report." }, 404);
  } catch (error) {
    console.error("Admin reports request failed", error);
    if (isReportDatabaseSetupError(error)) {
      return noStoreJson(
        {
          error:
            "Report database setup is missing or unavailable. Run sql/admin_reports.sql in the Supabase SQL Editor, then retry.",
        },
        503
      );
    }
    return noStoreJson({ error: "Unable to load report." }, 500);
  }
}
