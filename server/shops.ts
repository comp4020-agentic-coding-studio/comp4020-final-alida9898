import type { IncomingMessage, ServerResponse } from "node:http";
import { createShop, getShop, ITEM_RE, openShop, placeItem } from "./db.ts";

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
const broadcast = (shop: string, event: string, data: unknown) => {
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
    s ? json(res, 200, { ...s, present: present(m[1]) }) : json(res, 404, { error: "unknown_shop" });
    return true;
  }
  if ((m = p.match(/^\/api\/shops\/([\w-]+)\/place$/)) && req.method === "POST") {
    const shop = m[1];
    const { item, client } = await body(req);
    if (typeof client !== "string" || !CLIENT_RE.test(client)) return json(res, 400, { error: "bad_client" }), true;
    if (typeof item !== "string" || !ITEM_RE.test(item)) return json(res, 400, { error: "bad_item" }), true;
    const r = placeItem(shop, item, client);
    if (r.ok) {
      log(`${shop} place ${item} by ${client} ok`);
      room(shop).holds.get(client)?.delete(item);
      broadcast(shop, "placed", { item, client });
      json(res, 200, { placed: true });
    } else {
      log(`${shop} place ${item} by ${client} -> ${r.reason}`);
      const status = { unknown_shop: 404, bad_item: 400, taken: 409, full: 409 }[r.reason];
      json(res, status, { error: r.reason });
    }
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
