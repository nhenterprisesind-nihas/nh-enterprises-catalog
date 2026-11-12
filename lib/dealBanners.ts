import "server-only";

import type { Product } from "@/context/CartContext";
import { getProducts } from "@/lib/products";

const CONFIG = {
  minPct: 10,
  maxPct: 70,
  minSaveRs: 100,
  maxSlides: 6,
  timeZone: "Asia/Kolkata",
} as const;

type DiscountedProduct = {
  product: Product;
  pct: number;
  saveRs: number;
};

export type DealSlide =
  | {
      type: "hero";
      product: Product;
      pct: number;
      saveRs: number;
    }
  | {
      type: "collage";
      products: DiscountedProduct[];
      topPct: number;
    }
  | {
      type: "category";
      category: string;
      topPct: number;
    }
  | {
      type: "savings";
      product: Product;
      saveRs: number;
    }
  | {
      type: "wholesale";
    };

function isAllowedImageUrl(value: string): boolean {
  const url = value.trim();
  if (!url || url.startsWith("//") || url.startsWith("\\\\")) {
    return false;
  }

  if (!/^[a-z][a-z\d+.-]*:/i.test(url)) {
    return true;
  }

  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
}

function getToday(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CONFIG.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  if (!year || !month || !day) {
    throw new Error("Unable to determine today's date in the configured time zone.");
  }

  return `${year}-${month}-${day}`;
}

function hashSeed(value: string): number {
  let seed = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    seed = Math.imul(seed ^ value.charCodeAt(index), 16777619);
  }
  return seed >>> 0;
}

function mulberry32(seed: number): () => number {
  return () => {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(values: T[], random: () => number): T[] {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }
  return shuffled;
}

function getDiscountedProducts(products: Product[]): DiscountedProduct[] {
  return products.flatMap((product) => {
    if (
      typeof product.mrp !== "number" ||
      !Number.isFinite(product.mrp) ||
      product.mrp <= 0 ||
      typeof product.retail_price !== "number" ||
      !Number.isFinite(product.retail_price) ||
      product.retail_price <= 0 ||
      typeof product.stock !== "number" ||
      !Number.isFinite(product.stock) ||
      product.stock <= 0 ||
      !product.images.some(isAllowedImageUrl) ||
      product.mrp <= product.retail_price
    ) {
      return [];
    }

    const pct = Math.floor(
      ((product.mrp - product.retail_price) / product.mrp) * 100
    );
    const saveRs = product.mrp - product.retail_price;
    if (
      pct < CONFIG.minPct ||
      pct > CONFIG.maxPct ||
      saveRs <= 0
    ) {
      return [];
    }

    return [{ product, pct, saveRs }];
  });
}

function getTopCategory(products: DiscountedProduct[]) {
  const categoryStats = new Map<
    string,
    { category: string; count: number; topPct: number }
  >();

  for (const { product, pct } of products) {
    const category = product.category.trim();
    const key = category.toLowerCase();
    if (!key) continue;

    const current = categoryStats.get(key);
    if (current) {
      current.count += 1;
      current.topPct = Math.max(current.topPct, pct);
    } else {
      categoryStats.set(key, { category, count: 1, topPct: pct });
    }
  }

  return Array.from(categoryStats.values())
    .filter(({ count }) => count >= 2)
    .sort(
      (a, b) =>
        b.topPct - a.topPct ||
        a.category.localeCompare(b.category, undefined, {
          sensitivity: "base",
        })
    )[0];
}

export async function getDealSlides(): Promise<DealSlide[]> {
  const products = await getProducts();
  const qualifyingProducts = getDiscountedProducts(products);
  const hasWholesaleProduct = products.some(
    (product) =>
      typeof product.wholesale_price === "number" &&
      Number.isFinite(product.wholesale_price) &&
      product.wholesale_price > 0
  );

  if (qualifyingProducts.length === 0) {
    return hasWholesaleProduct ? [{ type: "wholesale" }] : [];
  }

  const topDiscounts = qualifyingProducts
    .sort(
      (a, b) =>
        b.pct - a.pct ||
        a.product.id.localeCompare(b.product.id, undefined, {
          sensitivity: "base",
        })
    )
    .slice(0, 12);
  const shuffled = shuffle(topDiscounts, mulberry32(hashSeed(getToday())));
  const firstHero = shuffled[0];
  const secondHero = shuffled[1];
  const collageProducts = shuffled.slice(2, 5);
  const selectedProductIds = new Set(
    [firstHero, secondHero, ...collageProducts]
      .filter((deal): deal is DiscountedProduct => deal !== undefined)
      .map(({ product }) => product.id)
  );
  const topCategory = getTopCategory(qualifyingProducts);
  const largestSaving = qualifyingProducts
    .slice()
    .sort(
      (a, b) =>
        b.saveRs - a.saveRs ||
        a.product.id.localeCompare(b.product.id, undefined, {
          sensitivity: "base",
        })
    )[0];

  const slides: DealSlide[] = [
    { type: "hero", ...firstHero },
  ];

  if (collageProducts.length > 0) {
    slides.push({
      type: "collage",
      products: collageProducts,
      topPct: Math.max(...collageProducts.map(({ pct }) => pct)),
    });
  }

  if (topCategory) {
    slides.push({
      type: "category",
      category: topCategory.category,
      topPct: topCategory.topPct,
    });
  }

  if (secondHero) {
    slides.push({ type: "hero", ...secondHero });
  }

  if (
    largestSaving &&
    largestSaving.saveRs >= CONFIG.minSaveRs &&
    !selectedProductIds.has(largestSaving.product.id)
  ) {
    slides.push({
      type: "savings",
      product: largestSaving.product,
      saveRs: largestSaving.saveRs,
    });
  }

  if (hasWholesaleProduct) {
    slides.push({ type: "wholesale" });
  }

  return slides.slice(0, CONFIG.maxSlides);
}
