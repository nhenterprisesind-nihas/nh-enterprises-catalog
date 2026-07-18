import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user = null;

try {
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  user = authUser;
} catch (error) {
  user = null;
  response.cookies.delete("sb-access-token");
  response.cookies.delete("sb-refresh-token");
}

  const pathname = request.nextUrl.pathname;

  const isLoginPage = pathname === "/login";
  const isAdminRoute = pathname.startsWith("/admin");

  if (!user && isAdminRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && isLoginPage) {
    return NextResponse.redirect(new URL("/admin/orders", request.url));
  }

  return response;
}