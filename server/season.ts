// Seasons and quota days follow the real calendar in Canberra (Australia/Sydney
// time zone, southern hemisphere). Pure functions — no DB — so tests import them.
export const SEASONS = ["spring", "summer", "autumn", "winter"] as const;
export type Season = (typeof SEASONS)[number];
export const TZ = "Australia/Sydney";

// "YYYY-MM-DD" of `now` in Canberra.
export function canberraDay(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export const isSeason = (s: unknown): s is Season => typeof s === "string" && (SEASONS as readonly string[]).includes(s);

// Season for a Canberra date, and the date it started (first of its first month).
export function seasonOf(day: string): { season: Season; since: string } {
  const [y, m] = day.split("-").map(Number);
  if (m >= 9 && m <= 11) return { season: "spring", since: `${y}-09-01` };
  if (m === 12) return { season: "summer", since: `${y}-12-01` };
  if (m <= 2) return { season: "summer", since: `${y - 1}-12-01` };
  if (m <= 5) return { season: "autumn", since: `${y}-03-01` };
  return { season: "winter", since: `${y}-06-01` };
}

// Most recent start of `season` on or before `day` (used when overriding).
function sinceFor(season: Season, day: string): string {
  const [y, m] = day.split("-").map(Number);
  const start = { spring: 9, summer: 12, autumn: 3, winter: 6 }[season];
  const year = m >= start ? y : y - 1;
  return `${year}-${String(start).padStart(2, "0")}-01`;
}

// The current season; `override` (env SEASON or a dev query) wins if valid.
export function currentSeason(override?: string | null, now = new Date()): { season: Season; since: string } {
  const day = canberraDay(now);
  if (isSeason(override)) return { season: override, since: sinceFor(override, day) };
  return seasonOf(day);
}
