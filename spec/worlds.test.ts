import { expect, inject, it } from "vitest";
import { currentSeason, seasonOf } from "../server/season.ts";

const baseUrl = inject("baseUrl");
const api = (path: string, init?: RequestInit) => fetch(new URL(path, baseUrl), init);
const post = (path: string, body?: unknown) =>
  api(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body ?? {}) });
const newWorld = async () => (await (await post("/api/worlds")).json()) as {
  world: string; owner: string; guest: string; shops: Record<string, string>;
};
const uid = () => `h-${Math.random().toString(36).slice(2, 12)}`;

it("a new world has its own cafe, flower, book and bakery shop", async () => {
  const w = await newWorld();
  expect(Object.keys(w.shops).sort()).toEqual(["bakery", "book", "cafe", "flower"]);
  expect(w.owner).not.toBe(w.guest);
  const res = await api(`/api/worlds/${w.world}?t=${w.owner}`);
  const body = await res.json();
  expect(body.role).toBe("owner");
  expect(body.guestToken).toBe(w.guest);
  expect(body.shops.map((s: { type: string }) => s.type)).toEqual(["cafe", "flower", "book", "bakery"]);
  expect(body.quota).toBeUndefined();
  expect((await api(`/w/${w.world}/cafe`)).status).toBe(200);
});

it("the owner places without a limit", async () => {
  const w = await newWorld();
  for (let i = 0; i < 10; i++) {
    const r = await post(`/api/shops/${w.shops.cafe}/place`, { item: `item-${i}`, client: "me", t: w.owner });
    expect(r.status).toBe(200);
  }
  const cafe = (await (await api(`/api/worlds/${w.world}?t=${w.owner}`)).json()).shops[0];
  expect(cafe.placed).toBe(10);
});

it("a guest places 8 items a day per world; the 9th is a 429", async () => {
  const w = await newWorld();
  const helper = uid();
  for (let i = 0; i < 8; i++) {
    const r = await post(`/api/shops/${w.shops.flower}/place`, { item: `f-${i}`, client: helper, t: w.guest, helper });
    expect(r.status).toBe(200);
    expect((await r.json()).quota.left).toBe(7 - i);
  }
  const ninth = await post(`/api/shops/${w.shops.book}/place`, { item: "b-0", client: helper, t: w.guest, helper });
  expect(ninth.status).toBe(429);
  expect((await ninth.json()).error).toBe("quota_today");
  const view = await (await api(`/api/worlds/${w.world}?t=${w.guest}&helper=${helper}`)).json();
  expect(view.role).toBe("guest");
  expect(view.guestToken).toBeUndefined();
  expect(view.quota).toEqual({ left: 0, worldsLeft: 2 });
});

it("a taken item doesn't use up a guest's quota", async () => {
  const w = await newWorld();
  const helper = uid();
  await post(`/api/shops/${w.shops.cafe}/place`, { item: "l0-lamp", client: "me", t: w.owner });
  const r = await post(`/api/shops/${w.shops.cafe}/place`, { item: "l0-lamp", client: helper, t: w.guest, helper });
  expect(r.status).toBe(409);
  const view = await (await api(`/api/worlds/${w.world}?t=${w.guest}&helper=${helper}`)).json();
  expect(view.quota).toEqual({ left: 8, worldsLeft: 3 });
});

it("a guest helps at most 3 worlds a day", async () => {
  const helper = uid();
  for (let i = 0; i < 3; i++) {
    const w = await newWorld();
    expect((await post(`/api/shops/${w.shops.cafe}/place`, { item: "x", client: helper, t: w.guest, helper })).status).toBe(200);
  }
  const fourth = await newWorld();
  const view = await (await api(`/api/worlds/${fourth.world}?t=${fourth.guest}&helper=${helper}`)).json();
  expect(view.quota).toEqual({ left: 0, worldsLeft: 0 });
  const r = await post(`/api/shops/${fourth.shops.cafe}/place`, { item: "x", client: helper, t: fourth.guest, helper });
  expect(r.status).toBe(429);
  expect((await r.json()).error).toBe("too_many_worlds");
});

it("a wrong or missing token is a 403; an unknown world is a 404", async () => {
  const w = await newWorld();
  expect((await api(`/api/worlds/${w.world}?t=nope`)).status).toBe(403);
  expect((await api(`/api/worlds/${w.world}`)).status).toBe(403);
  expect((await post(`/api/shops/${w.shops.cafe}/place`, { item: "x", client: "a" })).status).toBe(403);
  expect((await post(`/api/shops/${w.shops.cafe}/place`, { item: "x", client: "a", t: "nope" })).status).toBe(403);
  expect((await api("/api/worlds/no-such-world?t=x")).status).toBe(404);
  expect((await api("/w/no-such-world")).status).toBe(404);
});

it("legacy shops without a world keep the open rules", async () => {
  const { shop } = await (await post("/api/shops")).json();
  for (let i = 0; i < 9; i++) expect((await post(`/api/shops/${shop}/place`, { item: `i-${i}`, client: "anyone" })).status).toBe(200);
});

it("/api/season names one of the four seasons", async () => {
  const s = await (await api("/api/season")).json();
  expect(["spring", "summer", "autumn", "winter"]).toContain(s.season);
  expect(s.since).toMatch(/^\d{4}-\d{2}-01$/);
  if (process.env.SEASON) expect(s.season).toBe(process.env.SEASON);
  // the dev-only query override (absent in production, where it's ignored)
  const o = await (await api("/api/season?season=winter")).json();
  expect(["spring", "summer", "autumn", "winter"]).toContain(o.season);
});

it("seasons follow the southern-hemisphere calendar in Canberra", () => {
  expect(seasonOf("2026-10-13")).toEqual({ season: "spring", since: "2026-09-01" });
  expect(seasonOf("2027-01-05")).toEqual({ season: "summer", since: "2026-12-01" });
  expect(seasonOf("2026-12-31")).toEqual({ season: "summer", since: "2026-12-01" });
  expect(seasonOf("2026-04-01")).toEqual({ season: "autumn", since: "2026-03-01" });
  expect(seasonOf("2026-07-20")).toEqual({ season: "winter", since: "2026-06-01" });
  // 31 Aug 15:00 UTC is already 1 Sep in Canberra
  expect(currentSeason(null, new Date("2026-08-31T15:00:00Z")).season).toBe("spring");
  expect(currentSeason("winter", new Date("2026-10-13T00:00:00Z"))).toEqual({ season: "winter", since: "2026-06-01" });
});
