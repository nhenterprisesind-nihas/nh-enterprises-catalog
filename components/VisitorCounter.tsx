"use client";

import { useEffect, useState } from "react";

export default function VisitorCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/visitor");
        const data = await res.json();
        setCount(data.count);
      } catch (err) {
        console.error(err);
      }
    }

    load();
  }, []);

  return (
    <p className="text-center text-emerald-300 text-xs mt-2">
      👁️ {count === null ? "Loading..." : count.toLocaleString("en-IN")} Visitors
    </p>
  );
}