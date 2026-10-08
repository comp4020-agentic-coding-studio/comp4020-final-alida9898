import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as kit from "/clay/clay.js";
import { SCENE } from "/clay/scene.js";
import { buildScene, addStickerRigs, renderStickers } from "/clay/pipeline.js";

const canvas = document.getElementById("view");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe9dfcf);

// room corner (layer 0 only, so sticker renders never see it)
const W = kit.WALL_W, H = kit.WALL_H;
const roomMat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 1 });
const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, W), roomMat(0xd7c3a5));
floor.rotation.x = -Math.PI / 2;
floor.position.set(-W / 2, 0, W / 2);
const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(W, H), roomMat(0xf1e4cc));
leftWall.position.set(-W / 2, H / 2, 0);
const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(W, H), roomMat(0xece0c6));
rightWall.rotation.y = -Math.PI / 2;
rightWall.position.set(0, H / 2, W / 2);
for (const m of [floor, leftWall, rightWall]) { m.receiveShadow = true; scene.add(m); }

const rig = kit.lightRig({ shadows: true });
rig.rotation.y = -Math.PI / 4; // face the corner
scene.add(rig);
addStickerRigs(scene);

const { root, parts } = await buildScene(SCENE);
scene.add(root);

const camera = new THREE.PerspectiveCamera(35, 1, 1, 5000);
camera.position.set(-520, 260, 520);
const controls = new OrbitControls(camera, canvas);
controls.target.set(-120, 60, 120);
controls.update();

function resize() {
  const { clientWidth: w, clientHeight: h } = canvas;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(canvas);
renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });

// ---- stickers --------------------------------------------------------------
const stickers = renderStickers(scene, parts);
window.__clay = { stickers: stickers.map(({ node, png, ...s }) => s), camera, controls }; // for console inspection

const sheet = document.getElementById("sheet");
for (const s of stickers) {
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `<img alt="" src="${s.png}"><code>${s.id}</code><code>${s.wall} · ${s.mount} · order ${s.order} · z ${s.z}</code><code>x${s.box.x} y${s.box.y} w${s.box.w} h${s.box.h}</code>`;
  sheet.append(card);
}

const previews = document.getElementById("previews");
const K = 320 / kit.CANVAS;
for (const wall of ["left", "right"]) {
  const div = document.createElement("div");
  div.className = "preview";
  div.title = `${wall} wall, front view`;
  div.innerHTML = `<div class="floor"></div>`;
  for (const s of stickers.filter((s) => s.wall === wall).sort((a, b) => a.z - b.z)) {
    const img = document.createElement("img");
    img.src = s.png;
    img.alt = s.id;
    const pos = { left: `${s.box.x * K}px`, top: `${s.box.y * K}px`, width: `${s.box.w * K}px`, height: `${s.box.h * K}px` };
    Object.assign(img.style, pos);
    const box = document.createElement("div");
    box.className = "box";
    Object.assign(box.style, pos);
    div.append(img, box);
  }
  previews.append(div);
}
document.getElementById("boxes").addEventListener("change", (e) => {
  for (const b of document.querySelectorAll(".preview .box")) b.style.display = e.target.checked ? "" : "none";
});

document.getElementById("save").addEventListener("click", async () => {
  const status = document.getElementById("status");
  status.textContent = "saving…";
  const res = await fetch("/api/clay/draft", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ stickers: stickers.map(({ node, ...s }) => s) }),
  });
  status.textContent = res.ok ? `saved ${stickers.length} stickers` : `failed: ${res.status}`;
});
