import { expect, inject, it } from "vitest";

const baseUrl = inject("baseUrl");
const api = (path: string, init?: RequestInit) => fetch(new URL(path, baseUrl), init);
const send = (method: string, path: string, body?: unknown, init?: RequestInit) =>
  api(path, { ...init, method, headers: { "content-type": "application/json", ...(init?.headers ?? {}) }, body: JSON.stringify(body ?? {}) });

const uid = () => `u${Math.random().toString(36).slice(2, 10)}`;
const PASSWORD = "correct-horse-battery";

async function register(username = uid()) {
  const res = await send("POST", "/api/auth/register", { username, password: PASSWORD });
  const cookie = (res.headers.get("set-cookie") ?? "").split(";")[0];
  const { account } = await res.json();
  return { username, id: account.id, cookie };
}
const authed = (cookie: string) => (path: string, init?: RequestInit) => api(path, { ...init, headers: { ...(init?.headers ?? {}), cookie } });
const authedSend = (cookie: string) => (method: string, path: string, body?: unknown) => send(method, path, body, { headers: { cookie } });

async function newWorld() {
  const owner = await register();
  const { world, shops } = await (await authedSend(owner.cookie)("POST", "/api/worlds")).json();
  return { owner, world, shops };
}
async function makeFriends(a: { cookie: string; id: string }, b: { cookie: string; id: string; username: string }) {
  await authedSend(a.cookie)("POST", "/api/friends/request", { username: b.username });
  await authedSend(b.cookie)("POST", `/api/friends/${a.id}/accept`);
}

it("a new town has no name; the owner names it and both roles read it back", async () => {
  const w = await newWorld();
  const owner = async () => (await authed(w.owner.cookie)(`/api/worlds/${w.world}`)).json();
  expect((await owner()).ownerName).toBe("");
  const r = await authedSend(w.owner.cookie)("PUT", `/api/worlds/${w.world}/name`, { name: "  小美  " });
  expect(r.status).toBe(200);
  expect((await r.json()).ownerName).toBe("小美");
  expect((await owner()).ownerName).toBe("小美");
  const visitor = await register();
  const g = await (await authed(visitor.cookie)(`/api/worlds/${w.world}`)).json();
  expect(g.ownerName).toBe("小美");
});

it("only the owner may rename; names over 12 code points are refused", async () => {
  const w = await newWorld();
  const stranger = await register();
  expect((await authedSend(stranger.cookie)("PUT", `/api/worlds/${w.world}/name`, { name: "x" })).status).toBe(403);
  expect((await send("PUT", `/api/worlds/${w.world}/name`, { name: "x" })).status).toBe(403);
  expect((await authedSend(w.owner.cookie)("PUT", `/api/worlds/${w.world}/name`, { name: "一二三四五六七八九十一二" })).status).toBe(200);
  const long = await authedSend(w.owner.cookie)("PUT", `/api/worlds/${w.world}/name`, { name: "一二三四五六七八九十一二三" });
  expect(long.status).toBe(400);
  expect((await long.json()).error).toBe("too_long");
});

it("a friend's helperName is recorded and the owner sees it in helpers", async () => {
  const w = await newWorld();
  const friend = await register();
  await makeFriends(w.owner, friend);
  const p = await authedSend(friend.cookie)("POST", `/api/shops/${w.shops.cafe}/place`, { item: "a-1", client: friend.id, helperName: "阿明" });
  expect(p.status).toBe(200);
  await authedSend(friend.cookie)("POST", `/api/shops/${w.shops.book}/place`, { item: "b-1", client: friend.id });
  const o = await (await authed(w.owner.cookie)(`/api/worlds/${w.world}`)).json();
  expect(o.helpers).toEqual([{ name: "阿明", count: 2 }]);
  // helperName now defaults to the friend's real account username (up to 24 chars, see
  // USERNAME_RE), so its cap must not be the 12-char NAME_MAX used for town names: 13
  // chars is fine, only a helperName over 24 chars is refused.
  const notTooLong = await authedSend(friend.cookie)("POST", `/api/shops/${w.shops.cafe}/place`, { item: "a-2", client: friend.id, helperName: "x".repeat(13) });
  expect(notTooLong.status).toBe(200);
  const tooLong = await authedSend(friend.cookie)("POST", `/api/shops/${w.shops.cafe}/place`, { item: "a-3", client: friend.id, helperName: "x".repeat(25) });
  expect(tooLong.status).toBe(400);
});

it("a friend whose username is longer than the old 12-char town-name cap can still place (regression)", async () => {
  // Regression test for a bug where helperName validation reused NAME_MAX (12, meant for
  // town names) instead of a username-sized cap, so any friend with a longer username got
  // a silent bad_helper_name on every place attempt.
  const w = await newWorld();
  // a random username padded to 17 chars: >12 (old, wrong cap), <=24 (USERNAME_RE max)
  const longUsername = `alice_${Math.random().toString(36).slice(2, 13)}`;
  const friend = await register(longUsername);
  await makeFriends(w.owner, friend);
  const r = await authedSend(friend.cookie)("POST", `/api/shops/${w.shops.cafe}/place`, {
    item: "a-long-username",
    client: friend.id,
    helperName: friend.username,
  });
  expect(r.status).toBe(200);
  const o = await (await authed(w.owner.cookie)(`/api/worlds/${w.world}`)).json();
  expect(o.helpers).toEqual([{ name: longUsername, count: 1 }]);
});

it("a friend who switches to anonymous sends an empty helperName and is no longer named", async () => {
  const w = await newWorld();
  const friend = await register();
  await makeFriends(w.owner, friend);
  await authedSend(friend.cookie)("POST", `/api/shops/${w.shops.cafe}/place`, { item: "a-1", client: friend.id, helperName: "阿明" });
  const p = await authedSend(friend.cookie)("POST", `/api/shops/${w.shops.cafe}/place`, { item: "a-2", client: friend.id, helperName: "" });
  expect(p.status).toBe(200);
  const o = await (await authed(w.owner.cookie)(`/api/worlds/${w.world}`)).json();
  expect(o.helpers.some((h: { name: string }) => h.name === "阿明")).toBe(false);
});

it("the owner can't clear the town's name: a blank name is refused", async () => {
  const w = await newWorld();
  await authedSend(w.owner.cookie)("PUT", `/api/worlds/${w.world}/name`, { name: "Jiayi" });
  const r = await authedSend(w.owner.cookie)("PUT", `/api/worlds/${w.world}/name`, { name: "   " });
  expect(r.status).toBe(400);
  expect((await r.json()).error).toBe("empty");
  expect((await (await authed(w.owner.cookie)(`/api/worlds/${w.world}`)).json()).ownerName).toBe("Jiayi");
});
