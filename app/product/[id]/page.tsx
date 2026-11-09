import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Cart from "@/components/Cart";
import ProductCard from "@/components/ProductCard";
import ReconcileCartProducts from "@/components/ReconcileCartProducts";
import { getProducts } from "@/lib/products";

export const revalidate = 300;

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

async function findProduct(id: string) {
  const products = await getProducts();
  return {
    products,
    product: products.find((product) => product.id.toLowerCase() === id.toLowerCase()),
  };
}

function getSocialImage(imageUrl: string | undefined): string {
  if (!imageUrl) return "/og-image.png";
  return `https://wsrv.nl/?url=${encodeURIComponent(imageUrl)}&w=800&output=jpg&q=75`;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const { product } = await findProduct(id);
  if (!product) notFound();

  const title = `${product.name} | NIKSHAS Online Shop`;
  const description = `₹${product.retail_price} · ${product.category}. Order on WhatsApp.`;
  const url = `/product/${product.id}`;
  const images = [getSocialImage(product.images[0])];

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
    other: {
      "twitter:url": url,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const { products, product } = await findProduct(id);
  if (!product) notFound();

  return (
    <main className="min-h-screen bg-[#FDFBF7] px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="mb-6 inline-block text-sm font-medium text-emerald-700 hover:text-emerald-800"
        >
          ← Back to catalog
        </Link>
        <div className="mx-auto max-w-md">
          <ProductCard product={product} eagerImage />
        </div>
      </div>
      <ReconcileCartProducts products={products} />
      <Cart />
    </main>
  );
}
