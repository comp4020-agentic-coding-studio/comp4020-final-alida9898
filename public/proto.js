const side = new URLSearchParams(location.search).get("side") === "right" ? "right" : "left";
const KEY = `proto-${side}`;
const SNAP = 90;

const $ = (id) => document.getElementById(id);
const scene = $("scene");
const sheet = $("sheet");
$("where").textContent = side === "left" ? "店门口和柜台" : "里屋的座位";
$("swap").textContent = side === "left" ? "去里屋 →" : "← 去店门口";
$("swap").href = `?side=${side === "left" ? "right" : "left"}`;

const manifest = await fetch("/manifest.json").then((r) => r.json());
const W = manifest.canvas.w;
const FLOOR = manifest.canvas.floorLine;
const all = manifest.sides[side];
const bg = all.find((s) => s.bg);
const stickers = all.filter((s) => !s.bg);
const src = (s) => `/stickers/${s.id}.webp`;

const sizes = Object.fromEntries(
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
// the recommended spot: bottom-centred in the sticker's box
const suggested = (s) => ({ x: s.x + (s.w - sizes[s.id].w) / 2, y: s.y + s.h - sizes[s.id].h });

let placed = {};
try { placed = JSON.parse(localStorage.getItem(KEY) ?? "{}"); } catch {}
const byId = Object.fromEntries(stickers.map((s) => [s.id, s]));

const overChair = (s, pos) => {
  const cx = pos.x + sizes[s.id].w / 2;
  const foot = pos.y + sizes[s.id].h;
  return stickers.some((o) => {
    const p = placed[o.id];
    return p && o.id !== s.id && o.mount === "floor" && !o.sit &&
      cx > p.x && cx < p.x + sizes[o.id].w && foot > p.y && foot < p.y + sizes[o.id].h;
  });
};

// Settle a dropped sticker where it can physically be. Returns null if it has nowhere to go.
function settle(s, pos) {
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
    const host = hosts.reduce((a, b) => (dist(a) <= dist(b) ? a : b));
    const hp = placed[host.id];
    const hw = sizes[host.id].w;
    return {
      x: Math.max(hp.x, Math.min(pos.x, hp.x + hw - w)),
      y: hp.y + host.top * sizes[host.id].h - h,
      host: host.id,
    };
  }
  if (s.sit && overChair(s, pos)) return pos;
  return { ...pos, y: Math.max(pos.y, FLOOR + 8 - h) };
}

const save = () => { try { localStorage.setItem(KEY, JSON.stringify(placed)); } catch {} };

// Depth from where a thing touches the ground: lower on the canvas = nearer = in front.
// Wall things sit behind every floor thing; rugs lie under every standing thing;
// a sitter dropped onto furniture sits just in front of it.
function depth(s, pos) {
  const foot = pos.y + sizes[s.id].h;
  if (s.mount === "wall") return 1000 + foot;
  if (s.mount === "flat") return 3000 + foot;
  if (s.mount === "surface" && pos.host && placed[pos.host]) {
    return depth(byId[pos.host], placed[pos.host]) + 1;
  }
  if (s.sit) {
    const cx = pos.x + sizes[s.id].w / 2;
    const under = stickers
      .filter((o) => o.id !== s.id && o.mount === "floor" && placed[o.id] && !o.sit)
      .filter((o) => {
        const p = placed[o.id];
        return cx > p.x && cx < p.x + sizes[o.id].w && foot > p.y && foot < p.y + sizes[o.id].h;
      })
      .map((o) => depth(o, placed[o.id]));
    if (under.length) return Math.max(...under) + 1;
  }
  return 5000 + foot;
}

const pct = (v) => `${(v / W) * 100}%`;

function render() {
  scene.replaceChildren();
  const base = document.createElement("img");
  base.src = src(bg);
  base.alt = "";
  Object.assign(base.style, { left: 0, top: 0, width: "100%", height: "100%", zIndex: 0 });
  scene.append(base);
  for (const s of stickers) {
    const pos = placed[s.id];
    if (!pos) continue;
    const el = document.createElement("img");
    el.src = src(s);
    el.alt = "";
    el.draggable = false;
    el.className = "placed movable";
    Object.assign(el.style, {
      left: pct(pos.x), top: pct(pos.y), width: pct(sizes[s.id].w), height: pct(sizes[s.id].h),
      zIndex: Math.round(depth(s, pos)),
    });
    el.addEventListener("pointerdown", (e) => startDrag(e, s, el));
    scene.append(el);
  }
  sheet.replaceChildren();
  for (const s of stickers) {
    const cell = document.createElement("div");
    cell.className = "peel mini";
    if (placed[s.id]) {
      cell.classList.add("empty");
      sheet.append(cell);
      continue;
    }
    const img = document.createElement("img");
    img.src = src(s);
    img.alt = "";
    img.draggable = false;
    cell.append(img);
    cell.addEventListener("pointerdown", (e) => startDrag(e, s, img));
    sheet.append(cell);
  }
}

function startDrag(e, s, origin) {
  e.preventDefault();
  const box0 = origin.getBoundingClientRect();
  const fly = document.createElement("img");
  fly.src = src(s);
  fly.className = "flying";
  document.body.append(fly);
  origin.style.visibility = "hidden";
  const ghost = document.createElement("img");
  ghost.src = src(s);
  ghost.className = "guide";
  const sug = suggested(s);
  Object.assign(ghost.style, {
    left: pct(sug.x), top: pct(sug.y), width: pct(sizes[s.id].w), height: pct(sizes[s.id].h), zIndex: 99999,
  });
  scene.append(ghost);

  // keep the grab point under the finger; size grows to real scale only over the scene
  const grab = { fx: (e.clientX - box0.left) / box0.width, fy: (e.clientY - box0.top) / box0.height };
  let last = e;
  const frame = () => {
    const box = scene.getBoundingClientRect();
    const over = last.clientX > box.left && last.clientX < box.right && last.clientY > box.top && last.clientY < box.bottom;
    const scale = box.width / W;
    const w = over ? sizes[s.id].w * scale : box0.width;
    const h = over ? sizes[s.id].h * scale : box0.height;
    Object.assign(fly.style, { width: `${w}px`, height: `${h}px` });
    fly.style.transform = `translate(${last.clientX - grab.fx * w}px, ${last.clientY - grab.fy * h}px) rotate(-2deg)`;
    return { box, over, scale, w, h };
  };
  frame();
  const move = (ev) => { last = ev; frame(); };
  const up = (ev) => {
    last = ev;
    removeEventListener("pointermove", move);
    removeEventListener("pointerup", up);
    const { box, over, scale, w, h } = frame();
    ghost.remove();
    fly.remove();
    const before = placed[s.id];
    let pos = null;
    if (over) {
      pos = { x: (ev.clientX - grab.fx * w - box.left) / scale, y: (ev.clientY - grab.fy * h - box.top) / scale };
      if (Math.hypot(pos.x - sug.x, pos.y - sug.y) < SNAP) pos = { ...sug };
      pos = settle(s, pos);
    }
    // things resting on this one move with it, or come off with it
    for (const o of stickers) {
      const p = placed[o.id];
      if (!p || p.host !== s.id) continue;
      if (pos && before) placed[o.id] = { ...p, x: p.x + pos.x - before.x, y: p.y + pos.y - before.y };
      else delete placed[o.id];
    }
    if (pos) placed[s.id] = pos;
    else delete placed[s.id];
    save();
    render();
  };
  addEventListener("pointermove", move);
  addEventListener("pointerup", up);
}

$("reset").addEventListener("click", () => { placed = {}; save(); render(); });
render();
