const WORKSPACE =
  process.env.NEXT_PUBLIC_COUNTER_WORKSPACE || "nh-enterprises-catalog";

export function trackEvent(name: string): void {
  try {
    if (typeof window === "undefined" || window.location.hostname === "localhost") {
      return;
    }

    void fetch(
      `https://api.counterapi.dev/v1/${WORKSPACE}/${encodeURIComponent(name)}/up`,
      { keepalive: true }
    ).catch(() => {});
  } catch {
    // Tracking is best-effort and must not interfere with the user action.
  }
}
