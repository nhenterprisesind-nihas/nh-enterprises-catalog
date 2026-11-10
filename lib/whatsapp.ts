import type { Product } from "@/context/CartContext";
import { getProductUrl } from "@/lib/share";

export function buildProductMessage(product: Product): string {
  const lines = [
    "Hi, I'm interested in this product:",
    `*${product.name}*`,
  ];
  const retailPrice = product.retail_price;

  if (typeof retailPrice === "number" && Number.isFinite(retailPrice) && retailPrice >= 0) {
    const mrp = product.mrp;
    const mrpText =
      typeof mrp === "number" &&
      Number.isFinite(mrp) &&
      mrp > retailPrice
        ? ` (MRP ₹${mrp.toLocaleString("en-IN")})`
        : "";
    lines.push(
      `Price: ₹${retailPrice.toLocaleString("en-IN")}${mrpText}`
    );
  }

  lines.push(getProductUrl(product.id));
  return lines.join("\n");
}

export function getWhatsAppUrl(message: string): string {
  const number = (
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919999999999"
  ).replace(/\D/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
