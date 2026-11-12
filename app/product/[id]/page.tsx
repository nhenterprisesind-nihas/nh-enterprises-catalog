import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Cart from "@/components/Cart";
import ProductDetailView from "@/components/ProductDetailView";
import ReconcileCartProducts from "@/components/ReconcileCartProducts";
import SetWhatsAppProduct from "@/components/SetWhatsAppProduct";
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
  const description = product.description?.trim()
    ? product.description.trim().slice(0, 150)
    : `₹${product.retail_price} · ${product.category}. Order on WhatsApp.`;
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

  const categoryKey = product.category.trim().toLowerCase();
  const recommendations =
    categoryKey.length > 0
      ? products
          .filter(
            (candidate) =>
              candidate.id !== product.id &&
              candidate.category.trim().toLowerCase() === categoryKey &&
              Number.isFinite(candidate.stock) &&
              candidate.stock > 0
          )
          .slice(0, 4)
      : [];

  return (
    <main className="min-h-screen bg-surface px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-gray-500">
          <Link href="/" className="text-brand-dark hover:text-brand-dark">
            Home
          </Link>
          {product.category.trim() && (
            <>
              <span className="mx-2" aria-hidden="true">›</span>
              <span>{product.category.trim()}</span>
            </>
          )}
          <span className="mx-2" aria-hidden="true">›</span>
          <span className="text-gray-800" aria-current="page">
            {product.name}
          </span>
        </nav>
        <SetWhatsAppProduct product={product} />
        <ProductDetailView product={product} />
        {recommendations.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-5 text-xl font-bold text-gray-900">
              You may also like
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {recommendations.map((recommendation) => (
                <Link
                  key={recommendation.id}
                  href={`/product/${recommendation.id}`}
                  prefetch={false}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="aspect-square bg-gray-100">
                    {recommendation.images[0] && (
                      <img
                        src={recommendation.images[0]}
                        alt={recommendation.name}
                        width={320}
                        height={320}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="line-clamp-2 text-sm font-medium text-gray-900">
                      {recommendation.name}
                    </h3>
                    {Number.isFinite(recommendation.retail_price) &&
                      recommendation.retail_price > 0 && (
                        <p className="mt-1 text-sm font-semibold text-brand-dark">
                          ₹{recommendation.retail_price.toLocaleString("en-IN")}
                        </p>
                      )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
      <ReconcileCartProducts products={products} />
      <Cart />
    </main>
  );
}
