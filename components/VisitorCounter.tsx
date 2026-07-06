"use client";

import { useEffect, useRef, useState } from "react";

export default function VisitorCounter() {
  const [count, setCount] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const hasVisited = useRef(false);

  useEffect(() => {
    if (hasVisited.current) return;
    hasVisited.current = true;

    fetch("https://api.countapi.xyz/hit/nh-enterprises/catalog")
      .then((res) => {
        if (!res.ok) throw new Error("Unable to fetch visitor count");
        return res.json();
      })
      .then((data) => {
        setCount(data.value);
      })
      .catch((err) => {
        console.error(err);
        setFailed(true);
      });
  }, []);

  if (failed) {
    return (
      <p className="text-center text-emerald-400 text-xs mt-2">
        Visitor counter unavailable
      </p>
    );
  }

  return (
    <p className="text-center text-emerald-300 text-xs mt-2">
      👁️ {count === null ? "Loading..." : count.toLocaleString("en-IN")} visitors
    </p>
  );
}
