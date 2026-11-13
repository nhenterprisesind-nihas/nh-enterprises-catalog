import { ORDER_STATUS } from "./order-status";

export const ORDER_LOOKUP_MAX_ATTEMPTS = 8;
export const ORDER_LOOKUP_WINDOW_SECONDS = 15 * 60;

export const ORDER_TRACKING_STEPS = [
  "Order Placed",
  "Order Accepted",
  "Order Shipped",
  "Completed",
] as const;

export interface TrackingOrderRecord {
  order_no: string;
  phone: string | null;
  status: string | null;
  created_at: string;
  subtotal: number | string | null;
  shipping: number | string | null;
  grand_total: number | string | null;
}

export interface TrackingOrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface VerifiedTrackingOrder {
  orderNumber: string;
  orderDate: string;
  status: string;
  progressIndex: number;
  subtotal: number;
  shipping: number;
  grandTotal: number;
  statusNote?: string;
}

export interface TrackingOrderSummary extends VerifiedTrackingOrder {
  items: TrackingOrderItem[];
}

function parseOrderAmount(value: unknown): number | null {
  if (
    typeof value !== "number" &&
    (typeof value !== "string" || value.trim() === "")
  ) {
    return null;
  }

  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

export function normalizeTrackingOrderItems(
  records: readonly unknown[]
): TrackingOrderItem[] | null {
  const items: TrackingOrderItem[] = [];

  for (const record of records) {
    if (typeof record !== "object" || record === null || Array.isArray(record)) {
      return null;
    }

    const itemRecord = record as Record<string, unknown>;
    const productName =
      typeof itemRecord.product_name === "string"
        ? itemRecord.product_name.trim()
        : "";
    const quantity =
      typeof itemRecord.quantity === "number" ||
      typeof itemRecord.quantity === "string"
        ? Number(itemRecord.quantity)
        : NaN;
    const unitPrice = parseOrderAmount(itemRecord.price);
    const amount = parseOrderAmount(itemRecord.amount);

    if (
      !productName ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      unitPrice === null ||
      amount === null
    ) {
      return null;
    }

    items.push({ productName, quantity, unitPrice, amount });
  }

  return items;
}

export function formatTrackingPrice(value: number): string {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function formatTrackingOrderDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
}

export function buildTrackingSupportMessage(
  order: Pick<
    TrackingOrderSummary,
    | "orderNumber"
    | "orderDate"
    | "status"
    | "items"
    | "subtotal"
    | "shipping"
    | "grandTotal"
  >
): string {
  const itemLines = order.items.length
    ? order.items.map(
        (item) =>
          `- ${item.productName} | Qty: ${item.quantity} | Unit: ${formatTrackingPrice(item.unitPrice)} | Amount: ${formatTrackingPrice(item.amount)}`
      )
    : ["- Product details are not available for this order."];

  return [
    "Hi NH Enterprises, I need help with my order.",
    `Order Number: ${order.orderNumber}`,
    `Order Date: ${formatTrackingOrderDate(order.orderDate)}`,
    `Current Status: ${order.status}`,
    "Products:",
    ...itemLines,
    `Subtotal: ${formatTrackingPrice(order.subtotal)}`,
    `Shipping: ${formatTrackingPrice(order.shipping)}`,
    `Grand Total: ${formatTrackingPrice(order.grandTotal)}`,
  ].join("\n");
}

export type TrackingVerification =
  | { kind: "invalid"; field: "orderNumber" | "mobileNumber" }
  | { kind: "not-found" }
  | { kind: "database-error" }
  | { kind: "found"; order: VerifiedTrackingOrder };

export type FindTrackingOrder = (
  orderNumber: string
) => Promise<{ order: TrackingOrderRecord | null; error?: unknown }>;

export function normalizeOrderNumber(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const orderNumber = value.trim().toUpperCase();
  return /^NH\d{14,18}$/.test(orderNumber) ? orderNumber : null;
}

export function normalizeIndianMobileNumber(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 32) return null;

  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("0091")) {
    digits = digits.slice(4);
  } else if (digits.startsWith("91") && digits.length >= 12) {
    digits = digits.slice(2);
  }

  if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  return /^\d{10}$/.test(digits) ? digits : null;
}

export function areMobileNumbersEqual(
  first: unknown,
  second: unknown
): boolean {
  const normalizedFirst = normalizeIndianMobileNumber(first);
  const normalizedSecond = normalizeIndianMobileNumber(second);

  return normalizedFirst !== null && normalizedFirst === normalizedSecond;
}

export function isOrderLookupRateLimited(attemptCount: number): boolean {
  return attemptCount > ORDER_LOOKUP_MAX_ATTEMPTS;
}

export function getTrackingStatus(status: string | null): {
  label: string;
  progressIndex: number;
  statusNote?: string;
} {
  const normalizedStatus = status?.trim().toLowerCase();

  switch (normalizedStatus) {
    case ORDER_STATUS.PLACED.toLowerCase():
    case "order placed":
      return { label: ORDER_TRACKING_STEPS[0], progressIndex: 0 };
    case ORDER_STATUS.ACCEPTED.toLowerCase():
    case "order accepted":
      return { label: ORDER_TRACKING_STEPS[1], progressIndex: 1 };
    case ORDER_STATUS.DISPATCHED.toLowerCase():
    case "shipped":
    case "order shipped":
      return { label: ORDER_TRACKING_STEPS[2], progressIndex: 2 };
    case ORDER_STATUS.COMPLETE.toLowerCase():
    case "completed":
      return { label: ORDER_TRACKING_STEPS[3], progressIndex: 3 };
    case ORDER_STATUS.CANCELLED.toLowerCase():
      return {
        label: ORDER_STATUS.CANCELLED,
        progressIndex: -1,
        statusNote: "This order is not progressing through the delivery timeline.",
      };
    default:
      return {
        label: "Status update in progress",
        progressIndex: -1,
        statusNote:
          "The tracking status is being updated. Please contact us if you need help.",
      };
  }
}

export async function verifyTrackingRequest(
  rawOrderNumber: unknown,
  rawMobileNumber: unknown,
  findOrder: FindTrackingOrder
): Promise<TrackingVerification> {
  const orderNumber = normalizeOrderNumber(rawOrderNumber);
  if (!orderNumber) return { kind: "invalid", field: "orderNumber" };

  const mobileNumber = normalizeIndianMobileNumber(rawMobileNumber);
  if (!mobileNumber) return { kind: "invalid", field: "mobileNumber" };

  const lookup = await findOrder(orderNumber);
  if (lookup.error) return { kind: "database-error" };
  if (!lookup.order || !areMobileNumbersEqual(mobileNumber, lookup.order.phone)) {
    return { kind: "not-found" };
  }

  const subtotal = parseOrderAmount(lookup.order.subtotal);
  const shipping = parseOrderAmount(lookup.order.shipping);
  const grandTotal = parseOrderAmount(lookup.order.grand_total);
  if (subtotal === null || shipping === null || grandTotal === null) {
    return { kind: "database-error" };
  }

  const trackingStatus = getTrackingStatus(lookup.order.status);
  return {
    kind: "found",
    order: {
      orderNumber: lookup.order.order_no,
      orderDate: lookup.order.created_at,
      status: trackingStatus.label,
      progressIndex: trackingStatus.progressIndex,
      subtotal,
      shipping,
      grandTotal,
      ...(trackingStatus.statusNote
        ? { statusNote: trackingStatus.statusNote }
        : {}),
    },
  };
}
