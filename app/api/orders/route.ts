import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { normalizeStatus, ORDER_STATUS } from "@/lib/order-status";
import { sendOrderAlert } from "@/lib/orderAlert";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      data?.map((order) => ({
        ...order,
        status: normalizeStatus(order.status),
      }))
    );

  } catch (err) {

    console.error(err);

    return NextResponse.json(
      {
        error: "Unable to load orders.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      orderNo,
      customerName,
      phone,
      address,
      pincode,
      subtotal,
      shipping,
      grandTotal,
      items,
    } = body;

    const { error: orderError } = await supabaseAdmin
      .from("orders")
      .insert([
        {
          order_no: orderNo,
          customer_name: customerName,
          phone,
          address,
          pincode,
          subtotal,
          shipping,
          grand_total: grandTotal,
          status: ORDER_STATUS.PLACED,
        },
      ]);

    if (orderError) {
      console.error(orderError);
      return NextResponse.json(
        { error: orderError.message },
        { status: 500 }
      );
    }

    const orderItems: {
      order_no: string;
      product_name: string;
      quantity: number;
      price: number;
      amount: number;
    }[] = items.map(
      (item: { name: string; quantity: number; price: number }) => ({
        order_no: orderNo,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price,
        amount: item.price * item.quantity,
      })
    );

    const { error: itemError } = await supabaseAdmin
      .from("order_items")
      .insert(orderItems);

    if (itemError) {
      console.error(itemError);
      return NextResponse.json(
        { error: itemError.message },
        { status: 500 }
      );
    }

    let alertTimeout: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        sendOrderAlert({
          orderNo: String(orderNo),
          grandTotal,
          createdAt: new Date().toISOString(),
          customerName: String(customerName ?? ""),
          pincode: String(pincode ?? ""),
          items: orderItems.map((item) => ({
            name: item.product_name,
            quantity: item.quantity,
          })),
        }),
        new Promise<void>((resolve) => {
          alertTimeout = setTimeout(resolve, 5000);
        }),
      ]);
    } catch {
      console.error("Order alert failed");
    } finally {
      if (alertTimeout) clearTimeout(alertTimeout);
    }

    return NextResponse.json({
      success: true,
      orderNo,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 500,
      }
    );
  }
}
