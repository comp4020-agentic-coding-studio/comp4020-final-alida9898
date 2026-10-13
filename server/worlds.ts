import type { IncomingMessage, ServerResponse } from "node:http";
import { createWorld, getWorld, quota, worldShops } from "./db.ts";
import { canberraDay, currentSeason } from "./season.ts";

const log = (msg: string) => console.log(`[world] ${msg}`);
const CLIENT_RE = /^[\w-]{1,64}$/;
const devOverrides = process.env.NODE_ENV !== "production";
// env SEASON pins the season for the whole app (dev/tests)
export const season = (queryOverride?: string | null) => currentSeason((devOverrides && queryOverride) || process.env.SEASON);

type Json = (res: ServerResponse, status: number, body: unknown) => void;

export function handleWorlds(req: IncomingMessage, res: ServerResponse, p: string, url: URL, json: Json): boolean {
  let m: RegExpMatchArray | null;
  if (p === "/api/season" && req.method === "GET") {
    json(res, 200, season(url.searchParams.get("season")));
    return true;
  }
  if (p === "/api/worlds" && req.method === "POST") {
    const w = createWorld();
    log(`created ${w.world} (shops ${Object.entries(w.shops).map(([t, s]) => `${t}=${s}`).join(" ")})`);
    json(res, 200, w);
    return true;
  }
  if ((m = p.match(/^\/api\/worlds\/([\w-]+)$/)) && req.method === "GET") {
    const w = getWorld(m[1]);
    if (!w) return json(res, 404, { error: "unknown_world" }), true;
    const t = url.searchParams.get("t");
    const shops = worldShops(w.id);
    const { season: s } = season();
    if (t === w.owner_token) {
      json(res, 200, { world: w.id, role: "owner", guestToken: w.guest_token, season: s, shops });
    } else if (t === w.guest_token) {
      const helper = url.searchParams.get("helper") ?? "";
      if (!CLIENT_RE.test(helper)) return json(res, 400, { error: "bad_helper" }), true;
      const q = quota(helper, w.id, canberraDay());
      log(`${w.id} guest ${helper} visits [left ${q.left}, worlds left ${q.worldsLeft}]`);
      json(res, 200, { world: w.id, role: "guest", season: s, shops, quota: q });
    } else {
      log(`${w.id} visit with bad token -> 403`);
      json(res, 403, { error: "forbidden" });
    }
    return true;
  }
  return false;
}
