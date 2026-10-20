import type { IncomingMessage, ServerResponse } from "node:http";
import { createShop, getShop, getWorld, helperName, HELPER_NAME_MAX, logEvent, setHelperName, ITEM_RE, openShop, placeAsGuest, placeItem, quota, REQUEST_ID_RE, REQUEST_SCOPES, setRequest, shopRequests, shopWorld, worldPermission, type GuestPlaceResult } from "./db.ts";
import { canberraDay } from "./season.ts";
import { currentAccount } from "./accounts.ts";

// In-memory live state per shop: open SSE streams and what each client holds.
// Not persisted — a restart just drops presence; EventSource reconnects.
type Room = { streams: Map<ServerResponse, string>; holds: Map<string, Set<string>> };
const rooms = new Map<string, Room>();
const CLIENT_RE = /^[\w-]{1,64}$/;
const log = (msg: string) => console.log(`[shop] ${msg}`);

const room = (shop: string) => {
  let r = rooms.get(shop);
  if (!r) rooms.set(shop, (r = { streams: new Map(), holds: new Map() }));
  return r;
};
const present = (shop: string) => new Set(rooms.get(shop)?.streams.values()).size;
const write = (res: ServerResponse, event: string, data: unknown) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
export const broadcast = (shop: string, event: string, data: unknown) => {
  for (const res of rooms.get(shop)?.streams.keys() ?? []) write(res, event, data);
};

type Json = (res: ServerResponse, status: number, body: unknown) => void;
type Body = (req: IncomingMessage) => Promise<Record<string, unknown>>;

export function shopExists(shop: string) {
  return !!getShop(shop);
}

// Returns true if it handled the request.
export async function handleShops(req: IncomingMessage, res: ServerResponse, p: string, url: URL, json: Json, body: Body): Promise<boolean> {
  let m: RegExpMatchArray | null;
  if (p === "/api/shops" && req.method === "POST") {
    const shop = createShop();
    log(`created ${shop}`);
    json(res, 200, { shop });
    return true;
  }
  if (p === "/api/shops/match" && req.method === "POST") {
    const waiting = [...rooms.keys()].filter((s) => present(s) === 1);
    const { shop, opened } = openShop(waiting);
    log(opened ? `match: nobody waiting, created ${shop}` : `match: joined ${shop}`);
    json(res, 200, { shop });
    return true;
  }
  if ((m = p.match(/^\/api\/shops\/([\w-]+)$/)) && req.method === "GET") {
    const s = getShop(m[1]);
    s ? json(res, 200, { ...s, ...(shopWorld(m[1]) && { requests: shopRequests(m[1]) }), present: present(m[1]) }) : json(res, 404, { error: "unknown_shop" });
    return true;
  }
  if ((m = p.match(/^\/api\/shops\/([\w-]+)\/place$/)) && req.method === "POST") {
    const shop = m[1];
    const { item, client, helperName: hn } = await body(req);
    if (typeof client !== "string" || !CLIENT_RE.test(client)) return json(res, 400, { error: "bad_client" }), true;
    if (typeof item !== "string" || !ITEM_RE.test(item)) return json(res, 400, { error: "bad_item" }), true;
    // World shops require a logged-in account that is the owner or an accepted
    // friend of the owner (server-enforced — never trust a client-sent role).
    // Legacy shops (no world) stay open to anyone with the link, as before.
    const sw = shopWorld(shop);
    let r: GuestPlaceResult;
    let who = client;
    let actingAccountId: string | undefined;
    let guest: { world: string; helper: string } | undefined;
    if (!sw) r = placeItem(shop, item, client);
    else {
      const w = getWorld(sw.world)!;
      const acct = currentAccount(req);
      if (!acct) {
        log(`${shop} (world ${sw.world}/${sw.type}) place ${item} -> forbidden (not logged in)`);
        return json(res, 403, { error: "forbidden" }), true;
      }
      actingAccountId = acct.id;
      const perm = worldPermission(w, acct.id);
      if (!perm.place) {
        log(`${shop} (world ${sw.world}/${sw.type}) place ${item} by ${acct.username} -> forbidden (not a friend)`);
        logEvent({ accountId: acct.id, world: sw.world, action: "place_item", result: "forbidden" });
        return json(res, 403, { error: "forbidden" }), true;
      }
      if (perm.isOwner) {
        who = `owner:${acct.username}`;
        r = placeItem(shop, item, acct.id);
      } else {
        if (hn !== undefined && (typeof hn !== "string" || [...hn.trim()].length > HELPER_NAME_MAX)) return json(res, 400, { error: "bad_helper_name" }), true;
        guest = { world: sw.world, helper: acct.id };
        who = `friend:${acct.username}`;
        r = placeAsGuest(shop, sw.world, item, acct.id, canberraDay());
      }
    }
    const where = sw ? `${shop} (world ${sw.world}/${sw.type})` : shop;
    const q = guest && quota(guest.helper, guest.world, canberraDay());
    const qs = q ? ` [left ${q.left}, worlds left ${q.worldsLeft}]` : "";
    if (r.ok) {
      log(`${where} place ${item} by ${who} ok${qs}`);
      if (sw) logEvent({ accountId: actingAccountId, world: sw.world, action: "place_item", result: "ok", detail: item });
      room(shop).holds.get(client)?.delete(item);
      // a friend's display name rides along so the owner sees who helped; stored per world
      if (guest && typeof hn === "string") setHelperName(guest.world, guest.helper, hn.trim());
      const by = guest ? helperName(guest.world, guest.helper) : "";
      broadcast(shop, "placed", guest ? { item, client, guest: true, helperName: by } : { item, client });
      json(res, 200, q ? { placed: true, quota: q } : { placed: true });
    } else {
      log(`${where} place ${item} by ${who} -> ${r.reason}${qs}`);
      if (sw) logEvent({ accountId: actingAccountId, world: sw.world, action: "place_item", result: r.reason, detail: item });
      const status = { unknown_shop: 404, bad_item: 400, taken: 409, full: 409, quota_today: 429, too_many_worlds: 429 }[r.reason];
      json(res, status, q && status === 429 ? { error: r.reason, quota: q } : { error: r.reason });
    }
    return true;
  }
  if ((m = p.match(/^\/api\/shops\/([\w-]+)\/requests$/)) && req.method === "POST") {
    const shop = m[1];
    const { scope, id, on } = await body(req);
    if (!getShop(shop)) return json(res, 404, { error: "unknown_shop" }), true;
    const sw = shopWorld(shop);
    if (!sw) return json(res, 400, { error: "no_world" }), true;
    const acct = currentAccount(req);
    if (!acct || acct.id !== getWorld(sw.world)!.owner_account) {
      log(`${shop} (world ${sw.world}/${sw.type}) request change -> forbidden`);
      logEvent({ accountId: acct?.id, world: sw.world, action: "request_change", result: "forbidden" });
      return json(res, 403, { error: "forbidden" }), true;
    }
    if (typeof scope !== "string" || !(REQUEST_SCOPES as readonly string[]).includes(scope)) return json(res, 400, { error: "bad_scope" }), true;
    if (typeof id !== "string" || !REQUEST_ID_RE.test(id)) return json(res, 400, { error: "bad_id" }), true;
    if (typeof on !== "boolean") return json(res, 400, { error: "bad_on" }), true;
    const r = setRequest(shop, scope, id, on);
    if (!r.ok) {
      log(`${shop} (world ${sw.world}/${sw.type}) request ${scope}:${id} on -> too_many`);
      return json(res, 409, { error: "too_many" }), true;
    }
    log(`${shop} (world ${sw.world}/${sw.type}) request ${scope}:${id} ${on ? "on" : "off"} (${r.requests.length} total)`);
    broadcast(shop, "requests", { requests: r.requests });
    json(res, 200, { requests: r.requests });
    return true;
  }
  if ((m = p.match(/^\/api\/shops\/([\w-]+)\/hold$/)) && req.method === "POST") {
    const shop = m[1];
    const { item, client, holding } = await body(req);
    if (typeof client !== "string" || !CLIENT_RE.test(client)) return json(res, 400, { error: "bad_client" }), true;
    if (typeof item !== "string" || !ITEM_RE.test(item)) return json(res, 400, { error: "bad_item" }), true;
    if (!rooms.has(shop) && !getShop(shop)) return json(res, 404, { error: "unknown_shop" }), true;
    const r = room(shop);
    const held = r.holds.get(client) ?? new Set<string>();
    holding ? held.add(item) : held.delete(item);
    r.holds.set(client, held);
    broadcast(shop, "hold", { item, client, holding: !!holding });
    res.writeHead(204).end();
    return true;
  }
  if ((m = p.match(/^\/api\/shops\/([\w-]+)\/events$/)) && req.method === "GET") {
    const shop = m[1];
    const client = url.searchParams.get("client") ?? "";
    if (!CLIENT_RE.test(client)) return json(res, 400, { error: "bad_client" }), true;
    const s = getShop(shop);
    if (!s) return json(res, 404, { error: "unknown_shop" }), true;
    res.writeHead(200, {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    });
    const r = room(shop);
    r.streams.set(res, client);
    write(res, "hello", { placed: s.placed, present: present(shop) });
    broadcast(shop, "presence", { present: present(shop) });
    log(`${shop} connect ${client} (present ${present(shop)})`);
    const ping = setInterval(() => res.write(": ping\n\n"), 20_000);
    req.on("close", () => {
      clearInterval(ping);
      r.streams.delete(res);
      const stillHere = [...r.streams.values()].includes(client);
      if (!stillHere) {
        for (const item of r.holds.get(client) ?? []) broadcast(shop, "hold", { item, client, holding: false });
        r.holds.delete(client);
      }
      broadcast(shop, "presence", { present: present(shop) });
      log(`${shop} disconnect ${client} (present ${present(shop)})`);
      if (!r.streams.size) rooms.delete(shop);
    });
    return true;
  }
  return false;
}
