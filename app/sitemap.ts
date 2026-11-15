import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/businessProfile";
import { getProducts } from "@/lib/products";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const homePage: MetadataRoute.Sitemap[number] = {
    url: SITE_URL,
    priority: 1.0,
  };

  try {
    const products = await getProducts(3600);
    return [
      homePage,
      ...products.map((product) => ({
        url: `${SITE_URL}/product/${encodeURIComponent(product.id)}`,
        priority: 0.7,
      })),
    ];
  } catch {
    return [homePage];
  }
}
