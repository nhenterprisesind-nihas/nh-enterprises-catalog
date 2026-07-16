"use client";

import { useEffect, useState } from "react"; 

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
  params: { orderNo: string };
}) {
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [cancelReason, setCancelReason] = useState("Customer Cancelled");
  const [returnReason, setReturnReason] = useState("Damaged Product");
  useEffect(() => {
    loadOrder();
  }, []);

  async function loadOrder() {
    try {
      const response = await fetch(
  `/api/order-details/${params.orderNo}`,
  {
    cache: "no-store",
  }
);
      const data = await response.json();

      console.log("API returned status:", data.order.status);
      setOrder(data.order);
      setItems(data.items);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

    async function updateStatus(
    newStatus: string,
    reason?: string
    ) {
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
        reason,
      }),
    });

    const result = await response.json();

      if (!response.ok) {
      throw new Error(result.error || "Failed to update order.");
      }

    const refreshed = await fetch(`/api/order-details/${params.orderNo}`);
    const refreshedData = await refreshed.json();

      setOrder(refreshedData.order);
      setItems(refreshedData.items);
      setSuccessMessage(`Order ${newStatus} successfully.`);

      setTimeout(() => {
      setSuccessMessage("");
      }, 2000);

    } catch (error) {
      console.error(error);
      alert("Unable to update order status.");
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

  function getBadgeClass(status: string) {
  switch (status) {
    case "Placed":
      return "bg-yellow-100 text-yellow-800";

    case "Accepted":
      return "bg-blue-100 text-blue-800";

    case "Shipped":
      return "bg-orange-100 text-orange-800";

    case "Delivered":
      return "bg-indigo-100 text-indigo-800";

    case "Returned":
      return "bg-red-100 text-red-800";

    case "Cancelled":
      return "bg-gray-200 text-gray-800";

    case "Closed":
      return "bg-green-100 text-green-800";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

function isCompleted() {
  return (
    order?.status === "Closed" ||
    order?.status === "Cancelled" ||
    order?.status === "Returned"
  );
}

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between">

  <h1 className="text-3xl font-bold">
    Order {order.order_no}
  </h1>

  <button
    onClick={() => window.history.back()}
    className="rounded bg-slate-700 text-white px-4 py-2 hover:bg-slate-800"
  >
    ← Back to Orders
  </button>

</div>

        {successMessage && (
        <div className="mt-4 rounded-lg bg-green-100 border border-green-300 text-green-800 px-4 py-3">
        ✅    {successMessage}
        </div>
      )}

        <div className="grid grid-cols-2 gap-6 mt-6">
          <div>
            <p><strong>Customer</strong></p>
            <p>{order.customer_name}</p>
          </div>

          <div>
            <p><strong>Phone</strong></p>
            <p>{order.phone}</p>
          </div>

          <div>
            <p><strong>Address</strong></p>
            <p>{order.address}</p>
          </div>

          <div>
  <p><strong>Status</strong></p>

  <div className="mt-3 space-y-4">
      <div className="mt-2 space-y-3">

  <span
    className={`inline-block rounded-full px-3 py-1 text-sm font-semibold
      ${
        order.status === "Placed"
          ? "bg-yellow-100 text-yellow-800"
          : order.status === "Accepted"
          ? "bg-blue-100 text-blue-800"
          : order.status === "Dispatched"
          ? "bg-orange-100 text-orange-800"
          : "bg-green-100 text-green-800"
      }`}
  >
    {order.status}
  </span>

  {order.status === "Placed" && (
    <button
      onClick={() => updateStatus("Accepted")}
      disabled={updating}
      className="block w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
    >
      {updating ? "Updating..." : "Accept Order"}
    </button>
  )}

  {order.status === "Accepted" && (
    <button
      onClick={() => updateStatus("Dispatched")}
      disabled={updating}
      className="block w-full rounded bg-orange-600 px-4 py-2 text-white hover:bg-orange-700"
    >
      {updating ? "Updating..." : "Dispatch Order"}
    </button>
  )}

  {order.status === "Dispatched" && (
    <button
      onClick={() => updateStatus("Closed")}
      disabled={updating}
      className="block w-full rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
    >
      {updating ? "Updating..." : "Close Order"}
    </button>
  )}

  {order.status === "Closed" && (
    <div className="rounded bg-green-100 px-4 py-2 text-green-700 font-semibold">
      ✓ Order Completed
    </div>
  )}
  </div>
</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-left px-5 py-4">Product</th>
              <th className="text-center px-5 py-4">Qty</th>
              <th className="text-right px-5 py-4">Price</th>
              <th className="text-right px-5 py-4">Amount</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-t">
                <td className="px-5 py-4">
                  {item.product_name}
                </td>

                <td className="text-center px-5 py-4">
                  {item.quantity}
                </td>

                <td className="text-right px-5 py-4">
                  ₹{item.price}
                </td>

                <td className="text-right px-5 py-4 font-semibold">
                  ₹{item.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="p-6 border-t space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₹{order.subtotal}</span>
          </div>

          <div className="flex justify-between">
            <span>Shipping</span>
            <span>₹{order.shipping}</span>
          </div>

          <div className="flex justify-between text-xl font-bold">
            <span>Grand Total</span>
            <span>₹{order.grand_total}</span>
          </div>
          {order.cancel_reason && (
  <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3">
    <p className="font-semibold text-red-700">
      Cancellation Reason
    </p>
    <p className="text-red-600">
      {order.cancel_reason}
    </p>
  </div>
)}

{order.return_reason && (
  <div className="mt-4 rounded-lg bg-orange-50 border border-orange-200 p-3">
    <p className="font-semibold text-orange-700">
      Return Reason
    </p>
    <p className="text-orange-600">
      {order.return_reason}
    </p>
  </div>
)}
        </div>
      </div>
    </div>
  );
}