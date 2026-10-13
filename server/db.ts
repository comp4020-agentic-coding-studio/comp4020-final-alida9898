import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { randomBytes } from "node:crypto";

export type Side = "left" | "right";
export type Half = { token: string; room: string; side: Side; placed: string[] };

const dir = process.env.DATA_DIR ?? "/data";
mkdirSync(dir, { recursive: true });
const db = new DatabaseSync(`${dir}/app.db`);
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS halves (
    token TEXT PRIMARY KEY,
    room TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('left', 'right')),
    placed TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (room, side)
  );
`);

const id = (bytes: number) => randomBytes(bytes).toString("base64url");
const row = (r: { token: string; room: string; side: Side; placed: string }): Half => ({
  token: r.token,
  room: r.room,
  side: r.side,
  placed: JSON.parse(r.placed),
});

export function join(): Half & { opened: boolean } {
  db.exec("BEGIN IMMEDIATE");
  try {
    const open = db
      .prepare(
        `SELECT room, side FROM halves GROUP BY room HAVING count(*) = 1 ORDER BY min(created_at) LIMIT 1`,
      )
      .get() as { room: string; side: Side } | undefined;
    const room = open?.room ?? id(6);
    const side: Side = open ? (open.side === "left" ? "right" : "left") : Math.random() < 0.5 ? "left" : "right";
    const token = id(12);
    db.prepare("INSERT INTO halves (token, room, side) VALUES (?, ?, ?)").run(token, room, side);
    db.exec("COMMIT");
    return { token, room, side, placed: [], opened: !open };
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

export function half(token: string): Half | undefined {
  const r = db.prepare("SELECT token, room, side, placed FROM halves WHERE token = ?").get(token) as
    | { token: string; room: string; side: Side; placed: string }
    | undefined;
  return r && row(r);
}

export function roomStatus(room: string): { exists: boolean; full: boolean } {
  const rows = db.prepare("SELECT side FROM halves WHERE room = ?").all(room) as { side: Side }[];
  return { exists: rows.length > 0, full: rows.length >= 2 };
}

// Both halves' progress, for the finished-house view; a missing half is just empty.
export function roomHalves(room: string): { left: string[]; right: string[] } | undefined {
  const rows = db.prepare("SELECT side, placed FROM halves WHERE room = ?").all(room) as { side: Side; placed: string }[];
  if (!rows.length) return undefined;
  const out = { left: [] as string[], right: [] as string[] };
  for (const r of rows) out[r.side] = JSON.parse(r.placed);
  return out;
}

// Lets a specific invite link join the room it names, instead of the random
// matchmaking in join() — so you can bring a specific person in rather than
// whoever else happens to be waiting.
export function joinRoom(room: string): (Half & { opened: boolean }) | { error: "not_found" | "full" } {
  db.exec("BEGIN IMMEDIATE");
  try {
    const rows = db.prepare("SELECT side FROM halves WHERE room = ?").all(room) as { side: Side }[];
    if (rows.length === 0) {
      db.exec("ROLLBACK");
      return { error: "not_found" };
    }
    if (rows.length >= 2) {
      db.exec("ROLLBACK");
      return { error: "full" };
    }
    const side: Side = rows[0].side === "left" ? "right" : "left";
    const token = id(12);
    db.prepare("INSERT INTO halves (token, room, side) VALUES (?, ?, ?)").run(token, room, side);
    db.exec("COMMIT");
    return { token, room, side, placed: [], opened: false };
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

// Stickers can be placed in any order (no forced sequence) — this just marks
// one as done. Placing the same id twice is a harmless no-op, so a retried
// request can't double-count or error.
export function place(token: string, stickerId: string): string[] | undefined {
  const h = half(token);
  if (!h) return undefined;
  if (h.placed.includes(stickerId)) return h.placed;
  const placed = [...h.placed, stickerId];
  db.prepare("UPDATE halves SET placed = ? WHERE token = ?").run(JSON.stringify(placed), token);
  return placed;
}

// ---- shared shops: one café built together by everyone holding the link ----
// shop_items' primary key makes "first drop wins" atomic: INSERT OR IGNORE.
db.exec(`
  CREATE TABLE IF NOT EXISTS shops (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now'))
  );
  CREATE TABLE IF NOT EXISTS shop_items (
    shop TEXT NOT NULL REFERENCES shops(id),
    item TEXT NOT NULL,
    by TEXT NOT NULL,
    placed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    seq INTEGER NOT NULL,
    PRIMARY KEY (shop, item)
  );
`);

export const SHOP_CAP = 300;
export const ITEM_RE = /^[a-z0-9-]{1,64}$/;

export function createShop(): string {
  const shop = id(9);
  db.prepare("INSERT INTO shops (id) VALUES (?)").run(shop);
  return shop;
}

export function getShop(shop: string): { shop: string; placed: string[] } | undefined {
  if (!db.prepare("SELECT 1 FROM shops WHERE id = ?").get(shop)) return undefined;
  const rows = db.prepare("SELECT item FROM shop_items WHERE shop = ? ORDER BY seq").all(shop) as { item: string }[];
  return { shop, placed: rows.map((r) => r.item) };
}

export type PlaceResult = { ok: true } | { ok: false; reason: "taken" | "unknown_shop" | "bad_item" | "full" };

export function placeItem(shop: string, item: string, by: string): PlaceResult {
  if (!ITEM_RE.test(item)) return { ok: false, reason: "bad_item" };
  db.exec("BEGIN IMMEDIATE");
  try {
    const done = (r: PlaceResult) => (db.exec(r.ok ? "COMMIT" : "ROLLBACK"), r);
    if (!db.prepare("SELECT 1 FROM shops WHERE id = ?").get(shop)) return done({ ok: false, reason: "unknown_shop" });
    const { n } = db.prepare("SELECT count(*) AS n FROM shop_items WHERE shop = ?").get(shop) as { n: number };
    if (db.prepare("SELECT 1 FROM shop_items WHERE shop = ? AND item = ?").get(shop, item)) return done({ ok: false, reason: "taken" });
    if (n >= SHOP_CAP) return done({ ok: false, reason: "full" });
    const r = db.prepare("INSERT OR IGNORE INTO shop_items (shop, item, by, seq) VALUES (?, ?, ?, ?)").run(shop, item, by, n);
    return done(r.changes ? { ok: true } : { ok: false, reason: "taken" });
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

// Random match: the newest not-full shop among `candidates` (shops with exactly
// one visitor present right now, known only to the server's memory), else new.
export function openShop(candidates: string[]): { shop: string; opened: boolean } {
  if (candidates.length) {
    const marks = candidates.map(() => "?").join(",");
    const r = db
      .prepare(
        `SELECT s.id FROM shops s WHERE s.id IN (${marks})
         AND (SELECT count(*) FROM shop_items i WHERE i.shop = s.id) < ${SHOP_CAP}
         ORDER BY s.created_at DESC LIMIT 1`,
      )
      .get(...candidates) as { id: string } | undefined;
    if (r) return { shop: r.id, opened: false };
  }
  return { shop: createShop(), opened: true };
}

// ---- personal worlds: a town per person, with guest helpers and daily quotas ----
// Additive only: shops gains nullable world/type columns (legacy shops keep NULL
// and the old open rules); helps is the per-day ledger for guest quotas.
db.exec(`
  CREATE TABLE IF NOT EXISTS worlds (
    id TEXT PRIMARY KEY,
    owner_token TEXT NOT NULL UNIQUE,
    guest_token TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now'))
  );
  CREATE TABLE IF NOT EXISTS helps (
    helper TEXT NOT NULL,
    world TEXT NOT NULL REFERENCES worlds(id),
    day TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (helper, world, day)
  );
`);
{
  const cols = new Set((db.prepare("PRAGMA table_info(shops)").all() as { name: string }[]).map((c) => c.name));
  if (!cols.has("world")) db.exec("ALTER TABLE shops ADD COLUMN world TEXT REFERENCES worlds(id)");
  if (!cols.has("type")) db.exec("ALTER TABLE shops ADD COLUMN type TEXT");
}

export const SHOP_TYPES = ["cafe", "flower", "book", "bakery"] as const;
export type ShopType = (typeof SHOP_TYPES)[number];
export const GUEST_ITEMS_PER_DAY = 8;
export const GUEST_WORLDS_PER_DAY = 3;

export type WorldRow = { id: string; owner_token: string; guest_token: string };

export function createWorld(): { world: string; owner: string; guest: string; shops: Record<ShopType, string> } {
  const world = id(9), owner = id(18), guest = id(18);
  const shops = {} as Record<ShopType, string>;
  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare("INSERT INTO worlds (id, owner_token, guest_token) VALUES (?, ?, ?)").run(world, owner, guest);
    for (const type of SHOP_TYPES) {
      shops[type] = id(9);
      db.prepare("INSERT INTO shops (id, world, type) VALUES (?, ?, ?)").run(shops[type], world, type);
    }
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
  return { world, owner, guest, shops };
}

export function getWorld(world: string): WorldRow | undefined {
  return db.prepare("SELECT id, owner_token, guest_token FROM worlds WHERE id = ?").get(world) as WorldRow | undefined;
}

export function worldShops(world: string): { type: string; shop: string; placed: number }[] {
  const rows = db
    .prepare(
      `SELECT s.type, s.id AS shop, (SELECT count(*) FROM shop_items i WHERE i.shop = s.id) AS placed
       FROM shops s WHERE s.world = ?`,
    )
    .all(world) as { type: string; shop: string; placed: number }[];
  return SHOP_TYPES.flatMap((t) => rows.filter((r) => r.type === t)).map((r) => ({ ...r }));
}

// Which world (if any) a shop belongs to.
export function shopWorld(shop: string): { world: string; type: string } | undefined {
  const r = db.prepare("SELECT world, type FROM shops WHERE id = ? AND world IS NOT NULL").get(shop) as
    | { world: string; type: string }
    | undefined;
  return r;
}

export function worldShopOfType(world: string, type: string): string | undefined {
  return (db.prepare("SELECT id FROM shops WHERE world = ? AND type = ?").get(world, type) as { id: string } | undefined)?.id;
}

export type Quota = { left: number; worldsLeft: number };

// What a helper has left today: items in this world, and new worlds they could still start helping.
export function quota(helper: string, world: string, day: string): Quota {
  const rows = db.prepare("SELECT world, count FROM helps WHERE helper = ? AND day = ? AND count > 0").all(helper, day) as {
    world: string;
    count: number;
  }[];
  const here = rows.find((r) => r.world === world)?.count ?? 0;
  const others = rows.filter((r) => r.world !== world).length;
  const helpingHere = here > 0;
  const worldsUsed = others + (helpingHere ? 1 : 0);
  // a 4th world can't be started; one already started is still open
  const canHelpHere = helpingHere || others < GUEST_WORLDS_PER_DAY;
  return { left: canHelpHere ? GUEST_ITEMS_PER_DAY - here : 0, worldsLeft: Math.max(0, GUEST_WORLDS_PER_DAY - worldsUsed) };
}

export type GuestPlaceResult = PlaceResult | { ok: false; reason: "quota_today" | "too_many_worlds" };

// Guest placement: quota check, insert and ledger bump in one transaction, so a
// taken/full item never consumes quota and two tabs can't overspend.
export function placeAsGuest(shop: string, world: string, item: string, helper: string, day: string): GuestPlaceResult {
  if (!ITEM_RE.test(item)) return { ok: false, reason: "bad_item" };
  db.exec("BEGIN IMMEDIATE");
  try {
    const done = (r: GuestPlaceResult) => (db.exec(r.ok ? "COMMIT" : "ROLLBACK"), r);
    const { n } = db.prepare("SELECT count(*) AS n FROM shop_items WHERE shop = ?").get(shop) as { n: number };
    if (db.prepare("SELECT 1 FROM shop_items WHERE shop = ? AND item = ?").get(shop, item)) return done({ ok: false, reason: "taken" });
    if (n >= SHOP_CAP) return done({ ok: false, reason: "full" });
    const q = quota(helper, world, day);
    const helpingHere = !!db.prepare("SELECT 1 FROM helps WHERE helper = ? AND world = ? AND day = ? AND count > 0").get(helper, world, day);
    if (!helpingHere && q.worldsLeft === 0) return done({ ok: false, reason: "too_many_worlds" });
    if (q.left <= 0) return done({ ok: false, reason: "quota_today" });
    db.prepare("INSERT INTO shop_items (shop, item, by, seq) VALUES (?, ?, ?, ?)").run(shop, item, helper, n);
    db.prepare(
      `INSERT INTO helps (helper, world, day, count) VALUES (?, ?, ?, 1)
       ON CONFLICT (helper, world, day) DO UPDATE SET count = count + 1`,
    ).run(helper, world, day);
    return done({ ok: true });
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
