export const ORDER_STATUS = {
  PLACED: "Placed",
  ACCEPTED: "Accepted",
  DISPATCHED: "Dispatched",
  COMPLETE: "Complete",
  CANCELLED: "Cancelled",
} as const;

export type OrderStatus =
  (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export function normalizeStatus(
  value: string | null | undefined
): string {
  // Remove this compatibility mapping once the existing order data is migrated.
  return value?.trim().toLowerCase() === "closed"
    ? ORDER_STATUS.COMPLETE
    : value ?? "";
}
