"use client";

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

    const response = await fetch("/api/orders");

    const data = await response.json();

    setOrders(data);

    setLoading(false);
  }

  return (
    <>
      <div className="mb-8">

        <h1 className="text-3xl font-bold">
          Orders
        </h1>

        <p className="text-slate-500 mt-1">
          View and manage customer orders.
        </p>

      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">

        <table className="w-full">

          <thead className="bg-slate-100">

            <tr>

              <th className="px-5 py-4 text-left">
                Order No
              </th>

              <th className="px-5 py-4 text-left">
                Customer
              </th>

              <th className="px-5 py-4 text-left">
                Phone
              </th>

              <th className="px-5 py-4 text-left">
                Date
              </th>

              <th className="px-5 py-4 text-right">
                Amount
              </th>

              <th className="px-5 py-4 text-center">
                Status
              </th>

            </tr>

          </thead>

          <tbody>

            {loading && (

              <tr>

                <td
                  colSpan={6}
                  className="text-center py-10"
                >
                  Loading...
                </td>

              </tr>

            )}

            {!loading &&
              orders.map((order) => (

                <tr
                  key={order.order_no}
                  className="border-t hover:bg-slate-50"
                >

                  <td className="px-5 py-4 font-medium">
                    {order.order_no}
                  </td>

                  <td className="px-5 py-4">
                    {order.customer_name}
                  </td>

                  <td className="px-5 py-4">
                    {order.phone}
                  </td>

                  <td className="px-5 py-4">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>

                  <td className="px-5 py-4 text-right font-semibold">
                    ₹{order.grand_total}
                  </td>

                  <td className="px-5 py-4 text-center">

                    <span className="rounded-full bg-yellow-100 text-yellow-800 px-3 py-1 text-xs">

                      {order.status}

                    </span>

                  </td>

                </tr>

              ))}

          </tbody>

        </table>

      </div>
    </>
  );

}