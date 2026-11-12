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

type BackgroundImage = {
  url: string;
  productId: string;
};

export type DealSlide =
  | {
      type: "hero";
      product: Product;
      pct: number;
      saveRs: number;
      bg?: BackgroundImage;
    }
  | {
      type: "collage";
      products: DiscountedProduct[];
      topPct: number;
      bg?: BackgroundImage;
    }
  | {
      type: "category";
      category: string;
      topPct: number;
      bg?: BackgroundImage;
    }
  | {
      type: "savings";
      product: Product;
      saveRs: number;
      bg?: BackgroundImage;
    }
  | {
      type: "wholesale";
      bg?: BackgroundImage;
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

function getFirstImage(product: Product): string | undefined {
  const firstNonEmpty = product.images.find((image) => image.trim());
  if (!firstNonEmpty || !isAllowedImageUrl(firstNonEmpty)) {
    return undefined;
  }
  return firstNonEmpty.trim();
}

function getSlideCategory(slide: DealSlide): string | undefined {
  if (slide.type === "hero" || slide.type === "savings") {
    return slide.product.category;
  }
  if (slide.type === "collage") {
    return slide.products[0]?.product.category;
  }
  if (slide.type === "category") {
    return slide.category;
  }
  return undefined;
}

function getSlideTileIds(slide: DealSlide): Set<string> {
  if (slide.type === "hero" || slide.type === "savings") {
    return new Set([slide.product.id]);
  }
  if (slide.type === "collage") {
    return new Set(slide.products.map(({ product }) => product.id));
  }
  return new Set();
}

function addBackgrounds(
  slides: DealSlide[],
  products: Product[],
  today: string
): DealSlide[] {
  const usedBackgroundIds = new Set<string>();

  return slides.map((slide, slideIndex) => {
    const category = getSlideCategory(slide)?.trim().toLowerCase();
    const tileIds = getSlideTileIds(slide);
    const candidates = products.flatMap((product) => {
      if (
        typeof product.stock !== "number" ||
        !Number.isFinite(product.stock) ||
        product.stock <= 0 ||
        (category &&
          product.category.trim().toLowerCase() !== category)
      ) {
        return [];
      }

      const url = getFirstImage(product);
      return url ? [{ productId: product.id, url }] : [];
    });

    if (candidates.length === 0) {
      return slide;
    }

    const score = (candidate: BackgroundImage) =>
      Number(tileIds.has(candidate.productId)) +
      Number(usedBackgroundIds.has(candidate.productId));
    const bestScore = Math.min(...candidates.map(score));
    const preferredCandidates = candidates.filter(
      (candidate) => score(candidate) === bestScore
    );
    const selected = shuffle(
      preferredCandidates,
      mulberry32(hashSeed(`${today}:bg:${slideIndex}`))
    )[0];

    if (!selected) {
      return slide;
    }

    usedBackgroundIds.add(selected.productId);
    return { ...slide, bg: selected };
  });
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
  const today = getToday();
  const qualifyingProducts = getDiscountedProducts(products);
  const hasWholesaleProduct = products.some(
    (product) =>
      typeof product.wholesale_price === "number" &&
      Number.isFinite(product.wholesale_price) &&
      product.wholesale_price > 0
  );

  if (qualifyingProducts.length === 0) {
    return addBackgrounds(
      hasWholesaleProduct ? [{ type: "wholesale" }] : [],
      products,
      today
    );
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
  const shuffled = shuffle(topDiscounts, mulberry32(hashSeed(today)));
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

  return addBackgrounds(
    slides.slice(0, CONFIG.maxSlides),
    products,
    today
  );
}
