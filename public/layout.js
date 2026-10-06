// Shared sticker-placement physics used by the play prototype (proto.js) and
// the layout editor (edit.js): natural-size loading, where a dropped sticker
// can physically rest (settle), and what's in front of what (depth).
//
// Callers build a `ctx` object once: { stickers, sizes, byId, placed, FLOOR }.
// `placed` and `sizes` are mutated in place by the caller (drag, resize) —
// these functions always read the current values off ctx, never cache them.

export async function loadSizes(stickers, src) {
  return Object.fromEntries(
    await Promise.all(
      stickers.map(
        (s) =>
          new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
              const k = Math.min(s.w / img.naturalWidth, s.h / img.naturalHeight);
              resolve([s.id, { w: img.naturalWidth * k, h: img.naturalHeight * k }]);
            };
            img.src = src(s);
          }),
      ),
    ),
  );
}

export function overChair(ctx, s, pos) {
  const { stickers, sizes, placed } = ctx;
  const cx = pos.x + sizes[s.id].w / 2;
  const foot = pos.y + sizes[s.id].h;
  return stickers.some((o) => {
    const p = placed[o.id];
    return p && o.id !== s.id && o.mount === "floor" && !o.sit &&
      cx > p.x && cx < p.x + sizes[o.id].w && foot > p.y && foot < p.y + sizes[o.id].h;
  });
}

// Settle a dropped sticker where it can physically be. Returns null if it has nowhere to go.
export function settle(ctx, s, pos) {
  const { stickers, sizes, placed, FLOOR } = ctx;
  const { w, h } = sizes[s.id];
  if (s.mount === "wall") return { ...pos, y: Math.min(pos.y, FLOOR - 10 - h) };
  if (s.mount === "surface") {
    const hosts = stickers.filter((o) => o.top && placed[o.id]);
    if (!hosts.length) return null;
    const cx = pos.x + w / 2;
    const dist = (o) => {
      const p = placed[o.id];
      const ox = Math.max(p.x, Math.min(cx, p.x + sizes[o.id].w));
      return Math.hypot(cx - ox, pos.y + h - (p.y + o.top * sizes[o.id].h));
    };
    // an author can pin which host this rests on (s.pinHost); otherwise, the nearest one
    const pinned = s.pinHost && hosts.find((o) => o.id === s.pinHost);
    const host = pinned || hosts.reduce((a, b) => (dist(a) <= dist(b) ? a : b));
    const hp = placed[host.id];
    const hw = sizes[host.id].w;
    return {
      x: Math.max(hp.x, Math.min(pos.x, hp.x + hw - w)),
      y: hp.y + host.top * sizes[host.id].h - h,
      host: host.id,
    };
  }
  if (s.sit && overChair(ctx, s, pos)) return pos;
  return { ...pos, y: Math.max(pos.y, FLOOR + 8 - h) };
}

// Depth from where a thing touches the ground: lower on the canvas = nearer = in front.
// Wall things sit behind every floor thing; rugs lie under every standing thing;
// a sitter dropped onto furniture sits just in front of it.
export function depth(ctx, s, pos) {
  const { stickers, sizes, byId, placed } = ctx;
  const foot = pos.y + sizes[s.id].h;
  if (s.mount === "wall") return 1000 + foot;
  if (s.mount === "flat") return 3000 + foot;
  if (s.mount === "surface" && pos.host && placed[pos.host]) {
    return depth(ctx, byId[pos.host], placed[pos.host]) + 1;
  }
  if (s.sit) {
    const cx = pos.x + sizes[s.id].w / 2;
    const under = stickers
      .filter((o) => o.id !== s.id && o.mount === "floor" && placed[o.id] && !o.sit)
      .filter((o) => {
        const p = placed[o.id];
        return cx > p.x && cx < p.x + sizes[o.id].w && foot > p.y && foot < p.y + sizes[o.id].h;
      })
      .map((o) => depth(ctx, o, placed[o.id]));
    if (under.length) return Math.max(...under) + 1;
  }
  return 5000 + foot;
}
