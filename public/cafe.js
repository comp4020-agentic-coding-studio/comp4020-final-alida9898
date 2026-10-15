// Full 3D clay café preview: dollhouse cutaway, open front faces +Z.
// Frame + zones: public/cafe/README.md.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { STOREY_H, levelY } from "./cafe/zones.js";
import { buildShop, wallAttached } from "./cafe/build.js";
import { loadShopType, typeFromUrl } from "./shops/index.js";
import { currentSeason } from "./shops/season.js";

// the shop type (?type=, default café) and its season (?season= / server / date)
const def = await loadShopType(typeFromUrl());
const season = await currentSeason();
const { room: ROOM, levels: LEVELS } = def;
const YARD = def.yard;

const $ = (id) => document.getElementById(id);

// ---- language (same pattern as side.js) ----------------------------------
const TEXT = {
  zh: { brand: "小镇一角", place: "街角咖啡馆", toggle: "EN",
    views: { overview: "全景", "level-0": "一楼", "level-1": "二楼" } },
  en: { brand: "A Corner of Town", place: "The corner café", toggle: "中文",
    views: { overview: "Overview", "level-0": "Ground floor", "level-1": "Upstairs" } },
};
const LANG_KEY = "lang";
let lang = "zh";
try { lang = localStorage.getItem(LANG_KEY) || "zh"; } catch {}
function applyLang() {
  const t = TEXT[lang] || TEXT.zh;
  document.documentElement.lang = lang === "en" ? "en" : "zh";
  $("brand").textContent = t.brand;
  $("place").textContent = t.place;
  $("lang-toggle").querySelector(".tool-label").textContent = t.toggle;
  for (const b of document.querySelectorAll(".views button")) b.textContent = t.views[b.dataset.view];
}
applyLang();
$("lang-toggle").addEventListener("click", () => {
  lang = lang === "zh" ? "en" : "zh";
  try { localStorage.setItem(LANG_KEY, lang); } catch {}
  applyLang();
});

// ---- renderer / scene ------------------------------------------------------
const canvas = $("house");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf6eee2);

// warm, soft light: sky/ground fill, a warm key from front-upper-left, a gentle interior glow
scene.add(new THREE.HemisphereLight(0xfff4e6, 0xb89a80, 1.25));
const key = new THREE.DirectionalLight(0xffe9cc, 2.1);
key.position.set(-350, 1000, 1000);
key.target.position.set(0, 250, 200);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -600, right: 600, top: 700, bottom: -500, near: 100, far: 2200 });
key.shadow.radius = 5;
key.shadow.bias = -0.0006;
key.shadow.normalBias = 1.5;
scene.add(key, key.target);
const fill = new THREE.DirectionalLight(0xe8eeff, 0.5);
fill.position.set(700, 300, 600);
scene.add(fill);
const glow = new THREE.PointLight(0xffc98a, 0.9, 1200, 1.2);
glow.position.set(0, 420, 320);
scene.add(glow);

// ---- camera + controls -----------------------------------------------------
const camera = new THREE.PerspectiveCamera(38, 1, 10, 6000);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 60;
controls.maxDistance = 3000;
controls.minPolarAngle = 0.2;          // not straight down
controls.maxPolarAngle = Math.PI * 0.48; // never below the floor
controls.minAzimuthAngle = -Math.PI * 0.36; // stay on the open-front side
controls.maxAzimuthAngle = Math.PI * 0.36;

const N = LEVELS.length, TOP = N * STOREY_H;
const VIEWS = {
  overview: YARD
    ? { pos: [420, TOP * 0.6 + 120, 1350 + N * 120], target: [150, TOP * 0.42, 230] } // building + yard
    : { pos: [240, TOP * 0.6 + 120, 1250 + N * 120], target: [0, TOP * 0.46, 230] },
};
for (const { level } of LEVELS) {
  VIEWS[`level-${level}`] = { pos: [170, levelY(level) + 270, 860], target: [0, levelY(level) + 115, 220] };
}
function narrow() { return canvas.clientWidth / Math.max(1, canvas.clientHeight) < 0.9; }
function viewPos(v) {
  // on a tall phone screen, back the camera off so the room still fits
  const p = new THREE.Vector3(...v.pos), t = new THREE.Vector3(...v.target);
  if (narrow()) p.sub(t).multiplyScalar(1.7).add(t);
  return { p, t };
}
camera.position.copy(viewPos(VIEWS.overview).p);
controls.target.copy(viewPos(VIEWS.overview).t);

let fly = null;
function flyTo(name) {
  const { p, t } = viewPos(VIEWS[name]);
  fly = { from: camera.position.clone(), fromT: controls.target.clone(), p, t, t0: performance.now(), dur: 1000 };
  for (const b of document.querySelectorAll(".views button")) b.setAttribute("aria-pressed", String(b.dataset.view === name));
}
for (const b of document.querySelectorAll(".views button")) b.addEventListener("click", () => flyTo(b.dataset.view));
document.querySelector('[data-view="overview"]').setAttribute("aria-pressed", "true");
controls.addEventListener("start", () => { fly = null; });

// ---- build -----------------------------------------------------------------
const { storeys } = await buildShop(scene, def, season);
// things hung on / against a side wall go when the wall goes, or they float
const sideWalls = storeys.map((s) => ({ walls: s.walls, on: wallAttached(s.group, 35, 60, ROOM) }));

// ---- loop ------------------------------------------------------------------
function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (canvas.width !== Math.floor(w * renderer.getPixelRatio()) || canvas.height !== Math.floor(h * renderer.getPixelRatio())) {
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
  }
}
const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const [rx0, rx1] = ROOM.x, [, rz1] = ROOM.z;
function tick(now) {
  resize();
  if (fly) {
    const k = Math.min(1, (now - fly.t0) / fly.dur), e = ease(k);
    camera.position.lerpVectors(fly.from, fly.p, e);
    controls.target.lerpVectors(fly.fromT, fly.t, e);
    if (k >= 1) fly = null;
  }
  // keep the pan target inside the room
  const t = controls.target;
  t.x = THREE.MathUtils.clamp(t.x, rx0, YARD ? YARD.box.x[1] : rx1);
  t.y = THREE.MathUtils.clamp(t.y, 20, TOP);
  t.z = THREE.MathUtils.clamp(t.z, 0, rz1);
  controls.update();
  // dollhouse: a side wall the camera has swung past is hidden so it never blocks the view
  for (const { walls: w, on } of sideWalls) {
    w.left.visible = camera.position.x > rx0;
    w.right.visible = camera.position.x < rx1;
    for (const o of on.left) o.visible = w.left.visible;
    for (const o of on.right) o.visible = w.right.visible;
  }
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
