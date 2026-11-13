"use client";

import { useState, type FormEvent } from "react";
import { BUSINESS_PROFILE } from "@/lib/businessProfile";
import {
  buildTrackingSupportMessage,
  formatTrackingOrderDate,
  formatTrackingPrice,
  ORDER_TRACKING_STEPS,
  type TrackingOrderSummary,
} from "@/lib/order-tracking";

const GENERIC_LOOKUP_ERROR =
  "We could not find an order matching these details. Please verify your order number and mobile number.";

export default function TrackOrderForm() {
  const [orderNumber, setOrderNumber] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [order, setOrder] = useState<TrackingOrderSummary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setOrder(null);

    if (!orderNumber.trim() || !mobileNumber.trim()) {
      setError("Enter your order number and registered mobile number.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/track-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          orderNumber: orderNumber.trim(),
          mobileNumber: mobileNumber.trim(),
        }),
      });
      const result = (await response.json()) as {
        order?: TrackingOrderSummary;
        error?: string;
      };

      if (!response.ok) {
        setError(
          response.status === 404 ? GENERIC_LOOKUP_ERROR : result.error || GENERIC_LOOKUP_ERROR
        );
        return;
      }

      setOrder(result.order ?? null);
      if (!result.order) setError(GENERIC_LOOKUP_ERROR);
    } catch {
      setError("Order tracking is temporarily unavailable. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8"
      >
        <div>
          <label
            htmlFor="tracking-order-number"
            className="mb-2 block text-sm font-semibold text-gray-800"
          >
            Order Number
          </label>
          <input
            id="tracking-order-number"
            name="orderNumber"
            type="text"
            autoComplete="off"
            required
            maxLength={20}
            placeholder="NH20261113123456"
            value={orderNumber}
            onChange={(event) => setOrderNumber(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>

        <div>
          <label
            htmlFor="tracking-mobile-number"
            className="mb-2 block text-sm font-semibold text-gray-800"
          >
            Registered Mobile Number
          </label>
          <input
            id="tracking-mobile-number"
            name="mobileNumber"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            maxLength={32}
            placeholder="Enter the mobile number used when ordering"
            value={mobileNumber}
            onChange={(event) => setMobileNumber(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand px-5 py-3 font-semibold text-on-brand transition hover:bg-brand-dark hover:text-brand-soft disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        >
          {loading && (
            <span
              aria-hidden="true"
              className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
            />
          )}
          {loading ? "Checking order..." : "Track Order"}
        </button>
      </form>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </p>
      )}

      {order && (
        <section
          aria-live="polite"
          aria-labelledby="tracking-result-heading"
          className="space-y-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8"
        >
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-dark">
              Order Details
            </p>
            <h2
              id="tracking-result-heading"
              className="mt-1 text-xl font-bold text-gray-900"
            >
              {order.orderNumber}
            </h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-gray-500">Order Date</dt>
                <dd className="mt-1 font-medium text-gray-900">
                  {formatTrackingOrderDate(order.orderDate)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Current Order Status</dt>
                <dd className="mt-1 font-semibold text-brand-dark">
                  {order.status}
                </dd>
              </div>
            </dl>
          </div>

          <div className="border-t border-gray-200 pt-5">
            <h3 className="font-semibold text-gray-900">Product Details</h3>
            {order.items.length > 0 ? (
              <ul className="mt-3 divide-y divide-gray-100">
                {order.items.map((item, index) => (
                  <li
                    key={`${item.productName}-${index}`}
                    className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.productName}
                      </p>
                      <p className="text-sm text-gray-600">
                        Qty: {item.quantity} × {formatTrackingPrice(item.unitPrice)}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900">
                      {formatTrackingPrice(item.amount)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-gray-600">
                Product details are not available for this order.
              </p>
            )}

            <dl className="mt-3 space-y-2 border-t border-gray-200 pt-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-600">Subtotal</dt>
                <dd className="font-medium text-gray-900">
                  {formatTrackingPrice(order.subtotal)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-600">Shipping</dt>
                <dd className="font-medium text-gray-900">
                  {formatTrackingPrice(order.shipping)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-gray-200 pt-3 text-base">
                <dt className="font-semibold text-gray-900">Grand Total</dt>
                <dd className="font-bold text-brand-dark">
                  {formatTrackingPrice(order.grandTotal)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="border-t border-gray-200 pt-5">
            <h3 className="font-semibold text-gray-900">
              Order Progress Timeline
            </h3>
            <ol className="mt-5 space-y-4">
              {ORDER_TRACKING_STEPS.map((step, index) => {
                const isReached = index <= order.progressIndex;
                const isCurrent = index === order.progressIndex;

                return (
                  <li
                    key={step}
                    aria-current={isCurrent ? "step" : undefined}
                    className="flex items-center gap-3"
                  >
                    <span
                      aria-hidden="true"
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${
                        isReached
                          ? "border-brand-dark bg-brand-dark text-white"
                          : "border-gray-300 bg-white text-gray-400"
                      }`}
                    >
                      {isReached ? "✓" : index + 1}
                    </span>
                    <span
                      className={
                        isReached
                          ? "font-semibold text-brand-dark"
                          : "text-gray-500"
                      }
                    >
                      {step}
                    </span>
                    {isCurrent && (
                      <span className="sr-only">(current status)</span>
                    )}
                  </li>
                );
              })}
            </ol>
            {order.statusNote && (
              <p className="mt-4 text-sm text-gray-600">{order.statusNote}</p>
            )}
          </div>

          <div className="border-t border-gray-200 pt-5">
            <p className="font-semibold text-gray-900">
              Need help with your order?
            </p>
            <a
              href={`${BUSINESS_PROFILE.whatsappUrl}?text=${encodeURIComponent(
                buildTrackingSupportMessage(order)
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex min-h-11 items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-on-brand transition hover:bg-brand-dark hover:text-brand-soft"
            >
              Contact NH Enterprises on WhatsApp
            </a>
          </div>
        </section>
      )}
    </div>
  );
}
