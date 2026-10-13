// Single-player placement page: zoom building → storey → zone → focus item,
// drag each thing from the tray onto its one faint outline. No score, no timer.
// Items contract: public/cafe/README.md. Building + lights: cafe/build.js.
import * as THREE from "three";
import { ROOM, LEVELS, STOREY_H, TUBE, levelY } from "./cafe/zones.js";
import { addLights, buildCafe, wallAttached } from "./cafe/build.js";
import { collectItems, devTagIfEmpty } from "./cafe/items.js";

const $ = (id) => document.getElementById(id);
const debug = new URLSearchParams(location.search).has("debug");
const reduced = matchMedia("(prefers-reduced-motion: reduce)");

// ---- copy ------------------------------------------------------------------
const STOREY_NAME = { zh: ["一楼", "二楼", "三楼", "四楼"], en: ["Ground floor", "Upstairs", "Second floor", "Third floor"] };
const LAYER = {
  zh: ["", "① 大件", "② 放在上面", "③ 再放上去的小东西"],
  en: ["", "① Big pieces", "② On top", "③ Small things on those"],
};
const TEXT = {
  zh: {
    brand: "小镇一角", toggle: "EN", cafe: "咖啡馆", back: "‹ 返回", loading: "正在把咖啡馆捏出来……",
    hintBuilding: "点一层楼，走近一点。", hintStorey: "点一块地方，走近一点。",
    hintZone: "把东西拖到淡淡发光的轮廓上，放手就好。同一层里先放哪个都行。",
    hintEmpty: "这里暂时没有要放的东西。",
    closer: "走近看看", closerHint: "放好后点它，摆上面的小东西",
    unlocks: (p) => `放好${p}后解锁`, zoomTo: (p) => `点进${p}再放`, unlocksAfter: (p) => `放好${p}后能走近`,
    zoneDone: "这一块都放好了。", allDone: "整间咖啡馆都放好了。慢慢看一圈吧。",
    restart: "从头再来", sure: "真的从头再来？", yes: "是的", no: "算了",
    pageTitle: "小镇一角 · 摆一摆",
    closerShort: "走近看看", mute: "关掉声音", unmute: "打开声音", help: "怎么玩",
    hintTitle: "怎么玩",
    hintItems: ["点击：走近", "Esc 或 返回：后退", "手机上滑：后退", "把东西拖到发光的轮廓上"],
    hintClose: "点一下就关上",
  },
  en: {
    brand: "A Corner of Town", toggle: "中文", cafe: "Café", back: "‹ Back", loading: "Shaping the café out of clay…",
    hintBuilding: "Tap a floor to step closer.", hintStorey: "Tap an area to step closer.",
    hintZone: "Drag each thing onto its faint glowing outline and let go. Within a layer, any order is fine.",
    hintEmpty: "Nothing to place here for now.",
    closer: "Take a closer look", closerHint: "Once it's in, tap it to place what goes on it",
    unlocks: (p) => `Unlocks after: ${p}`, zoomTo: (p) => `Zoom into ${p} to place`, unlocksAfter: (p) => `Open after: ${p}`,
    zoneDone: "This corner's all in place.", allDone: "The whole café is in place. Have a slow look around.",
    restart: "Start over", sure: "Really start over?", yes: "Yes", no: "Never mind",
    pageTitle: "A Corner of Town · Place things",
    closerShort: "Take a closer look", mute: "Mute", unmute: "Unmute", help: "How to play",
    hintTitle: "How to play",
    hintItems: ["Click: zoom in", "Esc or Back: step back", "Swipe up (phone): back", "Drag things onto the glowing outline"],
    hintClose: "Tap to close",
  },
};
const LANG_KEY = "lang";
let lang = "zh";
try { lang = localStorage.getItem(LANG_KEY) === "en" ? "en" : "zh"; } catch {}
const T = () => TEXT[lang];
const L = (label) => label[lang] || label.zh || label.en;

// ---- progress (localStorage, single player) -------------------------------
const SAVE_KEY = "cafe-placed-v1";
const placed = new Set();
try { for (const id of JSON.parse(localStorage.getItem(SAVE_KEY) || "[]")) placed.add(id); } catch {}
const save = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify([...placed])); } catch {} };

// ---- sound: a soft wooden "tock", synthesised; starts only after a first gesture
const MUTE_KEY = "cafe-mute-v1";
let muted = false;
try { muted = localStorage.getItem(MUTE_KEY) === "1"; } catch {}
let actx = null;
function wakeAudio() {
  try {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === "suspended") actx.resume();
  } catch { actx = null; }
}
addEventListener("pointerdown", wakeAudio, { capture: true });
addEventListener("keydown", wakeAudio, { capture: true });
/** `soft` = the quieter, lower note when a thing floats back to the tray. */
function tock(soft = false) {
  if (muted || !actx || actx.state !== "running") return;
  const t = actx.currentTime, vol = soft ? 0.07 : 0.22, f = soft ? 300 : 440;
  const out = actx.createBiquadFilter(); out.type = "lowpass"; out.frequency.value = soft ? 1100 : 1800;
  out.connect(actx.destination);
  const body = actx.createOscillator(); body.type = "sine";
  body.frequency.setValueAtTime(f, t); body.frequency.exponentialRampToValueAtTime(f * 0.45, t + 0.14);
  const g = actx.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
  body.connect(g).connect(out);
  // a tiny higher knock on top gives it the "wood" in tock
  const knock = actx.createOscillator(); knock.type = "triangle"; knock.frequency.setValueAtTime(f * 2.6, t);
  const kg = actx.createGain();
  kg.gain.setValueAtTime(0.0001, t); kg.gain.exponentialRampToValueAtTime(vol * 0.35, t + 0.003); kg.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  knock.connect(kg).connect(out);
  body.start(t); body.stop(t + 0.3); knock.start(t); knock.stop(t + 0.08);
}

// ---- renderer / scene ------------------------------------------------------
const canvas = $("house");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.localClippingEnabled = true;

const BG = 0xf6eee2;
const scene = new THREE.Scene();
scene.background = new THREE.Color(BG);
addLights(scene);
const camera = new THREE.PerspectiveCamera(38, 1, 10, 6000);

$("loading").textContent = T().loading;
const { storeys, tube } = await buildCafe(scene);
$("loading").remove();
const N = LEVELS.length, TOP = N * STOREY_H;

// the tube spans every storey: clip it at the cut instead of hiding it
const cut = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1e6);
tube.traverse((o) => {
  if (o.isMesh) { o.material = o.material.clone(); o.material.clippingPlanes = [cut]; }
});

// ---- items -----------------------------------------------------------------
const devTags = devTagIfEmpty(storeys);
const items = collectItems(storeys);
for (const id of [...placed]) if (!items.has(id)) placed.delete(id);
// a child can't be placed without its parent (older saves, changed zones)
let pruned = true;
while (pruned) {
  pruned = false;
  for (const id of placed) { const p = items.get(id).parent; if (p && !placed.has(p)) { placed.delete(id); pruned = true; } }
}
for (const it of items.values()) {
  it.base = { y: it.obj.position.y, scale: it.obj.scale.clone() };
  it.obj.visible = placed.has(it.id);
}
const zoneItems = (level, zone) => [...items.values()].filter((it) => it.level === level && it.zone === zone);
const descendants = (id) => {
  const out = [];
  const walk = (i) => { for (const c of items.get(i).children) { out.push(items.get(c)); walk(c); } };
  walk(id);
  return out;
};
const count = (list) => ({ done: list.filter((it) => placed.has(it.id)).length, total: list.length });
const levelItems = (level) => [...items.values()].filter((it) => it.level === level);

// ---- views -----------------------------------------------------------------
// path[0] = building; then { kind: "storey", level } → { kind: "zone", level, zone } → { kind: "item", id } …
let path = [{ kind: "building" }];
const view = () => path[path.length - 1];
const viewLevel = (v = view()) => (v.kind === "building" ? null : v.kind === "item" ? items.get(v.id).level : v.level);
const viewZone = (v = view()) => (v.kind === "zone" ? v.zone : v.kind === "item" ? items.get(v.id).zone : null);

function zoneBoxes(level, zone) {
  const y0 = levelY(level);
  return LEVELS[level].zones[zone].boxes.map((b) =>
    new THREE.Box3(new THREE.Vector3(b.x[0], y0 + b.y[0], b.z[0]), new THREE.Vector3(b.x[1], y0 + b.y[1], b.z[1])));
}
const storeyBox = (level) => new THREE.Box3(
  new THREE.Vector3(ROOM.x[0], levelY(level), ROOM.z[0]), new THREE.Vector3(ROOM.x[1], levelY(level) + 270, ROOM.z[1]));
function itemBox(id) {
  const b = new THREE.Box3().setFromObject(items.get(id).obj);
  for (const d of descendants(id)) b.union(new THREE.Box3().setFromObject(d.obj));
  // never zoom in so far that a small thing fills the screen
  const c = b.getCenter(new THREE.Vector3()), s = b.getSize(new THREE.Vector3());
  return new THREE.Box3().setFromCenterAndSize(c, s.max(new THREE.Vector3(110, 70, 90)).multiplyScalar(1.08));
}
function viewBox(v) {
  if (v.kind === "building") return new THREE.Box3(new THREE.Vector3(ROOM.x[0] - 12, 0, 0), new THREE.Vector3(ROOM.x[1] + 12, TOP, ROOM.z[1]));
  if (v.kind === "storey") return storeyBox(v.level);
  if (v.kind === "zone") {
    // frame what the zone actually holds (all its items, placed or not), kept inside its boxes
    const zb = zoneBoxes(v.level, v.zone).reduce((a, b) => a.union(b));
    const list = zoneItems(v.level, v.zone);
    if (!list.length) return zb;
    const b = new THREE.Box3();
    for (const it of list) b.union(new THREE.Box3().setFromObject(it.obj));
    b.min.y = Math.min(b.min.y, zb.min.y);
    b.expandByScalar(15);
    b.intersect(zb);
    return b.isEmpty() ? zb : b;
  }
  return itemBox(v.id);
}
// a front-ish 3/4 angle that looks a little more down the closer you get
// kept low so the room reads like a stage seen from the front, not a floor plan
const ANGLE = { building: [14, 17], storey: [14, 18], zone: [16, 20], item: [14, 24] };
const deg = THREE.MathUtils.degToRad;
const dirFrom = (az, el) => new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
/** Which wall a focus piece hangs on / stands flat against (its back near the wall, facing out), or null. */
function wallOf(id) {
  const it = items.get(id);
  const b = new THREE.Box3().setFromObject(it.obj);
  const f = new THREE.Vector3(0, 0, 1).applyQuaternion(it.obj.getWorldQuaternion(new THREE.Quaternion()));
  // thin along the wall's normal: shelves, boards, frames, a bookcase — not a sofa backed onto a wall
  if (f.z > 0.9 && b.min.z < 35 && b.max.z < 55) return "back";
  if (f.x < -0.9 && b.max.x > ROOM.x[1] - 35 && b.min.x > ROOM.x[1] - 55) return "right";
  if (f.x > 0.9 && b.min.x < ROOM.x[0] + 35 && b.max.x < ROOM.x[0] + 55) return "left";
  return null;
}
const WALL_DIR = { back: new THREE.Vector3(0, 0, 1), right: new THREE.Vector3(-1, 0, 0), left: new THREE.Vector3(1, 0, 0) };
/** Things on the right half are seen from the left (front-on first), so the view never swings out past the right wall. */
const fromLeft = (v, c) => v.kind !== "building" && v.kind !== "storey" && c.x > 60;
/** The angle we'd like before checking what's in the way. */
function preferredAngle(v, box) {
  let [az, el] = ANGLE[v.kind].map(deg);
  if (fromLeft(v, box.getCenter(new THREE.Vector3()))) az = -az * 0.5;
  // things against the back wall left of the bean tube are seen from the left, so the tube never stands in front of them
  const c = box.getCenter(new THREE.Vector3());
  if ((v.kind === "zone" || v.kind === "item") && c.x < TUBE.x - 40 && c.z < TUBE.keepout.z[1] + 60) az = -az;
  if (v.kind === "item") {
    // a focus piece that faces sideways (a board on a side wall) is looked at face-on
    const f = new THREE.Vector3(0, 0, 1).applyQuaternion(items.get(v.id).obj.getWorldQuaternion(new THREE.Quaternion()));
    const turn = Math.atan2(f.x, f.z);
    if (Math.abs(turn) > deg(20)) az = THREE.MathUtils.clamp(turn, -1.13, 1.13);
  }
  return [az, el];
}

// ---- what can stand between the camera and a target: shell walls, stairs, rail, slabs, the tube
const occluders = [];
for (const s of storeys) {
  for (const w of ["back", "left", "right"]) occluders.push({ obj: s.walls[w], level: s.level, wall: w });
  for (const name of ["stairs", "stairwell-rail", "floor"]) {
    const o = s.group.getObjectByName(name);
    if (o) occluders.push({ obj: o, level: s.level, wall: null });
  }
}
occluders.push({ obj: tube, level: -1, wall: null });
const occRay = new THREE.Raycaster();
/** Share of sample rays from the target box to camera position `p` that hit the shell (0 = clear view). */
function blockedShare(p, box, lv, extra = []) {
  const cutY = lv === null ? Infinity : levelY(lv) + 282;
  const objs = occluders.filter((o) => {
    if (o.level >= 0 && lv !== null && o.level > lv) return false; // storeys above are hidden
    // a wall is hidden whenever the camera stands outside it (see tick)
    if (o.wall === "left") return p.x > ROOM.x[0];
    if (o.wall === "right") return p.x < ROOM.x[1];
    if (o.wall === "back") return p.z > 0;
    return true;
  }).map((o) => o.obj);
  const c = box.getCenter(new THREE.Vector3()), half = box.getSize(new THREE.Vector3()).multiplyScalar(0.35);
  const samples = [c];
  for (let i = 0; i < 8; i++) samples.push(c.clone().add(new THREE.Vector3(i & 1 ? half.x : -half.x, i & 2 ? half.y : -half.y, i & 4 ? half.z : -half.z)));
  samples.push(...extra.map((x) => x.clone()));
  let hit = 0;
  for (const s of samples) {
    // keep samples inside the room, so things hung on a wall don't count the wall they hang on
    s.x = THREE.MathUtils.clamp(s.x, ROOM.x[0] + 6, ROOM.x[1] - 6); s.z = Math.max(s.z, ROOM.z[0] + 6);
    const to = p.clone().sub(s), far = to.length();
    occRay.set(s, to.normalize()); occRay.near = 4; occRay.far = far;
    const hits = occRay.intersectObjects(objs, true).filter((h) => h.point.y <= cutY);
    if (hits.length) hit++;
  }
  return hit / samples.length;
}
/** Never inside a wall's thickness, behind the back wall, or inside the stairs / tube. */
const solidBoxes = occluders.filter((o) => !o.wall && o.obj.name !== "floor")
  .map((o) => new THREE.Box3().setFromObject(o.obj).expandByScalar(25));
const insideShell = (p) => p.z < 40 || Math.abs(Math.abs(p.x) - ROOM.x[1]) < ROOM.wall + 20 ||
  solidBoxes.some((b) => b.containsPoint(p));

// screen space left free by the tray (desktop: right panel; phone: bottom sheet)
let free = { w: 1, h: 1, fullW: 1, fullH: 1, offX: 0, offY: 0 };
function measure() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  const c = canvas.getBoundingClientRect(), t = $("tray").getBoundingClientRect();
  const bottomSheet = t.width >= c.width - 2;
  if (bottomSheet) {
    const sh = Math.max(0, c.bottom - t.top);
    free = { w, h: h - sh, fullW: w, fullH: h + sh, offX: 0, offY: sh };
  } else {
    const tw = Math.max(0, c.right - t.left);
    free = { w: w - tw, h, fullW: w + tw, fullH: h, offX: tw, offY: 0 };
  }
  camera.aspect = free.fullW / Math.max(1, free.fullH);
  camera.setViewOffset(free.fullW, free.fullH, free.offX, free.offY, w, h);
}
/** Distance along `dir` at which box fits the free part of the screen. */
function fitDistance(v, box, dir) {
  const c = box.getCenter(new THREE.Vector3());
  const fwd = dir.clone().negate();
  const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
  const up = new THREE.Vector3().crossVectors(right, fwd);
  const tanV0 = Math.tan(deg(camera.fov / 2));
  const margin = v.kind === "building" ? 0.9 : 0.86;
  const tanV = tanV0 * (free.h / free.fullH) * margin, tanH = tanV0 * (free.w / free.fullH) * margin;
  let d = 50;
  for (let i = 0; i < 8; i++) {
    const p = new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).sub(c);
    const z = p.dot(dir);
    d = Math.max(d, z + Math.abs(p.dot(right)) / tanH, z + Math.abs(p.dot(up)) / tanV);
  }
  return d;
}
// candidate turns around the preferred angle: right-hand side first (the stairs are on the left wall)
const AZ_STEPS = [0, 15, -15, 30, -30, 45, -45, 60, -60, 75].map(deg);
const EL_STEPS = [0, 10, 20].map(deg);
const frameCache = new Map();
/** Camera position + target that fit box `v` into the free part of the screen, with a clear line of sight. */
function frame(v, zoomOut = 1, at = path.indexOf(v)) {
  const box = viewBox(v), c = box.getCenter(new THREE.Vector3());
  const [az0, el0] = preferredAngle(v, box);
  let parentD = Infinity;
  // each level is closer than the one it came from
  if (v.kind === "item" && at > 0) parentD = frame(path[at - 1], 1, at - 1).d * 0.8;
  const key = `${JSON.stringify(v)}|${free.w}x${free.h}|${Math.round(parentD)}`;
  let best = frameCache.get(key);
  if (!best) {
    const lv = viewLevel(v);
    // in a zone, every big piece should be in sight, not just the middle of the box
    const extra = v.kind === "zone"
      ? zoneItems(v.level, v.zone).filter((it) => it.layer === 1).map((it) => new THREE.Box3().setFromObject(it.obj).getCenter(new THREE.Vector3()))
      : [];
    // a wall piece is a front elevation: square to its wall, at its own height, nothing to search
    const wall = v.kind === "item" ? wallOf(v.id) : null;
    if (wall) {
      const dir = WALL_DIR[wall].clone();
      best = { score: 0, dir, d: fitDistance(v, box, dir), occ: 0 };
    }
    const flip = fromLeft(v, c) ? -1 : 1;
    for (const [ei, del] of best ? [] : EL_STEPS.entries()) {
      for (const [ai, daz] of AZ_STEPS.entries()) {
        const az = THREE.MathUtils.clamp(az0 + flip * daz, deg(-80), deg(80)), el = el0 + del;
        const dir = dirFrom(az, el);
        const d = Math.min(fitDistance(v, box, dir), parentD);
        const p = c.clone().addScaledVector(dir, d);
        if (v.kind !== "building" && insideShell(p)) continue;
        const occ = v.kind === "building" ? 0 : blockedShare(p, box, lv, extra);
        // a clear view matters most; then staying near the preferred angle; then a lower camera
        const score = occ * 100 + ai * 1.2 + ei * 4;
        if (!best || score < best.score) best = { score, dir, d, occ };
        if (occ === 0 && ai === 0 && ei === 0) break;
      }
      if (best && best.occ === 0 && best.score < 5) break;
    }
    if (!best) { const dir = dirFrom(az0, el0); best = { dir, d: Math.min(fitDistance(v, box, dir), parentD), occ: 1 }; }
    frameCache.set(key, best);
    if (debug) console.debug("[frame]", key, `az ${Math.round(Math.atan2(best.dir.x, best.dir.z) * 57.3)}° el ${Math.round(Math.asin(best.dir.y) * 57.3)}° blocked ${best.occ.toFixed(2)}`);
  }
  const d = best.d * zoomOut;
  return { p: c.clone().addScaledVector(best.dir, d), t: c, d: best.d };
}

const look = new THREE.Vector3();
let fly = null, orbit = null, orbitNext = false;
const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
function flyTo(target, dur = 1100) {
  orbit = null; orbitNext = false;
  if (reduced.matches) dur = 0;
  fly = { from: camera.position.clone(), fromT: look.clone(), p: target.p, t: target.t, t0: performance.now(), dur };
}
function go(newPath) {
  path = newPath;
  applyCut();
  flyTo(frame(view()));
  hover(null);
  renderUI();
}
const goInto = (v) => go([...path, v]);
const goBack = () => { if (path.length > 1) go(path.slice(0, -1)); };

// dollhouse cutaway: inside a storey, the ones above vanish and the tube is cut at the ceiling
function applyCut() {
  const lv = viewLevel();
  for (const s of storeys) s.group.visible = lv === null || s.level <= lv;
  cut.constant = lv === null ? 1e6 : levelY(lv) + 282;
}

// ---- picking + hover -------------------------------------------------------
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const pickMat = new THREE.MeshBasicMaterial();
const hoverBox = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshBasicMaterial({ color: 0xffc46b, transparent: true, opacity: 0.1, depthWrite: false }));
const hoverEdges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)),
  new THREE.LineBasicMaterial({ color: 0xd9a441, transparent: true, opacity: 0.6 }));
hoverBox.add(hoverEdges);
hoverBox.visible = false; hoverBox.renderOrder = 5;
scene.add(hoverBox);
function showBox(box, opacity = 0.1) {
  box.getCenter(hoverBox.position); box.getSize(hoverBox.scale);
  hoverBox.material.opacity = opacity; hoverEdges.material.opacity = Math.min(1, opacity * 6);
  hoverBox.visible = true;
}
function pickMesh(box) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), pickMat);
  box.getCenter(m.position); box.getSize(m.scale); m.updateMatrixWorld(true);
  return m;
}
const shown = (o) => { for (; o; o = o.parent) if (!o.visible) return false; return true; };
/** What can be clicked at this zoom level: [{ mesh(es), box, go }] */
function targets() {
  const v = view();
  if (v.kind === "building") return storeys.map((s) => ({ objs: [pickMesh(storeyBox(s.level))], box: storeyBox(s.level), go: { kind: "storey", level: s.level } }));
  if (v.kind === "storey") {
    return Object.keys(LEVELS[v.level].zones).map((zone) => {
      const boxes = zoneBoxes(v.level, zone);
      return { objs: boxes.map(pickMesh), box: boxes.reduce((a, b) => a.clone().union(b)), go: { kind: "zone", level: v.level, zone } };
    });
  }
  const scope = v.kind === "item" ? v.id : null;
  return [...items.values()]
    .filter((it) => it.focus && it.children.length && placed.has(it.id) && it.scope === scope && it.level === viewLevel() && it.zone === viewZone())
    .map((it) => ({ objs: [it.obj], box: new THREE.Box3().setFromObject(it.obj), go: { kind: "item", id: it.id }, real: true }));
}
function pickAt(x, y) {
  const r = canvas.getBoundingClientRect();
  ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  let best = null;
  for (const t of targets()) {
    for (const hit of ray.intersectObjects(t.objs, true)) {
      if (t.real && !shown(hit.object)) continue;
      if (!best || hit.distance < best.d) best = { d: hit.distance, t };
      break;
    }
  }
  return best && best.t;
}
let hovered = null;
function hover(t) {
  hovered = t;
  canvas.style.cursor = t ? "pointer" : "";
  if (t) showBox(t.box);
  else if (!glowFx) hoverBox.visible = false;
}
let down = null;
canvas.addEventListener("pointermove", (e) => {
  if (drag || e.pointerType === "touch" || fly || orbit) return;
  const t = pickAt(e.clientX, e.clientY);
  if (t !== hovered && (!t || !hovered || t.go !== hovered.go)) hover(t);
});
canvas.addEventListener("pointerleave", () => hover(null));
canvas.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
canvas.addEventListener("pointercancel", () => { down = null; });
canvas.addEventListener("pointerup", (e) => {
  if (!down || drag) return;
  const dx = e.clientX - down.x, dy = e.clientY - down.y, moved = Math.hypot(dx, dy), dt = performance.now() - down.t;
  down = null;
  // phones: a quick swipe up on the scene steps back (mouse/trackpad never does)
  if (e.pointerType === "touch" && dy < -60 && Math.abs(dy) > 1.5 * Math.abs(dx) && dt < 700) { goBack(); return; }
  if (moved > 8) return;
  const t = pickAt(e.clientX, e.clientY);
  if (t) goInto(t.go); // empty space: nothing happens
});
addEventListener("keydown", (e) => { if (e.key === "Escape" && !drag) goBack(); });

// ---- thumbnails: each item rendered once, through the one renderer ---------
const THUMB = 112;
const thumbs = new Map();
const thumbQueue = [...items.keys()];
const thumbScene = new THREE.Scene();
thumbScene.add(new THREE.HemisphereLight(0xfff4e6, 0xb89a80, 1.6));
const tkey = new THREE.DirectionalLight(0xffe9cc, 2.2); tkey.position.set(-1, 2, 2); thumbScene.add(tkey);
const thumbCam = new THREE.PerspectiveCamera(28, 1, 1, 5000);
const thumbCanvas = document.createElement("canvas");
/** A copy of the item alone (its tagged children removed), sharing geometry/materials. */
function soloClone(it) {
  const c = it.obj.clone(true);
  const strip = (o) => { for (const ch of [...o.children]) { if (ch.userData.item) o.remove(ch); else strip(ch); } };
  strip(c);
  c.visible = true;
  return c;
}
function renderThumb(it) {
  const c = soloClone(it);
  c.position.set(0, 0, 0);
  thumbScene.add(c);
  const box = new THREE.Box3().setFromObject(c), sph = box.getBoundingSphere(new THREE.Sphere());
  const d = sph.radius / Math.sin(THREE.MathUtils.degToRad(thumbCam.fov / 2)) * 1.02;
  thumbCam.position.copy(sph.center).add(new THREE.Vector3(0.45, 0.5, 1).normalize().multiplyScalar(d));
  thumbCam.lookAt(sph.center);
  const pr = renderer.getPixelRatio(), px = Math.round(THUMB * pr);
  renderer.setViewport(0, 0, THUMB, THUMB);
  renderer.setScissor(0, 0, THUMB, THUMB);
  renderer.setScissorTest(true);
  renderer.render(thumbScene, thumbCam);
  thumbCanvas.width = thumbCanvas.height = px;
  const ctx = thumbCanvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(canvas, 0, canvas.height - px, px, px, 0, 0, px, px);
  // key out the flat background so the sticker floats on whatever is behind it
  const img = ctx.getImageData(0, 0, px, px), a = img.data, br = a[0], bg = a[1], bb = a[2];
  for (let i = 0; i < a.length; i += 4) {
    const dist = Math.abs(a[i] - br) + Math.abs(a[i + 1] - bg) + Math.abs(a[i + 2] - bb);
    if (dist < 10) a[i + 3] = 0; else if (dist < 30) a[i + 3] = Math.round(255 * (dist - 10) / 20);
  }
  ctx.putImageData(img, 0, 0);
  thumbs.set(it.id, thumbCanvas.toDataURL("image/png"));
  thumbScene.remove(c);
  for (const img of document.querySelectorAll(`img[data-thumb="${CSS.escape(it.id)}"]`)) { img.src = thumbs.get(it.id); img.className = ""; }
}
function pumpThumbs() {
  if (!thumbQueue.length || canvas.height < THUMB * renderer.getPixelRatio()) return;
  const bg = scene.background; thumbScene.background = new THREE.Color(0xfbf7f0);
  for (let n = 0; n < 6 && thumbQueue.length; n++) renderThumb(items.get(thumbQueue.shift()));
  void bg;
  renderer.setScissorTest(false);
  renderer.setViewport(0, 0, canvas.clientWidth, canvas.clientHeight);
}

// ---- ghost: the real model, translucent and glowing at its one spot -------
const ghostMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, depthTest: false,
  uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(0xffb84d) } },
  vertexShader: `varying vec3 vN; varying vec3 vV;
    void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
  fragmentShader: `uniform float uTime; uniform vec3 uColor; varying vec3 vN; varying vec3 vV;
    void main() { float rim = 1.0 - abs(dot(normalize(vN), normalize(vV)));
      float pulse = 0.72 + 0.28 * sin(uTime * 2.1);
      gl_FragColor = vec4(uColor * (1.0 + 0.35 * rim), min(1.0, (0.24 + 1.1 * pow(rim, 1.8)) * pulse)); }`,
});
let ghost = null;
function showGhost(it) {
  ghost = soloClone(it);
  ghost.traverse((o) => { if (o.isMesh) { o.material = ghostMat; o.castShadow = false; o.receiveShadow = false; o.renderOrder = 10; } });
  ghost.position.y = it.base.y;
  ghost.scale.copy(it.base.scale);
  it.obj.parent.add(ghost);
  const b = new THREE.Box3().setFromObject(it.obj);
  markerAt = new THREE.Vector3((b.min.x + b.max.x) / 2, b.max.y, (b.min.z + b.max.z) / 2);
  marker.visible = true;
}
function hideGhost() { if (ghost) { ghost.parent.remove(ghost); ghost = null; } marker.visible = false; }

// a soft glowing dot with a little arrow, floating above the spot at a fixed screen size,
// drawn over everything so a small or half-hidden spot is still easy to find
const marker = (() => {
  const c = document.createElement("canvas"); c.width = 64; c.height = 96;
  const g = c.getContext("2d");
  const halo = g.createRadialGradient(32, 30, 2, 32, 30, 30);
  halo.addColorStop(0, "rgba(255,214,140,0.95)"); halo.addColorStop(0.45, "rgba(255,184,77,0.55)"); halo.addColorStop(1, "rgba(255,184,77,0)");
  g.fillStyle = halo; g.fillRect(0, 0, 64, 64);
  g.fillStyle = "#fff6e6"; g.beginPath(); g.arc(32, 30, 8, 0, Math.PI * 2); g.fill();
  g.fillStyle = "rgba(217,140,40,0.9)";
  g.beginPath(); g.moveTo(18, 64); g.lineTo(46, 64); g.lineTo(32, 88); g.closePath(); g.fill();
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, sizeAttenuation: false }));
  m.center.set(0.5, 0.1); m.renderOrder = 12; m.visible = false;
  scene.add(m);
  return m;
})();
let markerAt = null;
function stepMarker(now) {
  if (!marker.visible || !markerAt) return;
  const t = now / 1000, bob = reduced.matches ? 0 : Math.sin(t * 2.1);
  const h = 0.1 * (free.h / Math.max(1, free.fullH));
  marker.scale.set(h * 0.667, h, 1);
  // a few pixels above the top of the spot, bobbing slowly
  const dist = camera.position.distanceTo(markerAt);
  marker.position.copy(markerAt).add(new THREE.Vector3(0, dist * (0.012 + 0.006 * bob), 0));
  marker.material.opacity = 0.9 + 0.1 * bob;
}

// ---- drag from tray --------------------------------------------------------
let drag = null;
function startPending(e, it, cell) {
  if (e.button !== 0 || drag || fly) return;
  const pend = { x: e.clientX, y: e.clientY, id: e.pointerId };
  const sheet = getComputedStyle(cell).touchAction === "pan-x";
  const move = (ev) => {
    if (ev.pointerId !== pend.id) return;
    const dx = ev.clientX - pend.x, dy = ev.clientY - pend.y;
    if (Math.hypot(dx, dy) < (ev.pointerType === "mouse" ? 4 : 8)) return;
    // touch: the tray scrolls along one axis, dragging out goes along the other
    if (ev.pointerType !== "mouse" && (sheet ? Math.abs(dx) > Math.abs(dy) : Math.abs(dy) > Math.abs(dx))) return stop();
    stop();
    beginDrag(ev, it, cell);
  };
  const stop = () => { removeEventListener("pointermove", move); removeEventListener("pointerup", stop); removeEventListener("pointercancel", stop); };
  addEventListener("pointermove", move);
  addEventListener("pointerup", stop);
  addEventListener("pointercancel", stop);
}
function beginDrag(e, it, cell) {
  hover(null);
  const el = document.createElement(thumbs.has(it.id) ? "img" : "div");
  if (thumbs.has(it.id)) el.src = thumbs.get(it.id);
  el.className = "dragging-thumb";
  document.body.append(el);
  cell.classList.add("lifted");
  showGhost(it);
  drag = { it, el, cell, id: e.pointerId };
  const pos = (ev) => { el.style.transform = `translate(${ev.clientX - 42}px, ${ev.clientY - 42}px) rotate(-4deg) scale(1.06)`; };
  pos(e);
  const move = (ev) => { if (ev.pointerId === drag.id) pos(ev); };
  const end = (ev) => {
    if (ev.pointerId !== drag.id) return;
    removeEventListener("pointermove", move); removeEventListener("pointerup", end); removeEventListener("pointercancel", end);
    finishDrag(ev, ev.type === "pointerup");
  };
  addEventListener("pointermove", move);
  addEventListener("pointerup", end);
  addEventListener("pointercancel", end);
}
/** Screen-space centre + snap radius of an item's spot. */
function spotOnScreen(it) {
  const box = new THREE.Box3().setFromObject(it.obj);
  const r = canvas.getBoundingClientRect();
  const toScreen = (v) => { const p = v.clone().project(camera); return { x: r.left + (p.x + 1) / 2 * r.width, y: r.top + (1 - p.y) / 2 * r.height }; };
  const c = toScreen(box.getCenter(new THREE.Vector3()));
  let ext = 0;
  for (let i = 0; i < 8; i++) {
    const s = toScreen(new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z));
    ext = Math.max(ext, Math.hypot(s.x - c.x, s.y - c.y));
  }
  // a spot that's tiny on screen (a cup seen from the zone view) still takes a generous drop
  return { ...c, radius: THREE.MathUtils.clamp(ext * 0.8, ext < 40 ? 90 : 60, 160) };
}
function finishDrag(ev, dropped) {
  const { it, el, cell } = drag;
  const spot = spotOnScreen(it);
  hideGhost();
  const tray = $("tray").getBoundingClientRect();
  const overTray = ev.clientX >= tray.left && ev.clientX <= tray.right && ev.clientY >= tray.top && ev.clientY <= tray.bottom;
  if (dropped && !overTray && Math.hypot(ev.clientX - spot.x, ev.clientY - spot.y) <= spot.radius) {
    el.classList.add("in");
    el.style.transform = `translate(${spot.x - 42}px, ${spot.y - 42}px) scale(0.6)`;
    setTimeout(() => el.remove(), 200);
    drag = null;
    land(it);
    return;
  }
  // not there yet: the thumbnail floats home, nothing else happens
  const home = cell.getBoundingClientRect();
  el.classList.add("back");
  requestAnimationFrame(() => {
    el.style.transform = `translate(${home.left + home.width / 2 - 42}px, ${home.top + home.height / 2 - 42}px) scale(0.7)`;
  });
  let home_ = false;
  const done = () => { if (home_) return; home_ = true; el.remove(); cell.classList.remove("lifted"); if (dropped) tock(true); };
  if (reduced.matches) done(); else { el.addEventListener("transitionend", done, { once: true }); setTimeout(done, 450); }
  drag = null;
}

// ---- landing: drop, squash, settle ----------------------------------------
const anims = [];
function land(it) {
  placed.add(it.id);
  save();
  it.obj.visible = true;
  if (!reduced.matches) {
    const h = new THREE.Box3().setFromObject(it.obj).getSize(new THREE.Vector3()).y;
    anims.push({ it, t0: performance.now(), lift: Math.min(60, 12 + h * 0.3) });
    setTimeout(() => tock(), 200); // the moment it touches down
  } else tock();
  renderUI();
  celebrate(it);
}
function stepAnims(now) {
  for (let i = anims.length - 1; i >= 0; i--) {
    const a = anims[i], { obj, base } = a.it, k = Math.min(1, (now - a.t0) / 520);
    const fall = Math.min(1, k / 0.4);
    obj.position.y = base.y + a.lift * (1 - fall * fall);
    const s = k < 0.4 ? 0 : Math.sin(((k - 0.4) / 0.6) * Math.PI) * 0.1 * (1 - (k - 0.4) / 0.6 * 0.5);
    obj.scale.set(base.scale.x * (1 + s * 0.5), base.scale.y * (1 - s), base.scale.z * (1 + s * 0.5));
    if (k >= 1) { obj.position.y = base.y; obj.scale.copy(base.scale); anims.splice(i, 1); }
  }
}

// ---- gentle completion moments --------------------------------------------
let glowFx = null;
function celebrate(it) {
  const z = count(zoneItems(it.level, it.zone));
  const all = count([...items.values()]);
  if (all.total && all.done === all.total) {
    glowFx = { box: storeyBox(it.level), t0: performance.now(), dur: 1800 };
    setTimeout(() => {
      go([{ kind: "building" }]);
      orbitNext = !reduced.matches; // one slow circle once the camera has eased out

    }, 1400);
    return;
  }
  if (z.done === z.total) {
    const zb = zoneBoxes(it.level, it.zone).reduce((a, b) => a.union(b));
    glowFx = { box: zb, t0: performance.now(), dur: 1800 };
    if (viewZone() === it.zone) setTimeout(() => { if (!drag) flyTo(frame(view(), 1.15), 1600); }, 500);
  }
}
function stepGlow(now) {
  if (!glowFx) return;
  const k = (now - glowFx.t0) / glowFx.dur;
  if (k >= 1 || reduced.matches) { glowFx = null; if (!hovered) hoverBox.visible = false; else showBox(hovered.box); return; }
  showBox(glowFx.box, 0.16 * Math.sin(k * Math.PI));
}

// ---- tray --------------------------------------------------------------------
function cellFor(it) {
  const cell = document.createElement("div");
  cell.className = "cell";
  const parent = it.parent && items.get(it.parent);
  // at the zone level, things that sit on a focus piece are placed from inside that piece
  const far = it.scope && view().kind === "zone";
  const state = placed.has(it.id) ? "placed" : parent && !placed.has(parent.id) ? "locked" : far ? "far" : "open";
  if (state !== "open") cell.classList.add(state);
  let img;
  if (thumbs.has(it.id)) { img = document.createElement("img"); img.src = thumbs.get(it.id); }
  else { img = document.createElement("img"); img.className = "noimg"; img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"; }
  img.alt = ""; img.draggable = false; img.dataset.thumb = it.id;
  const name = document.createElement("span"); name.className = "name"; name.textContent = L(it.label);
  cell.append(img, name);
  if (state === "locked") {
    const note = document.createElement("span"); note.className = "note"; note.textContent = T().unlocks(L(parent.label));
    cell.append(note);
  } else if (state === "far") {
    const host = items.get(it.scope);
    const note = document.createElement("span"); note.className = "note"; note.textContent = T().zoomTo(L(host.label));
    cell.append(note);
    cell.setAttribute("role", "button"); cell.tabIndex = 0;
    const fly_ = () => goInto({ kind: "item", id: host.id });
    cell.addEventListener("click", fly_);
    cell.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fly_(); } });
  }
  if (!thumbs.has(it.id)) { const q = thumbQueue.indexOf(it.id); if (q > 0) thumbQueue.unshift(...thumbQueue.splice(q, 1)); }
  if (state === "open") cell.addEventListener("pointerdown", (e) => startPending(e, it, cell));
  cell.title = L(it.label);
  return { cell, order: { open: 0, far: 1, locked: 2 }[state] ?? 3 };
}
function row(label, prog, onClick, disabledNote) {
  const b = document.createElement("button");
  b.type = "button"; b.className = "row";
  const a = document.createElement("span"); a.textContent = label;
  const c = document.createElement("span"); c.className = "small";
  c.textContent = disabledNote || (prog.total ? `${prog.done} / ${prog.total}` : "");
  if (prog.total && prog.done === prog.total) b.classList.add("done");
  b.append(a, c);
  if (disabledNote) b.disabled = true; else b.addEventListener("click", onClick);
  return b;
}
function crumbLabel(v) {
  if (v.kind === "building") return T().cafe;
  if (v.kind === "storey") return STOREY_NAME[lang][v.level] || `L${v.level}`;
  if (v.kind === "zone") return L(LEVELS[v.level].zones[v.zone].label);
  return L(items.get(v.id).label);
}
let confirming = false;
const layerPref = new Map();
function renderUI() {
  const t = T(), v = view();
  document.documentElement.lang = lang === "en" ? "en" : "zh";
  document.title = t.pageTitle;
  $("brand").textContent = t.brand;
  $("lang-toggle").textContent = t.toggle;
  $("back").textContent = t.back;
  $("back").hidden = path.length < 2;
  $("mute").textContent = muted ? "🔇" : "🔈";
  $("mute").setAttribute("aria-pressed", String(muted));
  $("mute").title = $("mute").ariaLabel = muted ? t.unmute : t.mute;
  $("help").title = $("help").ariaLabel = t.help;
  if (!$("hint-card").hidden) fillHint();
  // breadcrumb
  const crumbs = $("crumbs");
  crumbs.replaceChildren();
  path.forEach((p, i) => {
    if (i) { const s = document.createElement("span"); s.className = "sep"; s.textContent = "›"; crumbs.append(s); }
    if (i === path.length - 1) { const s = document.createElement("span"); s.className = "here"; s.textContent = crumbLabel(p); crumbs.append(s); }
    else { const b = document.createElement("button"); b.type = "button"; b.textContent = crumbLabel(p); b.addEventListener("click", () => go(path.slice(0, i + 1))); crumbs.append(b); }
  });
  // tray
  const body = $("tray-body");
  body.replaceChildren();
  $("tray-title").textContent = crumbLabel(v);
  const all = count([...items.values()]);
  if (all.total && all.done === all.total) {
    const p = document.createElement("p"); p.className = "done-note small"; p.textContent = t.allDone; body.append(p);
  }
  if (v.kind === "building") {
    $("tray-hint").textContent = t.hintBuilding;
    $("tray-progress").textContent = all.total ? `${all.done} / ${all.total}` : "";
    const rows = document.createElement("div"); rows.className = "rows";
    for (const s of storeys) rows.append(row(STOREY_NAME[lang][s.level], count(levelItems(s.level)), () => goInto({ kind: "storey", level: s.level })));
    body.append(rows);
  } else if (v.kind === "storey") {
    $("tray-hint").textContent = t.hintStorey;
    const lp = count(levelItems(v.level));
    $("tray-progress").textContent = lp.total ? `${lp.done} / ${lp.total}` : "";
    const rows = document.createElement("div"); rows.className = "rows";
    for (const [zone, z] of Object.entries(LEVELS[v.level].zones)) {
      rows.append(row(L(z.label), count(zoneItems(v.level, zone)), () => goInto({ kind: "zone", level: v.level, zone })));
    }
    body.append(rows);
  } else {
    const level = viewLevel(), zone = viewZone(), scope = v.kind === "item" ? v.id : null;
    const zp = count(zoneItems(level, zone));
    const sp = scope ? count(descendants(scope)) : zp;
    $("tray-progress").textContent = scope ? `${sp.done} / ${sp.total}` : `${zp.done} / ${zp.total}`;
    if (zp.total && zp.done === zp.total) {
      const p = document.createElement("p"); p.className = "done-note small"; p.textContent = t.zoneDone; body.append(p);
    }
    // zone view: everything in the zone, small things included (locked until their parent is in);
    // focus view: just what sits on that piece
    const here = scope ? descendants(scope) : zoneItems(level, zone);
    $("tray-hint").textContent = here.length ? t.hintZone : t.hintEmpty;
    const layers = [...new Set(here.map((it) => it.layer))].sort((a, b) => a - b);
    for (const ly of layers) {
      const list = here.filter((it) => it.layer === ly), lc = count(list), complete = lc.done === lc.total;
      const key = `${scope || `${level}/${zone}`}|${ly}`, pref = layerPref.get(key);
      // a finished layer folds itself away; a choice the player made holds until the layer's state changes
      const collapsed = pref && pref.complete === complete ? pref.collapsed : complete;
      const sec = document.createElement("section");
      sec.className = "layer" + (collapsed ? " collapsed" : "") + (complete ? " complete" : "");
      const h = document.createElement("button"); h.type = "button"; h.className = "layer-head";
      h.setAttribute("aria-expanded", String(!collapsed));
      const name = document.createElement("span");
      name.textContent = LAYER[lang][ly] || (lang === "zh" ? `${"①②③④⑤⑥⑦⑧⑨"[ly - 1] || ly} 第 ${ly} 层` : `${ly}. Layer ${ly}`);
      const cnt = document.createElement("span"); cnt.className = "count"; cnt.textContent = `${lc.done}/${lc.total} ${collapsed ? "▸" : "▾"}`;
      h.append(name, cnt);
      h.addEventListener("click", () => { layerPref.set(key, { complete, collapsed: !collapsed }); renderUI(); });
      const cells = document.createElement("div"); cells.className = "cells";
      list.map(cellFor).sort((a, b) => a.order - b.order).forEach((c) => cells.append(c.cell));
      sec.append(h, cells);
      body.append(sec);
    }
    const focusHere = [...items.values()].filter((it) => it.level === level && it.zone === zone && it.scope === scope && it.focus && descendants(it.id).length);
    if (focusHere.length) {
      const sec = document.createElement("section"); sec.className = "layer closer";
      const h = document.createElement("h3"); h.textContent = t.closerShort;
      const chips = document.createElement("div"); chips.className = "chips";
      for (const it of focusHere) {
        const c = count(descendants(it.id));
        const b = document.createElement("button"); b.type = "button"; b.className = "chip";
        b.textContent = L(it.label);
        const n = document.createElement("span"); n.className = "n"; n.textContent = `${c.done}/${c.total}`; b.append(n);
        if (c.total && c.done === c.total) b.classList.add("done");
        if (placed.has(it.id)) b.addEventListener("click", () => goInto({ kind: "item", id: it.id }));
        else { b.disabled = true; b.title = t.unlocksAfter(L(it.label)); }
        chips.append(b);
      }
      sec.append(h, chips);
      body.append(sec);
    }
  }
  // start over, with an inline two-step confirm
  const foot = $("tray-foot");
  foot.replaceChildren();
  const btn = (txt, fn) => { const b = document.createElement("button"); b.type = "button"; b.className = "linkish-btn"; b.textContent = txt; b.addEventListener("click", fn); return b; };
  if (!confirming) foot.append(btn(t.restart, () => { confirming = true; renderUI(); }));
  else {
    const s = document.createElement("span"); s.textContent = t.sure;
    foot.append(s, btn(t.yes, startOver), btn(t.no, () => { confirming = false; renderUI(); }));
  }
}
function startOver() {
  confirming = false;
  placed.clear();
  save();
  anims.length = 0;
  for (const it of items.values()) { it.obj.visible = false; it.obj.position.y = it.base.y; it.obj.scale.copy(it.base.scale); }
  go([{ kind: "building" }]);
}
$("back").addEventListener("click", goBack);
$("mute").addEventListener("click", () => {
  muted = !muted;
  try { localStorage.setItem(MUTE_KEY, muted ? "1" : "0"); } catch {}
  renderUI();
  if (!muted) { wakeAudio(); setTimeout(() => tock(true), 30); }
});

// ---- first-play hint: a quiet card, gone after ~6 s or a click; "?" brings it back
const HINT_KEY = "cafe-hint-seen-v1";
let hintTimer = 0;
function fillHint() {
  const t = T();
  $("hint-title").textContent = t.hintTitle;
  $("hint-list").replaceChildren(...t.hintItems.map((x) => { const li = document.createElement("li"); li.textContent = x; return li; }));
  $("hint-close").textContent = t.hintClose;
}
function showHint() {
  const card = $("hint-card");
  fillHint();
  card.hidden = false; card.classList.remove("fading");
  clearTimeout(hintTimer);
  hintTimer = setTimeout(hideHint, 6000);
  try { localStorage.setItem(HINT_KEY, "1"); } catch {}
}
function hideHint() {
  const card = $("hint-card");
  if (card.hidden || card.classList.contains("fading")) return;
  clearTimeout(hintTimer);
  card.classList.add("fading");
  setTimeout(() => { if (card.classList.contains("fading")) card.hidden = true; }, reduced.matches ? 0 : 800);
}
$("hint-card").addEventListener("click", hideHint);
// a tap that only closes the hint shouldn't also zoom into whatever is under it
canvas.addEventListener("pointerdown", () => {
  const card = $("hint-card");
  if (card.hidden || card.classList.contains("fading")) return;
  down = null;
  hideHint();
});
$("help").addEventListener("click", () => ($("hint-card").hidden ? showHint() : hideHint()));
let hintSeen = false;
try { hintSeen = localStorage.getItem(HINT_KEY) === "1"; } catch {}
$("lang-toggle").addEventListener("click", () => {
  lang = lang === "zh" ? "en" : "zh";
  try { localStorage.setItem(LANG_KEY, lang); } catch {}
  renderUI();
});

// ---- loop --------------------------------------------------------------------
let lastSize = "";
function resize() {
  const t = $("tray").getBoundingClientRect();
  const w = canvas.clientWidth, h = canvas.clientHeight, key = `${w}x${h}|${Math.round(t.left)},${Math.round(t.top)}`;
  if (key === lastSize) return;
  lastSize = key;
  renderer.setSize(w, h, false);
  measure();
  if (!fly && !orbit) { const f = frame(view()); camera.position.copy(f.p); look.copy(f.t); }
}
const [rx0, rx1] = ROOM.x;
// what hangs on / sits against each wall hides with it, or it would float in the air
const onWall = storeys.map((s) => wallAttached(s.group));
const itemOf = (o) => [...items.values()].find((it) => it.obj === o);
for (const on of onWall) for (const w of Object.keys(on)) on[w] = on[w].map((o) => ({ o, it: itemOf(o) }));
function tick(now) {
  resize();
  pumpThumbs();
  if (fly) {
    const k = fly.dur ? Math.min(1, (now - fly.t0) / fly.dur) : 1, e = ease(k);
    camera.position.lerpVectors(fly.from, fly.p, e);
    look.lerpVectors(fly.fromT, fly.t, e);
    if (k >= 1) {
      fly = null;
      if (orbitNext) { orbitNext = false; orbit = { t0: now, dur: 24000, from: camera.position.clone(), c: look.clone() }; }
    }
  }
  if (orbit) {
    const k = Math.min(1, (now - orbit.t0) / orbit.dur);
    const a = ease(k) * Math.PI * 2;
    const rel = orbit.from.clone().sub(orbit.c).applyAxisAngle(new THREE.Vector3(0, 1, 0), a);
    camera.position.copy(orbit.c).add(rel);
    if (k >= 1) orbit = null;
  }
  camera.lookAt(look);
  for (const s of storeys) {
    s.walls.left.visible = camera.position.x > rx0;
    s.walls.right.visible = camera.position.x < rx1;
    // while circling, the back wall hides when the camera is behind it
    s.walls.back.visible = camera.position.z > 0;
    const on = onWall[storeys.indexOf(s)];
    for (const w of ["left", "right", "back"]) {
      for (const { o, it } of on[w]) o.visible = s.walls[w].visible && (!it || placed.has(it.id));
    }
  }
  ghostMat.uniforms.uTime.value = now / 1000;
  stepAnims(now);
  stepGlow(now);
  stepMarker(now);
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
resize();
applyCut();
{ const f = frame(view()); camera.position.copy(f.p); look.copy(f.t); }
renderUI();
// read-only handle for poking at the page from devtools, only with ?debug
if (debug) globalThis.__play = { camera, free: () => free, items, placed, spot: (id) => spotOnScreen(items.get(id)), path: () => path, go, frame };
if (!hintSeen) showHint();
if (devTags) console.info("[play] dev fallback tags are active (no zone tags found)");
requestAnimationFrame(tick);
