import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import {
  getReportGroup,
  isReportDatabaseSetupError,
  noStoreJson,
  parseReportRange,
} from "@/lib/admin-reports";
import { supabaseAdmin } from "@/lib/supabase-admin";

type CsvRow = (string | number | null | undefined)[];
type ProductExportRow = {
  product_name: string;
  product_id: string | null;
  quantity: unknown;
  revenue: unknown;
  order_count: unknown;
};
type CategoryExportRow = {
  category: string;
  quantity: unknown;
  revenue: unknown;
};
type CustomerExportRow = {
  phone: string;
  order_count: unknown;
  spend: unknown;
  last_order_date: string;
};

function csvCell(value: CsvRow[number]): string {
  const text = value == null ? "" : String(value);
  const safeText = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replace(/"/g, '""')}"`;
}

function csvResponse(
  report: string,
  from: string,
  to: string,
  rows: CsvRow[]
): NextResponse {
  const csv = `\uFEFF${rows.slice(0, 10_000).map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
  return new NextResponse(csv, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="nh-enterprises-${report}-${from}-${to}.csv"`,
    },
  });
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authorizationError = await requireAdmin();
  if (authorizationError) {
    return authorizationError;
  }

  const rangeResult = parseReportRange(request.nextUrl.searchParams);
  if (!rangeResult.ok) {
    return noStoreJson({ error: rangeResult.error }, 400);
  }
  const { range } = rangeResult;
  const report = request.nextUrl.searchParams.get("report") ?? "";
  const allowedReports = [
    "sales",
    "products",
    "categories",
    "customers",
    "operations",
  ];
  if (!allowedReports.includes(report)) {
    return noStoreJson({ error: "Unknown report." }, 400);
  }

  try {
    if (report === "sales") {
      const { data, error } = await supabaseAdmin.rpc("report_sales", {
        p_from: range.from,
        p_to: range.to,
        p_group: getReportGroup(range),
      });
      if (error) throw error;
      if (!data) throw new Error("Sales report returned no data.");

      const result = data as {
        totals: Record<string, unknown>;
        previous_totals: Record<string, unknown>;
        series: { period: string; orders: unknown; revenue: unknown }[];
      };
      const headers = [
        "section",
        "period",
        "orders",
        "revenue",
        "complete_revenue",
        "aov",
        "items_sold",
        "cancelled_orders",
        "cancelled_value",
        "shipping_total",
      ];
      const totalRow = (section: string, values: Record<string, unknown>): CsvRow => [
        section,
        "",
        toNumber(values.orders),
        toNumber(values.revenue),
        toNumber(values.complete_revenue),
        toNumber(values.aov),
        toNumber(values.items_sold),
        toNumber(values.cancelled_orders),
        toNumber(values.cancelled_value),
        toNumber(values.shipping_total),
      ];
      const rows: CsvRow[] = [
        headers,
        totalRow("Current totals", result.totals),
        totalRow("Previous period", result.previous_totals),
        ...result.series.map((item) => [
          "Series",
          item.period,
          toNumber(item.orders),
          toNumber(item.revenue),
          "",
          "",
          "",
          "",
          "",
          "",
        ]),
      ];
      return csvResponse(report, range.from, range.to, rows);
    }

    if (report === "products") {
      const { data, error } = await supabaseAdmin.rpc("report_products", {
        p_from: range.from,
        p_to: range.to,
        p_limit: 10_000,
      });
      if (error) throw error;
      const rows: CsvRow[] = [
        ["product_name", "product_id", "quantity", "revenue", "order_count"],
        ...((data ?? []) as ProductExportRow[]).map((item) => [
          item.product_name,
          item.product_id,
          toNumber(item.quantity),
          toNumber(item.revenue),
          toNumber(item.order_count),
        ]),
      ];
      return csvResponse(report, range.from, range.to, rows);
    }

    if (report === "categories") {
      const { data, error } = await supabaseAdmin.rpc("report_categories", {
        p_from: range.from,
        p_to: range.to,
      });
      if (error) throw error;
      const rows: CsvRow[] = [
        ["category", "quantity", "revenue"],
        ...((data ?? []) as CategoryExportRow[]).map((item) => [
          item.category,
          toNumber(item.quantity),
          toNumber(item.revenue),
        ]),
      ];
      return csvResponse(report, range.from, range.to, rows);
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
        repeat_rate: unknown;
        customers: {
          phone: string;
          order_count: unknown;
          spend: unknown;
          last_order_date: string;
        }[];
        pincodes: { pincode: string; orders: unknown; revenue: unknown }[];
      };
      const includeFullPhone =
        request.nextUrl.searchParams.get("includeFullPhone") === "true";
      let customerRows = (result.customers ?? []).map((item) => ({
        phone: item.phone,
        orderCount: toNumber(item.order_count),
        spend: toNumber(item.spend),
        lastOrderDate: item.last_order_date,
      }));

      if (includeFullPhone) {
        const { data: fullPhones, error: phoneError } =
          await supabaseAdmin.rpc("report_customers_full_phones", {
            p_from: range.from,
            p_to: range.to,
          });
        if (phoneError) throw phoneError;
        customerRows = ((fullPhones ?? []) as CustomerExportRow[]).map((item) => ({
          phone: item.phone,
          orderCount: toNumber(item.order_count),
          spend: toNumber(item.spend),
          lastOrderDate: item.last_order_date,
        }));
      }

      const rows: CsvRow[] = [
        ["section", "phone", "order_count", "spend", "last_order_date", "pincode", "orders", "revenue", "repeat_rate_percent"],
        ["Summary", "", "", "", "", "", "", "", toNumber(result.repeat_rate)],
        ["New customers", "", toNumber(result.new_customers), "", "", "", "", "", ""],
        ["Repeat customers", "", toNumber(result.repeat_customers), "", "", "", "", "", ""],
        ...customerRows.map((item) => [
          "Top customer",
          item.phone,
          item.orderCount,
          item.spend,
          item.lastOrderDate,
          "",
          "",
          "",
          "",
        ]),
        ...(result.pincodes ?? []).map((item) => [
          "Top pincode",
          "",
          "",
          "",
          "",
          item.pincode,
          toNumber(item.orders),
          toNumber(item.revenue),
          "",
        ]),
      ];
      return csvResponse(report, range.from, range.to, rows);
    }

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
    const statuses = ["Placed", "Accepted", "Dispatched", "Complete", "Cancelled"];
    const rows: CsvRow[] = [
      ["section", "status", "count", "cancellation_rate_percent", "order_no", "customer_name", "age_hours", "grand_total"],
      ...statuses.map((status) => [
        "Status",
        status,
        toNumber(result.status_counts[status]),
        "",
        "",
        "",
        "",
        "",
      ]),
      ["Cancellation rate", "", "", toNumber(result.cancellation_rate), "", "", "", ""],
      ...(result.stale_orders ?? []).map((item) => [
        "Stale order",
        item.status,
        "",
        "",
        item.order_no,
        item.customer_name,
        toNumber(item.age_hours),
        toNumber(item.grand_total),
      ]),
    ];
    return csvResponse(report, range.from, range.to, rows);
  } catch (error) {
    console.error("Admin report export failed", error);
    if (isReportDatabaseSetupError(error)) {
      return noStoreJson(
        {
          error:
            "Report database setup is missing or unavailable. Run sql/admin_reports.sql in the Supabase SQL Editor, then retry.",
        },
        503
      );
    }
    return noStoreJson({ error: "Unable to export report." }, 500);
  }
}
