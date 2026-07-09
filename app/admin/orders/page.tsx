"use client"; 

import Link from "next/link";
import { useEffect, useState } from "react";

interface Order {
  order_no: string;
  customer_name: string;
  phone: string;
  grand_total: number;
  status: string;
  created_at: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8">
                  No orders found.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order.order_no}
                  className="border-t hover:bg-slate-50"
                >
                  <td className="px-5 py-4 font-medium">
                    <Link
                        href={`/admin/orders/${order.order_no}`}
                        className="text-blue-600 hover:underline"
                    >
                      {order.order_no}
                    </Link>
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
                    <span className="rounded-full bg-yellow-100 text-yellow-800 px-3 py-1 text-xs font-semibold">
                      {order.status}
                    </span>
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