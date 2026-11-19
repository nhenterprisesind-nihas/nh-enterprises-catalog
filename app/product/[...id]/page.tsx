import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Cart from "@/components/Cart";
import ProductDetailView from "@/components/ProductDetailView";
import ReconcileCartProducts from "@/components/ReconcileCartProducts";
import SetWhatsAppProduct from "@/components/SetWhatsAppProduct";
import { getProducts } from "@/lib/products";
import ProductImage from "@/components/ProductImage";
import { optimizeImage } from "@/lib/images";
import JsonLd from "@/components/JsonLd";
import { SITE_URL } from "@/lib/businessProfile";

export const revalidate = 300;

interface ProductPageProps {
  params: Promise<{ id: string[] }>;
}

async function findProduct(id: string[]) {
  const productId = id.join("/");
  const products = await getProducts();
  const product =
    products.find(
      (candidate) => candidate.id.toLowerCase() === productId.toLowerCase()
    ) ??
    products.find(
      (candidate) =>
        candidate.id.toLowerCase() ===
        productId.replace(/(\d+)\/(\d+)/g, "$1by$2").toLowerCase()
    ) ??
    products.find((candidate) => {
      const nameSlug = candidate.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const requestedSlug = productId
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      if (requestedSlug === nameSlug) return true;
      const candidateBaseSlug = candidate.id.replace(/-\d+$/, "");
      return (
        requestedSlug === candidateBaseSlug ||
        requestedSlug.replace(/-\d+$/, "") === candidateBaseSlug
      );
    });

  return {
    products,
    product,
  };
}

function getSocialImage(imageUrl: string | undefined): string {
  if (!imageUrl) return "/og-image.png";
  return optimizeImage(imageUrl, 800, "jpg", 75);
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const { product } = await findProduct(id);
  if (!product) notFound();

  const title = `${product.name} | NH Enterprises`;
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
  const productUrl = new URL(
    `/product/${encodeURIComponent(product.id)}`,
    SITE_URL
  ).toString();
  const productImages = product.images
    .slice(0, 5)
    .map((image) => new URL(image, SITE_URL).toString());
  const productStructuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    ...(product.description?.trim()
      ? { description: product.description.trim() }
      : {}),
    sku: product.id,
    ...(productImages.length > 0 ? { image: productImages } : {}),
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "INR",
      ...(Number.isFinite(product.retail_price) && product.retail_price > 0
        ? { price: product.retail_price }
        : {}),
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };
  const category = product.category.trim();
  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      ...(category
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: category,
              item: `${SITE_URL}/?category=${encodeURIComponent(
                category.toLowerCase()
              )}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: category ? 3 : 2,
        name: product.name,
        item: productUrl,
      },
    ],
  };

  return (
    <>
      <JsonLd data={productStructuredData} />
      <JsonLd data={breadcrumbStructuredData} />
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
                      <ProductImage
                        key={recommendation.images[0]}
                        src={recommendation.images[0]}
                        alt={recommendation.name}
                        width={320}
                        height={320}
                        loading="lazy"
                        className="h-full w-full object-cover"
                        placeholderClassName="flex h-full w-full items-center justify-center bg-gray-100 px-2 text-center text-xs text-gray-500"
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
    </>
  );
}
