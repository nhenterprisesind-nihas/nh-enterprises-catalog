export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface SaveOrderRequest {
  orderNo: string;
  customerName: string;
  phone: string;
  address: string;
  pincode: string;
  subtotal: number;
  shipping: number;
  grandTotal: number;
  items: OrderItem[];
}

export async function saveOrder(order: SaveOrderRequest) {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(order),
  });

  if (!response.ok) {
    const error = await response.json();

    throw new Error(error.error || "Unable to save order.");
  }

  return response.json();
}