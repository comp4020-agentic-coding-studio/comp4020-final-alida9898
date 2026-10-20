import type { IncomingMessage, ServerResponse } from "node:http";
import {
  getOrCreateWorldForAccount,
  getWorld,
  logEvent,
  NAME_MAX,
  NOTE_MAX,
  getAccountById,
  ownerName,
  setOwnerName,
  worldHelpers,
  quota,
  setWorldNote,
  shopRequests,
  worldNote,
  worldPermission,
  worldShops,
} from "./db.ts";
import { broadcast } from "./shops.ts";
import { canberraDay, currentSeason } from "./season.ts";
import { currentAccount } from "./accounts.ts";

const log = (msg: string) => console.log(`[world] ${msg}`);
const devOverrides = process.env.NODE_ENV !== "production";
// env SEASON pins the season for the whole app (dev/tests)
export const season = (queryOverride?: string | null) => currentSeason((devOverrides && queryOverride) || process.env.SEASON);

// Town pages listen here (no presence, no shop): only world-wide events like `name`.
const worldStreams = new Map<string, Set<ServerResponse>>();
const worldBroadcast = (world: string, event: string, data: unknown) => {
  for (const r of worldStreams.get(world) ?? []) r.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
};

type Json = (res: ServerResponse, status: number, body: unknown) => void;
type Body = (req: IncomingMessage) => Promise<Record<string, unknown>>;

export async function handleWorlds(req: IncomingMessage, res: ServerResponse, p: string, url: URL, json: Json, body: Body): Promise<boolean> {
  let m: RegExpMatchArray | null;
  if (p === "/api/season" && req.method === "GET") {
    json(res, 200, season(url.searchParams.get("season")));
    return true;
  }
  // Crit 10: there's one town per account, created on demand — no more a
  // standalone "create a world, remember its owner token" step. Logging in (or
  // registering) is what gets you a town; this just fetches/creates it.
  if (p === "/api/worlds" && req.method === "POST") {
    const acct = currentAccount(req);
    if (!acct) return json(res, 401, { error: "forbidden" }), true;
    const w = getOrCreateWorldForAccount(acct.id);
    if (w.created) log(`created ${w.world} for ${acct.username} (shops ${Object.entries(w.shops).map(([t, s]) => `${t}=${s}`).join(" ")})`);
    logEvent({ accountId: acct.id, world: w.world, action: "world_created_or_fetched", result: w.created ? "created" : "existing" });
    json(res, 200, { world: w.world, shops: w.shops });
    return true;
  }
  if ((m = p.match(/^\/api\/worlds\/([\w-]+)$/)) && req.method === "GET") {
    const w = getWorld(m[1]);
    if (!w) return json(res, 404, { error: "unknown_world" }), true;
    const acct = currentAccount(req);
    if (!acct) {
      log(`${w.id} visit with no session -> 401`);
      return json(res, 401, { error: "forbidden" }), true;
    }
    const perm = worldPermission(w, acct.id);
    if (!perm.view) {
      log(`${w.id} visit by ${acct.username} -> 403`);
      logEvent({ accountId: acct.id, world: w.id, action: "world_view", result: "forbidden" });
      return json(res, 403, { error: "forbidden" }), true;
    }
    const shops = worldShops(w.id).map((x) => ({ ...x, requests: shopRequests(x.shop) }));
    const note = worldNote(w.id);
    const { season: s } = season();
    const ownerUsername = getAccountById(w.owner_account)?.username ?? "";
    if (perm.isOwner) {
      logEvent({ accountId: acct.id, world: w.id, action: "world_view", result: "owner" });
      json(res, 200, { world: w.id, role: "owner", ownerName: ownerName(w.id), ownerUsername, helpers: worldHelpers(w.id), season: s, note, shops });
    } else {
      const q = perm.place ? quota(acct.id, w.id, canberraDay()) : undefined;
      log(`${w.id} visit by ${acct.username} [canPlace ${perm.place}${q ? `, left ${q.left}, worlds left ${q.worldsLeft}` : ""}]`);
      logEvent({ accountId: acct.id, world: w.id, action: "world_view", result: perm.place ? "friend" : "visitor_view_only" });
      json(res, 200, { world: w.id, role: "guest", canPlace: perm.place, ownerName: ownerName(w.id), ownerUsername, season: s, note, shops, quota: q });
    }
    return true;
  }
  if ((m = p.match(/^\/api\/worlds\/([\w-]+)\/note$/)) && req.method === "PUT") {
    const w = getWorld(m[1]);
    if (!w) return json(res, 404, { error: "unknown_world" }), true;
    const acct = currentAccount(req);
    if (!acct || acct.id !== w.owner_account) {
      log(`${w.id} note change -> forbidden`);
      logEvent({ accountId: acct?.id, world: w.id, action: "note_change", result: "forbidden" });
      return json(res, 403, { error: "forbidden" }), true;
    }
    const { text } = await body(req);
    if (typeof text !== "string") return json(res, 400, { error: "bad_text" }), true;
    const trimmed = text.trim();
    if ([...trimmed].length > NOTE_MAX) return json(res, 400, { error: "too_long" }), true;
    const note = setWorldNote(w.id, trimmed);
    log(`${w.id} note ${note === null ? "cleared" : `set (${[...note].length} chars)`}`);
    logEvent({ accountId: acct.id, world: w.id, action: "note_change", result: note === null ? "cleared" : "set" });
    for (const x of worldShops(w.id)) broadcast(x.shop, "note", { note });
    json(res, 200, { note });
    return true;
  }
  if ((m = p.match(/^\/api\/worlds\/([\w-]+)\/events$/)) && req.method === "GET") {
    const w = getWorld(m[1]);
    if (!w) return json(res, 404, { error: "unknown_world" }), true;
    res.writeHead(200, { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache, no-transform", connection: "keep-alive", "x-accel-buffering": "no" });
    let set = worldStreams.get(w.id);
    if (!set) worldStreams.set(w.id, (set = new Set()));
    set.add(res);
    res.write(`event: hello\ndata: ${JSON.stringify({ ownerName: ownerName(w.id) })}\n\n`);
    const ping = setInterval(() => res.write(": ping\n\n"), 20_000);
    req.on("close", () => {
      clearInterval(ping);
      set.delete(res);
      if (!set.size) worldStreams.delete(w.id);
    });
    return true;
  }
  if ((m = p.match(/^\/api\/worlds\/([\w-]+)\/name$/)) && req.method === "PUT") {
    const w = getWorld(m[1]);
    if (!w) return json(res, 404, { error: "unknown_world" }), true;
    const acct = currentAccount(req);
    if (!acct || acct.id !== w.owner_account) {
      log(`${w.id} name change -> forbidden`);
      logEvent({ accountId: acct?.id, world: w.id, action: "name_change", result: "forbidden" });
      return json(res, 403, { error: "forbidden" }), true;
    }
    const { name } = await body(req);
    if (typeof name !== "string") return json(res, 400, { error: "bad_name" }), true;
    const trimmed = name.trim();
    // the owner always has a name: it can be changed, never cleared
    if (trimmed === "") return json(res, 400, { error: "empty" }), true;
    if ([...trimmed].length > NAME_MAX) return json(res, 400, { error: "too_long" }), true;
    const newName = setOwnerName(w.id, trimmed);
    log(`${w.id} owner name set (${[...newName].length} chars)`);
    logEvent({ accountId: acct.id, world: w.id, action: "name_change", result: "ok" });
    for (const x of worldShops(w.id)) broadcast(x.shop, "name", { ownerName: newName });
    worldBroadcast(w.id, "name", { ownerName: newName });
    json(res, 200, { ownerName: newName });
    return true;
  }
  return false;
}
