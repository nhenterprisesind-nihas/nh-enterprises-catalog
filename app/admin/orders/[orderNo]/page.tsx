"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { use } from "react";

interface Order {
  order_no: string;
  customer_name: string;
  phone: string;
  address: string;
  pincode: string;
  subtotal: number;
  shipping: number;
  grand_total: number;
  status: string;
  created_at: string;
}

interface OrderItem {
  product_name: string;
  quantity: number;
  price: number;
  amount: number;
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

  async function updateStatus(newStatus: string) {
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

      setSuccessMessage(
        `Order ${newStatus} successfully.`
      );

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

  if (loading) {
    return <div className="text-xl">Loading...</div>;
  }

  if (!order) {
    return <div className="text-xl">Order not found.</div>;
  }

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
                className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
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
                order.status === "Placed"
                  ? "bg-yellow-100 text-yellow-800"
                  : order.status === "Accepted"
                  ? "bg-blue-100 text-blue-800"
                  : order.status === "Dispatched"
                  ? "bg-orange-100 text-orange-800"
                  : order.status === "Cancelled"
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {order.status}
            </span>

            <div className="mt-4">

              {/* Placed */}

              {order.status === "Placed" && (
                <div className="flex gap-3">

                  <button
                    onClick={() =>
                      updateStatus("Accepted")
                    }
                    disabled={updating}
                    className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
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
                        updateStatus("Cancelled");
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

              {order.status === "Accepted" && (
                <button
                  onClick={() =>
                    updateStatus("Dispatched")
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

              {order.status === "Dispatched" && (
                <button
                  onClick={() =>
                    updateStatus("Closed")
                  }
                  disabled={updating}
                  className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                >
                  {updating
                    ? "Updating..."
                    : "Close Order"}
                </button>
              )}

              {/* Cancelled */}

              {order.status === "Cancelled" && (
                <div className="rounded bg-red-100 px-4 py-2 font-semibold text-red-700">
                  ✕ Order Cancelled
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