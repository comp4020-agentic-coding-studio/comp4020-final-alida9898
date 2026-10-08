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
