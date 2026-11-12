type FestivalRange = {
  start: string;
  end: string;
  greeting?: string;
};

type FestivalDefinition = {
  theme: string;
  greeting: string;
  ranges: readonly FestivalRange[];
};

export const FESTIVALS = [
  {
    theme: "deepavali",
    greeting: "Happy Deepavali! Gifts, jewellery and pooja items",
    // TODO: I will fill the dates each year.
    ranges: [],
  },
  {
    theme: "navaratri",
    greeting: "Happy Navaratri! Golu and pooja essentials",
    // TODO: I will fill the dates each year.
    ranges: [],
  },
  {
    theme: "pongal",
    greeting: "Happy Pongal! Gifts for the harvest festival",
    ranges: [{ start: "01-13", end: "01-17" }],
  },
  {
    theme: "holi",
    greeting: "Happy Holi! Bright colours, brighter offers",
    // TODO: I will fill the dates each year.
    ranges: [],
  },
  {
    theme: "christmas",
    greeting: "Merry Christmas! Gifts for everyone on your list",
    ranges: [{ start: "12-15", end: "01-01" }],
  },
  {
    theme: "tricolour",
    greeting: "Happy Republic Day!",
    ranges: [
      { start: "01-22", end: "01-26" },
      {
        start: "08-10",
        end: "08-15",
        greeting: "Happy Independence Day!",
      },
    ],
  },
  {
    theme: "eid",
    greeting: "Eid Mubarak! Gifts and festive accessories",
    // TODO: I will fill the dates each year.
    ranges: [],
  },
] as const satisfies readonly FestivalDefinition[];

export type FestivalTheme = (typeof FESTIVALS)[number]["theme"];
export type ThemeName = FestivalTheme | "base";

export const THEME_NAMES: readonly ThemeName[] = [
  "base",
  ...FESTIVALS.map(({ theme }) => theme),
];

function isValidISODate(dateISO: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) {
    return false;
  }

  const date = new Date(`${dateISO}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === dateISO
  );
}

function rangeContainsDate(dateISO: string, range: FestivalRange): boolean {
  const usesFullDates =
    /^\d{4}-\d{2}-\d{2}$/.test(range.start) &&
    /^\d{4}-\d{2}-\d{2}$/.test(range.end);

  if (usesFullDates) {
    return dateISO >= range.start && dateISO <= range.end;
  }

  if (!/^\d{2}-\d{2}$/.test(range.start) || !/^\d{2}-\d{2}$/.test(range.end)) {
    return false;
  }

  const monthDay = dateISO.slice(5);
  return range.start <= range.end
    ? monthDay >= range.start && monthDay <= range.end
    : monthDay >= range.start || monthDay <= range.end;
}

export function getActiveFestival(
  dateISO: string
): { theme: FestivalTheme; greeting: string } | undefined {
  if (!isValidISODate(dateISO)) {
    return undefined;
  }

  for (const festival of FESTIVALS) {
    const activeRange = festival.ranges.find((range) =>
      rangeContainsDate(dateISO, range)
    );
    if (activeRange) {
      return {
        theme: festival.theme,
        greeting:
          ("greeting" in activeRange && activeRange.greeting) ||
          festival.greeting,
      };
    }
  }

  return undefined;
}

export function getActiveTheme(dateISO: string): ThemeName {
  return getActiveFestival(dateISO)?.theme ?? "base";
}

export function createThemeBootstrapScript(forceTheme?: string): string {
  const festivals = JSON.stringify(FESTIVALS).replace(/</g, "\\u003c");
  const themeNames = JSON.stringify(THEME_NAMES).replace(/</g, "\\u003c");
  const forcedTheme = JSON.stringify(forceTheme ?? null).replace(/</g, "\\u003c");

  return `(() => {
    const festivals = ${festivals};
    const themeNames = ${themeNames};
    const forcedTheme = ${forcedTheme};
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(new Date());
    const today = [
      parts.find((part) => part.type === "year").value,
      parts.find((part) => part.type === "month").value,
      parts.find((part) => part.type === "day").value
    ].join("-");
    const matchesRange = (range) => {
      const fullDateRange =
        /^\\d{4}-\\d{2}-\\d{2}$/.test(range.start) &&
        /^\\d{4}-\\d{2}-\\d{2}$/.test(range.end);
      if (fullDateRange) {
        return today >= range.start && today <= range.end;
      }
      const monthDayRange =
        /^\\d{2}-\\d{2}$/.test(range.start) &&
        /^\\d{2}-\\d{2}$/.test(range.end);
      if (!monthDayRange) return false;
      const monthDay = today.slice(5);
      return range.start <= range.end
        ? monthDay >= range.start && monthDay <= range.end
        : monthDay >= range.start || monthDay <= range.end;
    };
    let scheduled = null;
    for (const festival of festivals) {
      const range = festival.ranges.find(matchesRange);
      if (range) {
        scheduled = { festival, range };
        break;
      }
    }
    let requestedTheme = null;
    let rememberedTheme = null;
    try {
      requestedTheme = new URLSearchParams(window.location.search).get("theme");
      if (themeNames.includes(requestedTheme)) {
        sessionStorage.setItem("festivalThemeOverride", requestedTheme);
      } else {
        requestedTheme = null;
      }
      const remembered = sessionStorage.getItem("festivalThemeOverride");
      if (themeNames.includes(remembered)) {
        rememberedTheme = remembered;
      }
    } catch {}
    const activeTheme = themeNames.includes(forcedTheme)
      ? forcedTheme
      : requestedTheme || rememberedTheme || scheduled?.festival.theme || "base";
    const activeFestival = festivals.find(({ theme }) => theme === activeTheme);
    const greeting =
      scheduled?.festival.theme === activeTheme
        ? scheduled.range.greeting || scheduled.festival.greeting
        : activeFestival?.greeting || "";
    const root = document.documentElement;
    root.dataset.theme = activeTheme;
    if (greeting) root.dataset.greeting = greeting;
    else delete root.dataset.greeting;
  })();`;
}
