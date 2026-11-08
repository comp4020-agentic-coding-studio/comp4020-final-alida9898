import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { expect, inject, it } from "vitest";

const baseUrl = inject("baseUrl");
const api = (path: string, init?: RequestInit) => fetch(new URL(path, baseUrl), init);
const post = (path: string, body?: unknown, init?: RequestInit) =>
  api(path, { ...init, method: "POST", headers: { "content-type": "application/json", ...(init?.headers ?? {}) }, body: JSON.stringify(body ?? {}) });

const uid = () => `u${Math.random().toString(36).slice(2, 10)}`;
async function register() {
  const username = uid();
  const res = await post("/api/auth/register", { username, password: "correct-horse-battery" });
  expect(res.status).toBe(200);
  const cookie = (res.headers.get("set-cookie") ?? "").split(";")[0];
  return { username, id: (await res.json()).account.id as string, cookie };
}
const authedPost = (cookie: string) => (path: string, body?: unknown) => post(path, body, { headers: { cookie } });

// ---- one fixed place per item ----

it("a placement only names the item: extra coordinates, positions or furniture ids are ignored", async () => {
  // the owner's own town shop: an account's shop is never handed to anyone else
  const owner = await register();
  const { shops } = await (await authedPost(owner.cookie)("/api/worlds")).json();
  const shop = shops.cafe as string;
  const res = await authedPost(owner.cookie)(`/api/shops/${shop}/place`, {
    item: "l0-lamp",
    client: "a",
    x: 999, y: -5, z: 3, position: [1, 2, 3], parent: "l0-stool-1", on: "l1-plant", rotation: 90,
  });
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ placed: true });
  // what the server keeps is just "this item is placed" — no client-chosen spot
  // exists to store, so the item lands at its one spot in the layout data
  expect((await (await api(`/api/shops/${shop}`, { headers: { cookie: owner.cookie } })).json()).placed).toEqual(["l0-lamp"]);
});

it("every item id appears once in a shop's layout data, so it has exactly one place", () => {
  const dirs = { cafe: "public/cafe/zones", bakery: "public/shops/bakery/zones", book: "public/shops/book/zones", flower: "public/shops/flower/zones" };
  for (const [shopType, dir] of Object.entries(dirs)) {
    const ids = readdirSync(dir)
      .filter((f) => f.endsWith(".js"))
      .flatMap((f) => [...readFileSync(join(dir, f), "utf8").matchAll(/\bid: "([a-z0-9-]+)"/g)].map((m) => m[1]));
    expect(ids.length, `${shopType} has no items`).toBeGreaterThan(0);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes, `${shopType} lists these ids more than once`).toEqual([]);
  }
});

// ---- the events table records who did what ----

// The spec talks to the app over HTTP, and the events table has no HTTP
// endpoint (it is a server-side log). So this reads the SQLite file directly,
// which only works when the app's DATA_DIR is on this machine (`pnpm dev`
// uses ./data). Against a remote/containerised app (CI, Fly) it is skipped.
const dbFile = join(process.env.DATA_DIR ?? "./data", "app.db");
it.skipIf(!existsSync(dbFile))("a friend's placement is written to the events table with that friend's account", async () => {
  const owner = await register();
  const { world, shops } = await (await authedPost(owner.cookie)("/api/worlds")).json();
  const friend = await register();
  expect((await authedPost(friend.cookie)("/api/friends/request", { username: owner.username })).status).toBe(200);
  expect((await authedPost(owner.cookie)(`/api/friends/${friend.id}/accept`)).status).toBe(200);

  const db = new DatabaseSync(dbFile, { readOnly: true });
  try {
    const count = () => (db.prepare("SELECT count(*) AS n FROM events WHERE world = ? AND action = 'place_item'").get(world) as { n: number }).n;
    const before = count();
    expect((await authedPost(friend.cookie)(`/api/shops/${shops.cafe}/place`, { item: "l0-lamp", client: "f" })).status).toBe(200);
    expect(count()).toBe(before + 1);
    const row = db.prepare("SELECT account_id, action, result, detail FROM events WHERE world = ? ORDER BY id DESC LIMIT 1").get(world);
    expect(row).toEqual({ account_id: friend.id, action: "place_item", result: "ok", detail: "l0-lamp" });
  } finally {
    db.close();
  }
});
