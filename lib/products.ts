import Papa from "papaparse";
import type { Product } from "@/context/CartContext";

type ProductRow = Record<string, string>;

function createProductId(value: string, name: string, rowIndex: number): string {
  const providedId = value.trim().toLowerCase();
  if (providedId) return providedId;

  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || `product-${rowIndex + 1}`;
}

export function parseProducts(csvText: string): Product[] {
  const results = Papa.parse<ProductRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  });
  if (results.errors.length > 0) {
    throw new Error("Product CSV is invalid");
  }

  const usedIds = new Set<string>();
  const namedRows = results.data
    .map((row, originalRowIndex) => ({ row, originalRowIndex }))
    .filter(({ row }) => row.name?.trim());
  const products = namedRows.map(({ row, originalRowIndex }) => {
    const name = row.name.trim();
    const baseId = createProductId(row.id || "", name, originalRowIndex);
    let id = baseId;
    let suffix = 2;
    while (usedIds.has(id)) {
      id = `${baseId}-${suffix}`;
      suffix += 1;
    }
    usedIds.add(id);

    const images: string[] = [];
    for (let imageIndex = 1; imageIndex <= 5; imageIndex += 1) {
      const url = row[`image_url_${imageIndex}`]?.trim();
      if (url && !["NA", "N/A", "-"].includes(url.toUpperCase())) {
        images.push(url);
      }
    }

    return {
      id,
      name,
      description: "",
      category: row.category?.trim() || "",
      mrp: parseFloat(row.mrp) || 0,
      retail_price: parseFloat(row.retail_price) || 0,
      wholesale_price: parseFloat(row.wholesale_price) || 0,
      images,
      stock: parseInt(row.stock) || 0,
      originalRowIndex,
    };
  });

  if (products.length === 0) {
    throw new Error("Product CSV contains no products");
  }

  return products;
}

export async function getProducts(): Promise<Product[]> {
  const sheetUrl = process.env.NEXT_PUBLIC_SHEET_URL;
  if (!sheetUrl) {
    throw new Error("NEXT_PUBLIC_SHEET_URL is not configured");
  }

  const response = await fetch(sheetUrl, { next: { revalidate: 300 } });
  if (!response.ok) {
    throw new Error(`Product fetch failed with status ${response.status}`);
  }

  return parseProducts(await response.text());
}
