// Password hashing and cookie-based sessions for crit 10's account system.
// scrypt (node:crypto, no new dependency) salted per password; sessions are a
// random token stored server-side in SQLite (server/db.ts), not a signed
// cookie/JWT — simplest given the existing plain node:http + node:sqlite
// stack, and it means logout actually revokes the session immediately instead
// of just deleting a cookie the server can no longer see.
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";

const SCRYPT_KEYLEN = 64;
const SALT_BYTES = 16;

// "saltHex:hashHex" — self-contained, so verifying never needs a second lookup.
export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_BYTES);
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  let salt: Buffer, expected: Buffer;
  try {
    salt = Buffer.from(saltHex, "hex");
    expected = Buffer.from(hashHex, "hex");
  } catch {
    return false;
  }
  if (expected.length === 0) return false;
  const actual = scryptSync(password, salt, expected.length);
  return timingSafeEqual(actual, expected);
}

export const SESSION_COOKIE = "sid";
const SESSION_DAYS = 30;

export const newSessionToken = (): string => randomBytes(24).toString("base64url");
export const sessionExpiry = (now = new Date()): string => new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();

export function parseCookies(req: IncomingMessage): Record<string, string> {
  const header = req.headers.cookie ?? "";
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    if (!k) continue;
    try {
      out[k] = decodeURIComponent(part.slice(i + 1).trim());
    } catch {
      out[k] = part.slice(i + 1).trim();
    }
  }
  return out;
}

// Secure only in production: the deployed app sits behind Fly's TLS-terminating
// proxy (the browser sees https), but local dev over plain http needs the
// cookie to still work — same dev/production split as layoutEditingEnabled in main.ts.
const secureAttr = () => (process.env.NODE_ENV === "production" ? "; Secure" : "");

export function setSessionCookie(res: ServerResponse, token: string) {
  res.setHeader(
    "set-cookie",
    `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 24 * 60 * 60}${secureAttr()}`,
  );
}

export function clearSessionCookie(res: ServerResponse) {
  res.setHeader("set-cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureAttr()}`);
}
