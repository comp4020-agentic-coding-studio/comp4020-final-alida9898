import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { randomBytes } from "node:crypto";

export type Side = "left" | "right";
export type Half = { token: string; room: string; side: Side; step: number };

const dir = process.env.DATA_DIR ?? "/data";
mkdirSync(dir, { recursive: true });
const db = new DatabaseSync(`${dir}/app.db`);
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS halves (
    token TEXT PRIMARY KEY,
    room TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('left', 'right')),
    step INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (room, side)
  );
`);

const id = (bytes: number) => randomBytes(bytes).toString("base64url");

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
    return { token, room, side, step: 0, opened: !open };
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

export function half(token: string): Half | undefined {
  return db.prepare("SELECT token, room, side, step FROM halves WHERE token = ?").get(token) as Half | undefined;
}

// Only the next step is accepted, so a replayed or skipped request can't corrupt progress.
export function advance(token: string, step: number, maxStep: number): boolean {
  if (step > maxStep) return false;
  return db.prepare("UPDATE halves SET step = ? WHERE token = ? AND step = ?").run(step, token, step - 1).changes === 1;
}
