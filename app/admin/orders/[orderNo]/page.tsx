"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { use } from "react";
import { ORDER_STATUS, type OrderStatus } from "@/lib/order-status";
import {
  buildCourierDispatchedMessage,
  buildConfirmationMessage,
  buildLocalDeliveryMessage,
  buildStatusMessage,
} from "@/lib/orderMessages";
import { normalizeIndianMobileNumber } from "@/lib/indian-mobile";

type DispatchDialog = "courier" | "local" | null;
type ExpectedDayChoice = "" | "Today" | "Tomorrow" | "date";

interface Order {
  order_no: string;
  customer_name: string;
  phone: string;
  address: string;
  pincode: string;
  subtotal: number;
  shipping: number;
  grand_total: number;
  status: OrderStatus;
  created_at: string;
  confirmation_opened_at: string | null;
  courier?: string | null;
  tracking_number?: string | null;
}

interface OrderItem {
  product_name: string;
  quantity: number;
  price: number;
  amount: number;
}

function relativeTime(value: string): string {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "recently";

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (elapsedSeconds < 60) return "just now";
  if (elapsedSeconds < 3600) {
    return formatter.format(-Math.floor(elapsedSeconds / 60), "minute");
  }
  if (elapsedSeconds < 86_400) {
    return formatter.format(-Math.floor(elapsedSeconds / 3600), "hour");
  }
  return formatter.format(-Math.floor(elapsedSeconds / 86_400), "day");
}

export default function OrderDetailsPage({
  params,
}: {
  params: Promise<{ orderNo: string }>;
}) {
  const { orderNo } = use(params);

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [messageActionError, setMessageActionError] = useState("");
  const [copyNotice, setCopyNotice] = useState("");
  const [dispatchDialog, setDispatchDialog] = useState<DispatchDialog>(null);
  const [courierName, setCourierName] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [expectedDayChoice, setExpectedDayChoice] =
    useState<ExpectedDayChoice>("");
  const [expectedLocalDate, setExpectedLocalDate] = useState("");
  const [preparedDispatchMessage, setPreparedDispatchMessage] =
    useState<string | null>(null);

  useEffect(() => {
    loadOrder();
  }, []);

  async function loadOrder() {
    try {
      const response = await fetch(
        `/api/order-details/${orderNo}`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error("Unable to load order.");
      }

      const data = await response.json();

      setOrder(data.order);
      setItems(data.items);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(newStatus: OrderStatus) {
    try {
      setUpdating(true);

      const response = await fetch("/api/order-status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderNo: order?.order_no,
          status: newStatus,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to update order."
        );
      }

      setOrder(result.order);

      setSuccessMessage(`Order status updated to ${newStatus}.`);

      setTimeout(() => {
        setSuccessMessage("");
      }, 2000);
    } catch (error) {
      console.error(error);
      alert("Unable to update order.");
    } finally {
      setUpdating(false);
    }
  }

  async function markConfirmationOpened() {
    if (!order) return;

    try {
      const response = await fetch(
        `/api/admin/orders/${encodeURIComponent(order.order_no)}/whatsapp`,
        { method: "POST" }
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Unable to record the message status.");
      }

      setOrder((current) =>
        current
          ? {
              ...current,
              confirmation_opened_at: result.confirmationOpenedAt,
            }
          : current
      );
      setMessageActionError("");
    } catch {
      setMessageActionError("Could not record that the message was opened.");
    }
  }

  async function copyCustomerMessage(message: string) {
    try {
      await navigator.clipboard.writeText(message);
      setCopyNotice("Message copied.");
      setMessageActionError("");
    } catch {
      setCopyNotice("");
      setMessageActionError("Could not copy the message. Check clipboard permissions.");
    }
  }

  function openDispatchDialog(dialog: Exclude<DispatchDialog, null>) {
    setDispatchDialog(dialog);
    setPreparedDispatchMessage(null);
    setCopyNotice("");
    setMessageActionError("");
    if (dialog === "courier") {
      setCourierName("");
      setTrackingNumber("");
      setExpectedDelivery("");
    } else {
      setExpectedDayChoice("");
      setExpectedLocalDate("");
    }
  }

  function sendDispatchMessage(message: string) {
    if (!customerPhone) return;

    setPreparedDispatchMessage(message);
    setDispatchDialog(null);
    setMessageActionError("");
    const url = `https://wa.me/91${customerPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    void markConfirmationOpened();
  }

  function submitCourierMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!order) return;
    if (
      !courierName.trim() ||
      !trackingNumber.trim() ||
      !expectedDelivery
    ) {
      setMessageActionError("Please complete all required fields.");
      return;
    }

    sendDispatchMessage(
      buildCourierDispatchedMessage(
        order,
        courierName,
        trackingNumber,
        expectedDelivery
      )
    );
  }

  function submitLocalDeliveryMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!order) return;
    const expectedDay =
      expectedDayChoice === "date" ? expectedLocalDate : expectedDayChoice;
    if (!expectedDay) {
      setMessageActionError("Please choose an expected day.");
      return;
    }

    sendDispatchMessage(buildLocalDeliveryMessage(order, expectedDay));
  }

  if (loading) {
    return <div className="text-xl">Loading...</div>;
  }

  if (!order) {
    return <div className="text-xl">Order not found.</div>;
  }

  const customerPhone = normalizeIndianMobileNumber(order.phone);
  const customerMessage =
    order.status === ORDER_STATUS.PLACED
      ? buildConfirmationMessage(order, items)
      : order.status === ORDER_STATUS.DISPATCHED
      ? preparedDispatchMessage ?? buildStatusMessage(order, order.status)
      : buildStatusMessage(order, order.status);
  const customerWhatsAppUrl = customerPhone
    ? `https://wa.me/91${customerPhone}?text=${encodeURIComponent(customerMessage)}`
    : null;
  const canCopyCustomerMessage =
    order.status !== ORDER_STATUS.DISPATCHED ||
    preparedDispatchMessage !== null;

  return (
    <div className="space-y-8">
      {/* ================================
          ORDER HEADER
      ================================= */}

      <div className="rounded-xl bg-white p-6 shadow">
        <div className="flex items-center justify-between">

          <h1 className="text-3xl font-bold">
            Order {order.order_no}
          </h1>

          <div className="flex gap-3">

            {/* ================================
                DOWNLOAD MENU
            ================================= */}

            <div className="relative">

              <button
                type="button"
                onClick={() =>
                  setDownloadOpen(
                    (current) => !current
                  )
                }
                className="rounded bg-brand px-4 py-2 text-on-brand hover:bg-brand-dark hover:text-brand-soft"
              >
                📄 Download
              </button>

              {downloadOpen && (
                <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">

                  {/* Bill of Supply */}

                  <Link
                    href={`/api/invoice/${order.order_no}`}
                    target="_blank"
                    prefetch={false}
                    onClick={() =>
                      setDownloadOpen(false)
                    }
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    📄 Bill of Supply
                  </Link>

                  {/* GST Invoice */}

                  <Link
                    href={`/api/gst-invoice/${order.order_no}`}
                    target="_blank"
                    prefetch={false}
                    onClick={() =>
                      setDownloadOpen(false)
                    }
                    className="block border-t border-gray-100 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    🧾 GST Invoice
                  </Link>

                </div>
              )}

            </div>

            {/* Back Button */}

            <button
              onClick={() =>
                window.history.back()
              }
              className="rounded bg-slate-700 px-4 py-2 text-white hover:bg-slate-800"
            >
              ← Back to Orders
            </button>

          </div>
        </div>

        {/* ================================
            SUCCESS MESSAGE
        ================================= */}

        {successMessage && (
          <div className="mt-4 rounded-lg border border-green-300 bg-green-100 px-4 py-3 text-green-800">
            ✅ {successMessage}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {order.status === ORDER_STATUS.DISPATCHED ? (
            <>
              <button
                type="button"
                onClick={() => openDispatchDialog("courier")}
                disabled={!customerPhone}
                title={
                  customerPhone
                    ? undefined
                    : "Customer phone must be a valid 10-digit Indian mobile number."
                }
                className={`min-h-11 rounded-lg px-5 py-2 font-semibold text-white ${
                  customerPhone
                    ? "bg-green-700 hover:bg-green-800"
                    : "cursor-not-allowed bg-green-700 opacity-50"
                }`}
              >
                Dispatched by courier
              </button>
              <button
                type="button"
                onClick={() => openDispatchDialog("local")}
                disabled={!customerPhone}
                title={
                  customerPhone
                    ? undefined
                    : "Customer phone must be a valid 10-digit Indian mobile number."
                }
                className={`min-h-11 rounded-lg px-5 py-2 font-semibold text-white ${
                  customerPhone
                    ? "bg-green-700 hover:bg-green-800"
                    : "cursor-not-allowed bg-green-700 opacity-50"
                }`}
              >
                Local delivery
              </button>
            </>
          ) : (
            <a
              href={customerWhatsAppUrl ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!customerWhatsAppUrl}
              tabIndex={customerWhatsAppUrl ? undefined : -1}
              title={
                customerWhatsAppUrl
                  ? undefined
                  : "Customer phone must be a valid 10-digit Indian mobile number."
              }
              onClick={(event) => {
                if (!customerWhatsAppUrl) {
                  event.preventDefault();
                  return;
                }
                void markConfirmationOpened();
              }}
              className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-5 py-2 font-semibold text-white ${
                customerWhatsAppUrl
                  ? "bg-green-700 hover:bg-green-800"
                  : "cursor-not-allowed bg-green-700 opacity-50"
              }`}
            >
              <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.52 3.48A11.86 11.86 0 0012.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.9 11.9 0 005.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.9a11.83 11.83 0 00-3.42-8.42zM12.05 21.8h-.01a9.9 9.9 0 01-5.04-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.87 9.87 0 01-1.51-5.28c0-5.46 4.44-9.9 9.9-9.9a9.84 9.84 0 017 2.9 9.83 9.83 0 012.89 7c0 5.46-4.44 9.9-9.89 9.9zm5.43-7.41c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.47-2.4-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.91-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.06 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35z" />
              </svg>
              WhatsApp customer
            </a>
          )}
          <button
            type="button"
            onClick={() => void copyCustomerMessage(customerMessage)}
            disabled={!canCopyCustomerMessage}
            className="min-h-11 rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Copy message
          </button>
          {order.confirmation_opened_at && (
            <span className="text-sm text-slate-500">
              Message opened {relativeTime(order.confirmation_opened_at)}
            </span>
          )}
          {copyNotice && (
            <span className="text-sm text-green-700" role="status">{copyNotice}</span>
          )}
          {messageActionError && (
            <span className="text-sm text-red-700" role="alert">{messageActionError}</span>
          )}
        </div>

        {dispatchDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="dispatch-dialog-title"
              className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            >
              <h2 id="dispatch-dialog-title" className="mb-5 text-xl font-bold">
                {dispatchDialog === "courier"
                  ? "Dispatched by courier"
                  : "Local delivery"}
              </h2>
              {messageActionError && (
                <p className="mb-4 text-sm text-red-700" role="alert">
                  {messageActionError}
                </p>
              )}
              {dispatchDialog === "courier" ? (
                <form onSubmit={submitCourierMessage} className="space-y-4">
                  <label className="block space-y-1">
                    <span className="font-medium">Courier name</span>
                    <input
                      type="text"
                      required
                      value={courierName}
                      onChange={(event) => setCourierName(event.target.value)}
                      className="w-full rounded border border-slate-300 px-3 py-2"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="font-medium">Tracking number</span>
                    <input
                      type="text"
                      required
                      value={trackingNumber}
                      onChange={(event) => setTrackingNumber(event.target.value)}
                      className="w-full rounded border border-slate-300 px-3 py-2"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="font-medium">Expected delivery</span>
                    <input
                      type="date"
                      required
                      value={expectedDelivery}
                      onChange={(event) => setExpectedDelivery(event.target.value)}
                      className="w-full rounded border border-slate-300 px-3 py-2"
                    />
                  </label>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setDispatchDialog(null)}
                      className="rounded border border-slate-300 px-4 py-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded bg-green-700 px-4 py-2 font-semibold text-white hover:bg-green-800"
                    >
                      Open WhatsApp
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={submitLocalDeliveryMessage} className="space-y-4">
                  <label className="block space-y-1">
                    <span className="font-medium">Expected day</span>
                    <select
                      required
                      value={expectedDayChoice}
                      onChange={(event) => {
                        const value = event.target.value;
                        if (
                          value === "" ||
                          value === "Today" ||
                          value === "Tomorrow" ||
                          value === "date"
                        ) {
                          setExpectedDayChoice(value);
                        }
                      }}
                      className="w-full rounded border border-slate-300 px-3 py-2"
                    >
                      <option value="">Choose expected day</option>
                      <option value="Today">Today</option>
                      <option value="Tomorrow">Tomorrow</option>
                      <option value="date">Choose a date</option>
                    </select>
                  </label>
                  {expectedDayChoice === "date" && (
                    <label className="block space-y-1">
                      <span className="font-medium">Expected date</span>
                      <input
                        type="date"
                        required
                        value={expectedLocalDate}
                        onChange={(event) =>
                          setExpectedLocalDate(event.target.value)
                        }
                        className="w-full rounded border border-slate-300 px-3 py-2"
                      />
                    </label>
                  )}
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setDispatchDialog(null)}
                      className="rounded border border-slate-300 px-4 py-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded bg-green-700 px-4 py-2 font-semibold text-white hover:bg-green-800"
                    >
                      Open WhatsApp
                    </button>
                  </div>
                </form>
              )}
            </section>
          </div>
        )}

        {/* ================================
            CUSTOMER / STATUS
        ================================= */}

        <div className="mt-6 grid grid-cols-2 gap-6">

          <div>
            <p className="font-semibold">
              Customer
            </p>
            <p>{order.customer_name}</p>
          </div>

          <div>
            <p className="font-semibold">
              Phone
            </p>
            <p>{order.phone}</p>
          </div>

          <div>
            <p className="font-semibold">
              Address
            </p>
            <p>{order.address}</p>
          </div>

          <div>

            <p className="mb-2 font-semibold">
              Status
            </p>

            <span
              className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${
                order.status === ORDER_STATUS.PLACED
                  ? "bg-yellow-100 text-yellow-800"
                  : order.status === ORDER_STATUS.ACCEPTED
                  ? "bg-blue-100 text-blue-800"
                  : order.status === ORDER_STATUS.DISPATCHED
                  ? "bg-orange-100 text-orange-800"
                  : order.status === ORDER_STATUS.CANCELLED
                  ? "bg-red-100 text-red-700"
                  : order.status === ORDER_STATUS.COMPLETE
                  ? "bg-green-100 text-green-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {order.status}
            </span>

            <div className="mt-4">

              {/* Placed */}

              {order.status === ORDER_STATUS.PLACED && (
                <div className="flex gap-3">

                  <button
                    onClick={() =>
                      updateStatus(ORDER_STATUS.ACCEPTED)
                    }
                    disabled={updating}
                    className="rounded bg-brand px-4 py-2 text-on-brand hover:bg-brand-dark hover:text-brand-soft"
                  >
                    {updating
                      ? "Updating..."
                      : "Accept Order"}
                  </button>

                  <button
                    onClick={() => {
                      if (
                        confirm(
                          "Are you sure you want to cancel this order?"
                        )
                      ) {
                        updateStatus(ORDER_STATUS.CANCELLED);
                      }
                    }}
                    disabled={updating}
                    className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                  >
                    {updating
                      ? "Updating..."
                      : "Cancel Order"}
                  </button>

                </div>
              )}

              {/* Accepted */}

              {order.status === ORDER_STATUS.ACCEPTED && (
                <button
                  onClick={() =>
                    updateStatus(ORDER_STATUS.DISPATCHED)
                  }
                  disabled={updating}
                  className="rounded bg-orange-600 px-4 py-2 text-white hover:bg-orange-700"
                >
                  {updating
                    ? "Updating..."
                    : "Dispatch Order"}
                </button>
              )}

              {/* Dispatched */}

              {order.status === ORDER_STATUS.DISPATCHED && (
                <button
                  onClick={() =>
                    updateStatus(ORDER_STATUS.COMPLETE)
                  }
                  disabled={updating}
                  className="rounded bg-brand px-4 py-2 text-on-brand hover:bg-brand-dark hover:text-brand-soft"
                >
                  {updating
                    ? "Updating..."
                    : "Complete Order"}
                </button>
              )}

              {/* Cancelled */}

              {order.status === ORDER_STATUS.CANCELLED && (
                <div className="rounded bg-red-100 px-4 py-2 font-semibold text-red-700">
                  ✕ Order {ORDER_STATUS.CANCELLED}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* ================================
          ORDER ITEMS
      ================================= */}

      <div className="overflow-hidden rounded-xl bg-white shadow">

        <table className="w-full">

          <thead className="bg-slate-100">

            <tr>

              <th className="px-5 py-4 text-left">
                Product
              </th>

              <th className="px-5 py-4 text-center">
                Qty
              </th>

              <th className="px-5 py-4 text-right">
                Price
              </th>

              <th className="px-5 py-4 text-right">
                Amount
              </th>

            </tr>

          </thead>

          <tbody>

            {items.map(
              (item, index) => (
                <tr
                  key={index}
                  className="border-t"
                >

                  <td className="px-5 py-4">
                    {item.product_name}
                  </td>

                  <td className="px-5 py-4 text-center">
                    {item.quantity}
                  </td>

                  <td className="px-5 py-4 text-right">
                    ₹
                    {Number(
                      item.price
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </td>

                  <td className="px-5 py-4 text-right font-semibold">
                    ₹
                    {Number(
                      item.amount
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </td>

                </tr>
              )
            )}

          </tbody>

        </table>

        {/* ================================
            ORDER TOTALS
        ================================= */}

        <div className="space-y-2 border-t p-6">

          <div className="flex justify-between">
            <span>
              Subtotal
            </span>

            <span>
              ₹
              {Number(
                order.subtotal
              ).toLocaleString(
                "en-IN"
              )}
            </span>
          </div>

          <div className="flex justify-between">
            <span>
              Shipping
            </span>

            <span>
              ₹
              {Number(
                order.shipping
              ).toLocaleString(
                "en-IN"
              )}
            </span>
          </div>

          <div className="flex justify-between text-xl font-bold">

            <span>
              Grand Total
            </span>

            <span>
              ₹
              {Number(
                order.grand_total
              ).toLocaleString(
                "en-IN"
              )}
            </span>

          </div>

        </div>
      </div>
    </div>
  );
}