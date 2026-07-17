import Link from "next/link";
import type { ReactNode } from "react";
import LogoutButton from "@/components/LogoutButton";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
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
            href="/admin/orders"
            className="block rounded-lg px-4 py-3 hover:bg-slate-800 transition"
          >
            📦 Orders
          </Link>

          <Link
            href="#"
            className="block rounded-lg px-4 py-3 text-slate-500 cursor-not-allowed"
          >
            📊 Dashboard
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