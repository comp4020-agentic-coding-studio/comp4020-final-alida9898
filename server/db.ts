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

// ---- accounts, sessions, friends, events (crit 10: real accounts replace token links) ----
db.exec(`
  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now'))
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    expires_at TEXT NOT NULL
  );
  -- one row per (from, to) pair; status flips to 'accepted' once "to" accepts.
  -- friendship is symmetric: isFriend checks both directions for 'accepted'.
  CREATE TABLE IF NOT EXISTS friend_requests (
    from_account TEXT NOT NULL REFERENCES accounts(id),
    to_account TEXT NOT NULL REFERENCES accounts(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    PRIMARY KEY (from_account, to_account)
  );
  -- persistent log: survives past what console.log/flyctl logs can show.
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    account_id TEXT,
    world TEXT,
    action TEXT NOT NULL,
    result TEXT NOT NULL,
    detail TEXT
  );
`);

export type Account = { id: string; username: string; password_hash: string };

const USERNAME_RE = /^[a-zA-Z0-9_-]{3,24}$/;
export const isValidUsername = (s: unknown): s is string => typeof s === "string" && USERNAME_RE.test(s);

export function createAccount(username: string, passwordHash: string): Account | { error: "taken" } {
  const acctId = id(12);
  try {
    db.prepare("INSERT INTO accounts (id, username, password_hash) VALUES (?, ?, ?)").run(acctId, username, passwordHash);
  } catch {
    return { error: "taken" };
  }
  return { id: acctId, username, password_hash: passwordHash };
}

export function getAccountByUsername(username: string): Account | undefined {
  return db.prepare("SELECT id, username, password_hash FROM accounts WHERE username = ?").get(username) as Account | undefined;
}

export function getAccountById(accountId: string): Account | undefined {
  return db.prepare("SELECT id, username, password_hash FROM accounts WHERE id = ?").get(accountId) as Account | undefined;
}

export function createSession(accountId: string, token: string, expiresAt: string) {
  db.prepare("INSERT INTO sessions (token, account_id, expires_at) VALUES (?, ?, ?)").run(token, accountId, expiresAt);
}

// Returns the account for a still-valid session token, or undefined (missing/expired).
export function sessionAccount(token: string): Account | undefined {
  const row = db
    .prepare(
      `SELECT a.id, a.username, a.password_hash FROM sessions s JOIN accounts a ON a.id = s.account_id
       WHERE s.token = ? AND s.expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
    )
    .get(token) as Account | undefined;
  return row;
}

export function deleteSession(token: string) {
  db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

export type FriendStatus = "none" | "pending_out" | "pending_in" | "friends";

// The relationship from `me`'s point of view looking at `other`.
export function friendStatus(me: string, other: string): FriendStatus {
  if (me === other) return "friends";
  const out = db.prepare("SELECT status FROM friend_requests WHERE from_account = ? AND to_account = ?").get(me, other) as
    | { status: string }
    | undefined;
  if (out?.status === "accepted") return "friends";
  const inc = db.prepare("SELECT status FROM friend_requests WHERE from_account = ? AND to_account = ?").get(other, me) as
    | { status: string }
    | undefined;
  if (inc?.status === "accepted") return "friends";
  if (out?.status === "pending") return "pending_out";
  if (inc?.status === "pending") return "pending_in";
  return "none";
}

export function areFriends(a: string, b: string): boolean {
  return a === b || friendStatus(a, b) === "friends";
}

export type FriendRequestResult = { ok: true; status: FriendStatus } | { ok: false; reason: "self" | "already" };

// Sending a request when the other side already sent one is treated as mutual
// acceptance (steam/Xbox-style), rather than leaving both stuck as "pending".
export function sendFriendRequest(from: string, to: string): FriendRequestResult {
  if (from === to) return { ok: false, reason: "self" };
  const status = friendStatus(from, to);
  if (status === "friends" || status === "pending_out") return { ok: false, reason: "already" };
  if (status === "pending_in") {
    db.prepare("UPDATE friend_requests SET status = 'accepted' WHERE from_account = ? AND to_account = ?").run(to, from);
    return { ok: true, status: "friends" };
  }
  db.prepare("INSERT INTO friend_requests (from_account, to_account, status) VALUES (?, ?, 'pending')").run(from, to);
  return { ok: true, status: "pending_out" };
}

export function acceptFriendRequest(me: string, from: string): boolean {
  const r = db.prepare("UPDATE friend_requests SET status = 'accepted' WHERE from_account = ? AND to_account = ? AND status = 'pending'").run(from, me);
  return r.changes > 0;
}

// Declines a pending incoming request, or removes an existing friendship /
// cancels an outgoing request — whichever row exists between the two.
export function removeFriendLink(me: string, other: string) {
  db.prepare("DELETE FROM friend_requests WHERE (from_account = ? AND to_account = ?) OR (from_account = ? AND to_account = ?)").run(
    me,
    other,
    other,
    me,
  );
}

export function listFriends(me: string): { id: string; username: string }[] {
  return db
    .prepare(
      `SELECT a.id, a.username FROM friend_requests f JOIN accounts a ON a.id = CASE WHEN f.from_account = ? THEN f.to_account ELSE f.from_account END
       WHERE f.status = 'accepted' AND (f.from_account = ? OR f.to_account = ?)`,
    )
    .all(me, me, me) as { id: string; username: string }[];
}

export function listIncomingRequests(me: string): { id: string; username: string }[] {
  return db
    .prepare(
      `SELECT a.id, a.username FROM friend_requests f JOIN accounts a ON a.id = f.from_account
       WHERE f.to_account = ? AND f.status = 'pending'`,
    )
    .all(me) as { id: string; username: string }[];
}

export function listOutgoingRequests(me: string): { id: string; username: string }[] {
  return db
    .prepare(
      `SELECT a.id, a.username FROM friend_requests f JOIN accounts a ON a.id = f.to_account
       WHERE f.from_account = ? AND f.status = 'pending'`,
    )
    .all(me) as { id: string; username: string }[];
}

export type LoggedEvent = { accountId?: string | null; world?: string | null; action: string; result: string; detail?: string | null };

// Second, persistent sink alongside the existing console.log() helpers in
// shops.ts/worlds.ts — this is what survives past `flyctl logs`.
export function logEvent(e: LoggedEvent) {
  db.prepare("INSERT INTO events (account_id, world, action, result, detail) VALUES (?, ?, ?, ?, ?)").run(
    e.accountId ?? null,
    e.world ?? null,
    e.action,
    e.result,
    e.detail ?? null,
  );
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

// ---- personal worlds: a town per account, with friend helpers and daily quotas ----
// Crit 10: owner_token/guest_token are gone. A world belongs to exactly one
// account (owner_account); anyone logged in may view it, but only an accepted
// friend of the owner (or the owner) may place items — see worldPermission().
// helps now keys on the *account id* of whoever helped, not a self-reported
// client string, so quota can't be reset by clearing localStorage.
db.exec(`
  CREATE TABLE IF NOT EXISTS worlds (
    id TEXT PRIMARY KEY,
    owner_account TEXT NOT NULL UNIQUE REFERENCES accounts(id),
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

export type WorldRow = { id: string; owner_account: string };

export function createWorld(ownerAccount: string): { world: string; shops: Record<ShopType, string> } {
  const world = id(9);
  const shops = {} as Record<ShopType, string>;
  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare("INSERT INTO worlds (id, owner_account) VALUES (?, ?)").run(world, ownerAccount);
    for (const type of SHOP_TYPES) {
      shops[type] = id(9);
      db.prepare("INSERT INTO shops (id, world, type) VALUES (?, ?, ?)").run(shops[type], world, type);
    }
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
  return { world, shops };
}

export function getWorld(world: string): WorldRow | undefined {
  return db.prepare("SELECT id, owner_account FROM worlds WHERE id = ?").get(world) as WorldRow | undefined;
}

// One town per account: the account's existing world, or a freshly created one.
export function getOrCreateWorldForAccount(accountId: string): { world: string; shops: Record<ShopType, string>; created: boolean } {
  const existing = db.prepare("SELECT id FROM worlds WHERE owner_account = ?").get(accountId) as { id: string } | undefined;
  if (existing) return { world: existing.id, shops: Object.fromEntries(worldShops(existing.id).map((s) => [s.type, s.shop])) as Record<ShopType, string>, created: false };
  const w = createWorld(accountId);
  return { ...w, created: true };
}

// Server-side permission: can `accountId` (possibly undefined = not logged in)
// view, or place items in, this world? The owner can always do both; any
// logged-in account may view; only an accepted friend of the owner may place.
export type WorldPermission = { view: boolean; place: boolean; isOwner: boolean };

export function worldPermission(world: WorldRow, accountId: string | undefined): WorldPermission {
  if (!accountId) return { view: false, place: false, isOwner: false };
  if (accountId === world.owner_account) return { view: true, place: true, isOwner: true };
  return { view: true, place: areFriends(accountId, world.owner_account), isOwner: false };
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

// ---- noticeboard + help requests (owner-set hints for friends; never restrict placing) ----
db.exec(`
  CREATE TABLE IF NOT EXISTS help_requests (
    shop TEXT NOT NULL REFERENCES shops(id),
    scope TEXT NOT NULL,
    id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    PRIMARY KEY (shop, scope, id)
  );
`);
{
  const cols = new Set((db.prepare("PRAGMA table_info(worlds)").all() as { name: string }[]).map((c) => c.name));
  if (!cols.has("note")) db.exec("ALTER TABLE worlds ADD COLUMN note TEXT");
}

export const NOTE_MAX = 40;
export const REQUESTS_MAX = 50;
export const REQUEST_SCOPES = ["zone", "piece", "item"] as const;
export const REQUEST_ID_RE = /^[a-z0-9-]{1,64}$/;
export type HelpRequest = { scope: string; id: string };

export function worldNote(world: string): string | null {
  return (db.prepare("SELECT note FROM worlds WHERE id = ?").get(world) as { note: string | null } | undefined)?.note ?? null;
}

export function setWorldNote(world: string, text: string): string | null {
  const note = text === "" ? null : text;
  db.prepare("UPDATE worlds SET note = ? WHERE id = ?").run(note, world);
  return note;
}

export function shopRequests(shop: string): HelpRequest[] {
  return (db.prepare("SELECT scope, id FROM help_requests WHERE shop = ? ORDER BY created_at, scope, id").all(shop) as HelpRequest[]).map(
    (r) => ({ scope: r.scope, id: r.id }),
  );
}

export function setRequest(shop: string, scope: string, id: string, on: boolean): { ok: true; requests: HelpRequest[] } | { ok: false } {
  db.exec("BEGIN IMMEDIATE");
  try {
    if (on) {
      const exists = db.prepare("SELECT 1 FROM help_requests WHERE shop = ? AND scope = ? AND id = ?").get(shop, scope, id);
      const n = (db.prepare("SELECT count(*) AS n FROM help_requests WHERE shop = ?").get(shop) as { n: number }).n;
      if (!exists && n >= REQUESTS_MAX) return db.exec("ROLLBACK"), { ok: false };
      db.prepare("INSERT OR IGNORE INTO help_requests (shop, scope, id) VALUES (?, ?, ?)").run(shop, scope, id);
    } else db.prepare("DELETE FROM help_requests WHERE shop = ? AND scope = ? AND id = ?").run(shop, scope, id);
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
  return { ok: true, requests: shopRequests(shop) };
}

// ---- names: the owner's name for the town, and names friends give themselves ----
// owner_name "" = not named yet. helper_names maps a guest's helper id to the
// name they typed, per world; shop_items.by already holds the helper id.
{
  const cols = new Set((db.prepare("PRAGMA table_info(worlds)").all() as { name: string }[]).map((c) => c.name));
  if (!cols.has("owner_name")) db.exec("ALTER TABLE worlds ADD COLUMN owner_name TEXT NOT NULL DEFAULT ''");
}
db.exec(`
  CREATE TABLE IF NOT EXISTS helper_names (
    world TEXT NOT NULL REFERENCES worlds(id),
    helper TEXT NOT NULL,
    name TEXT NOT NULL,
    PRIMARY KEY (world, helper)
  );
`);

export const NAME_MAX = 12;
// A friend's helper display name now defaults to their real account username
// (see USERNAME_RE above, max 24), so it needs its own, longer cap — don't
// reuse NAME_MAX (meant for short owner/town names) here.
export const HELPER_NAME_MAX = 24;

export function ownerName(world: string): string {
  return (db.prepare("SELECT owner_name FROM worlds WHERE id = ?").get(world) as { owner_name: string } | undefined)?.owner_name ?? "";
}

export function setOwnerName(world: string, name: string): string {
  db.prepare("UPDATE worlds SET owner_name = ? WHERE id = ?").run(name, world);
  return name;
}

export function setHelperName(world: string, helper: string, name: string) {
  if (name === "") db.prepare("DELETE FROM helper_names WHERE world = ? AND helper = ?").run(world, helper);
  else
    db.prepare(
      "INSERT INTO helper_names (world, helper, name) VALUES (?, ?, ?) ON CONFLICT (world, helper) DO UPDATE SET name = excluded.name",
    ).run(world, helper, name);
}

export function helperName(world: string, helper: string): string {
  return (db.prepare("SELECT name FROM helper_names WHERE world = ? AND helper = ?").get(world, helper) as { name: string } | undefined)?.name ?? "";
}

// Named friends who placed things in this world, most recent first (max 10).
export function worldHelpers(world: string): { name: string; count: number }[] {
  return db
    .prepare(
      `SELECT n.name AS name, count(*) AS count, max(i.placed_at) AS last
       FROM shop_items i JOIN shops s ON s.id = i.shop JOIN helper_names n ON n.world = s.world AND n.helper = i.by
       WHERE s.world = ? GROUP BY n.helper ORDER BY last DESC LIMIT 10`,
    )
    .all(world)
    .map((r) => ({ name: (r as { name: string }).name, count: Number((r as { count: number }).count) }));
}
