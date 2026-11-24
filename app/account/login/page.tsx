"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import { supabase } from "@/lib/supabase";

export default function AccountLoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("error") === "1") {
      setError("We couldn't sign you in with Google. Please try again.");
    }
  }, []);

  async function signInWithGoogle() {
    setLoading(true);
    setError("");

    try {
      const next =
        new URLSearchParams(window.location.search).get("next") ?? "/account";
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (signInError) {
        throw signInError;
      }
    } catch (error) {
      console.error("Could not start Google sign-in", error);
      setError("We couldn't start Google sign-in. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface text-ink">
      <SiteHeader />
      <main className="mx-auto flex max-w-7xl justify-center px-4 py-12 sm:py-20">
        <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-brand-dark">Sign in</h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to view your account and orders.
          </p>

          {error && (
            <p
              className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            disabled={loading}
            className="mt-6 flex min-h-12 w-full items-center justify-center rounded-lg bg-brand px-4 py-3 font-semibold text-on-brand transition hover:bg-brand-dark hover:text-brand-soft disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Redirecting to Google..." : "Continue with Google"}
          </button>

          <p className="mt-5 text-center text-sm text-gray-600">
            By signing in you agree to our{" "}
            <Link
              href="/privacy"
              className="font-medium text-brand-dark underline underline-offset-2"
            >
              Privacy Policy
            </Link>
            .
          </p>
          <p className="mt-4 text-center text-sm text-gray-600">
            Guests can still place orders without an account.
          </p>
        </section>
      </main>
    </div>
  );
}
