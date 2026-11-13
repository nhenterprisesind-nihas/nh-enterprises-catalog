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
}

export interface TrackingOrderSummary {
  orderNumber: string;
  orderDate: string;
  status: string;
  progressIndex: number;
  statusNote?: string;
}

export type TrackingVerification =
  | { kind: "invalid"; field: "orderNumber" | "mobileNumber" }
  | { kind: "not-found" }
  | { kind: "database-error" }
  | { kind: "found"; order: TrackingOrderSummary };

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

  const trackingStatus = getTrackingStatus(lookup.order.status);
  return {
    kind: "found",
    order: {
      orderNumber: lookup.order.order_no,
      orderDate: lookup.order.created_at,
      status: trackingStatus.label,
      progressIndex: trackingStatus.progressIndex,
      ...(trackingStatus.statusNote
        ? { statusNote: trackingStatus.statusNote }
        : {}),
    },
  };
}
