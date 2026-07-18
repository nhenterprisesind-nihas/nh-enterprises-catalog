"use client";

import { use, useEffect, useState } from "react";

type Order = {
  order_no: string;
  customer_name: string;
  phone: string;
  address: string | null;
  pincode: string | null;
  subtotal: number;
  shipping: number;
  grand_total: number;
  status: string;
  created_at: string;
};

type OrderItem = {
  id: number;
  order_no: string;
  product_name: string;
  quantity: number;
  price: number;
  amount: number;
};

export default function InvoicePage({
  params,
}: {
  params: Promise<{ orderNo: string }>;
}) {
  const { orderNo } = use(params);

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadInvoice() {
      try {
        const res = await fetch(`/api/order-details/${orderNo}`, {
          cache: "no-store",
        });
        if (!res.ok) {
            console.log("Status:", res.status);
            console.log("URL:", `/api/order-details/${orderNo}`);

            const text = await res.text();
            console.log(text);

            throw new Error("API Failed");
          }

        const data = await res.json();
        setOrder(data.order);
        setItems(data.items ?? []);
      } catch (err) {
        console.error(err);
        setError("Unable to load invoice.");
      } finally {
        setLoading(false);
      }
    }

    loadInvoice();
  }, [orderNo]);

  if (loading) return <div className="p-10">Loading invoice...</div>;
  if (error) return <div className="p-10">{error}</div>;
  if (!order) return <div className="p-10">Invoice not found.</div>;

  return (
    <div className="max-w-5xl mx-auto p-8 bg-white">
      <h1 className="text-3xl font-bold">NH Enterprises</h1>
      <h2 className="text-2xl font-semibold mt-2">TAX INVOICE</h2>

      <div className="mt-6 grid grid-cols-2 gap-8">
        <div>
          <p><b>Invoice:</b> INV-{order.order_no}</p>
          <p><b>Order:</b> {order.order_no}</p>
          <p><b>Date:</b> {new Date(order.created_at).toLocaleDateString("en-IN")}</p>
          <p><b>Status:</b> {order.status}</p>
        </div>

        <div>
          <p><b>Customer:</b> {order.customer_name}</p>
          <p>{order.phone}</p>
          <p>{order.address}</p>
          <p>{order.pincode}</p>
        </div>
      </div>

      <table className="w-full border mt-8">
        <thead>
          <tr>
            <th className="border p-2 text-left">Product</th>
            <th className="border p-2">Qty</th>
            <th className="border p-2 text-right">Price</th>
            <th className="border p-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id}>
              <td className="border p-2">{i.product_name}</td>
              <td className="border p-2 text-center">{i.quantity}</td>
              <td className="border p-2 text-right">{i.price}</td>
              <td className="border p-2 text-right">{i.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-8 ml-auto w-72">
        <div className="flex justify-between"><span>Subtotal</span><span>₹{order.subtotal}</span></div>
        <div className="flex justify-between"><span>Shipping</span><span>₹{order.shipping}</span></div>
        <div className="flex justify-between font-bold border-t mt-2 pt-2"><span>Grand Total</span><span>₹{order.grand_total}</span></div>
      </div>

      <button
        className="mt-8 px-4 py-2 bg-black text-white print:hidden"
        onClick={() => window.print()}
      >
        Print Invoice
      </button>
    </div>
  );
}
