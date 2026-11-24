import "server-only";

import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function requireUser(): Promise<User | NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("Customer authentication check failed", error);
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    return user;
  } catch (error) {
    console.error("Customer authentication check failed", error);
    return NextResponse.json(
      { error: "Unable to verify authentication." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
