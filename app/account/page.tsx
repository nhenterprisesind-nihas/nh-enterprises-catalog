"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import SiteHeader from "@/components/SiteHeader";
import { supabase } from "@/lib/supabase";

type Profile = {
  full_name: string;
  phone: string;
  address: string;
  pincode: string;
};

const confirmationPhrase = "DELETE MY ACCOUNT";

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [error, setError] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function loadProfile() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/account/profile", {
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Unable to load your profile.");
      }

      setProfile({
        full_name: result.profile.full_name ?? "",
        phone: result.profile.phone ?? "",
        address: result.profile.address ?? "",
        pincode: result.profile.pincode ?? "",
      });
    } catch {
      setError("Unable to load your profile. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProfile();
  }, []);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;

    setSaving(true);
    setSaveMessage("");
    setError("");
    try {
      const response = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Unable to save your profile.");
      }

      setProfile({
        full_name: result.profile.full_name ?? "",
        phone: result.profile.phone ?? "",
        address: result.profile.address ?? "",
        pincode: result.profile.pincode ?? "",
      });
      setSaveMessage("Your profile has been saved.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save your profile."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (confirmation !== confirmationPhrase) return;

    setDeleting(true);
    setDeleteError("");
    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Unable to delete your account.");
      }

      try {
        const { error: signOutError } = await supabase.auth.signOut({
          scope: "local",
        });
        if (signOutError) {
          console.error("Could not clear the deleted account session.");
        }
      } catch {
        console.error("Could not clear the deleted account session.");
      }
      router.replace("/");
      router.refresh();
    } catch (deleteError) {
      setDeleteError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete your account."
      );
      setDeleting(false);
    }
  }

  const inputClassName =
    "mt-1 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-ink outline-none focus:border-brand-dark focus:ring-2 focus:ring-brand/30";

  return (
    <div className="min-h-screen bg-surface text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-brand-dark">My account</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
              Your details
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
            >
              ← Home
            </Link>
            <Link
              href="/account/orders"
              className="inline-flex min-h-11 items-center rounded-lg border border-brand-dark px-4 py-2 font-semibold text-brand-dark hover:bg-brand-dark hover:text-white"
            >
              My orders
            </Link>
          </div>
        </div>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900">
            Profile information
          </h2>
          {loading ? (
            <div className="mt-6 space-y-4" aria-label="Loading profile">
              <div className="h-12 animate-pulse rounded-lg bg-gray-100" />
              <div className="h-12 animate-pulse rounded-lg bg-gray-100" />
              <div className="h-24 animate-pulse rounded-lg bg-gray-100" />
            </div>
          ) : error && !profile ? (
            <div className="mt-5" role="alert">
              <p className="text-sm text-red-700">{error}</p>
              <button
                type="button"
                onClick={() => void loadProfile()}
                className="mt-3 min-h-11 rounded-lg bg-brand px-4 py-2 font-semibold text-on-brand hover:bg-brand-dark"
              >
                Retry
              </button>
            </div>
          ) : profile ? (
            <form onSubmit={saveProfile} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="full-name"
                  className="block text-sm font-medium text-gray-800"
                >
                  Full name
                </label>
                <input
                  id="full-name"
                  type="text"
                  autoComplete="name"
                  maxLength={80}
                  required
                  value={profile.full_name}
                  onChange={(event) =>
                    setProfile({ ...profile, full_name: event.target.value })
                  }
                  className={inputClassName}
                />
              </div>
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-800"
                >
                  Contact number (not verified)
                </label>
                <input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={32}
                  value={profile.phone}
                  onChange={(event) =>
                    setProfile({ ...profile, phone: event.target.value })
                  }
                  className={inputClassName}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Use a 10-digit Indian mobile number. This number is not
                  verified.
                </p>
              </div>
              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-800"
                >
                  Delivery address
                </label>
                <textarea
                  id="address"
                  autoComplete="street-address"
                  maxLength={300}
                  rows={4}
                  value={profile.address}
                  onChange={(event) =>
                    setProfile({ ...profile, address: event.target.value })
                  }
                  className={inputClassName}
                />
              </div>
              <div>
                <label
                  htmlFor="pincode"
                  className="block text-sm font-medium text-gray-800"
                >
                  Pincode
                </label>
                <input
                  id="pincode"
                  type="text"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  value={profile.pincode}
                  onChange={(event) =>
                    setProfile({ ...profile, pincode: event.target.value })
                  }
                  className={inputClassName}
                />
              </div>
              {error && (
                <p className="text-sm text-red-700" role="alert">
                  {error}
                </p>
              )}
              {saveMessage && (
                <p className="text-sm text-green-700" role="status">
                  {saveMessage}
                </p>
              )}
              <button
                type="submit"
                disabled={saving}
                className="min-h-11 rounded-lg bg-brand px-5 py-2 font-semibold text-on-brand hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </form>
          ) : (
            <p className="mt-4 text-sm text-gray-600">
              Your profile could not be loaded.
            </p>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-red-200 bg-white p-5 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold text-gray-900">
            Delete my account
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Your profile and sign-in will be deleted. Existing orders are kept
            for records.
          </p>
          <button
            type="button"
            onClick={() => {
              setConfirmation("");
              setDeleteError("");
              setShowDeleteDialog(true);
            }}
            className="mt-4 min-h-11 rounded-lg border border-red-700 px-4 py-2 font-semibold text-red-700 hover:bg-red-50"
          >
            Delete my account
          </button>
        </section>
      </main>

      {showDeleteDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
        >
          <section
            aria-labelledby="delete-dialog-title"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:p-7"
            role="dialog"
          >
            <h2
              id="delete-dialog-title"
              className="text-xl font-bold text-gray-900"
            >
              Delete your account?
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              This permanently removes your profile and sign-in. Your orders
              are kept for records.
            </p>
            <form onSubmit={deleteAccount} className="mt-5">
              <label
                htmlFor="delete-confirmation"
                className="block text-sm font-medium text-gray-800"
              >
                Type <span className="font-bold">{confirmationPhrase}</span> to
                confirm
              </label>
              <input
                id="delete-confirmation"
                type="text"
                autoComplete="off"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                className={inputClassName}
              />
              {deleteError && (
                <p className="mt-3 text-sm text-red-700" role="alert">
                  {deleteError}
                </p>
              )}
              <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowDeleteDialog(false)}
                  disabled={deleting}
                  className="min-h-11 rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    deleting || confirmation !== confirmationPhrase
                  }
                  className="min-h-11 rounded-lg bg-red-700 px-4 py-2 font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete account"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
