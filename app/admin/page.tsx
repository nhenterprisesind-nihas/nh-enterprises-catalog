"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Order = {
  order_no: string;
  customer_name: string;
  phone: string;
  grand_total: number;
  status: string;
  created_at: string;
};

type DashboardResponse = {
  summary: {
    todayOrders: number;
    totalOrders: number;
    todayRevenue: number;
    totalRevenue: number;
  };
  statusCounts: Record<string, number>;
  orders: Order[];
};

export default function AdminHomePage() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      if (!res.ok) throw new Error("Unable to load dashboard");
      setDashboard(await res.json());
    } catch {
      setError("Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }
  
  function exportExcel() {
  window.open("/api/export/orders", "_blank");
  }

  const filteredOrders = useMemo(() => {
    const orders = dashboard?.orders ?? [];
    return orders.filter((o) => {
      const s = search.toLowerCase();
      const matchesSearch =
        !s ||
        o.order_no.toLowerCase().includes(s) ||
        o.customer_name.toLowerCase().includes(s) ||
        (o.phone ?? "").toLowerCase().includes(s);
      const matchesStatus =
        statusFilter === "All" || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [dashboard, search, statusFilter]);

  if (loading) return <div className="p-10 text-center">Loading dashboard...</div>;
  if (error) return <div className="p-6 rounded border bg-red-100">{error}</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-slate-500">Welcome to NH Enterprises Order Management System</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 items-end">
          <div className="lg:col-span-3">
            <label className="block text-sm font-medium mb-2">Search</label>
            <input className="w-full rounded border px-3 py-2" value={search}
              onChange={(e)=>setSearch(e.target.value)}
              placeholder="Search Order No., Customer or Phone..." />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select className="w-full rounded border px-3 py-2"
              value={statusFilter}
              onChange={(e)=>setStatusFilter(e.target.value)}>
              <option value="All">All</option>
              {Object.keys(dashboard?.statusCounts ?? {}).map(st=>(
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          <button
              onClick={loadDashboard}
              className="rounded bg-slate-900 text-white px-3 py-2 whitespace-nowrap hover:bg-slate-800"
            >
              🔍 Search
          </button>

          <button
              onClick={() => {
                setSearch("");
                setStatusFilter("All");
              }}
              className="rounded border px-3 py-2 whitespace-nowrap hover:bg-slate-100"
            >
              Reset
          </button>

          <button
              onClick={exportExcel}
              className="rounded bg-green-600 text-white px-3 py-2 whitespace-nowrap hover:bg-green-700"
            >
              📊 Download Orders
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card title="Today's Orders" value={dashboard?.summary.todayOrders ?? 0}/>
        <Card title="Total Orders" value={dashboard?.summary.totalOrders ?? 0}/>
        <Card title="Today's Revenue" value={`₹${dashboard?.summary.todayRevenue ?? 0}`}/>
        <Card title="Total Revenue" value={`₹${dashboard?.summary.totalRevenue ?? 0}`}/>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-xl font-semibold mb-6">Order Status Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {Object.entries(dashboard?.statusCounts ?? {}).map(([k,v])=>(
            <StatusCard key={k} title={k} value={v}/>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <div className="flex justify-between mb-6">
          <h2 className="text-xl font-semibold">Order Details</h2>
          <span>{filteredOrders.length} Order(s)</span>
        </div>
        <div className="overflow-x-auto overflow-y-auto max-h-[650px] border rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-white z-10"><tr>
              <th className="text-left p-2">Order</th>
              <th className="text-left p-2">Customer</th>
              <th className="text-left p-2">Phone</th>
              <th className="text-left p-2">Status</th>
              <th className="text-right p-2">Amount</th>
              <th className="text-left p-2">Date</th>
              <th className="text-center p-2">Action</th>
            </tr></thead>
            <tbody>
            {filteredOrders.map(o=>(
              <tr key={o.order_no} className="border-t">
                <td className="p-2">{o.order_no}</td>
                <td className="p-2">{o.customer_name}</td>
                <td className="p-2">{o.phone}</td>
                <td className="p-2">{o.status}</td>
                <td className="p-2 text-right">₹{o.grand_total.toLocaleString()}</td>
                <td className="p-2">{new Date(o.created_at).toLocaleDateString()}</td>
                <td className="p-2 text-center"><Link href={`/admin/orders/${o.order_no}`}>View</Link></td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Card({title,value}:{title:string;value:string|number}) {
  return <div className="rounded-xl bg-white border p-6"><div className="text-sm text-slate-500">{title}</div><div className="text-3xl font-bold mt-2">{value}</div></div>;
}
function StatusCard({title,value}:{title:string;value:number}) {
  return <div className="rounded-xl border bg-slate-50 p-5 text-center"><div>{title}</div><div className="text-3xl font-bold">{value}</div></div>;
}
