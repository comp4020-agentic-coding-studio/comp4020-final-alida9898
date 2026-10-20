import { expect, inject, it } from "vitest";
import { currentSeason, seasonOf } from "../server/season.ts";

const baseUrl = inject("baseUrl");
const api = (path: string, init?: RequestInit) => fetch(new URL(path, baseUrl), init);
const post = (path: string, body?: unknown, init?: RequestInit) =>
  api(path, { ...init, method: "POST", headers: { "content-type": "application/json", ...(init?.headers ?? {}) }, body: JSON.stringify(body ?? {}) });

const uid = () => `u${Math.random().toString(36).slice(2, 10)}`;
const PASSWORD = "correct-horse-battery";

/** Registers a fresh account and returns its session cookie + id. */
async function register(username = uid()): Promise<{ username: string; id: string; cookie: string }> {
  const res = await post("/api/auth/register", { username, password: PASSWORD });
  expect(res.status, `register(${username}) failed`).toBe(200);
  const cookie = (res.headers.get("set-cookie") ?? "").split(";")[0];
  const { account } = await res.json();
  return { username, id: account.id, cookie };
}
const authed = (cookie: string) => (path: string, init?: RequestInit) =>
  api(path, { ...init, headers: { ...(init?.headers ?? {}), cookie } });
const authedPost = (cookie: string) => (path: string, body?: unknown) =>
  post(path, body, { headers: { cookie } });

/** A fresh account with its own town (created on first POST /api/worlds). */
async function newWorld() {
  const owner = await register();
  const res = await authedPost(owner.cookie)("/api/worlds");
  const { world, shops } = (await res.json()) as { world: string; shops: Record<string, string> };
  return { owner, world, shops };
}
/** Makes `a` and `b` mutual friends (a sends, b accepts). */
async function makeFriends(a: { cookie: string; id: string }, b: { cookie: string; id: string; username: string }) {
  const sent = await authedPost(a.cookie)("/api/friends/request", { username: b.username });
  expect(sent.status).toBe(200);
  const acc = await authedPost(b.cookie)(`/api/friends/${a.id}/accept`);
  expect(acc.status).toBe(200);
}

it("a new world has its own cafe, flower, book and bakery shop", async () => {
  const w = await newWorld();
  expect(Object.keys(w.shops).sort()).toEqual(["bakery", "book", "cafe", "flower"]);
  const res = await authed(w.owner.cookie)(`/api/worlds/${w.world}`);
  const body = await res.json();
  expect(body.role).toBe("owner");
  expect(body.shops.map((s: { type: string }) => s.type)).toEqual(["cafe", "flower", "book", "bakery"]);
  expect(body.quota).toBeUndefined();
  expect((await authed(w.owner.cookie)(`/w/${w.world}/cafe`)).status).toBe(200);
});

it("POST /api/worlds is idempotent: the same account always gets the same town", async () => {
  const owner = await register();
  const a = await (await authedPost(owner.cookie)("/api/worlds")).json();
  const b = await (await authedPost(owner.cookie)("/api/worlds")).json();
  expect(a.world).toBe(b.world);
});

it("the owner places without a limit", async () => {
  const w = await newWorld();
  for (let i = 0; i < 10; i++) {
    const r = await authedPost(w.owner.cookie)(`/api/shops/${w.shops.cafe}/place`, { item: `item-${i}`, client: "me" });
    expect(r.status).toBe(200);
  }
  const cafe = (await (await authed(w.owner.cookie)(`/api/worlds/${w.world}`)).json()).shops[0];
  expect(cafe.placed).toBe(10);
});

it("a friend places 8 items a day per world; the 9th is a 429", async () => {
  const w = await newWorld();
  const friend = await register();
  await makeFriends(w.owner, friend);
  for (let i = 0; i < 8; i++) {
    const r = await authedPost(friend.cookie)(`/api/shops/${w.shops.flower}/place`, { item: `f-${i}`, client: friend.id });
    expect(r.status).toBe(200);
    expect((await r.json()).quota.left).toBe(7 - i);
  }
  const ninth = await authedPost(friend.cookie)(`/api/shops/${w.shops.book}/place`, { item: "b-0", client: friend.id });
  expect(ninth.status).toBe(429);
  expect((await ninth.json()).error).toBe("quota_today");
  const view = await (await authed(friend.cookie)(`/api/worlds/${w.world}`)).json();
  expect(view.role).toBe("guest");
  expect(view.canPlace).toBe(true);
  expect(view.quota).toEqual({ left: 0, worldsLeft: 2 });
});

it("a taken item doesn't use up a friend's quota", async () => {
  const w = await newWorld();
  const friend = await register();
  await makeFriends(w.owner, friend);
  await authedPost(w.owner.cookie)(`/api/shops/${w.shops.cafe}/place`, { item: "l0-lamp", client: "me" });
  const r = await authedPost(friend.cookie)(`/api/shops/${w.shops.cafe}/place`, { item: "l0-lamp", client: friend.id });
  expect(r.status).toBe(409);
  const view = await (await authed(friend.cookie)(`/api/worlds/${w.world}`)).json();
  expect(view.quota).toEqual({ left: 8, worldsLeft: 3 });
});

it("a friend helps at most 3 worlds a day", async () => {
  const friend = await register();
  for (let i = 0; i < 3; i++) {
    const w = await newWorld();
    await makeFriends(w.owner, friend);
    expect((await authedPost(friend.cookie)(`/api/shops/${w.shops.cafe}/place`, { item: "x", client: friend.id })).status).toBe(200);
  }
  const fourth = await newWorld();
  await makeFriends(fourth.owner, friend);
  const view = await (await authed(friend.cookie)(`/api/worlds/${fourth.world}`)).json();
  expect(view.quota).toEqual({ left: 0, worldsLeft: 0 });
  const r = await authedPost(friend.cookie)(`/api/shops/${fourth.shops.cafe}/place`, { item: "x", client: friend.id });
  expect(r.status).toBe(429);
  expect((await r.json()).error).toBe("too_many_worlds");
});

it("reusing the same account never resets a spent quota (no client-chosen id to clear)", async () => {
  const w = await newWorld();
  const friend = await register();
  await makeFriends(w.owner, friend);
  for (let i = 0; i < 8; i++) {
    expect((await authedPost(friend.cookie)(`/api/shops/${w.shops.flower}/place`, { item: `g-${i}`, client: friend.id })).status).toBe(200);
  }
  // "clearing localStorage" used to mean a fresh helper string; now the account id is server-side
  // and can't be chosen by the client at all, so a second "fresh" request with the same session
  // (simulating the old reset trick) still sees the spent quota.
  const again = await authedPost(friend.cookie)(`/api/shops/${w.shops.flower}/place`, { item: "g-8", client: friend.id });
  expect(again.status).toBe(429);
});

it("anyone logged in may view a town, but only an accepted friend (or the owner) may place", async () => {
  const w = await newWorld();
  const stranger = await register();
  const viewRes = await authed(stranger.cookie)(`/api/worlds/${w.world}`);
  expect(viewRes.status).toBe(200);
  const view = await viewRes.json();
  expect(view.role).toBe("guest");
  expect(view.canPlace).toBe(false);
  expect(view.quota).toBeUndefined();
  const placeRes = await authedPost(stranger.cookie)(`/api/shops/${w.shops.cafe}/place`, { item: "x", client: stranger.id });
  expect(placeRes.status).toBe(403);
});

it("no session is 401 for viewing; an unknown world is a 404; a non-owner can't rename or set the note", async () => {
  const w = await newWorld();
  expect((await api(`/api/worlds/${w.world}`)).status).toBe(401);
  expect((await post(`/api/shops/${w.shops.cafe}/place`, { item: "x", client: "a" })).status).toBe(403);
  expect((await api("/api/worlds/no-such-world")).status).toBe(404);
  expect((await authed(w.owner.cookie)("/api/worlds/no-such-world")).status).toBe(404);
  expect((await api("/w/no-such-world")).status).toBe(404);
  const stranger = await register();
  const put = await api(`/api/worlds/${w.world}/name`, {
    method: "PUT",
    headers: { "content-type": "application/json", cookie: stranger.cookie },
    body: JSON.stringify({ name: "x" }),
  });
  expect(put.status).toBe(403);
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
