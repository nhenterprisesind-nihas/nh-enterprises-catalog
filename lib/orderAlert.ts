import "server-only";

interface OrderAlertItem {
  name: string;
  quantity: number;
}

interface OrderAlert {
  orderNo: string;
  grandTotal: number;
  createdAt: string;
  customerName: string;
  pincode: string;
  items: OrderAlertItem[];
}

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://nh-enterprises-catalog.vercel.app"
).replace(/\/+$/, "");

function escapeAndTruncate(value: string | number, maxLength: number): string {
  let escapedValue = "";

  for (const character of String(value)) {
    const escapedCharacter =
      character === "&"
        ? "&amp;"
        : character === "<"
          ? "&lt;"
          : character === ">"
            ? "&gt;"
            : character;

    if (escapedValue.length + escapedCharacter.length > maxLength - 1) {
      return `${escapedValue}…`;
    }

    escapedValue += escapedCharacter;
  }

  return escapedValue;
}

function formatOrderMessage(order: OrderAlert): string {
  const firstName = order.customerName.trim().split(/\s+/)[0] || "";
  const time = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(order.createdAt));
  const itemLines = order.items.slice(0, 15).map(
    (item) =>
      `• ${escapeAndTruncate(item.name, 170)} × ${escapeAndTruncate(
        item.quantity,
        20
      )}`
  );

  if (order.items.length > 15) {
    itemLines.push(`and ${order.items.length - 15} more`);
  }

  return [
    `🛍 New order ${escapeAndTruncate(order.orderNo, 120)}`,
    `Total: ₹${escapeAndTruncate(
      order.grandTotal.toLocaleString("en-IN"),
      100
    )}`,
    `Customer: ${escapeAndTruncate(firstName, 80)}, ${escapeAndTruncate(
      order.pincode,
      40
    )}`,
    `Time: ${escapeAndTruncate(time, 60)}`,
    "",
    ...itemLines,
  ].join("\n");
}

export async function sendOrderAlert(order: OrderAlert): Promise<void> {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
    const chatIds =
      process.env.TELEGRAM_CHAT_ID?.split(",")
        .map((chatId) => chatId.trim())
        .filter(Boolean) ?? [];

    if (!token || chatIds.length === 0) {
      console.warn("Order alert not configured");
      return;
    }

    const text = formatOrderMessage(order);
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const orderUrl = `${SITE_URL}/admin/orders/${encodeURIComponent(
      order.orderNo
    )}`;

    await Promise.all(
      chatIds.map(async (chatId) => {
        try {
          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text,
              parse_mode: "HTML",
              disable_web_page_preview: true,
              reply_markup: {
                inline_keyboard: [
                  [{ text: "Open order", url: orderUrl }],
                ],
              },
            }),
            signal: AbortSignal.timeout(5000),
          });

          if (!response.ok) {
            console.error(`Order alert failed (HTTP ${response.status})`);
          }
        } catch {
          console.error("Order alert request failed");
        }
      })
    );
  } catch {
    console.error("Order alert failed");
  }
}
