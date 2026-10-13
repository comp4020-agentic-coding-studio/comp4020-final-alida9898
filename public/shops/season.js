// The current season: `?season=<name>` on the page (dev override), else
// GET /api/season ({ season, since }), else computed from today's date in
// Canberra (southern hemisphere: spring Sep–Nov, summer Dec–Feb,
// autumn Mar–May, winter Jun–Aug).
export const SEASONS = ["spring", "summer", "autumn", "winter"];
export const SEASON_NAME = {
  spring: { zh: "春天", en: "Spring" }, summer: { zh: "夏天", en: "Summer" },
  autumn: { zh: "秋天", en: "Autumn" }, winter: { zh: "冬天", en: "Winter" },
};
export const SEEN_KEY = "cafe-season-seen-v1";

/** Season for a date, by the month in Australia/Sydney (Canberra's time zone). */
export function localSeason(date = new Date()) {
  let month;
  try { month = Number(new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Sydney", month: "numeric" }).format(date)); }
  catch { month = date.getMonth() + 1; }
  return ["summer", "summer", "autumn", "autumn", "autumn", "winter", "winter", "winter", "spring", "spring", "spring", "summer"][month - 1];
}

export async function currentSeason(loc = location) {
  const q = new URLSearchParams(loc.search).get("season");
  if (SEASONS.includes(q)) return q;
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 2500);
    const res = await fetch("/api/season", { signal: ctl.signal });
    clearTimeout(timer);
    if (res.ok) {
      const { season } = await res.json();
      if (SEASONS.includes(season)) return season;
    }
  } catch {}
  return localSeason();
}
