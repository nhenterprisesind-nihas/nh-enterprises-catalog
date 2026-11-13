const formatPrice = (price: number) => `₹${price.toLocaleString("en-IN")}`;

export const PRICE_RANGES = [
  {
    id: "under-100",
    label: `Under ${formatPrice(100)}`,
    min: 0,
    max: 100,
  },
  {
    id: "100-299",
    label: `${formatPrice(100)} to ${formatPrice(299)}`,
    min: 100,
    max: 300,
  },
  {
    id: "300-plus",
    label: `${formatPrice(300)} and above`,
    min: 300,
    max: Infinity,
  },
] as const;

export type PriceRangeId = (typeof PRICE_RANGES)[number]["id"];

export function isPriceRangeId(value: string | null): value is PriceRangeId {
  return PRICE_RANGES.some((range) => range.id === value);
}

export function getPriceRangeForValue(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }

  return PRICE_RANGES.find((range) => value >= range.min && value < range.max);
}
