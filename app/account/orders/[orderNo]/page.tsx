"use client";

import Link from "next/link";
import { use } from "react";
import { useEffect, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import { BUSINESS_PROFILE } from "@/lib/businessProfile";

type OrderStatus =
  | "Placed"
  | "Accepted"
  | "Dispatched"
  | "Complete"
  | "Cancelled";

type Order = {
  order_no: string;
  status: OrderStatus | string;
  created_at: string;
  subtotal: number | string;
  shipping: number | string;
  grand_total: number | string;
  customer_name: string | null;
  phone: string | null;
  address: string | null;
  pincode: string | null;
  customer_update: string | null;
};

type OrderItem = {
  product_name: string;
  quantity: number | string;
  price: number | string;
  amount: number | string;
};

type OrderResult = {
  order: Order;
  items: OrderItem[];
};

const regularStatuses: OrderStatus[] = [
  "Placed",
  "Accepted",
  "Dispatched",
  "Complete",
];

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

function money(value: number | string): string {
  return Number(value).toLocaleString("en-IN");
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function normalizedStatus(status: string): string {
  return status.trim().toLowerCase() === "closed" ? "Complete" : status;
}

export default function AccountOrderDetailsPage({
  params,
}: {
  params: Promise<{ orderNo: string }>;
}) {
  const { orderNo } = use(params);
  const [result, setResult] = useState<OrderResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    fetch(`/api/account/orders/${encodeURIComponent(orderNo)}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "We couldn't find that order."
              : data.error || "Unable to load this order."
          );
        }
        return data as OrderResult;
      })
      .then((data) => {
        if (active) setResult(data);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load this order."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [orderNo, retryCount]);

  function openWhatsApp() {
    if (!result) return;
    const url = new URL(BUSINESS_PROFILE.whatsappUrl);
    url.searchParams.set(
      "text",
      `Hi, about my order ${result.order.order_no}.`
    );
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  }

  const status = result ? normalizedStatus(result.order.status) : "";
  const isCancelled = status === "Cancelled";
  const timeline = isCancelled
    ? (["Placed", "Cancelled"] as const)
    : regularStatuses;
  const currentStep = isCancelled
    ? 1
    : regularStatuses.indexOf(status as OrderStatus);

  return (
    <div className="min-h-screen bg-surface text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <Link
          href="/account/orders"
          className="inline-flex min-h-11 items-center font-semibold text-brand-dark hover:underline"
        >
          ← My orders
        </Link>

        {loading ? (
          <div className="mt-5 space-y-4" aria-label="Loading order">
            <div className="h-36 animate-pulse rounded-2xl bg-white" />
            <div className="h-56 animate-pulse rounded-2xl bg-white" />
          </div>
        ) : error || !result ? (
          <section
            className="mt-5 rounded-2xl border border-red-200 bg-white p-6"
            role="alert"
          >
            <p className="text-sm text-red-700">
              {error || "Unable to load this order."}
            </p>
            {error !== "We couldn't find that order." && (
              <button
                type="button"
                onClick={() => setRetryCount((count) => count + 1)}
                className="mt-4 min-h-11 rounded-lg bg-brand px-4 py-2 font-semibold text-on-brand hover:bg-brand-dark"
              >
                Retry
              </button>
            )}
          </section>
        ) : (
          <>
            <section className="mt-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-500">Order</p>
                  <h1 className="mt-1 break-all text-2xl font-bold text-gray-900">
                    {result.order.order_no}
                  </h1>
                  <p className="mt-2 text-sm text-gray-600">
                    Placed {formatDate(result.order.created_at)}
                  </p>
                </div>
                <span
                  className={`inline-flex min-h-9 items-center rounded-full px-3 py-1 text-sm font-semibold ${statusClass(
                    status
                  )}`}
                >
                  {status}
                </span>
              </div>

              <div className="mt-6 border-t border-gray-100 pt-5">
                <h2 className="text-lg font-semibold text-gray-900">
                  Order status
                </h2>
                <ol className="mt-4">
                  {timeline.map((step, index) => {
                    const complete = index <= currentStep;
                    const current = index === currentStep;
                    const cancelledStep = step === "Cancelled";

                    return (
                      <li
                        key={step}
                        aria-current={current ? "step" : undefined}
                        className="flex min-h-12 gap-3"
                      >
                        <div className="flex w-8 flex-col items-center">
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                              cancelledStep
                                ? complete
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-500"
                                : complete
                                  ? "bg-brand text-on-brand"
                                  : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {cancelledStep ? "×" : complete ? "✓" : index + 1}
                          </span>
                          {index < timeline.length - 1 && (
                            <span
                              className={`mt-1 min-h-5 w-px flex-1 ${
                                complete ? "bg-brand/60" : "bg-gray-200"
                              }`}
                            />
                          )}
                        </div>
                        <span
                          className={`pb-4 pt-1 text-sm ${
                            current
                              ? "font-semibold text-gray-900"
                              : complete
                                ? "text-gray-700"
                                : "text-gray-500"
                          }`}
                        >
                          {step}
                          {current && (
                            <span className="sr-only"> (current status)</span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </section>

            {result.order.customer_update && (
              <section className="mt-4 rounded-2xl border border-brand/20 bg-white p-5 shadow-sm sm:p-7">
                <h2 className="text-lg font-semibold text-gray-900">
                  Latest update from us
                </h2>
                <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-gray-700">
                  {result.order.customer_update}
                </p>
              </section>
            )}

            <section className="mt-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
              <h2 className="text-lg font-semibold text-gray-900">Items</h2>
              <ul className="mt-3 divide-y divide-gray-100">
                {result.items.map((item, index) => (
                  <li
                    key={`${item.product_name}-${index}`}
                    className="flex flex-wrap items-start justify-between gap-2 py-4"
                  >
                    <div className="min-w-0">
                      <p className="break-words font-medium text-gray-900">
                        {item.product_name}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        Qty {item.quantity} · ₹{money(item.price)} each
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900">
                      ₹{money(item.amount)}
                    </p>
                  </li>
                ))}
              </ul>

              <dl className="space-y-2 border-t border-gray-100 pt-4 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-600">Subtotal</dt>
                  <dd className="font-medium">₹{money(result.order.subtotal)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-600">Shipping</dt>
                  <dd className="font-medium">₹{money(result.order.shipping)}</dd>
                </div>
                <div className="flex justify-between gap-3 pt-1 text-base">
                  <dt className="font-semibold text-gray-900">Total</dt>
                  <dd className="font-bold text-gray-900">
                    ₹{money(result.order.grand_total)}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="mt-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
              <h2 className="text-lg font-semibold text-gray-900">
                Delivery details
              </h2>
              <p className="mt-3 font-medium text-gray-900">
                {result.order.customer_name || "Customer"}
              </p>
              {result.order.phone && (
                <p className="mt-1 text-sm text-gray-600">
                  {result.order.phone}
                </p>
              )}
              {result.order.address && (
                <address className="mt-2 whitespace-pre-line text-sm not-italic leading-6 text-gray-700">
                  {result.order.address}
                  {result.order.pincode ? `\n${result.order.pincode}` : ""}
                </address>
              )}
            </section>

            <button
              type="button"
              onClick={openWhatsApp}
              className="mt-5 min-h-11 w-full rounded-lg bg-brand px-4 py-3 font-semibold text-on-brand hover:bg-brand-dark sm:w-auto"
            >
              Message us on WhatsApp about this order
            </button>
          </>
        )}
      </main>
    </div>
  );
}
