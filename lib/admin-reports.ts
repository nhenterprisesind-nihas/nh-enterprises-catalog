import { NextResponse } from "next/server";

export type ReportRange = {
  from: string;
  to: string;
  days: number;
};

export type ReportRangeResult =
  | { ok: true; range: ReportRange }
  | { ok: false; error: string };

function isIsoDate(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function parseReportRange(
  searchParams: URLSearchParams
): ReportRangeResult {
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!isIsoDate(from) || !isIsoDate(to)) {
    return { ok: false, error: "from and to must be valid YYYY-MM-DD dates." };
  }

  const fromTime = Date.parse(`${from}T00:00:00.000Z`);
  const toTime = Date.parse(`${to}T00:00:00.000Z`);
  const days = Math.floor((toTime - fromTime) / 86_400_000) + 1;

  if (days < 1) {
    return { ok: false, error: "from must be on or before to." };
  }

  if (days > 800) {
    return { ok: false, error: "The date range cannot exceed 800 days." };
  }

  return { ok: true, range: { from, to, days } };
}

function addMonthsClamped(value: string, months: number): number {
  const [year, month, day] = value.split("-").map(Number);
  const targetMonth = month - 1 + months;
  const targetYear = year + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate();
  return Date.UTC(targetYear, normalizedMonth, Math.min(day, lastDay));
}

export function getReportGroup(range: ReportRange): "day" | "week" | "month" {
  if (range.days <= 45) {
    return "day";
  }

  const toTime = Date.parse(`${range.to}T00:00:00.000Z`);
  return toTime <= addMonthsClamped(range.from, 6) ? "week" : "month";
}

export function noStoreJson(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
