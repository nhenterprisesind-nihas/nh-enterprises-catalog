import Link from "next/link";

export default function ProductNotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center bg-surface px-4 text-center">
      <h1 className="text-2xl font-bold text-gray-900">
        This product is no longer available
      </h1>
      <Link
        href="/"
        className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-dark hover:text-brand-soft"
      >
        Browse the catalog
      </Link>
    </main>
  );
}
