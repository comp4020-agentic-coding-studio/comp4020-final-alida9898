// Talking to one shared shop on the server. Contract: server/SHOPS.md.
// Placed items live on the server; presence and "holding" are live-only.

export const LAST_SHOP_KEY = "cafe-last-shop";

/** The shop id from `/shop/<id>` or `?shop=<id>`, or null. */
export function shopFromUrl(loc = location) {
  const m = loc.pathname.match(/^\/shop\/([\w-]+)\/?$/);
  if (m) return m[1];
  const q = new URLSearchParams(loc.search).get("shop");
  return q && /^[\w-]+$/.test(q) ? q : null;
}

/** `{ world, type }` from `/w/<world>/<type>`, or null. Crit 10: no more `?t=` — who
 * you are comes from the session cookie (server/accounts.ts), not a URL token. */
export function worldFromUrl(loc = location) {
  const m = loc.pathname.match(/^\/w\/([\w-]+)\/([a-z_]+)\/?$/);
  return m ? { world: m[1], type: m[2] } : null;
}

/** The shop id of a world's shop of that type (contract: server/SHOPS.md, worlds).
 * 401 (not logged in) is reported distinctly so callers can show a login prompt
 * instead of "this town doesn't exist". Throws on other trouble. */
export async function loadWorldShop({ world, type }) {
  const res = await fetch(`/api/worlds/${world}`);
  if (res.status === 401) { const e = new Error("login_required"); e.code = 401; throw e; }
  if (!res.ok) throw new Error(`world ${res.status}`);
  const data = await res.json();
  const s = (data.shops || []).find((x) => x.type === type);
  // `ownerUsername`: the owner's account username (server/worlds.ts), used to
  // prefill the "Add as friend" request; `ownerName` is the separate, free-text
  // town nickname, often blank.
  return s
    ? { shop: s.shop, role: data.role, canPlace: data.role === "owner" || !!data.canPlace, quota: data.quota || null, note: data.note ?? null, ownerName: data.ownerName || "", ownerUsername: data.ownerUsername || "", requests: s.requests || [] }
    : null;
}

/** A random id per tab, kept across reloads of that tab. */
export function clientId() {
  const make = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 20);
  try {
    let id = sessionStorage.getItem("cafe-client");
    if (!id || !/^[\w-]{1,64}$/.test(id)) { id = make(); sessionStorage.setItem("cafe-client", id); }
    return id;
  } catch { return make(); }
}

export const shopUrl = (shop) => `${location.origin}/shop/${shop}`;

/** POST /api/shops or /api/shops/match → shop id. */
export async function newShop(match = false) {
  const res = await fetch(match ? "/api/shops/match" : "/api/shops", { method: "POST" });
  if (!res.ok) throw new Error(`shop ${res.status}`);
  return (await res.json()).shop;
}

/** GET the shop: { placed, present } or null when it doesn't exist. Throws on network trouble. */
export async function loadShop(shop) {
  const res = await fetch(`/api/shops/${shop}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`load ${res.status}`);
  return res.json();
}

/**
 * Live link to a shop. `on` = { hello, placed, hold, presence } handlers.
 * place(item) resolves "ok" | "taken" | "full" | "forbidden" | "error" (network / server
 * trouble). `extra` is sent with every POST (a world shop's `{ helperName }`); a 429
 * (daily helper quota) resolves "quota", and a 403 (not logged in, or not an accepted
 * friend — server-enforced, see server/shops.ts) resolves "forbidden".
 * World shops also get `requests { requests }`, `note { note }` and `name { ownerName }`.
 * `extra` is read at each POST, so changing it (e.g. helperName) takes effect next time.
 * A guest's quota (from a 200 or a 429) is passed to `on.quota({ left, worldsLeft })`.
 */
export function connect(shop, client, on, extra = {}) {
  const base = `/api/shops/${shop}`;
  const es = new EventSource(`${base}/events?client=${encodeURIComponent(client)}`);
  for (const name of ["hello", "placed", "hold", "presence", "requests", "note", "name"]) {
    es.addEventListener(name, (e) => {
      let data;
      try { data = JSON.parse(e.data); } catch { return; }
      on[name]?.(data);
    });
  }
  const post = (path, body) => fetch(`${base}/${path}`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...extra, ...body, client }),
  });
  return {
    async place(item) {
      try {
        const res = await post("place", { item });
        if (res.ok) {
          const body = await res.json().catch(() => ({}));
          if (body.quota) on.quota?.(body.quota);
          return "ok";
        }
        if (res.status === 429) {
          const body = await res.json().catch(() => ({}));
          on.quota?.(body.quota || { left: 0, worldsLeft: 0 });
          return "quota";
        }
        if (res.status === 403) return "forbidden";
        if (res.status === 409) {
          const { error } = await res.json().catch(() => ({}));
          return error === "full" ? "full" : "taken";
        }
        return "error";
      } catch { return "error"; }
    },
    /** Owner only: ask friends to help with a part ({ scope, id, on }) → the new list, or null. */
    async setRequest(scope, id, on) {
      try {
        const res = await post("requests", { scope, id, on });
        return res.ok ? (await res.json()).requests : null;
      } catch { return null; }
    },
    hold(item, holding) { post("hold", { item, holding }).catch(() => {}); },
    close() { es.close(); },
  };
}
