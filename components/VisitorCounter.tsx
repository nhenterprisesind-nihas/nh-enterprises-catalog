"use client";

import { useEffect, useState } from "react";

export default function VisitorCounter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const STORAGE_KEY = "nh_total_visits";
    const SESSION_KEY = "nh_session_visited";

    let visits = Number(localStorage.getItem(STORAGE_KEY) || "0");

    // Count only once per browser session
    if (!sessionStorage.getItem(SESSION_KEY)) {
      visits++;
      localStorage.setItem(STORAGE_KEY, visits.toString());
      sessionStorage.setItem(SESSION_KEY, "true");
    }

    setCount(Number(localStorage.getItem(STORAGE_KEY) || visits));
  }, []);

  return (
    <p className="text-center text-emerald-300 text-xs mt-2">
      👁️ {count.toLocaleString("en-IN")} visitors
    </p>
  );
}
