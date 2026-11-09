import type { Product } from "@/context/CartContext";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://nh-enterprises-catalog.vercel.app"
).replace(/\/+$/, "");

export function getProductUrl(id: string): string {
  return `${SITE_URL}/product/${encodeURIComponent(id)}`;
}

export function getWhatsAppShareUrl(product: Product): string {
  const productUrl = getProductUrl(product.id);
  const message = `${product.name} – ₹${product.retail_price}\n${productUrl}`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
