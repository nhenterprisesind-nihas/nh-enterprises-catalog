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
  const isAdminRoute =
    pathname === "/admin" || pathname.startsWith("/admin/");
  const isAccountRoute =
    pathname === "/account" || pathname.startsWith("/account/");
  const isAccountLoginPage = pathname === "/account/login";

  if (!user && isAdminRoute) {
    const redirectResponse = NextResponse.redirect(
      new URL("/login", request.url)
    );
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  if (!user && isAccountRoute && !isAccountLoginPage) {
    const loginUrl = new URL("/account/login", request.url);
    loginUrl.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`
    );
    const redirectResponse = NextResponse.redirect(loginUrl);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  if (user && isLoginPage && user.app_metadata?.role === "admin") {
    const redirectResponse = NextResponse.redirect(
      new URL("/admin/orders", request.url)
    );
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  return response;
}