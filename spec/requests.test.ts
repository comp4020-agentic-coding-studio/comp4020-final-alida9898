import { expect, inject, it } from "vitest";

const baseUrl = inject("baseUrl");
const api = (path: string, init?: RequestInit) => fetch(new URL(path, baseUrl), init);
const send = (method: string, path: string, body?: unknown) =>
  api(path, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body ?? {}) });
const newWorld = async () => (await (await send("POST", "/api/worlds")).json()) as {
  world: string; owner: string; guest: string; shops: Record<string, string>;
};
const asGuest = async (w: { world: string; guest: string }) =>
  (await api(`/api/worlds/${w.world}?t=${w.guest}&helper=h-req`)).json();

it("the owner sets a note; guests read it; empty clears", async () => {
  const w = await newWorld();
  expect((await asGuest(w)).note).toBeNull();
  const r = await send("PUT", `/api/worlds/${w.world}/note`, { t: w.owner, text: "想请你帮我把甜点柜摆满～" });
  expect(r.status).toBe(200);
  expect((await r.json()).note).toBe("想请你帮我把甜点柜摆满～");
  expect((await asGuest(w)).note).toBe("想请你帮我把甜点柜摆满～");
  const c = await send("PUT", `/api/worlds/${w.world}/note`, { t: w.owner, text: "" });
  expect((await c.json()).note).toBeNull();
  expect((await asGuest(w)).note).toBeNull();
});

it("a note is at most 40 code points; only the owner may set it", async () => {
  const w = await newWorld();
  const put = (t: string, text: string) => send("PUT", `/api/worlds/${w.world}/note`, { t, text });
  const long = await put(w.owner, "a".repeat(41));
  expect(long.status).toBe(400);
  expect((await long.json()).error).toBe("too_long");
  expect((await put(w.owner, "甜".repeat(40))).status).toBe(200);
  expect((await put(w.owner, "甜".repeat(41))).status).toBe(400);
  expect((await put(w.guest, "hi")).status).toBe(403);
  expect((await put("nope", "hi")).status).toBe(403);
});

it("the owner adds zone/piece/item requests; everyone sees them; off removes", async () => {
  const w = await newWorld();
  const shop = w.shops.bakery;
  const req = (scope: string, id: string, on = true, t = w.owner) => send("POST", `/api/shops/${shop}/requests`, { t, scope, id, on });
  expect((await req("zone", "l0-bar")).status).toBe(200);
  expect((await req("piece", "l0-bar-pastry-case")).status).toBe(200);
  const last = await (await req("item", "l0-spring-blossom-vase")).json();
  expect(last.requests).toHaveLength(3);
  const world = await asGuest(w);
  const bakery = world.shops.find((s: { type: string }) => s.type === "bakery");
  expect(bakery.requests).toContainEqual({ scope: "piece", id: "l0-bar-pastry-case" });
  expect(world.shops.find((s: { type: string }) => s.type === "cafe").requests).toEqual([]);
  expect((await (await api(`/api/shops/${shop}`)).json()).requests).toHaveLength(3);
  const off = await (await req("zone", "l0-bar", false)).json();
  expect(off.requests).not.toContainEqual({ scope: "zone", id: "l0-bar" });
  expect(off.requests).toHaveLength(2);
  // validation and auth
  expect((await req("item", "x", true, w.guest)).status).toBe(403);
  expect((await req("shelf", "x")).status).toBe(400);
  expect((await req("item", "Bad Id")).status).toBe(400);
  const legacy = (await (await send("POST", "/api/shops")).json()).shop;
  const nw = await send("POST", `/api/shops/${legacy}/requests`, { t: w.owner, scope: "item", id: "x", on: true });
  expect((await nw.json()).error).toBe("no_world");
});

it("requests are capped at 50 per shop", async () => {
  const w = await newWorld();
  const shop = w.shops.flower;
  for (let i = 0; i < 50; i++) {
    expect((await send("POST", `/api/shops/${shop}/requests`, { t: w.owner, scope: "item", id: `i-${i}`, on: true })).status).toBe(200);
  }
  const over = await send("POST", `/api/shops/${shop}/requests`, { t: w.owner, scope: "item", id: "i-50", on: true });
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
  await send("POST", `/api/shops/${w.shops.cafe}/requests`, { t: w.owner, scope: "zone", id: "window", on: true });
  expect((await waitFor("requests")).requests).toEqual([{ scope: "zone", id: "window" }]);
  await send("PUT", `/api/worlds/${w.world}/note`, { t: w.owner, text: "hi" });
  expect((await waitFor("note")).note).toBe("hi");
  ctrl.abort();
});
