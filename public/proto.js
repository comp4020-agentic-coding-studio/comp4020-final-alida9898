import { loadSizes, settle, depth } from "./layout.js";

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

const sizes = await loadSizes(stickers, src);
// the recommended spot: bottom-centred in the sticker's box
const suggested = (s) => ({ x: s.x + (s.w - sizes[s.id].w) / 2, y: s.y + s.h - sizes[s.id].h });

const placed = {};
try { Object.assign(placed, JSON.parse(localStorage.getItem(KEY) ?? "{}")); } catch {}
const byId = Object.fromEntries(stickers.map((s) => [s.id, s]));
const ctx = { stickers, sizes, byId, placed, FLOOR };

const save = () => { try { localStorage.setItem(KEY, JSON.stringify(placed)); } catch {} };

const pct = (v) => `${(v / W) * 100}%`;

// id of the sticker that just settled (placed or returned to the tray), so its
// landing spot gets one soft "press" bounce instead of just popping into place
let justSettled = null;

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
    el.className = "placed movable" + (s.id === justSettled ? " pressed" : "");
    Object.assign(el.style, {
      left: pct(pos.x), top: pct(pos.y), width: pct(sizes[s.id].w), height: pct(sizes[s.id].h),
      zIndex: Math.round(depth(ctx, s, pos)),
    });
    el.addEventListener("pointerdown", (e) => startDrag(e, s, el));
    scene.append(el);
  }
  justSettled = null;
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
  // liftT eases 0 -> 1 over the first moment of the pick-up: a soft, felt-like
  // flex (not a sharp paper fold) that settles into the steady carrying tilt
  const frame = (liftT = 1) => {
    const box = scene.getBoundingClientRect();
    const over = last.clientX > box.left && last.clientX < box.right && last.clientY > box.top && last.clientY < box.bottom;
    const scale = box.width / W;
    const w = over ? sizes[s.id].w * scale : box0.width;
    const h = over ? sizes[s.id].h * scale : box0.height;
    Object.assign(fly.style, { width: `${w}px`, height: `${h}px` });
    const pop = 1 + 0.08 * Math.sin(liftT * Math.PI);
    const tilt = -2 - 3 * (1 - liftT);
    fly.style.transform =
      `translate(${last.clientX - grab.fx * w}px, ${last.clientY - grab.fy * h}px) scale(${pop}) rotate(${tilt}deg)`;
    return { box, over, scale, w, h };
  };
  const liftStart = performance.now();
  (function liftTick() {
    const t = Math.min(1, (performance.now() - liftStart) / 180);
    frame(t);
    if (t < 1) requestAnimationFrame(liftTick);
  })();
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
      pos = settle(ctx, s, pos);
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
    justSettled = s.id;
    render();
  };
  addEventListener("pointermove", move);
  addEventListener("pointerup", up);
}

$("reset").addEventListener("click", () => { for (const k of Object.keys(placed)) delete placed[k]; save(); render(); });
render();
