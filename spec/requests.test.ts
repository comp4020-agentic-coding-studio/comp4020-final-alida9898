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
const asFriend = async (w: { world: string; owner: { username: string; id: string; cookie: string } }, friend: { cookie: string; id: string; username: string }) => {
  await makeFriends(w.owner, friend);
  return (await authed(friend.cookie)(`/api/worlds/${w.world}`)).json();
};

it("the owner sets a note; a visitor reads it; empty clears", async () => {
  const w = await newWorld();
  const visitor = await register();
  expect((await (await authed(visitor.cookie)(`/api/worlds/${w.world}`)).json()).note).toBeNull();
  const r = await authedSend(w.owner.cookie)("PUT", `/api/worlds/${w.world}/note`, { text: "想请你帮我把甜点柜摆满～" });
  expect(r.status).toBe(200);
  expect((await r.json()).note).toBe("想请你帮我把甜点柜摆满～");
  expect((await (await authed(visitor.cookie)(`/api/worlds/${w.world}`)).json()).note).toBe("想请你帮我把甜点柜摆满～");
  const c = await authedSend(w.owner.cookie)("PUT", `/api/worlds/${w.world}/note`, { text: "" });
  expect((await c.json()).note).toBeNull();
  expect((await (await authed(visitor.cookie)(`/api/worlds/${w.world}`)).json()).note).toBeNull();
});

it("a note is at most 40 code points; only the owner may set it", async () => {
  const w = await newWorld();
  const put = (cookie: string, text: string) => authedSend(cookie)("PUT", `/api/worlds/${w.world}/note`, { text });
  const long = await put(w.owner.cookie, "a".repeat(41));
  expect(long.status).toBe(400);
  expect((await long.json()).error).toBe("too_long");
  expect((await put(w.owner.cookie, "甜".repeat(40))).status).toBe(200);
  expect((await put(w.owner.cookie, "甜".repeat(41))).status).toBe(400);
  const stranger = await register();
  expect((await put(stranger.cookie, "hi")).status).toBe(403);
  expect((await send("PUT", `/api/worlds/${w.world}/note`, { text: "hi" })).status).toBe(403);
});

it("the owner adds zone/piece/item requests; a friend sees them; off removes", async () => {
  const w = await newWorld();
  const friend = await register();
  const shop = w.shops.bakery;
  const req = (scope: string, id: string, on = true, cookie = w.owner.cookie) => authedSend(cookie)("POST", `/api/shops/${shop}/requests`, { scope, id, on });
  expect((await req("zone", "l0-bar")).status).toBe(200);
  expect((await req("piece", "l0-bar-pastry-case")).status).toBe(200);
  const last = await (await req("item", "l0-spring-blossom-vase")).json();
  expect(last.requests).toHaveLength(3);
  const world = await asFriend(w, friend);
  const bakery = world.shops.find((s: { type: string }) => s.type === "bakery");
  expect(bakery.requests).toContainEqual({ scope: "piece", id: "l0-bar-pastry-case" });
  expect(world.shops.find((s: { type: string }) => s.type === "cafe").requests).toEqual([]);
  expect((await (await api(`/api/shops/${shop}`)).json()).requests).toHaveLength(3);
  const off = await (await req("zone", "l0-bar", false)).json();
  expect(off.requests).not.toContainEqual({ scope: "zone", id: "l0-bar" });
  expect(off.requests).toHaveLength(2);
  // validation and auth
  expect((await req("item", "x", true, friend.cookie)).status).toBe(403);
  expect((await req("shelf", "x")).status).toBe(400);
  expect((await req("item", "Bad Id")).status).toBe(400);
  const legacy = (await (await send("POST", "/api/shops")).json()).shop;
  const nw = await authedSend(w.owner.cookie)("POST", `/api/shops/${legacy}/requests`, { scope: "item", id: "x", on: true });
  expect((await nw.json()).error).toBe("no_world");
});

it("requests are capped at 50 per shop", async () => {
  const w = await newWorld();
  const shop = w.shops.flower;
  for (let i = 0; i < 50; i++) {
    expect((await authedSend(w.owner.cookie)("POST", `/api/shops/${shop}/requests`, { scope: "item", id: `i-${i}`, on: true })).status).toBe(200);
  }
  const over = await authedSend(w.owner.cookie)("POST", `/api/shops/${shop}/requests`, { scope: "item", id: "i-50", on: true });
  expect(over.status).toBe(409);
  expect((await over.json()).error).toBe("too_many");
});

it("the shop stream gets a requests event, and every shop stream gets a note event", async () => {
  const w = await newWorld();
  const ctrl = new AbortController();
  const res = await api(`/api/shops/${w.shops.cafe}/events?client=watcher`, { signal: ctrl.signal });
  const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "";
  const waitFor = async (event: string) => {
    const deadline = Date.now() + 3000;
    for (;;) {
      const re = new RegExp(`event: ${event}\\ndata: (.*)\\n\\n`);
      const hit = buf.match(re);
      if (hit) return (buf = buf.slice(hit.index! + hit[0].length)), JSON.parse(hit[1]);
      if (Date.now() > deadline) throw new Error(`timed out waiting for ${event}`);
      const r = await Promise.race([reader.read(), new Promise<null>((ok) => setTimeout(() => ok(null), 200))]);
      if (r && !r.done) buf += r.value;
    }
  };
  await waitFor("hello");
  await authedSend(w.owner.cookie)("POST", `/api/shops/${w.shops.cafe}/requests`, { scope: "zone", id: "window", on: true });
  expect((await waitFor("requests")).requests).toEqual([{ scope: "zone", id: "window" }]);
  await authedSend(w.owner.cookie)("PUT", `/api/worlds/${w.world}/note`, { text: "hi" });
  expect((await waitFor("note")).note).toBe("hi");
  ctrl.abort();
});
