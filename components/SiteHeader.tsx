"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BUSINESS_PROFILE } from "@/lib/businessProfile";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function SiteHeader({ home = false }: { home?: boolean }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [signOutError, setSignOutError] = useState("");

  useEffect(() => {
    let receivedAuthEvent = false;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      receivedAuthEvent = true;
      setUser(session?.user ?? null);
      setAuthReady(true);
    });

    void supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (error) {
          console.error("Could not load the signed-in customer", error);
        }
        if (!receivedAuthEvent) {
          setUser(error ? null : data.user);
        }
        setAuthReady(true);
      })
      .catch((error: unknown) => {
        console.error("Could not load the signed-in customer", error);
        setAuthReady(true);
      });

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    setSignOutError("");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }

      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Could not sign out the customer", error);
      setSignOutError("Unable to sign out. Please try again.");
    }
  }

  const metadataName =
    typeof user?.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user?.user_metadata?.name === "string"
        ? user.user_metadata.name
        : "";
  const displayName = metadataName.trim() || user?.email || "My account";
  const initial = displayName.charAt(0).toUpperCase() || "A";

  const brandName = home ? (
    <h1 className="text-xl font-bold tracking-tight text-brand-soft sm:text-2xl">
      Nikshas Collections
    </h1>
  ) : (
    <p className="text-xl font-bold tracking-tight text-brand-soft sm:text-2xl">
      {BUSINESS_PROFILE.name}
    </p>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-brand-dark shadow-sm">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            aria-label="Go to home page"
            className="flex min-w-0 items-center gap-3 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-soft"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand">
              {process.env.NEXT_PUBLIC_LOGO_URL ? (
                <img
                  src={process.env.NEXT_PUBLIC_LOGO_URL}
                  alt="NH Enterprises logo"
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <span className="text-lg font-bold text-on-brand">N</span>
              )}
            </div>
            <div>
              {brandName}
              <p className="text-xs text-brand-soft">
                Quality products at retail and wholesale pricing
              </p>
            </div>
          </Link>
          <div className="ml-auto">
            {authReady && user ? (
              <details className="relative">
                <summary
                  aria-label={`Account menu for ${displayName}`}
                  className="flex cursor-pointer list-none items-center gap-2 rounded-full p-1 text-brand-soft hover:bg-white/10 [&::-webkit-details-marker]:hidden"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-on-brand">
                    {initial}
                  </span>
                  <span className="hidden max-w-36 truncate text-sm font-medium sm:block">
                    {displayName}
                  </span>
                </summary>
                <nav className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-gray-200 bg-white p-2 text-sm text-gray-800 shadow-lg">
                  <Link
                    href="/account"
                    className="block rounded-md px-3 py-2 hover:bg-gray-100"
                  >
                    My account
                  </Link>
                  <Link
                    href="/account/orders"
                    className="block rounded-md px-3 py-2 hover:bg-gray-100"
                  >
                    My orders
                  </Link>
                  <button
                    type="button"
                    onClick={() => void signOut()}
                    className="block w-full rounded-md px-3 py-2 text-left hover:bg-gray-100"
                  >
                    Sign out
                  </button>
                  {signOutError && (
                    <p className="px-3 py-2 text-xs text-red-700" role="alert">
                      {signOutError}
                    </p>
                  )}
                </nav>
              </details>
            ) : authReady ? (
              <Link
                href="/account/login"
                className="rounded-lg px-3 py-2 text-sm font-semibold text-brand-soft hover:bg-white/10"
              >
                Sign in
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
