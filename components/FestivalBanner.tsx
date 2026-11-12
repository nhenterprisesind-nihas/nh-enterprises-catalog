"use client";

import { useEffect, useState } from "react";

const DISMISSED_KEY = "festivalBannerDismissed";

export default function FestivalBanner() {
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const root = document.documentElement;
    const theme = root.dataset.theme;
    const activeGreeting = root.dataset.greeting;
    if (!theme || theme === "base" || !activeGreeting) {
      return;
    }

    try {
      if (sessionStorage.getItem(DISMISSED_KEY) === "true") {
        return;
      }
    } catch {
      // Storage may be unavailable in restricted browser contexts.
    }

    setGreeting(activeGreeting);
  }, []);

  function dismiss() {
    try {
      sessionStorage.setItem(DISMISSED_KEY, "true");
    } catch {
      // The banner can still be dismissed for the current page.
    }
    setGreeting("");
  }

  if (!greeting) {
    return null;
  }

  return (
    <div
      className="relative flex items-center justify-center bg-accent px-10 py-2 text-center text-sm text-on-accent"
      aria-live="polite"
    >
      <span>{greeting}</span>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss festival greeting"
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded px-1 text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
}
