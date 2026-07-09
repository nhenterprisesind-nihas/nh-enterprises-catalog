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

  useEffect(() => {
    loadOrder();
  }, []);

  async function loadOrder() {
    try {
      const response = await fetch(`/api/order-details/${params.orderNo}`);
      const data = await response.json();

      setOrder(data.order);
      setItems(data.items);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
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
      <div className="bg-white rounded-xl shadow p-6">
        <h1 className="text-3xl font-bold">
          Order {order.order_no}
        </h1>

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
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
              {order.status}
            </span>
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
        </div>
      </div>
    </div>
  );
}