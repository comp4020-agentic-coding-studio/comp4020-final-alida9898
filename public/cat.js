// Preview page for the clay cat (public/clay/models/cat.js): one cat on a cushion,
// buttons for each motion, speed/amplitude sliders and coat swatches. Not part of the café.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as kit from "/clay/clay.js";
import { build, createCatAnimator, COATS, FACE } from "/clay/models/cat.js";

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

let cat, anim, curPose = "loaf", curCoat = "tabby";
// ?editor: face numbers tuned with sliders (start from the last export if there is one)
const face = { ...FACE };
function makeCat(coat) {
  const old = anim;
  if (cat) scene.remove(cat);
  curCoat = coat;
  cat = build(kit, { coat, face });
  cat.position.y = SEAT_Y;
  scene.add(cat);
  anim = createCatAnimator(cat, { reduced, speed: old?.speed ?? 1, amplitude: old?.amplitude ?? 1, idle: old?.idle ?? true });
  anim.setPose(curPose); // a coat swap keeps the chosen pose
}
makeCat("tabby");

const target = new THREE.Vector3();
const MOTIONS = [
  ["breathe", "呼吸", "Breathe"], ["flick", "甩尾巴", "Tail flick"], ["ear", "抖耳朵", "Ear twitch"],
  ["blink", "眨眼", "Blink"], ["squint", "眯眼", "Slow squint"], ["smile", "笑眯眯", "Smile"], ["stretch", "伸懒腰", "Stretch"],
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
// ---- ?editor: sliders for the head and eyes, Export writes assets/editor/cat.json ----
if (new URLSearchParams(location.search).has("editor")) {
  try { const r = await fetch("/api/editor/cat"); if (r.ok) Object.assign(face, (await r.json()).face || {}); } catch {}
  makeCat(curCoat);
  const SL = [
    ["headW", "头宽 Head width", 3, 6.5], ["headH", "头高 Head height", 2.8, 6], ["headD", "头前后 Head depth", 2.8, 6],
    ["headY", "头上下 Head up/down", 16.5, 22], ["headX", "头前后位置 Head fwd/back", 8.5, 13],
    ["eyeY", "眼睛高低 Eye height", 16.5, 23], ["eyeSpread", "两眼距离 Eye spacing", 0.25, 0.9], ["eyeSize", "眼睛大小 Eye size", 0.9, 2.4],
    ["eyeSink", "眼睛凸出 Eye bulge", 0, 1.2], ["noseY", "鼻子高低 Nose height", -2, 1],
    ["earSpread", "两耳距离 Ear spacing", 1.2, 3.5], ["earUp", "耳朵高低 Ear height", 2, 4.5],
  ];
  const panel = document.createElement("div");
  panel.style.cssText = "position:fixed;top:10px;left:10px;z-index:10;background:var(--paper);border:1.5px solid var(--stitch);border-radius:12px;padding:10px 12px;font-size:13px;max-height:calc(100vh - 20px);overflow:auto;width:260px";
  panel.innerHTML = "<b>编辑模式 · 猫的脸</b><br><span class=small>拖滑块调整，Export 存到 assets/editor/cat.json</span>";
  let timer = 0;
  for (const [k, label, lo, hi] of SL) {
    const row = document.createElement("label");
    row.style.cssText = "display:block;margin-top:6px";
    const out = document.createElement("span"); out.textContent = ` ${face[k]}`;
    const inp = Object.assign(document.createElement("input"), { type: "range", min: lo, max: hi, step: 0.05, value: face[k] });
    inp.style.width = "100%";
    // rebuilding the cat (meshing the clay) takes a moment, so wait until the slider rests
    inp.addEventListener("input", () => { face[k] = Number(inp.value); out.textContent = ` ${face[k]}`; clearTimeout(timer); timer = setTimeout(() => makeCat(curCoat), 120); });
    row.append(label, out, inp); panel.append(row);
  }
  const btns = document.createElement("div"); btns.style.marginTop = "10px";
  const reset = Object.assign(document.createElement("button"), { type: "button", textContent: "还原 Reset" });
  reset.addEventListener("click", () => { Object.assign(face, FACE); for (const i of panel.querySelectorAll("input")) { const k = SL[[...panel.querySelectorAll("input")].indexOf(i)][0]; i.value = face[k]; i.previousSibling.textContent = ` ${face[k]}`; } makeCat(curCoat); });
  const exp = Object.assign(document.createElement("button"), { type: "button", textContent: "Export" });
  const msg = document.createElement("div"); msg.className = "small"; msg.style.marginTop = "6px";
  exp.addEventListener("click", async () => {
    try {
      const r = await fetch("/api/editor/cat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ face }) });
      msg.textContent = r.ok ? "已保存到 assets/editor/cat.json" : `保存失败（${r.status}）`;
    } catch { msg.textContent = "保存失败"; }
  });
  btns.append(reset, " ", exp); panel.append(btns, msg);
  document.body.append(panel);
}

// for verification from the console
Object.assign(window, { __cat: { get anim() { return anim; }, get cat() { return cat; }, camera, controls } });
