/**
 * GST configuration for NH Enterprises
 *
 * Category-level operational mapping.
 * If a category cannot be determined, GST defaults to 18%.
 */

const GST_RATES: Record<string, number> = {
  Bags: 12,
  Decor: 12,
  "Hair Accessories": 12,
  "House Hold": 12,
  Jewellery: 3,
  Saree: 5,
  Stationery: 12,
};

/**
 * Normalizes category names so minor differences in
 * Google Sheet capitalization/spacing do not cause problems.
 */
function normalizeCategory(category: string): string {
  return category
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/**
 * Returns the GST rate for a product category.
 *
 * If the category is missing or not mapped,
 * the default GST rate is 18%.
 */
export function getGstRate(category?: string | null): number {
  if (!category || !category.trim()) {
    return 18;
  }

  const normalized = normalizeCategory(category);

  const matchedCategory = Object.keys(GST_RATES).find(
    (key) => normalizeCategory(key) === normalized
  );

  if (!matchedCategory) {
    return 18;
  }

  return GST_RATES[matchedCategory];
}

/**
 * Calculates GST amount for a taxable value.
 */
export function calculateGst(
  taxableValue: number,
  gstRate: number
): number {
  return Number(
    ((taxableValue * gstRate) / 100).toFixed(2)
  );
}

/**
 * Calculates CGST and SGST for an intra-state transaction.
 */
export function calculateCgstSgst(
  taxableValue: number,
  gstRate: number
) {
  const totalGst = calculateGst(taxableValue, gstRate);
  const halfRate = gstRate / 2;

  const cgst = Number((totalGst / 2).toFixed(2));
  const sgst = Number((totalGst - cgst).toFixed(2));

  return {
    cgstRate: halfRate,
    sgstRate: halfRate,
    cgstAmount: cgst,
    sgstAmount: sgst,
    totalGst,
  };
}

/**
 * Calculates IGST for an inter-state transaction.
 */
export function calculateIgst(
  taxableValue: number,
  gstRate: number
) {
  const igstAmount = calculateGst(taxableValue, gstRate);

  return {
    igstRate: gstRate,
    igstAmount,
    totalGst: igstAmount,
  };
}