"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SiteHeader from "@/components/SiteHeader";

type Order = {
  order_no: string;
  status: string;
  grand_total: number | string;
  created_at: string;
  item_count: number;
};

type OrdersResult = {
  orders: Order[];
  page: number;
  totalPages: number;
  totalCount: number;
};

function statusClass(status: string): string {
  switch (status) {
    case "Placed":
      return "bg-amber-100 text-amber-900";
    case "Accepted":
      return "bg-blue-100 text-blue-900";
    case "Dispatched":
      return "bg-orange-100 text-orange-900";
    case "Cancelled":
      return "bg-red-100 text-red-800";
    case "Complete":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AccountOrdersPage() {
  const [result, setResult] = useState<OrdersResult | null>(null);
  const [page, setPage] = useState(1);
  const [retryCount, setRetryCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    fetch(`/api/account/orders?page=${page}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Unable to load your orders.");
        }
        return data as OrdersResult;
      })
      .then((data) => {
        if (active) setResult(data);
      })
      .catch(() => {
        if (active) setError("Unable to load your orders.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, retryCount]);

  return (
    <div className="min-h-screen bg-surface text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <Link
          href="/account"
          className="inline-flex min-h-11 items-center font-semibold text-brand-dark hover:underline"
        >
          ← My account
        </Link>
        <div className="mt-3">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            My orders
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            View your recent orders and their status.
          </p>
        </div>

        {loading ? (
          <div className="mt-6 space-y-4" aria-label="Loading orders">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-2xl border border-gray-200 bg-white"
              />
            ))}
          </div>
        ) : error ? (
          <section
            className="mt-6 rounded-2xl border border-red-200 bg-white p-6"
            role="alert"
          >
            <p className="text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => setRetryCount((count) => count + 1)}
              className="mt-4 min-h-11 rounded-lg bg-brand px-4 py-2 font-semibold text-on-brand hover:bg-brand-dark"
            >
              Retry
            </button>
          </section>
        ) : result?.orders.length === 0 ? (
          <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              No orders yet
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Your orders will appear here.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-brand px-4 py-2 font-semibold text-on-brand hover:bg-brand-dark"
            >
              Continue shopping
            </Link>
          </section>
        ) : (
          <>
            <div className="mt-6 space-y-4">
              {result?.orders.map((order) => (
                <Link
                  key={order.order_no}
                  href={`/account/orders/${encodeURIComponent(order.order_no)}`}
                  className="block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-brand/50 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Order
                      </p>
                      <h2 className="mt-1 break-all font-semibold text-brand-dark">
                        {order.order_no}
                      </h2>
                      <p className="mt-1 text-sm text-gray-600">
                        {formatDate(order.created_at)} · {order.item_count}{" "}
                        {order.item_count === 1 ? "item" : "items"}
                      </p>
                    </div>
                    <span
                      className={`inline-flex min-h-8 items-center rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="mt-4 text-lg font-bold text-gray-900">
                    ₹{Number(order.grand_total).toLocaleString("en-IN")}
                  </p>
                </Link>
              ))}
            </div>

            {result && result.totalPages > 1 && (
              <nav
                aria-label="Order pages"
                className="mt-6 flex items-center justify-between gap-3"
              >
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1}
                  className="min-h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {result.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPage((current) =>
                      Math.min(result.totalPages, current + 1)
                    )
                  }
                  disabled={page >= result.totalPages}
                  className="min-h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            )}
          </>
        )}
      </main>
    </div>
  );
}
