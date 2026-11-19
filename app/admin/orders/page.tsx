"use client"; 

import Link from "next/link";
import { useEffect, useState } from "react";
import { ORDER_STATUS, type OrderStatus } from "@/lib/order-status";

interface Order {
  order_no: string;
  customer_name: string;
  phone: string;
  grand_total: number;
  status: OrderStatus;
  created_at: string;
  confirmation_opened_at: string | null;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsMessageOnly, setNeedsMessageOnly] = useState(false);
  const [messageActionError, setMessageActionError] = useState("");

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      const response = await fetch("/api/orders");

      if (!response.ok) {
        throw new Error("Failed to load orders");
      }

      const data = await response.json();

      setOrders(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function markConfirmationOpened(orderNo: string) {
    try {
      const response = await fetch(
        `/api/admin/orders/${encodeURIComponent(orderNo)}/whatsapp`,
        { method: "POST" }
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Unable to record the message status.");
      }

      setOrders((current) =>
        current.map((order) =>
          order.order_no === orderNo
            ? {
                ...order,
                confirmation_opened_at: result.confirmationOpenedAt,
              }
            : order
        )
      );
      setMessageActionError("");
    } catch {
      setMessageActionError("Could not record that the message was opened.");
    }
  }

  const visibleOrders = needsMessageOnly
    ? orders.filter(
        (order) =>
          order.status === ORDER_STATUS.PLACED && !order.confirmation_opened_at
      )
    : orders;

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Orders
        </h1>

        <p className="text-slate-500 mt-1">
          View and manage customer orders.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          aria-pressed={needsMessageOnly}
          onClick={() => setNeedsMessageOnly((current) => !current)}
          className={`min-h-10 rounded-lg border px-4 py-2 text-sm font-semibold ${
            needsMessageOnly
              ? "border-amber-300 bg-amber-100 text-amber-900"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          Needs message
        </button>
        {needsMessageOnly && (
          <span className="text-sm text-slate-500">
            Placed orders not yet messaged
          </span>
        )}
      </div>
      {messageActionError && (
        <p className="mb-4 text-sm text-red-700" role="alert">
          {messageActionError}
        </p>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr className="text-left">
              <th className="px-5 py-4">Order No</th>
              <th className="px-5 py-4">Customer</th>
              <th className="px-5 py-4">Phone</th>
              <th className="px-5 py-4">Date</th>
              <th className="px-5 py-4 text-right">Amount</th>
              <th className="px-5 py-4 text-center">Status</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8">
                  Loading orders...
                </td>
              </tr>
            ) : visibleOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8">
                  {needsMessageOnly ? "No orders need a message." : "No orders found."}
                </td>
              </tr>
            ) : (
              visibleOrders.map((order) => (
                <tr
                  key={order.order_no}
                  className="border-t hover:bg-slate-50"
                >
                  <td className="px-5 py-4 font-medium">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/orders/${order.order_no}`}
                        className="text-blue-600 hover:underline"
                      >
                        {order.order_no}
                      </Link>
                      {order.status === ORDER_STATUS.PLACED &&
                        !order.confirmation_opened_at && (
                          <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-800">
                            Needs message
                          </span>
                        )}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    {order.customer_name}
                  </td>

                  <td className="px-5 py-4">
                    {order.phone}
                  </td>

                  <td className="px-5 py-4">
                    {new Date(order.created_at).toLocaleDateString("en-IN")}
                  </td>

                  <td className="px-5 py-4 text-right font-semibold">
                    ₹{Number(order.grand_total).toLocaleString("en-IN")}
                  </td>

                  <td className="px-5 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          order.status === ORDER_STATUS.PLACED
                            ? "bg-yellow-100 text-yellow-800"
                            : order.status === ORDER_STATUS.ACCEPTED
                            ? "bg-blue-100 text-blue-800"
                            : order.status === ORDER_STATUS.DISPATCHED
                            ? "bg-orange-100 text-orange-800"
                            : order.status === ORDER_STATUS.CANCELLED
                            ? "bg-red-100 text-red-800"
                            : order.status === ORDER_STATUS.COMPLETE
                            ? "bg-green-100 text-green-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {order.status}
                      </span>
                      {order.status === ORDER_STATUS.PLACED && (
                        <a
                          href={`/api/admin/orders/${encodeURIComponent(order.order_no)}/whatsapp`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Message customer for order ${order.order_no} on WhatsApp`}
                          title="Message customer on WhatsApp"
                          onClick={() => void markConfirmationOpened(order.order_no)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-800 hover:bg-green-200"
                        >
                          <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.52 3.48A11.86 11.86 0 0012.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.9 11.9 0 005.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.9a11.83 11.83 0 00-3.42-8.42zM12.05 21.8h-.01a9.9 9.9 0 01-5.04-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.87 9.87 0 01-1.51-5.28c0-5.46 4.44-9.9 9.9-9.9a9.84 9.84 0 017 2.9 9.83 9.83 0 012.89 7c0 5.46-4.44 9.9-9.89 9.9zm5.43-7.41c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.47-2.4-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.91-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.06 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35z" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}