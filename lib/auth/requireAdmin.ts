import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function requireAdmin(): Promise<NextResponse | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (user.app_metadata?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403, headers: { "Cache-Control": "no-store" } }
      );
    }

    return null;
  } catch {
    console.error("Admin authorization check failed");
    return NextResponse.json(
      { error: "Unable to verify authorization." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
