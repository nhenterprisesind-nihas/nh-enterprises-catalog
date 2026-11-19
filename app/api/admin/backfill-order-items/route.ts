import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getProducts } from "@/lib/products";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const BATCH_SIZE = 200;

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.app_metadata?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const products = await getProducts();
    const productsByName = new Map(
      products.map((product) => [product.name.trim().toLowerCase(), product])
    );
    const unmatchedNameKeys = new Set<string>();
    const unmatchedNames: string[] = [];
    let matched = 0;
    let unmatched = 0;
    let lastId: number | string | undefined;

    while (true) {
      let query = supabaseAdmin
        .from("order_items")
        .select("id, product_name")
        .is("category", null)
        .order("id", { ascending: true })
        .limit(BATCH_SIZE);

      if (lastId !== undefined) {
        query = query.gt("id", lastId);
      }

      const { data: rows, error } = await query;
      if (error) {
        throw error;
      }

      if (!rows || rows.length === 0) {
        break;
      }

      lastId = rows[rows.length - 1].id;
      const updatesByProduct = new Map<
        string,
        { productId: string; category: string; ids: (number | string)[] }
      >();

      for (const row of rows) {
        const productName =
          typeof row.product_name === "string" ? row.product_name.trim() : "";
        const product = productsByName.get(productName.toLowerCase());

        if (!product) {
          unmatched += 1;
          const nameKey = productName.toLowerCase();
          if (productName && !unmatchedNameKeys.has(nameKey)) {
            unmatchedNameKeys.add(nameKey);
            if (unmatchedNames.length < 20) {
              unmatchedNames.push(productName);
            }
          }
          continue;
        }

        const update = updatesByProduct.get(product.id) ?? {
          productId: product.id,
          category: product.category.trim(),
          ids: [],
        };
        update.ids.push(row.id);
        updatesByProduct.set(product.id, update);
      }

      for (const update of updatesByProduct.values()) {
        const { data: updatedRows, error: updateError } = await supabaseAdmin
          .from("order_items")
          .update({
            product_id: update.productId,
            category: update.category,
          })
          .in("id", update.ids)
          .is("category", null)
          .select("id");

        if (updateError) {
          throw updateError;
        }

        matched += updatedRows?.length ?? 0;
      }

      if (rows.length < BATCH_SIZE) {
        break;
      }
    }

    return NextResponse.json({ matched, unmatched, unmatchedNames });
  } catch (error) {
    console.error("Order item backfill failed", error);
    return NextResponse.json(
      { error: "Unable to backfill order items." },
      { status: 500 }
    );
  }
}
