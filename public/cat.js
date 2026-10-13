// Preview page for the clay cat (public/clay/models/cat.js): one cat on a cushion,
// buttons for each motion, speed/amplitude sliders and coat swatches. Not part of the café.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as kit from "/clay/clay.js";
import { build, createCatAnimator, COATS } from "/clay/models/cat.js";

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById("view"));
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(getComputedStyle(document.body).getPropertyValue("--paper").trim() || "#f3e9da");
const camera = new THREE.PerspectiveCamera(35, 1, 1, 2000);
camera.position.set(40, 75, 120);
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 45, 0);
controls.enableDamping = true;

const rig = kit.lightRig({ shadows: true });
scene.add(rig);
const floor = new THREE.Mesh(new THREE.CircleGeometry(160, 48), kit.clay(0xe2cfb2));
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

// Simple window seat: bench + cushion. Seat top at y = 44.
const bench = kit.roundedBox(80, 36, 44, 4, "brown"); bench.position.y = 18; scene.add(bench);
const cushion = kit.roundedBox(66, 8, 38, 4, "blue"); cushion.position.y = 40; scene.add(cushion);
const SEAT_Y = 44;
// A little cup on the floor to look at.
const cup = kit.roundedCylinder(5, 9, 1.5, "terracotta"); cup.position.set(-30, 0, 45); scene.add(cup);

let cat, anim, curPose = "loaf";
function makeCat(coat) {
  const old = anim;
  if (cat) scene.remove(cat);
  cat = build(kit, { coat });
  cat.position.y = SEAT_Y;
  scene.add(cat);
  anim = createCatAnimator(cat, { reduced, speed: old?.speed ?? 1, amplitude: old?.amplitude ?? 1, idle: old?.idle ?? true });
  anim.setPose(curPose); // a coat swap keeps the chosen pose
}
makeCat("tabby");

const target = new THREE.Vector3();
const MOTIONS = [
  ["breathe", "呼吸", "Breathe"], ["flick", "甩尾巴", "Tail flick"], ["ear", "抖耳朵", "Ear twitch"],
  ["blink", "眨眼", "Blink"], ["squint", "眯眼", "Slow squint"], ["stretch", "伸懒腰", "Stretch"],
  ["lookUp", "抬头看", "Look up"], ["jump", "跳上来", "Jump up"],
];
const mBox = document.getElementById("motions");
for (const [id, zh, en] of MOTIONS) {
  const b = document.createElement("button");
  b.type = "button"; b.textContent = `${zh} ${en}`;
  b.addEventListener("click", () => {
    if (id === "lookUp") {
      // glance at a random point up and to the front, like something just placed nearby
      target.set(-40 + Math.random() * 80, SEAT_Y + 30 + Math.random() * 30, 60);
      anim.play("lookUp", target);
    } else anim.play(id);
  });
  mBox.append(b);
}

// poses + lick, and a pause / single-frame step to look at a motion frame by frame
const pBox = document.getElementById("poses");
const poseBtns = [];
for (const [id, zh, en] of [["loaf", "趴着", "Loaf"], ["walk", "走路", "Walk"], ["sit", "坐着", "Sit"]]) {
  const b = document.createElement("button");
  b.type = "button"; b.textContent = `${zh} ${en}`; b.setAttribute("aria-pressed", String(id === "loaf"));
  b.addEventListener("click", () => { curPose = id; anim.setPose(id); for (const x of poseBtns) x.setAttribute("aria-pressed", String(x === b)); });
  poseBtns.push(b); pBox.append(b);
}
const lickBtn = document.createElement("button");
lickBtn.type = "button"; lickBtn.textContent = "舔爪 Lick (坐着时 when sitting)";
lickBtn.addEventListener("click", () => anim.lick());
pBox.append(lickBtn);
let paused = false;
const pauseBtn = document.createElement("button");
pauseBtn.type = "button"; pauseBtn.textContent = "⏸ 暂停 Pause";
pauseBtn.addEventListener("click", () => { paused = !paused; pauseBtn.textContent = paused ? "▶ 继续 Play" : "⏸ 暂停 Pause"; });
const stepBtn = document.createElement("button");
stepBtn.type = "button"; stepBtn.textContent = "下一帧 Next frame ▸";
stepBtn.addEventListener("click", () => { if (!paused) pauseBtn.click(); anim.update(1 / 24); });
pBox.append(pauseBtn, stepBtn);

const cBox = document.getElementById("coats");
for (const [id, c] of Object.entries(COATS)) {
  const b = document.createElement("button");
  b.type = "button"; b.setAttribute("aria-pressed", String(id === "tabby"));
  b.innerHTML = `<span class="swatch" style="background:#${c.base.toString(16).padStart(6, "0")}"></span>${c.label[0]} ${c.label[1]}`;
  b.addEventListener("click", () => {
    for (const x of cBox.children) x.setAttribute("aria-pressed", "false");
    b.setAttribute("aria-pressed", "true");
    makeCat(id);
  });
  cBox.append(b);
}

const bindRange = (id, key) => {
  const el = /** @type {HTMLInputElement} */ (document.getElementById(id));
  el.addEventListener("input", () => { anim[key] = Number(el.value); document.getElementById(`${id}-o`).textContent = `${Number(el.value).toFixed(1)}×`; });
};
bindRange("speed", "speed"); bindRange("amp", "amplitude");
const idleEl = /** @type {HTMLInputElement} */ (document.getElementById("idle"));
idleEl.addEventListener("change", () => { anim.idle = idleEl.checked; });
if (reduced) document.getElementById("rm").textContent = "· 已减少动态 reduced motion (仅呼吸 breathing only)";

function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
}
addEventListener("resize", resize); resize();

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = clock.getDelta();
  if (!paused) anim.update(dt);
  controls.update();
  renderer.render(scene, camera);
});
// for verification from the console
Object.assign(window, { __cat: { get anim() { return anim; }, get cat() { return cat; } } });
