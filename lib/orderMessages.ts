import type { OrderStatus } from "./order-status";

export const BRAND_NAME = "Nikshas Collections";
export const PAYMENT_NOTE =
  "Please reply YES to confirm, and we'll share the payment details here.";
export const CONFIRM_WITHIN = "within a few hours";

export interface OrderMessageOrder {
  order_no: string;
  customer_name: string | null;
  subtotal: number | string | null;
  shipping: number | string | null;
  grand_total: number | string | null;
  address: string | null;
  pincode: string | null;
  courier?: string | null;
  tracking_number?: string | null;
}

export interface OrderMessageItem {
  product_name: string;
  quantity: number | string;
  amount: number | string | null;
}

function cleanLine(value: string | null | undefined): string {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function firstName(value: string | null): string {
  return cleanLine(value).split(" ")[0] ?? "";
}

function formatMoney(value: number | string | null): string {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount.toLocaleString("en-IN") : "0";
}

function fitMessage(lines: string[]): string {
  const message = lines.join("\n");
  return message.length < 1000
    ? message
    : `${message.slice(0, 998).trimEnd()}…`;
}

export function buildConfirmationMessage(
  order: OrderMessageOrder,
  items: readonly OrderMessageItem[]
): string {
  const name = firstName(order.customer_name);
  const greeting = name
    ? `Hi ${name}, thank you for ordering from *${BRAND_NAME}*! 👋`
    : `Hi, thank you for ordering from *${BRAND_NAME}*! 👋`;
  const address = cleanLine(order.address);
  const pincode = cleanLine(order.pincode);

  const linesForCount = (itemCount: number) => [
    greeting,
    "",
    `🧾 *Order:* ${cleanLine(order.order_no)}`,
    "",
    "🛍️ *Items*",
    ...items.slice(0, itemCount).map(
      (item) =>
        `• ${cleanLine(item.product_name)} × ${item.quantity} – ₹${formatMoney(
          item.amount
        )}`
    ),
    ...(itemCount < items.length ? [`and ${items.length - itemCount} more`] : []),
    "",
    `💰 *Subtotal:* ₹${formatMoney(order.subtotal)}`,
    `🚚 *Shipping:* ₹${formatMoney(order.shipping)}`,
    `*Total: ₹${formatMoney(order.grand_total)}*`,
    "",
    "📍 *Delivery address*",
    `${address}${pincode ? `, ${pincode}` : ""}`,
    "",
    `💬 ${PAYMENT_NOTE}`,
    "We'll update you when your order is dispatched. 🚚",
  ];

  let itemCount = items.length;
  let lines = linesForCount(itemCount);
  while (lines.join("\n").length >= 1000 && itemCount > 0) {
    itemCount -= 1;
    lines = linesForCount(itemCount);
  }

  return fitMessage(lines);
}

export function buildStatusMessage(
  order: OrderMessageOrder,
  status: OrderStatus
): string {
  const name = firstName(order.customer_name);
  const greeting = name ? `Hi ${name}, ` : "Hi, ";
  const orderNumber = cleanLine(order.order_no);
  let message: string;

  switch (status) {
    case "Accepted":
      message = `${greeting}your order ${orderNumber} is confirmed and being packed.`;
      break;
    case "Dispatched": {
      const trackingDetails = [
        cleanLine(order.courier),
        cleanLine(order.tracking_number)
          ? `tracking number ${cleanLine(order.tracking_number)}`
          : "",
      ].filter(Boolean);
      message = `${greeting}your order ${orderNumber} has been dispatched${
        trackingDetails.length > 0 ? ` via ${trackingDetails.join(", ")}` : ""
      }.`;
      break;
    }
    case "Complete":
      message = `${greeting}thank you for shopping with us!`;
      break;
    case "Cancelled":
      message = `${greeting}your order ${orderNumber} has been cancelled; message us if you have any questions.`;
      break;
    case "Placed":
      message = buildConfirmationMessage(order, []);
      break;
  }

  return fitMessage([message]);
}

export function buildCourierDispatchedMessage(
  order: OrderMessageOrder,
  courier: string,
  trackingNumber: string,
  expectedDelivery: string
): string {
  const name = firstName(order.customer_name);
  const greeting = name ? `Hi ${name}` : "Hi";

  return fitMessage([
    `${greeting}, your order ${cleanLine(order.order_no)} has been dispatched by courier.`,
    `Courier: ${cleanLine(courier)}`,
    `Tracking no: ${cleanLine(trackingNumber)}`,
    `Expected delivery: ${cleanLine(expectedDelivery)}`,
    "Message us here if you need any help.",
  ]);
}

export function buildLocalDeliveryMessage(
  order: OrderMessageOrder,
  expectedDay: string
): string {
  const name = firstName(order.customer_name);
  const greeting = name ? `Hi ${name}` : "Hi";

  return fitMessage([
    `${greeting}, your order ${cleanLine(order.order_no)} is on its way with our delivery person and should reach you ${cleanLine(expectedDay)}. Please keep your phone handy.`,
  ]);
}
