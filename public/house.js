// The finished house: both halves stood up as the two walls of a room corner.
// This is the reward view, so it may move — but only slowly and a little.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const token = location.pathname.split("/").pop();
const $ = (id) => document.getElementById(id);

const state = await fetch(`/api/s/${token}`).then((r) => r.json());
const [room, manifest] = await Promise.all([
  fetch(`/api/rooms/${state.room}`).then((r) => r.json()),
  fetch("/manifest.json").then((r) => r.json()),
]);

const TEXT = {
  zh: { brand: "小镇一角", back: "回到我的那一半", left: "正面看左墙", right: "正面看右墙", corner: "回到墙角", toggle: "EN" },
  en: { brand: "A Corner of Town", back: "Back to my half", left: "Face left wall", right: "Face right wall", corner: "Back to corner", toggle: "中文" },
};
const LANG_KEY = "lang";
let lang = "zh";
try { lang = localStorage.getItem(LANG_KEY) || "zh"; } catch {}
function applyLang() {
  const t = TEXT[lang];
  document.documentElement.lang = lang === "zh" ? "zh" : "en";
  $("brand").textContent = t.brand;
  $("back").textContent = t.back;
  $("v-left").textContent = t.left;
  $("v-right").textContent = t.right;
  $("v-corner").textContent = t.corner;
  $("lang-toggle").textContent = t.toggle;
}
applyLang();
$("back").href = `/s/${token}`;
$("lang-toggle").addEventListener("click", () => {
  lang = lang === "zh" ? "en" : "zh";
  try { localStorage.setItem(LANG_KEY, lang); } catch {}
  applyLang();
});

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const U = 100; // scene units per world unit: each 1000-wide half is a 10-wide wall
const WALL = manifest.canvas.w / U;
const F = manifest.canvas.floorLine; // the painted floor line becomes the real floor
const WALL_H = F / U;

// ---- renderer, scene, lights ----
const canvas = $("house");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);

scene.add(new THREE.HemisphereLight(0xfff1dc, 0x8a6a4a, 1.6));
const sun = new THREE.DirectionalLight(0xffe2b8, 1.3);
sun.position.set(12, 14, 10);
sun.target.position.set(3, 0, 3);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.radius = 6; // soft, never crisp
sun.shadow.bias = -0.0005;
Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 50 });
scene.add(sun, sun.target);

// ---- textures ----
const loader = new THREE.TextureLoader();
const load = (id) =>
  loader.loadAsync(`/stickers/${id}.webp`).then((t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  });

function plane(tex, w, h) {
  const mat = new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  // shadows follow the sticker's outline, not its square
  mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 });
  mesh.castShadow = true;
  return mesh;
}

function softDot() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

// floorboards drawn by hand so there's no extra asset to keep in sync
function boards() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  const tones = ["#c99a68", "#c2925f", "#cfa271", "#c69764"];
  for (let i = 0; i < 8; i++) {
    g.fillStyle = tones[i % tones.length];
    g.fillRect(0, i * 32, 256, 32);
    g.fillStyle = "rgba(90,60,35,.35)";
    g.fillRect(0, i * 32, 256, 2);
    g.fillRect(((i * 97) % 256), i * 32, 2, 32);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2.5, 2.5);
  return t;
}

// ---- layout: where each placed sticker stands in its wall's frame ----
// Frame: X along the wall (scene left→right), Y up from the floor, Z out into the room.
const floorDepth = (foot) => 0.3 + Math.max(0, foot - F) / U * 0.8;

async function buildSide(side) {
  const all = manifest.sides[side];
  const bg = all.find((s) => s.bg);
  const placed = new Set(room[side]);
  const list = all.filter((s) => !s.bg && placed.has(s.id));
  const texs = await Promise.all([bg, ...list].map((s) => load(s.id)));
  const bgTex = texs.shift();
  const texById = new Map(list.map((s, i) => [s.id, texs[i]]));

  // the same contain-and-bottom-centre fit as the sticker page
  const rect = (s) => {
    const img = texById.get(s.id).image;
    const k = Math.min(s.w / img.width, s.h / img.height);
    const w = img.width * k, h = img.height * k;
    return { x: s.x + (s.w - w) / 2, y: s.y + s.h - h, w, h };
  };
  const nearCorner = (r) => (side === "left" ? manifest.canvas.w - (r.x + r.w) : r.x) / U;

  const hinge = new THREE.Group();
  const wallTex = bgTex.clone();
  wallTex.repeat.set(1, F / 1000);
  wallTex.offset.set(0, 1 - F / 1000);
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(WALL, WALL_H),
    new THREE.MeshStandardMaterial({ map: wallTex, roughness: 1, side: THREE.DoubleSide }),
  );
  wall.position.set(WALL / 2, WALL_H / 2, 0);
  wall.receiveShadow = true;
  hinge.add(wall);

  const pose = new Map(); // id → { d, lift }
  const items = [];
  // floor things first: surface and sitting things borrow their host's depth
  const order = [...list].sort((a, b) => (a.mount === "floor" && !a.sit ? 0 : 1) - (b.mount === "floor" && !b.sit ? 0 : 1));
  for (const s of order) {
    const r = rect(s);
    const foot = r.y + r.h;
    let d = 0.02 + s.z * 0.002, lift = 0;
    let host;
    if (s.mount === "surface") {
      const cx = r.x + r.w / 2;
      host = list.find((o) => o.id === s.pinHost && pose.has(o.id)) ||
        list.filter((o) => o.top && pose.has(o.id)).sort((a, b) => {
          const da = Math.abs(cx - (rect(a).x + rect(a).w / 2)), db = Math.abs(cx - (rect(b).x + rect(b).w / 2));
          return da - db;
        })[0];
    } else if (s.sit) {
      const cx = r.x + r.w / 2;
      host = list.find((o) => {
        const q = pose.has(o.id) && rect(o);
        return q && o.mount === "floor" && !o.sit && cx > q.x && cx < q.x + q.w && foot > q.y && foot < q.y + q.h;
      });
    }
    if (host) {
      ({ d, lift } = pose.get(host.id));
      d += 0.03;
    } else if (s.mount === "floor" || s.sit) {
      // things near the corner can't stand far out, or they'd walk through the other wall's things
      d = Math.min(floorDepth(foot), 0.85 * Math.max(nearCorner(r), 0.6)) + s.z * 0.003;
      lift = (foot - F) / U;
    }
    pose.set(s.id, { d, lift });

    const tex = texById.get(s.id);
    const w = r.w / U, h = r.h / U;
    const holder = new THREE.Group();
    const cx = r.x / U + w / 2;
    const top = (F - r.y) / U + lift; // lift raises a thing whose foot was painted below the floor line
    if (s.mount === "flat") {
      // a rug lies down: its top edge toward the wall, its bottom edge out into the room
      const z0 = floorDepth(r.y), z1 = floorDepth(foot);
      const mesh = plane(tex, w, Math.max(z1 - z0, 0.4));
      mesh.rotation.x = -Math.PI / 2;
      mesh.castShadow = false;
      mesh.receiveShadow = true;
      holder.add(mesh);
      holder.position.set(cx, 0.01 + s.z * 0.001, (z0 + z1) / 2);
      items.push({ s, holder, d: (z0 + z1) / 2, flat: true });
      hinge.add(holder);
      continue;
    }
    const mesh = plane(tex, w, h);
    // pivot where the thing would actually hang or stand from, so idle motion reads right
    const fromTop = s.id === "l-sign" || s.id === "r-vine";
    mesh.position.y = fromTop ? -h / 2 : h / 2;
    holder.add(mesh);
    holder.position.set(cx, fromTop ? top : top - h, d);
    items.push({ s, holder, mesh, d, w, h });
    hinge.add(holder);
  }

  const mount = new THREE.Group();
  if (side === "left") {
    mount.rotation.y = Math.PI / 2; // frame X runs back toward the corner along world -z
    mount.position.z = WALL;
  }
  mount.add(hinge);
  hinge.traverse((o) => { o.userData.side = side; });
  scene.add(mount);
  return { hinge, items };
}

const sides = { left: await buildSide("left"), right: await buildSide("right") };

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(WALL, WALL),
  new THREE.MeshStandardMaterial({ map: boards(), roughness: 1 }),
);
floor.rotation.x = -Math.PI / 2;
floor.position.set(WALL / 2, 0, WALL / 2);
floor.receiveShadow = true;
const floorPivot = new THREE.Group(); // scales out from the corner as the page opens
floorPivot.add(floor);
scene.add(floorPivot);

// ---- idle bits, only for things actually placed ----
const find = (id) => [...sides.left.items, ...sides.right.items].find((i) => i.s.id === id);
const dot = softDot();
const steam = [];
const machine = find("l-machine");
if (machine) {
  for (let i = 0; i < 4; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: 0xfffaf2, transparent: true, depthWrite: false, opacity: 0 }));
    machine.holder.add(sp);
    steam.push({ sp, phase: i / 4 });
  }
}
let lampLight, lampGlow;
const lamp = find("r-lamp");
if (lamp) {
  lampLight = new THREE.PointLight(0xffb45a, 2, 6, 1.6);
  lampLight.position.set(0, lamp.h * 0.82, 0.35);
  lamp.holder.add(lampLight);
  const m = lamp.mesh.material;
  m.emissive = new THREE.Color(0xffc070);
  m.emissiveMap = m.map;
  lampGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: 0xffc070, transparent: true, depthWrite: false, opacity: 0.35, blending: THREE.AdditiveBlending }));
  lampGlow.scale.set(lamp.w * 1.6, lamp.w * 1.6, 1);
  lampGlow.position.set(0, lamp.h * 0.82, 0.05);
  lamp.holder.add(lampGlow);
}
const sign = find("l-sign"), vine = find("r-vine"), plant = find("l-plant");
let nextRustle = 6;

function idle(t) {
  if (sign) sign.holder.rotation.z = Math.sin(t * 0.6) * 0.035;
  if (vine) vine.holder.rotation.z = Math.sin(t * 0.33) * 0.012;
  if (plant) {
    // now and then, as if someone walked past
    if (t > nextRustle + 3) nextRustle = t + 7 + Math.random() * 6;
    const k = t - nextRustle;
    plant.holder.rotation.z = k > 0 && k < 3 ? Math.sin(k * 5) * 0.025 * Math.exp(-k * 1.4) : 0;
  }
  for (const p of steam) {
    const k = (t / 6 + p.phase) % 1;
    p.sp.position.set(Math.sin(k * 6 + p.phase * 9) * 0.06, machine.h + 0.05 + k * 0.9, 0.05);
    const s = 0.15 + k * 0.35;
    p.sp.scale.set(s, s, 1);
    p.sp.material.opacity = Math.sin(k * Math.PI) * 0.45;
  }
  if (lampLight) {
    const pulse = Math.sin(t * 0.5);
    lampLight.intensity = 2 + pulse * 0.4;
    lamp.mesh.material.emissiveIntensity = 0.18 + pulse * 0.06;
    lampGlow.material.opacity = 0.3 + pulse * 0.08;
  }
}

// ---- reveal: a pop-up book opening ----
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const span = (p, a, b) => ease((p - a) / (b - a));
function unfold(p) {
  const f = Math.max(span(p, 0, 0.35), 0.001);
  floorPivot.scale.set(f, 1, f);
  const up = span(p, 0.15, 0.65);
  for (const side of Object.values(sides)) {
    side.hinge.rotation.x = -(Math.PI / 2) * (1 - up);
    const lift = span(p, 0.5, 0.9);
    for (const it of side.items) {
      if (!it.flat) it.holder.position.z = Math.max(it.d * lift, 0.005);
    }
  }
}

// ---- camera ----
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.rotateSpeed = 0.5;
const CENTER_Y = WALL_H * 0.42; // a touch low: floor things stand out toward you and loom larger
const views = {
  corner: () => {
    const fit = Math.max(1, 1.25 / camera.aspect);
    return { pos: new THREE.Vector3(16, 0, 16).multiplyScalar(fit).setY(7.5 + fit), target: new THREE.Vector3(3.2, 2.6, 3.2) };
  },
  left: () => ({ pos: new THREE.Vector3(faceDist(), CENTER_Y, WALL / 2), target: new THREE.Vector3(0, CENTER_Y, WALL / 2) }),
  right: () => ({ pos: new THREE.Vector3(WALL / 2, CENTER_Y, faceDist()), target: new THREE.Vector3(WALL / 2, CENTER_Y, 0) }),
};
function faceDist() {
  const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  return Math.max(WALL_H / 2 / tan, WALL / 2 / (tan * camera.aspect)) * 1.2;
}
let mode = "corner";
function limits() {
  if (mode === "corner") {
    Object.assign(controls, {
      minAzimuthAngle: 0.12, maxAzimuthAngle: Math.PI / 2 - 0.12,
      minPolarAngle: 0.3, maxPolarAngle: Math.PI / 2 - 0.08,
      minDistance: 5, maxDistance: 35, enablePan: false,
    });
  } else {
    const az = mode === "left" ? Math.PI / 2 : 0;
    // straight-on: a little tilt allowed, but zoom right in to read the small stickers
    Object.assign(controls, {
      minAzimuthAngle: az - 0.35, maxAzimuthAngle: az + 0.35,
      minPolarAngle: Math.PI / 2 - 0.35, maxPolarAngle: Math.PI / 2 - 0.02,
      minDistance: 1, maxDistance: faceDist() * 1.3, enablePan: true, screenSpacePanning: true,
    });
  }
}
// keep a panned face view on its wall
function clampTarget() {
  if (mode === "corner") return;
  const t = controls.target;
  t.y = THREE.MathUtils.clamp(t.y, 0.3, WALL_H);
  if (mode === "left") { t.x = 0; t.z = THREE.MathUtils.clamp(t.z, 0, WALL); }
  else { t.z = 0; t.x = THREE.MathUtils.clamp(t.x, 0, WALL); }
}

let flight = null;
function fly(to, duration = 1.6) {
  mode = to;
  for (const v of ["left", "corner", "right"]) $(`v-${v}`).setAttribute("aria-pressed", String(v === to));
  const end = views[to]();
  controls.enabled = false;
  if (reduced) return land(end);
  flight = { from: camera.position.clone(), fromT: controls.target.clone(), end, t0: clock.getElapsedTime(), duration };
}
function land(end) {
  camera.position.copy(end.pos);
  controls.target.copy(end.target);
  flight = null;
  limits();
  controls.enabled = true;
  controls.update();
}
for (const v of ["left", "corner", "right"]) $(`v-${v}`).addEventListener("click", () => fly(v));

// tap a wall (or anything on it) to face it
const ray = new THREE.Raycaster();
let downAt = null;
canvas.addEventListener("pointerdown", (e) => { downAt = { x: e.clientX, y: e.clientY }; });
canvas.addEventListener("pointerup", (e) => {
  if (!downAt || flight || !controls.enabled) return;
  if (Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 6) return;
  const box = canvas.getBoundingClientRect();
  ray.setFromCamera(new THREE.Vector2(((e.clientX - box.left) / box.width) * 2 - 1, -((e.clientY - box.top) / box.height) * 2 + 1), camera);
  const hit = ray.intersectObjects([sides.left.hinge, sides.right.hinge], true)[0];
  const side = hit?.object.userData.side;
  if (side && side !== mode) fly(side);
});

function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(canvas);
resize();

// ---- loop ----
const clock = new THREE.Clock();
const REVEAL = 4.5;
const start = { pos: new THREE.Vector3(9, 20, 9), target: new THREE.Vector3(1, 0, 1) };
let revealing = !reduced;
controls.enabled = false;
if (reduced) { unfold(1); land(views.corner()); }
else { camera.position.copy(start.pos); controls.target.copy(start.target); }
$("v-corner").setAttribute("aria-pressed", "true");

renderer.setAnimationLoop(() => {
  const t = clock.getElapsedTime();
  if (revealing) {
    const p = Math.min(t / REVEAL, 1);
    unfold(p);
    const c = ease(span(p, 0.1, 1));
    const end = views.corner();
    camera.position.lerpVectors(start.pos, end.pos, c);
    controls.target.lerpVectors(start.target, end.target, c);
    camera.lookAt(controls.target);
    if (p >= 1) { revealing = false; land(end); }
  } else if (flight) {
    const k = ease((t - flight.t0) / flight.duration);
    camera.position.lerpVectors(flight.from, flight.end.pos, k);
    controls.target.lerpVectors(flight.fromT, flight.end.target, k);
    camera.lookAt(controls.target);
    if (k >= 1) land(flight.end);
  } else {
    clampTarget();
    controls.update();
  }
  // a reduced-motion viewer gets the house held still
  if (!reduced) idle(t);
  renderer.render(scene, camera);
});
