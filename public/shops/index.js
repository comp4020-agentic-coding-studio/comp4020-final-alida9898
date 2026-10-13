// Shop-type registry: type → definition module. See ./README.md for the
// definition shape and how to add a type. Each type owns only its own folder.
const TYPES = {
  cafe: () => import("./cafe/index.js"),
  // flower: () => import("./flower/index.js"),
  // book:   () => import("./book/index.js"),
  // bakery: () => import("./bakery/index.js"),
  _template: () => import("./_template/index.js"), // dev only: ?type=_template
};
export const DEFAULT_TYPE = "cafe";
export const KNOWN_TYPES = ["cafe", "flower", "book", "bakery"];

/** The shop type from `/w/<world>/<type>` or `?type=<type>`, else "cafe". */
export function typeFromUrl(loc = location) {
  const m = loc.pathname.match(/^\/w\/[\w-]+\/([a-z_]+)\/?$/);
  const t = m ? m[1] : new URLSearchParams(loc.search).get("type");
  return t && /^[a-z_]+$/.test(t) ? t : DEFAULT_TYPE;
}

/** Load a type's definition; an unknown / not-yet-built type falls back to the café. */
export async function loadShopType(type = DEFAULT_TYPE) {
  if (!TYPES[type]) {
    console.info(`[shops] type "${type}" isn't built yet — showing the café`);
    type = DEFAULT_TYPE;
  }
  const def = (await TYPES[type]()).default;
  return { ...def, type };
}
