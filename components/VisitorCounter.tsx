"use client";

import React, { useEffect, useRef, useState } from "react";

// Free, keyless counter service — https://counterapi.dev
// Swap NEXT_PUBLIC_COUNTER_WORKSPACE if you want your own separate tally.
const WORKSPACE = process.env.NEXT_PUBLIC_COUNTER_WORKSPACE || "nikshas-collections";
const COUNTER_NAME = "site-visits";

export default function VisitorCounter() {
  const [count, setCount] = useState<number | null>(null);
  const hasFired = useRef(false);

  useEffect(() => {
    // Guard against React 18 StrictMode's double-invoke in dev,
    // which would otherwise count one visit as two.
    if (hasFired.current) return;
    hasFired.current = true;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    fetch(`https://api.counterapi.dev/v1/${WORKSPACE}/${COUNTER_NAME}/up`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        const value = data?.value ?? data?.count ?? data?.data?.up_count;
        if (typeof value === "number") setCount(value);
      })
      .catch(() => {
        // Fail silently — a missing visitor count shouldn't break the footer.
      })
      .finally(() => clearTimeout(timeoutId));

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  if (count === null) return null;

  return (
    <p className="text-center text-emerald-300 text-xs mt-2">
      👁️ {count.toLocaleString("en-IN")} visitors
    </p>
  );
}
