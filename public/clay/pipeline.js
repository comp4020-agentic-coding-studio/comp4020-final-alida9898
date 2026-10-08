// Scene assembly + sticker rendering. Shared by clay-test.js and any later exporter.
import * as kit from "./clay.js";
const { THREE } = kit;

/**
 * Build every non-todo SCENE entry. Returns { root, objects: [{ entry, group }], parts }.
 * parts: [{ id, wall, mount, order, zBias, node }] — one per sticker.
 */
export async function buildScene(scene) {
  const root = new THREE.Group();
  const objects = [];
  const parts = [];
  for (const entry of scene) {
    if (entry.todo) continue;
    const mod = await import(`./models/${entry.model}.js`);
    const group = mod.build(kit, entry.opts || {});
    const w = kit.WALLS[entry.wall];
    group.position.copy(w.toWorld(entry.u, entry.d)).setY(entry.y || 0);
    group.rotation.y = w.rotY + THREE.MathUtils.degToRad(entry.turn || 0);
    root.add(group);
    objects.push({ entry, group });
    group.traverse((n) => {
      if (n.isMesh) n.layers.enableAll();
      if (!n.userData.part) return;
      parts.push({
        id: n.name, wall: entry.wall, mount: n.userData.mount,
        order: n.userData.order ?? 0, zBias: n.userData.zBias ?? 0, node: n,
      });
    });
  }
  root.updateMatrixWorld(true);
  const seen = new Set();
  for (const p of parts) {
    if (seen.has(p.id)) throw new Error(`duplicate sticker id ${p.id}`);
    seen.add(p.id);
  }
  return { root, objects, parts };
}

const LAYER = { left: 1, right: 2 };

/** Adds one sticker light rig per wall (on its own layer) to `scene`. */
export function addStickerRigs(scene) {
  for (const [wall, layer] of Object.entries(LAYER)) {
    const rig = kit.lightRig();
    rig.rotation.y = kit.WALLS[wall].rotY;
    rig.traverse((n) => n.layers.set(layer));
    scene.add(rig);
  }
}

/**
 * Render each part alone, orthographic, straight-on to its wall, transparent bg,
 * cropped exactly to its canvas box. Returns [{ ...part, box, z, png }] with
 * box = { x, y, w, h } on the 1000×1000 half-canvas.
 */
export function renderStickers(scene, parts, { longSide = 512 } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const cam = new THREE.OrthographicCamera();
  const vis = new Map(parts.map((p) => [p.node, p.node.visible]));
  const bg = scene.background;
  scene.background = null; // transparent: the scene's colour must not leak in
  const out = [];
  for (const p of parts) {
    const { depth, ...box } = kit.canvasBox(p.wall, p.node);
    for (const q of parts) q.node.visible = q === p;
    const k = longSide / Math.max(box.w, box.h);
    renderer.setSize(Math.max(1, Math.round(box.w * k)), Math.max(1, Math.round(box.h * k)), false);
    const hw = box.w / 2 / kit.PX_PER_CM, hh = box.h / 2 / kit.PX_PER_CM;
    Object.assign(cam, { left: -hw, right: hw, top: hh, bottom: -hh, near: 1, far: 5000 });
    cam.updateProjectionMatrix();
    const cx = (box.x + box.w / 2) / kit.PX_PER_CM, cy = (kit.FLOOR_LINE - box.y - box.h / 2) / kit.PX_PER_CM;
    const centre = p.wall === "left" ? new THREE.Vector3(cx - kit.WALL_W, cy, 0) : new THREE.Vector3(0, cy, cx);
    const n = kit.WALLS[p.wall].normal;
    cam.position.copy(centre).addScaledVector(n, 2000);
    cam.up.set(0, 1, 0);
    cam.lookAt(centre);
    cam.layers.set(LAYER[p.wall]);
    renderer.render(scene, cam);
    out.push({ ...p, box, z: Math.round(depth) + p.zBias, png: renderer.domElement.toDataURL("image/png") });
  }
  for (const [node, v] of vis) node.visible = v;
  scene.background = bg;
  renderer.dispose();
  return out;
}
