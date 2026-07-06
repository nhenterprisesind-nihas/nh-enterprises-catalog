"use client";

import { useEffect, useState } from "react";

export default function VisitorCounter() {
  const [count, setCount] = useState<string>("Loading...");

  useEffect(() => {
    async function loadCounter() {
      try {
        const response = await fetch(
          "https://api.visitorbadge.io/api/visitors?path=nh-enterprises-catalog"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch");
        }

        const data = await response.json();

        setCount(Number(data.total).toLocaleString("en-IN"));
      } catch (err) {
        console.error(err);
        setCount("--");
      }
    }

    loadCounter();
  }, []);

  return (
    <p className="text-center text-emerald-300 text-xs mt-2">
      👁️ {count} Visitors
    </p>
  );
}
