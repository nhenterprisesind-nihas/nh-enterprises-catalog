import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { normalizeStatus, ORDER_STATUS } from "@/lib/order-status";
import { sendOrderAlert } from "@/lib/orderAlert";
import { getProducts } from "@/lib/products";
import { normalizeIndianMobileNumber } from "@/lib/indian-mobile";

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
      phone: rawPhone,
      address,
      pincode,
      subtotal,
      shipping,
      grandTotal,
      items,
    } = body;

    const phone = normalizeIndianMobileNumber(rawPhone);
    if (!phone) {
      return NextResponse.json(
        {
          error:
            "Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.",
        },
        { status: 400 }
      );
    }

    const products = await getProducts();
    const productsByName = new Map(
      products.map((product) => [product.name.trim().toLowerCase(), product])
    );

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
      console.error("Order insert failed.");
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
      product_id: string | null;
      category: string | null;
    }[] = items.map(
      (item: { name: string; quantity: number; price: number }) => {
        const product = productsByName.get(item.name.trim().toLowerCase());
        return {
          order_no: orderNo,
          product_name: item.name,
          quantity: item.quantity,
          price: item.price,
          amount: item.price * item.quantity,
          product_id: product?.id ?? null,
          category: product ? product.category.trim() : null,
        };
      }
    );

    const { error: itemError } = await supabaseAdmin
      .from("order_items")
      .insert(orderItems);

    if (itemError) {
      console.error("Order item insert failed.");
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
    console.error("Order request failed.");

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
