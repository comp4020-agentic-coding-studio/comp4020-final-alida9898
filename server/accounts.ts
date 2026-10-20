// Account/session/friends HTTP handlers: /api/auth/* and /api/friends/*.
// Crit 10 replaces the owner/guest token-link identity model with real accounts
// (server/auth.ts does the hashing/cookie mechanics; server/db.ts has the schema).
import type { IncomingMessage, ServerResponse } from "node:http";
import {
  acceptFriendRequest,
  createAccount,
  createSession,
  deleteSession,
  friendStatus,
  getAccountByUsername,
  getAccountById,
  getOrCreateWorldForAccount,
  isValidUsername,
  listFriends,
  listIncomingRequests,
  listOutgoingRequests,
  logEvent,
  removeFriendLink,
  sendFriendRequest,
  sessionAccount,
  type Account,
} from "./db.ts";
import { hashPassword, newSessionToken, parseCookies, sessionExpiry, setSessionCookie, clearSessionCookie, verifyPassword, SESSION_COOKIE } from "./auth.ts";

const log = (msg: string) => console.log(`[account] ${msg}`);
const PASSWORD_MIN = 8;

// Live friend-change notifications: account id -> open SSE responses (one per tab). In memory only.
const friendStreams = new Map<string, Set<ServerResponse>>();

/** Tell every open /api/friends/stream of these accounts to re-fetch GET /api/friends. */
export function notifyFriends(...accountIds: string[]) {
  for (const id of new Set(accountIds)) {
    for (const res of friendStreams.get(id) ?? []) res.write("event: friends\ndata: {}\n\n");
  }
}

type Json = (res: ServerResponse, status: number, body: unknown) => void;
type Body = (req: IncomingMessage) => Promise<Record<string, unknown>>;

/** The logged-in account for this request, from its session cookie, or undefined. */
export function currentAccount(req: IncomingMessage): Account | undefined {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return undefined;
  return sessionAccount(token);
}

function publicAccount(a: Account) {
  return { id: a.id, username: a.username };
}

export async function handleAccounts(req: IncomingMessage, res: ServerResponse, p: string, url: URL, json: Json, body: Body): Promise<boolean> {
  if (p === "/api/auth/register" && req.method === "POST") {
    const { username, password } = await body(req);
    if (!isValidUsername(username)) return json(res, 400, { error: "bad_username" }), true;
    if (typeof password !== "string" || password.length < PASSWORD_MIN) return json(res, 400, { error: "bad_password" }), true;
    const acct = createAccount(username, hashPassword(password));
    if ("error" in acct) {
      logEvent({ action: "register", result: "taken", detail: username });
      return json(res, 409, { error: "taken" }), true;
    }
    const token = newSessionToken();
    createSession(acct.id, token, sessionExpiry());
    setSessionCookie(res, token);
    logEvent({ accountId: acct.id, action: "register", result: "ok", detail: username });
    log(`registered ${username} (${acct.id})`);
    json(res, 200, { account: publicAccount(acct) });
    return true;
  }
  if (p === "/api/auth/login" && req.method === "POST") {
    const { username, password } = await body(req);
    if (typeof username !== "string" || typeof password !== "string") return json(res, 400, { error: "bad_request" }), true;
    const acct = getAccountByUsername(username);
    if (!acct || !verifyPassword(password, acct.password_hash)) {
      logEvent({ action: "login", result: "bad_credentials", detail: username });
      log(`login ${username} -> bad credentials`);
      return json(res, 401, { error: "bad_credentials" }), true;
    }
    const token = newSessionToken();
    createSession(acct.id, token, sessionExpiry());
    setSessionCookie(res, token);
    logEvent({ accountId: acct.id, action: "login", result: "ok" });
    log(`login ${username} (${acct.id}) ok`);
    json(res, 200, { account: publicAccount(acct) });
    return true;
  }
  if (p === "/api/auth/logout" && req.method === "POST") {
    const token = parseCookies(req)[SESSION_COOKIE];
    if (token) deleteSession(token);
    clearSessionCookie(res);
    json(res, 200, { ok: true });
    return true;
  }
  if (p === "/api/auth/me" && req.method === "GET") {
    const acct = currentAccount(req);
    if (!acct) return json(res, 200, { account: null }), true;
    const { world } = getOrCreateWorldForAccount(acct.id);
    json(res, 200, { account: publicAccount(acct), world });
    return true;
  }

  // ---- friends: mutual consent. Sending to someone who already sent to you auto-accepts. ----
  if (p === "/api/friends" && req.method === "GET") {
    const acct = currentAccount(req);
    if (!acct) return json(res, 401, { error: "forbidden" }), true;
    json(res, 200, {
      friends: listFriends(acct.id),
      incoming: listIncomingRequests(acct.id),
      outgoing: listOutgoingRequests(acct.id),
    });
    return true;
  }
  if (p === "/api/friends/stream" && req.method === "GET") {
    const acct = currentAccount(req);
    if (!acct) return json(res, 401, { error: "forbidden" }), true;
    res.writeHead(200, { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache, no-transform", connection: "keep-alive", "x-accel-buffering": "no" });
    let set = friendStreams.get(acct.id);
    if (!set) friendStreams.set(acct.id, (set = new Set()));
    set.add(res);
    res.write(": connected\n\n");
    log(`${acct.username} friends stream open (${set.size})`);
    const ping = setInterval(() => res.write(": ping\n\n"), 20_000);
    req.on("close", () => {
      clearInterval(ping);
      set.delete(res);
      if (!set.size) friendStreams.delete(acct.id);
      log(`${acct.username} friends stream closed`);
    });
    return true;
  }
  if (p === "/api/friends/request" && req.method === "POST") {
    const acct = currentAccount(req);
    if (!acct) return json(res, 401, { error: "forbidden" }), true;
    const { username } = await body(req);
    if (typeof username !== "string") return json(res, 400, { error: "bad_username" }), true;
    const target = getAccountByUsername(username);
    if (!target) return json(res, 404, { error: "unknown_user" }), true;
    const r = sendFriendRequest(acct.id, target.id);
    if (!r.ok) {
      log(`${acct.username} -> ${username} friend request: ${r.reason}`);
      return json(res, 409, { error: r.reason }), true;
    }
    logEvent({ accountId: acct.id, action: "friend_request_sent", result: r.status, detail: target.id });
    log(`${acct.username} -> ${username} friend request: ${r.status}`);
    notifyFriends(acct.id, target.id);
    json(res, 200, { status: r.status });
    return true;
  }
  let m: RegExpMatchArray | null;
  if ((m = p.match(/^\/api\/friends\/([\w-]+)\/accept$/)) && req.method === "POST") {
    const acct = currentAccount(req);
    if (!acct) return json(res, 401, { error: "forbidden" }), true;
    const ok = acceptFriendRequest(acct.id, m[1]);
    if (!ok) return json(res, 404, { error: "no_such_request" }), true;
    logEvent({ accountId: acct.id, action: "friend_request_accepted", result: "ok", detail: m[1] });
    log(`${acct.id} accepted friend request from ${m[1]}`);
    notifyFriends(acct.id, m[1]);
    json(res, 200, { ok: true });
    return true;
  }
  if ((m = p.match(/^\/api\/friends\/([\w-]+)$/)) && req.method === "DELETE") {
    const acct = currentAccount(req);
    if (!acct) return json(res, 401, { error: "forbidden" }), true;
    removeFriendLink(acct.id, m[1]);
    logEvent({ accountId: acct.id, action: "friend_removed", result: "ok", detail: m[1] });
    notifyFriends(acct.id, m[1]);
    json(res, 200, { ok: true });
    return true;
  }
  if ((m = p.match(/^\/api\/friends\/([\w-]+)\/status$/)) && req.method === "GET") {
    const acct = currentAccount(req);
    if (!acct) return json(res, 401, { error: "forbidden" }), true;
    const other = getAccountById(m[1]);
    if (!other) return json(res, 404, { error: "unknown_user" }), true;
    json(res, 200, { status: friendStatus(acct.id, other.id) });
    return true;
  }
  return false;
}
