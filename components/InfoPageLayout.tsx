import type { ReactNode } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import SiteHeader from "@/components/SiteHeader";

export default function InfoPageLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/"
            className="text-sm font-semibold text-brand-dark hover:underline"
          >
            ← Back to products
          </Link>
          <div className="mt-6">{children}</div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
