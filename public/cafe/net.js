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

/** `{ world, t, type }` from `/w/<world>/<type>?t=<token>`, or null. */
export function worldFromUrl(loc = location) {
  const m = loc.pathname.match(/^\/w\/([\w-]+)\/([a-z_]+)\/?$/);
  if (!m) return null;
  const t = new URLSearchParams(loc.search).get("t") || "";
  return { world: m[1], type: m[2], t };
}

/** The shop id of a world's shop of that type (contract: server/SHOPS.md, worlds). Throws on trouble. */
export async function loadWorldShop({ world, type, t }, helper) {
  const res = await fetch(`/api/worlds/${world}?t=${encodeURIComponent(t)}&helper=${encodeURIComponent(helper)}`);
  if (!res.ok) throw new Error(`world ${res.status}`);
  const data = await res.json();
  const s = (data.shops || []).find((x) => x.type === type);
  return s ? { shop: s.shop, t, role: data.role } : null;
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
 * place(item) resolves "ok" | "taken" | "full" | "error" (network / server trouble).
 * `extra` is sent with every POST (a world shop's `{ t, helper }`); a 429 (daily
 * helper quota) or 403 resolves "full", so the drop goes back quietly.
 */
export function connect(shop, client, on, extra = {}) {
  const base = `/api/shops/${shop}`;
  const es = new EventSource(`${base}/events?client=${encodeURIComponent(client)}`);
  for (const name of ["hello", "placed", "hold", "presence"]) {
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
        if (res.ok) return "ok";
        if (res.status === 429 || res.status === 403) return "full";
        if (res.status === 409) {
          const { error } = await res.json().catch(() => ({}));
          return error === "full" ? "full" : "taken";
        }
        return "error";
      } catch { return "error"; }
    },
    hold(item, holding) { post("hold", { item, holding }).catch(() => {}); },
    close() { es.close(); },
  };
}
