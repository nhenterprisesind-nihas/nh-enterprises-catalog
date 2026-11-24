import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

function getSafeNextPath(value: string | null): string {
  if (
    value &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\")
  ) {
    return value;
  }

  return "/account";
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(
      new URL("/account/login?error=1", request.url)
    );
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      throw error;
    }

    const nextPath = getSafeNextPath(
      request.nextUrl.searchParams.get("next")
    );
    return NextResponse.redirect(new URL(nextPath, request.url));
  } catch (error) {
    console.error("Google sign-in callback failed", error);
    return NextResponse.redirect(
      new URL("/account/login?error=1", request.url)
    );
  }
}
