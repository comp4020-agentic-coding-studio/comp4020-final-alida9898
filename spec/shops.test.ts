import { expect, inject, it } from "vitest";

const baseUrl = inject("baseUrl");
const api = (path: string, init?: RequestInit) => fetch(new URL(path, baseUrl), init);
const post = (path: string, body?: unknown) =>
  api(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body ?? {}) });
const newShop = async (): Promise<string> => (await (await post("/api/shops")).json()).shop;

// Opens an SSE stream and lets a test wait for the next event matching a predicate.
async function stream(shop: string, client: string) {
  const ctrl = new AbortController();
  const res = await api(`/api/shops/${shop}/events?client=${client}`, { signal: ctrl.signal });
  expect(res.headers.get("content-type")).toContain("text/event-stream");
  const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "";
  const queue: { event: string; data: any }[] = [];
  async function next(pred: (e: { event: string; data: any }) => boolean, ms = 3000) {
    const deadline = Date.now() + ms;
    for (;;) {
      const i = queue.findIndex(pred);
      if (i >= 0) return queue.splice(0, i + 1)[i];
      const left = deadline - Date.now();
      if (left <= 0) throw new Error("timed out waiting for event");
      const r = await Promise.race([reader.read(), new Promise<null>((ok) => setTimeout(() => ok(null), left))]);
      if (!r || r.done) continue;
      buf += r.value;
      let cut;
      while ((cut = buf.indexOf("\n\n")) >= 0) {
        const block = buf.slice(0, cut);
        buf = buf.slice(cut + 2);
        const ev = block.match(/^event: (.*)$/m)?.[1];
        const data = block.match(/^data: (.*)$/m)?.[1];
        if (ev && data) queue.push({ event: ev, data: JSON.parse(data) });
      }
    }
  }
  return { next, close: () => ctrl.abort() };
}

it("a new shop starts empty", async () => {
  const shop = await newShop();
  expect(await (await api(`/api/shops/${shop}`)).json()).toEqual({ shop, placed: [], present: 0 });
});

it("placed items persist, in order", async () => {
  const shop = await newShop();
  expect((await post(`/api/shops/${shop}/place`, { item: "l0-bar-counter", client: "a" })).status).toBe(200);
  expect((await post(`/api/shops/${shop}/place`, { item: "l0-stool-1", client: "b" })).status).toBe(200);
  expect((await (await api(`/api/shops/${shop}`)).json()).placed).toEqual(["l0-bar-counter", "l0-stool-1"]);
});

it("the first drop wins: placing an item twice is a 409 and it's listed once", async () => {
  const shop = await newShop();
  await post(`/api/shops/${shop}/place`, { item: "l0-lamp", client: "a" });
  const second = await post(`/api/shops/${shop}/place`, { item: "l0-lamp", client: "b" });
  expect(second.status).toBe(409);
  expect(await second.json()).toEqual({ error: "taken" });
  expect((await (await api(`/api/shops/${shop}`)).json()).placed).toEqual(["l0-lamp"]);
});

it("a malformed item id is a 400", async () => {
  const shop = await newShop();
  expect((await post(`/api/shops/${shop}/place`, { item: "Not An Id!", client: "a" })).status).toBe(400);
  expect((await (await api(`/api/shops/${shop}`)).json()).placed).toEqual([]);
});

it("an unknown shop is a 404 for the API and the page", async () => {
  expect((await api("/api/shops/no-such-shop")).status).toBe(404);
  expect((await post("/api/shops/no-such-shop/place", { item: "x", client: "a" })).status).toBe(404);
  expect((await api("/shop/no-such-shop")).status).toBe(404);
});

it("a shop's link serves the play page", async () => {
  const res = await api(`/shop/${await newShop()}`);
  expect(res.status).toBe(200);
  expect(res.headers.get("content-type")).toContain("text/html");
});

it("everyone in the shop hears about a placement, and presence counts visitors", async () => {
  const shop = await newShop();
  const a = await stream(shop, "client-a");
  const b = await stream(shop, "client-b");
  try {
    expect((await a.next((e) => e.event === "hello")).data).toEqual({ placed: [], present: 1 });
    await a.next((e) => e.event === "presence" && e.data.present === 2);
    expect((await (await api(`/api/shops/${shop}`)).json()).present).toBe(2);

    await post(`/api/shops/${shop}/place`, { item: "l1-plant", client: "client-b" });
    expect((await a.next((e) => e.event === "placed")).data).toEqual({ item: "l1-plant", client: "client-b" });

    expect((await post(`/api/shops/${shop}/hold`, { item: "l1-rug", client: "client-b", holding: true })).status).toBe(204);
    expect((await a.next((e) => e.event === "hold")).data).toEqual({ item: "l1-rug", client: "client-b", holding: true });

    // leaving lets go of whatever you were holding
    b.close();
    expect((await a.next((e) => e.event === "hold")).data).toEqual({ item: "l1-rug", client: "client-b", holding: false });
    await a.next((e) => e.event === "presence" && e.data.present === 1);
  } finally {
    a.close();
    b.close();
  }
});

it("matching joins a shop where someone is waiting", async () => {
  // ours is the newest shop with exactly one visitor, so match picks it
  const shop = await newShop();
  const a = await stream(shop, "waiter");
  try {
    await a.next((e) => e.event === "hello");
    expect((await (await post("/api/shops/match")).json()).shop).toBe(shop);
  } finally {
    a.close();
  }
});
