import Link from "next/link";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import LogoutButton from "@/components/LogoutButton";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const headersList = await headers();
  const pathname =
    headersList.get("x-next-pathname") ||
    headersList.get("next-url") ||
    "";

  const isDashboard = pathname === "/admin";
  const isOrders = pathname.startsWith("/admin/orders");
  const isInvoice = pathname.includes("/invoice");

  if (isInvoice) {
    return (
      <main className="min-h-screen bg-white p-8">
        {children}
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold">
            NH ENTERPRISES
          </h1>

          <p className="text-xs text-slate-400 mt-1">
            Order Management System
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link
            href="/admin"
            className={`block rounded-lg px-4 py-3 transition ${
              isDashboard
                ? "bg-blue-600 text-white"
                : "hover:bg-slate-800"
            }`}
          >
            📊 Dashboard
          </Link>

          <Link
            href="/admin/orders"
            className={`block rounded-lg px-4 py-3 transition ${
              isOrders
                ? "bg-blue-600 text-white"
                : "hover:bg-slate-800"
            }`}
          >
            📦 Orders
          </Link>

          <Link
            href="#"
            className="block rounded-lg px-4 py-3 text-slate-500 cursor-not-allowed"
          >
            📈 Reports
          </Link>
        </nav>

        <div className="border-t border-slate-700 p-4 space-y-4">
          <LogoutButton />

          <div className="text-xs text-slate-400">
            NH OMS v1.0
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}