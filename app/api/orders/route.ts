import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

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

    return NextResponse.json(data);

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
          status: "Placed",
        },
      ]);

    if (orderError) {
      console.error(orderError);
      return NextResponse.json(
        { error: orderError.message },
        { status: 500 }
      );
    }

    const orderItems = items.map((item: any) => ({
      order_no: orderNo,
      product_name: item.name,
      quantity: item.quantity,
      price: item.price,
      amount: item.price * item.quantity,
    }));

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
