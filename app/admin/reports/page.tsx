"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type ReportTab = "sales" | "products" | "customers" | "operations";
type Preset =
  | "today"
  | "last7"
  | "last30"
  | "thisMonth"
  | "lastMonth"
  | "financialYear"
  | "custom";
type DateRange = { from: string; to: string };
type SalesTotals = {
  orders: number;
  revenue: number;
  complete_revenue: number;
  aov: number;
  items_sold: number;
  cancelled_orders: number;
  cancelled_value: number;
  shipping_total: number;
};
type SalesData = {
  totals: SalesTotals;
  previousTotals: SalesTotals;
  series: { period: string; orders: number; revenue: number }[];
  group: "day" | "week" | "month";
};
type Product = {
  product_name: string;
  product_id: string | null;
  quantity: number;
  revenue: number;
  order_count: number;
};
type Category = { category: string; quantity: number; revenue: number };
type ProductsData = { products: Product[]; categories: Category[] };
type CustomersData = {
  newCustomers: number;
  repeatCustomers: number;
  totalCustomers: number;
  repeatRate: number;
  customers: {
    phone: string;
    orderCount: number;
    spend: number;
    lastOrderDate: string;
  }[];
  pincodes: { pincode: string; orders: number; revenue: number }[];
};
type OperationsData = {
  statusCounts: Record<string, number>;
  cancellationRate: number;
  staleOrders: {
    order_no: string;
    customer_name: string | null;
    status: string;
    age_hours: number;
    grand_total: number;
  }[];
};
type ReportData = SalesData | ProductsData | CustomersData | OperationsData;

const TABS: { id: ReportTab; label: string }[] = [
  { id: "sales", label: "Sales" },
  { id: "products", label: "Products" },
  { id: "customers", label: "Customers" },
  { id: "operations", label: "Operations" },
];

const PRESETS: { id: Preset; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "last7", label: "Last 7 days" },
  { id: "last30", label: "Last 30 days" },
  { id: "thisMonth", label: "This month" },
  { id: "lastMonth", label: "Last month" },
  { id: "financialYear", label: "This financial year" },
  { id: "custom", label: "Custom range" },
];

function todayInKolkata(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function shiftDate(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function presetRange(preset: Exclude<Preset, "custom">, today: string): DateRange {
  const [year, month] = today.split("-").map(Number);
  if (preset === "today") return { from: today, to: today };
  if (preset === "last7") return { from: shiftDate(today, -6), to: today };
  if (preset === "last30") return { from: shiftDate(today, -29), to: today };
  if (preset === "thisMonth") {
    return { from: `${today.slice(0, 7)}-01`, to: today };
  }
  if (preset === "lastMonth") {
    const lastMonthStart = new Date(Date.UTC(year, month - 2, 1));
    const lastMonthEnd = new Date(Date.UTC(year, month - 1, 0));
    return {
      from: lastMonthStart.toISOString().slice(0, 10),
      to: lastMonthEnd.toISOString().slice(0, 10),
    };
  }

  const financialYearStart = month >= 4 ? year : year - 1;
  return { from: `${financialYearStart}-04-01`, to: today };
}

function findPreset(range: DateRange, today: string): Preset {
  const presets: Exclude<Preset, "custom">[] = [
    "today",
    "last7",
    "last30",
    "thisMonth",
    "lastMonth",
    "financialYear",
  ];
  return (
    presets.find((preset) => {
      const candidate = presetRange(preset, today);
      return candidate.from === range.from && candidate.to === range.to;
    }) ?? "custom"
  );
}

function money(value: number): string {
  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function count(value: number): string {
  return value.toLocaleString("en-IN");
}

function displayDate(value: string): string {
  return new Date(`${value}T00:00:00.000Z`).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
  });
}

function rangeQuery(range: DateRange): string {
  const params = new URLSearchParams({ from: range.from, to: range.to });
  return params.toString();
}

async function fetchReport<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error ?? "Unable to load report.");
  }
  return body as T;
}

function percentChange(current: number, previous: number): string {
  if (previous === 0) return current === 0 ? "0%" : "New";
  const change = ((current - previous) / Math.abs(previous)) * 100;
  return `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
}

function syncUrl(tab: ReportTab, range: DateRange) {
  const url = new URL(window.location.href);
  url.searchParams.set("tab", tab);
  url.searchParams.set("from", range.from);
  url.searchParams.set("to", range.to);
  window.history.replaceState(null, "", url);
}

export default function AdminReportsPage() {
  const [tab, setTab] = useState<ReportTab>("sales");
  const [preset, setPreset] = useState<Preset>("last30");
  const [range, setRange] = useState<DateRange>({ from: "", to: "" });
  const [compare, setCompare] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [sortBy, setSortBy] = useState<"quantity" | "revenue">("revenue");
  const [search, setSearch] = useState("");
  const [includeFullPhone, setIncludeFullPhone] = useState(false);

  useEffect(() => {
    const today = todayInKolkata();
    const params = new URLSearchParams(window.location.search);
    const requestedTab = params.get("tab") as ReportTab | null;
    const urlFrom = params.get("from");
    const urlTo = params.get("to");
    const selectedTab = TABS.find((item) => item.id === requestedTab)?.id ?? "sales";
    const selectedRange =
      urlFrom && urlTo && /^\d{4}-\d{2}-\d{2}$/.test(urlFrom) && /^\d{4}-\d{2}-\d{2}$/.test(urlTo)
        ? { from: urlFrom, to: urlTo }
        : presetRange("last30", today);

    setTab(selectedTab);
    setRange(selectedRange);
    setPreset(findPreset(selectedRange, today));
    syncUrl(selectedTab, selectedRange);
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (!initialized || !range.from || !range.to) return;

    let active = true;
    const query = rangeQuery(range);
    setLoading(true);
    setError("");

    const request =
      tab === "products"
        ? Promise.all([
            fetchReport<{ products: Product[] }>(
              `/api/admin/reports/products?${query}&limit=100`
            ),
            fetchReport<{ categories: Category[] }>(
              `/api/admin/reports/categories?${query}`
            ),
          ]).then(([products, categories]) => ({
            products: products.products,
            categories: categories.categories,
          }))
        : fetchReport<ReportData>(`/api/admin/reports/${tab}?${query}`);

    request
      .then((report) => {
        if (active) setData(report as ReportData);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setData(null);
          setError(
            loadError instanceof Error ? loadError.message : "Unable to load report."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [initialized, tab, range, retry]);

  const setRangeAndUrl = useCallback(
    (nextRange: DateRange, nextPreset: Preset = "custom") => {
      setPreset(nextPreset);
      setData(null);
      setLoading(true);
      setError("");
      setRange(nextRange);
      syncUrl(tab, nextRange);
    },
    [tab]
  );

  function selectTab(nextTab: ReportTab) {
    if (nextTab !== tab) {
      setData(null);
      setLoading(true);
      setError("");
    }
    setTab(nextTab);
    syncUrl(nextTab, range);
  }

  function choosePreset(value: Preset) {
    setPreset(value);
    if (value !== "custom") {
      setRangeAndUrl(presetRange(value, todayInKolkata()), value);
    }
  }

  function exportCsv(report: string, includePhone = false) {
    const params = new URLSearchParams({
      report,
      from: range.from,
      to: range.to,
    });
    if (includePhone) params.set("includeFullPhone", "true");
    window.location.assign(`/api/admin/reports/export?${params.toString()}`);
  }

  const isEmpty = useMemo(() => {
    if (!data) return false;
    if (tab === "sales") {
      const sales = data as SalesData;
      return sales.totals.orders === 0 && sales.totals.cancelled_orders === 0;
    }
    if (tab === "products") return (data as ProductsData).products.length === 0;
    if (tab === "customers") return (data as CustomersData).totalCustomers === 0;
    const operations = data as OperationsData;
    return (
      Object.values(operations.statusCounts).every((value) => value === 0) &&
      operations.staleOrders.length === 0
    );
  }, [data, tab]);

  const setDatePart = (key: keyof DateRange, value: string) => {
    setRangeAndUrl({ ...range, [key]: value });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Reports</h1>
        <p className="mt-1 text-slate-500">
          Sales, product, customer, and order operations insights.
        </p>
      </header>

      <section className="rounded-xl border bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="block text-sm font-medium text-slate-700">
              Date range
              <select
                className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base sm:w-56"
                value={preset}
                onChange={(event) => choosePreset(event.target.value as Preset)}
              >
                {PRESETS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            {preset === "custom" && (
              <>
                <label className="block text-sm font-medium text-slate-700">
                  From
                  <input
                    className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 px-3 text-base"
                    type="date"
                    value={range.from}
                    max={range.to || undefined}
                    onChange={(event) => setDatePart("from", event.target.value)}
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  To
                  <input
                    className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 px-3 text-base"
                    type="date"
                    value={range.to}
                    min={range.from || undefined}
                    onChange={(event) => setDatePart("to", event.target.value)}
                  />
                </label>
              </>
            )}
          </div>
          <button
            type="button"
            className="min-h-11 rounded-lg border border-slate-300 px-4 text-left text-sm font-medium hover:bg-slate-50"
            aria-pressed={compare}
            onClick={() => setCompare((value) => !value)}
          >
            <span className="mr-2 inline-block h-4 w-8 rounded-full bg-slate-300 align-middle">
              <span
                className={`block h-4 w-4 rounded-full bg-brand transition-transform ${
                  compare ? "translate-x-4" : ""
                }`}
              />
            </span>
            Compare with previous period
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Dates use Asia/Kolkata calendar days, inclusive.
        </p>
      </section>

      <nav
        className="flex min-h-11 gap-2 overflow-x-auto border-b border-slate-200"
        aria-label="Report tabs"
      >
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => selectTab(item.id)}
            className={`min-h-11 shrink-0 rounded-t-lg px-4 text-sm font-semibold ${
              tab === item.id
                ? "bg-brand text-on-brand"
                : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
            aria-current={tab === item.id ? "page" : undefined}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="flex flex-wrap justify-end gap-2">
        {tab === "products" ? (
          <>
            <button
              type="button"
              onClick={() => exportCsv("products")}
              className="min-h-11 rounded-lg bg-brand px-4 font-semibold text-on-brand hover:bg-brand-dark"
            >
              Export products CSV
            </button>
            <button
              type="button"
              onClick={() => exportCsv("categories")}
              className="min-h-11 rounded-lg border border-slate-300 px-4 font-semibold hover:bg-slate-50"
            >
              Export categories CSV
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() =>
              exportCsv(tab, tab === "customers" && includeFullPhone)
            }
            className="min-h-11 rounded-lg bg-brand px-4 font-semibold text-on-brand hover:bg-brand-dark"
          >
            Export CSV
          </button>
        )}
      </div>

      {loading ? (
        <ReportSkeleton />
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
          <p role="alert">{error}</p>
          <button
            type="button"
            onClick={() => setRetry((value) => value + 1)}
            className="mt-4 min-h-11 rounded-lg bg-red-700 px-4 font-semibold text-white hover:bg-red-800"
          >
            Retry
          </button>
        </div>
      ) : isEmpty ? (
        <div className="rounded-xl border bg-white p-8 text-center text-slate-500">
          No report data for this date range.
        </div>
      ) : data ? (
        <>
          {tab === "sales" && (
            <SalesPanel
              data={data as SalesData}
              compare={compare}
              range={range}
            />
          )}
          {tab === "products" && (
            <ProductsPanel
              data={data as ProductsData}
              sortBy={sortBy}
              setSortBy={setSortBy}
              search={search}
              setSearch={setSearch}
            />
          )}
          {tab === "customers" && (
            <CustomersPanel
              data={data as CustomersData}
              includeFullPhone={includeFullPhone}
              setIncludeFullPhone={setIncludeFullPhone}
            />
          )}
          {tab === "operations" && (
            <OperationsPanel
              data={data as OperationsData}
            />
          )}
        </>
      ) : null}

      <Definitions />
    </div>
  );
}

function ReportSkeleton() {
  return (
    <div className="space-y-5" aria-label="Loading report" aria-busy="true">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-xl bg-slate-200" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-xl bg-slate-200" />
      <div className="h-56 animate-pulse rounded-xl bg-slate-200" />
    </div>
  );
}

function MetricCard({
  label,
  value,
  change,
}: {
  label: string;
  value: string;
  change?: string;
}) {
  return (
    <article className="rounded-xl border bg-white p-4 shadow-sm md:p-5">
      <h3 className="text-sm font-medium text-slate-500">{label}</h3>
      <p className="mt-2 break-words text-2xl font-bold text-slate-900">{value}</p>
      {change !== undefined && (
        <p className="mt-1 text-sm text-slate-500">{change} vs previous period</p>
      )}
    </article>
  );
}

function SalesPanel({
  data,
  compare,
  range,
}: {
  data: SalesData;
  compare: boolean;
  range: DateRange;
}) {
  const metrics: { label: string; key: keyof SalesTotals; format: (value: number) => string }[] = [
    { label: "Orders", key: "orders", format: count },
    { label: "Revenue", key: "revenue", format: money },
    { label: "Complete revenue", key: "complete_revenue", format: money },
    { label: "Average order value", key: "aov", format: money },
    { label: "Items sold", key: "items_sold", format: count },
    { label: "Shipping collected", key: "shipping_total", format: money },
    { label: "Cancelled orders", key: "cancelled_orders", format: count },
    { label: "Cancelled value", key: "cancelled_value", format: money },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.key}
            label={metric.label}
            value={metric.format(data.totals[metric.key])}
            change={
              compare
                ? percentChange(
                    data.totals[metric.key],
                    data.previousTotals[metric.key]
                  )
                : undefined
            }
          />
        ))}
      </div>
      <section className="rounded-xl border bg-white p-4 shadow-sm md:p-6">
        <h2 className="text-xl font-semibold">Revenue and orders</h2>
        <p className="mt-1 text-sm text-slate-500">
          {displayDate(range.from)} – {displayDate(range.to)} · Grouped by {data.group}
        </p>
        <SalesChart series={data.series} />
      </section>
      <section className="rounded-xl border bg-white p-4 shadow-sm md:p-6">
        <h2 className="mb-4 text-xl font-semibold">Sales by {data.group}</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-[520px] w-full text-sm">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="p-3">Period</th>
                <th className="p-3 text-right">Orders</th>
                <th className="p-3 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.series.map((item) => (
                <tr key={item.period} className="border-t">
                  <td className="p-3">{displayDate(item.period)}</td>
                  <td className="p-3 text-right">{count(item.orders)}</td>
                  <td className="p-3 text-right">{money(item.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SalesChart({
  series,
}: {
  series: SalesData["series"];
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const width = Math.max(720, series.length * 38);
  const height = 280;
  const left = 62;
  const right = 54;
  const top = 18;
  const bottom = 52;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const maxRevenue = Math.max(1, ...series.map((item) => item.revenue));
  const maxOrders = Math.max(1, ...series.map((item) => item.orders));
  const step = series.length > 1 ? chartWidth / (series.length - 1) : 0;
  const x = (index: number) => left + (series.length > 1 ? index * step : chartWidth / 2);
  const yRevenue = (value: number) => top + chartHeight * (1 - value / maxRevenue);
  const yOrders = (value: number) => top + chartHeight * (1 - value / maxOrders);
  const revenuePoints = series.map((item, index) => `${x(index)},${yRevenue(item.revenue)}`).join(" ");
  const orderPoints = series.map((item, index) => `${x(index)},${yOrders(item.orders)}`).join(" ");
  const selectedItem = selected === null ? null : series[selected];
  const labelIndexes = new Set(
    series.map((_, index) =>
      series.length <= 8 ? index : Math.round((index * (series.length - 1)) / 7)
    )
  );

  return (
    <div className="mt-5">
      <div className="mb-3 flex flex-wrap gap-4 text-sm">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-brand" /> Revenue (left axis)
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-amber-500" /> Orders (right axis)
        </span>
      </div>
      <div className="overflow-x-auto rounded-lg border bg-slate-50">
        <svg
          className="block max-w-none"
          width={width}
          height={height}
          role="img"
          aria-label="Revenue and order count over time"
        >
          {[0, 1, 2, 3, 4].map((tick) => {
            const y = top + (chartHeight * tick) / 4;
            const revenue = maxRevenue * (1 - tick / 4);
            const orders = maxOrders * (1 - tick / 4);
            return (
              <g key={tick}>
                <line x1={left} x2={width - right} y1={y} y2={y} stroke="#e2e8f0" />
                <text x={left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#64748b">
                  {revenue >= 1000 ? `₹${(revenue / 1000).toFixed(0)}k` : `₹${revenue.toFixed(0)}`}
                </text>
                <text x={width - right + 8} y={y + 4} fontSize="10" fill="#64748b">
                  {orders.toFixed(0)}
                </text>
              </g>
            );
          })}
          {series.length > 1 && (
            <>
              <polyline
                fill="none"
                stroke="rgb(var(--brand))"
                strokeWidth="2.5"
                points={revenuePoints}
              />
              <polyline
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                points={orderPoints}
              />
            </>
          )}
          {series.map((item, index) => (
            <g key={item.period}>
              <circle
                cx={x(index)}
                cy={yRevenue(item.revenue)}
                r="5"
                fill="rgb(var(--brand))"
                tabIndex={0}
                role="button"
                aria-label={`${item.period}: revenue ${money(item.revenue)}, ${item.orders} orders`}
                onClick={() => setSelected(index)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") setSelected(index);
                }}
              >
                <title>
                  {displayDate(item.period)}: {money(item.revenue)}, {count(item.orders)} orders
                </title>
              </circle>
              <circle
                cx={x(index)}
                cy={yOrders(item.orders)}
                r="4"
                fill="#f59e0b"
                tabIndex={0}
                role="button"
                aria-label={`${item.period}: ${item.orders} orders`}
                onClick={() => setSelected(index)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") setSelected(index);
                }}
              >
                <title>
                  {displayDate(item.period)}: {count(item.orders)} orders
                </title>
              </circle>
              {labelIndexes.has(index) && (
                <text
                  x={x(index)}
                  y={height - 20}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#64748b"
                >
                  {item.period.slice(5)}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
      <p className="mt-3 min-h-6 text-sm text-slate-600" aria-live="polite">
        {selectedItem
          ? `${displayDate(selectedItem.period)}: ${money(selectedItem.revenue)} revenue, ${count(selectedItem.orders)} orders`
          : "Tap or hover a chart point to see its exact values."}
      </p>
    </div>
  );
}

function ProductsPanel({
  data,
  sortBy,
  setSortBy,
  search,
  setSearch,
}: {
  data: ProductsData;
  sortBy: "quantity" | "revenue";
  setSortBy: (value: "quantity" | "revenue") => void;
  search: string;
  setSearch: (value: string) => void;
}) {
  const products = useMemo(() => {
    const term = search.trim().toLowerCase();
    return [...data.products]
      .filter(
        (item) =>
          !term ||
          item.product_name.toLowerCase().includes(term) ||
          (item.product_id ?? "").toLowerCase().includes(term)
      )
      .sort((a, b) => b[sortBy] - a[sortBy]);
  }, [data.products, search, sortBy]);
  const totalCategoryRevenue = data.categories.reduce(
    (sum, category) => sum + category.revenue,
    0
  );

  return (
    <div className="space-y-5">
      <section className="rounded-xl border bg-white p-4 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Top products</h2>
            <p className="mt-1 text-sm text-slate-500">Non-cancelled orders only.</p>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label className="flex-1 text-sm font-medium text-slate-700">
            Search products
            <input
              className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-base"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Product name or ID"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSortBy("quantity")}
              aria-pressed={sortBy === "quantity"}
              className={`min-h-11 rounded-lg border px-4 font-medium ${
                sortBy === "quantity" ? "border-brand bg-brand-soft" : "bg-white"
              }`}
            >
              Quantity
            </button>
            <button
              type="button"
              onClick={() => setSortBy("revenue")}
              aria-pressed={sortBy === "revenue"}
              className={`min-h-11 rounded-lg border px-4 font-medium ${
                sortBy === "revenue" ? "border-brand bg-brand-soft" : "bg-white"
              }`}
            >
              Revenue
            </button>
          </div>
        </div>
        {products.length === 0 ? (
          <p className="mt-5 rounded-lg bg-slate-50 p-5 text-center text-slate-500">
            No product sales match this range or search.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border">
            <table className="min-w-[680px] w-full text-sm">
              <thead className="bg-slate-100 text-left">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3">Product ID</th>
                  <th className="p-3 text-right">Quantity</th>
                  <th className="p-3 text-right">Revenue</th>
                  <th className="p-3 text-right">Orders</th>
                </tr>
              </thead>
              <tbody>
                {products.map((item) => (
                  <tr key={`${item.product_id ?? "none"}-${item.product_name}`} className="border-t">
                    <td className="p-3">{item.product_name}</td>
                    <td className="p-3 text-slate-500">{item.product_id ?? "—"}</td>
                    <td className="p-3 text-right">{count(item.quantity)}</td>
                    <td className="p-3 text-right">{money(item.revenue)}</td>
                    <td className="p-3 text-right">{count(item.order_count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border bg-white p-4 shadow-sm md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Category breakdown</h2>
            <p className="mt-1 text-sm text-slate-500">Share of non-cancelled item revenue.</p>
          </div>
        </div>
        {data.categories.length === 0 ? (
          <p className="mt-4 text-slate-500">No category sales for this date range.</p>
        ) : (
          <div className="mt-5 space-y-4">
            {data.categories.map((category) => {
              const share =
                totalCategoryRevenue > 0
                  ? (category.revenue / totalCategoryRevenue) * 100
                  : 0;
              return (
                <div key={category.category}>
                  <div className="mb-1 flex flex-wrap justify-between gap-2 text-sm">
                    <span className="font-medium">{category.category}</span>
                    <span className="text-slate-600">
                      {money(category.revenue)} · {share.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${Math.min(share, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function CustomersPanel({
  data,
  includeFullPhone,
  setIncludeFullPhone,
}: {
  data: CustomersData;
  includeFullPhone: boolean;
  setIncludeFullPhone: (value: boolean) => void;
}) {
  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard label="New customers" value={count(data.newCustomers)} />
        <MetricCard label="Repeat customers" value={count(data.repeatCustomers)} />
        <MetricCard label="Repeat rate" value={`${data.repeatRate.toFixed(1)}%`} />
      </section>
      <section className="rounded-xl border bg-white p-4 shadow-sm md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Top customers by spend</h2>
            <p className="mt-1 text-sm text-slate-500">Phone numbers are masked on screen.</p>
          </div>
        </div>
        <label className="mt-4 flex min-h-11 items-center gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={includeFullPhone}
            onChange={(event) => setIncludeFullPhone(event.target.checked)}
            className="h-5 w-5 accent-brand"
          />
          Include full phone numbers in CSV export
        </label>
        {data.customers.length === 0 ? (
          <p className="mt-4 text-slate-500">No customer orders in this range.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border">
            <table className="min-w-[620px] w-full text-sm">
              <thead className="bg-slate-100 text-left">
                <tr>
                  <th className="p-3">Phone</th>
                  <th className="p-3 text-right">Orders</th>
                  <th className="p-3 text-right">Spend</th>
                  <th className="p-3">Last order</th>
                </tr>
              </thead>
              <tbody>
                {data.customers.map((customer) => (
                  <tr key={customer.phone} className="border-t">
                    <td className="p-3">{customer.phone}</td>
                    <td className="p-3 text-right">{count(customer.orderCount)}</td>
                    <td className="p-3 text-right">{money(customer.spend)}</td>
                    <td className="p-3">{displayDate(customer.lastOrderDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="rounded-xl border bg-white p-4 shadow-sm md:p-6">
        <h2 className="text-xl font-semibold">Top pincodes</h2>
        {data.pincodes.length === 0 ? (
          <p className="mt-4 text-slate-500">No pincode data for this date range.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border">
            <table className="min-w-[480px] w-full text-sm">
              <thead className="bg-slate-100 text-left">
                <tr>
                  <th className="p-3">Pincode</th>
                  <th className="p-3 text-right">Orders</th>
                  <th className="p-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.pincodes.map((item) => (
                  <tr key={item.pincode} className="border-t">
                    <td className="p-3">{item.pincode}</td>
                    <td className="p-3 text-right">{count(item.orders)}</td>
                    <td className="p-3 text-right">{money(item.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function OperationsPanel({
  data,
}: {
  data: OperationsData;
}) {
  const statuses = ["Placed", "Accepted", "Dispatched", "Complete", "Cancelled"];
  return (
    <div className="space-y-5">
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {statuses.map((status) => (
          <MetricCard
            key={status}
            label={`${status} orders`}
            value={count(data.statusCounts[status] ?? 0)}
          />
        ))}
        <MetricCard
          label="Cancellation rate"
          value={`${data.cancellationRate.toFixed(1)}%`}
        />
      </section>
      <section className="rounded-xl border bg-white p-4 shadow-sm md:p-6">
        <h2 className="text-xl font-semibold">Stale orders</h2>
        <p className="mt-1 text-sm text-slate-500">
          Placed &gt;24h · Accepted &gt;48h · Dispatched &gt;7d. This list is current and ignores
          the selected date range.
        </p>
        {data.staleOrders.length === 0 ? (
          <p className="mt-5 rounded-lg bg-slate-50 p-5 text-center text-slate-500">
            No stale orders right now.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border">
            <table className="min-w-[760px] w-full text-sm">
              <thead className="bg-slate-100 text-left">
                <tr>
                  <th className="p-3">Order</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Age (hours)</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.staleOrders.map((order) => (
                  <tr key={order.order_no} className="border-t">
                    <td className="p-3 font-medium">
                      <Link
                        href={`/admin/orders/${encodeURIComponent(order.order_no)}`}
                        className="text-blue-700 underline-offset-2 hover:underline"
                      >
                        {order.order_no}
                      </Link>
                    </td>
                    <td className="p-3">{order.customer_name || "—"}</td>
                    <td className="p-3">{order.status}</td>
                    <td className="p-3 text-right">
                      {order.age_hours.toLocaleString("en-IN", {
                        maximumFractionDigits: 1,
                      })}
                    </td>
                    <td className="p-3 text-right">{money(order.grand_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Definitions() {
  return (
    <details className="rounded-xl border bg-white p-4 shadow-sm">
      <summary className="min-h-11 cursor-pointer py-2 font-semibold text-slate-800">
        How these numbers are calculated
      </summary>
      <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
        <li>
          Dates are order creation dates in Asia/Kolkata; the end date is included. Stored
          timestamp-without-time-zone values are treated as Asia/Kolkata wall time.
        </li>
        <li>
          Revenue is the sum of grand totals for orders not Cancelled. Shipping is included in
          revenue and is also shown separately. Complete revenue includes Complete orders only.
        </li>
        <li>
          AOV is non-cancelled revenue divided by the number of non-cancelled orders. Items sold
          is the sum of order-item quantities for non-cancelled orders.
        </li>
        <li>
          Legacy Closed orders count as Complete. Repeat customers had a non-cancelled order before
          the selected range or more than one non-cancelled order in it.
        </li>
        <li>
          Cancellation rate is cancelled orders divided by all orders in the selected range.
          Stale orders use the thresholds shown above and are not date-filtered.
        </li>
      </ul>
    </details>
  );
}
