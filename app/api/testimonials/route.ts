import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type TestimonialInput = {
  customerName?: unknown;
  productName?: unknown;
  review?: unknown;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("testimonials")
    .select("id, customer_name, product_name, review, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Unable to load testimonials." }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TestimonialInput;
    const customerName = clean(body.customerName);
    const productName = clean(body.productName);
    const review = clean(body.review);

    if (productName.length < 2 || productName.length > 120 || review.length < 10 || review.length > 1000) {
      return NextResponse.json({ error: "Please enter a product name and feedback between 10 and 1,000 characters." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("testimonials")
      .insert({
        customer_name: customerName || null,
        product_name: productName,
        review,
      })
      .select("id, customer_name, product_name, review, created_at")
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to submit your feedback. Please try again." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "Invalid testimonial." }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("testimonials").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: "Unable to delete testimonial." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
