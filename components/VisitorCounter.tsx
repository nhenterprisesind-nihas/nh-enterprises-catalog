"use client";

import { useEffect, useState } from "react";

export default function VisitorCounter() {
  const [count, setCount] = useState<number>();

  useEffect(() => {
    fetch("/api/visitor")
      .then((r) => r.json())
      .then((d) => setCount(d.count))
      .catch(console.error);
  }, []);

  return (
    <p className="text-center text-emerald-300 text-xs mt-2">
      👁️ {count ? count.toLocaleString("en-IN") : "Loading..."} Visitors
    </p>
  );
}