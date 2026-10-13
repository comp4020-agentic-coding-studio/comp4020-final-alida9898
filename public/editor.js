// Editor mode (`?editor` on any page, local dev only). Lets the person nudge
// objects and record camera views by hand, then exports the tweaks to
// assets/editor/<name>.json through POST /api/editor/<name>. It never touches
// live game data: changes are local to this tab until exported, and the export
// is a note for a person (or agent) to apply to the real code afterwards.
import * as THREE from "three";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export const editorOn = () => new URLSearchParams(location.search).has("editor");

const CSS = `
.ed-panel { position: fixed; left: 12px; top: 56px; z-index: 9999; width: 260px; max-width: calc(100vw - 24px);
  font: 13px/1.4 system-ui, sans-serif; color: #3b2f25; background: rgba(255,250,242,.96); border: 1px solid #d8c6ad;
  border-radius: 10px; box-shadow: 0 4px 16px rgba(60,40,20,.18); }
.ed-panel summary { cursor: pointer; padding: 8px 10px; font-weight: 600; list-style: none; }
.ed-panel summary small { font-weight: 400; color: #8a6d4c; display: block; }
.ed-body { padding: 0 10px 10px; display: grid; gap: 6px; }
.ed-body .row { display: flex; gap: 4px; align-items: center; }
.ed-body label { flex: 0 0 14px; }
.ed-body input[type=number] { width: 0; min-width: 0; flex: 1; }
.ed-body input[type=range] { flex: 1; }
.ed-body button { font: inherit; padding: 3px 8px; border: 1px solid #c9b295; border-radius: 6px; background: #fff; cursor: pointer; }
.ed-body button.on { background: #f3d9a8; }
.ed-sel { font-size: 12px; color: #5a4632; word-break: break-all; }
.ed-msg { font-size: 12px; color: #2f6b3a; min-height: 1em; }
.ed-msg.err { color: #a23a2a; }
`;

const r1 = (n) => Math.round(n * 10) / 10;
const r3 = (n) => Math.round(n * 1000) / 1000;
const vec = (v) => [r1(v.x), r1(v.y), r1(v.z)];

/**
 * @param {{ name: string, scene: THREE.Scene, camera: THREE.PerspectiveCamera, canvas: HTMLCanvasElement,
 *   pickFrom: () => THREE.Object3D[], identify: (o: THREE.Object3D) => ({ id: string, label: string, obj: THREE.Object3D } | null),
 *   viewId: () => Record<string, unknown>, look: () => THREE.Vector3, onFreeCam?: (on: boolean) => void,
 *   requestRender?: () => void, extraButtons?: (sel: { id: string, obj: THREE.Object3D } | null) => Array<[string, () => void]> }} o
 */
export function createEditor(o) {
  const { name, scene, camera, canvas } = o;
  const changes = new Map(); // id → { id, label, original, position, scale }
  const views = new Map();   // key → { view, camera }
  let sel = null, freeCam = false;
  const redraw = () => o.requestRender?.();

  const style = document.createElement("style"); style.textContent = CSS; document.head.append(style);
  const panel = document.createElement("details");
  panel.className = "ed-panel"; panel.open = true;
  panel.innerHTML = `<summary>编辑模式 · 不会改正式数据<small>点选物件调位置/大小；方向键微调（PgUp/PgDn 上下，Shift 加大步长）</small></summary>
  <div class="ed-body">
    <div class="ed-sel">还没选中东西</div>
    <div class="row"><label>x</label><input type="number" step="1" data-k="x"><label>y</label><input type="number" step="1" data-k="y"><label>z</label><input type="number" step="1" data-k="z"></div>
    <div class="row"><span>缩放</span><input type="range" min="0.2" max="3" step="0.01" value="1" data-k="s"><span class="ed-s">1.00</span></div>
    <div class="row ed-extra"></div>
    <div class="row"><button data-a="reset">还原这件</button><button data-a="drop">取消选中</button></div>
    <hr style="border:none;border-top:1px solid #e6d6bf;margin:2px 0">
    <div class="row"><button data-a="cam">自由镜头</button><button data-a="view">记下这个视角</button></div>
    <div class="ed-count" style="font-size:12px"></div>
    <div class="row"><button data-a="export">Export</button></div>
    <div class="ed-msg"></div>
  </div>`;
  document.body.append(panel);
  const q = (s) => panel.querySelector(s);
  const inputs = { x: q('[data-k="x"]'), y: q('[data-k="y"]'), z: q('[data-k="z"]') };
  const slider = q('[data-k="s"]');
  const msg = (t, err = false) => { q(".ed-msg").textContent = t; q(".ed-msg").classList.toggle("err", err); };
  // keys typed into the panel never reach the page's own shortcuts
  panel.addEventListener("keydown", (e) => e.stopPropagation());
  panel.addEventListener("pointerdown", (e) => e.stopPropagation());

  const tc = new TransformControls(camera, canvas);
  tc.setSpace("local");
  scene.add(tc.getHelper());
  const orbit = new OrbitControls(camera, canvas);
  orbit.enabled = false; orbit.enableDamping = false;
  orbit.addEventListener("change", redraw);
  tc.addEventListener("dragging-changed", (e) => { orbit.enabled = freeCam && !e.value; });
  tc.addEventListener("objectChange", () => { record(); fill(); redraw(); });
  tc.addEventListener("change", redraw);

  function entry(s) {
    let c = changes.get(s.id);
    if (!c) {
      c = { id: s.id, label: s.label, original: { position: vec(s.obj.position), scale: [r3(s.obj.scale.x), r3(s.obj.scale.y), r3(s.obj.scale.z)] }, position: null, scale: null };
      changes.set(s.id, c);
    }
    return c;
  }
  function record() {
    if (!sel) return;
    const c = entry(sel);
    c.position = vec(sel.obj.position);
    c.scale = [r3(sel.obj.scale.x), r3(sel.obj.scale.y), r3(sel.obj.scale.z)];
    counts();
  }
  function fill() {
    q(".ed-sel").textContent = sel ? `${sel.label}（${sel.id}）` : "还没选中东西";
    for (const k of ["x", "y", "z"]) { inputs[k].disabled = !sel; if (sel) inputs[k].value = String(r1(sel.obj.position[k])); }
    slider.disabled = !sel;
    if (sel) {
      const base = entry(sel).original.scale[0] || 1;
      slider.value = String(sel.obj.scale.x / base);
      q(".ed-s").textContent = (sel.obj.scale.x / base).toFixed(2);
    }
    const ex = q(".ed-extra"); ex.replaceChildren();
    for (const [text, fn] of o.extraButtons?.(sel) || []) {
      const b = document.createElement("button"); b.textContent = text; b.addEventListener("click", fn); ex.append(b);
    }
  }
  function counts() {
    const moved = [...changes.values()].filter((c) => c.position).length;
    q(".ed-count").textContent = `待导出：${moved} 件物品，${views.size} 个视角`;
  }
  function select(s) {
    sel = s;
    if (s) { entry(s); tc.attach(s.obj); } else tc.detach();
    fill(); redraw();
  }

  for (const k of ["x", "y", "z"]) {
    inputs[k].addEventListener("input", () => {
      const n = Number(inputs[k].value);
      if (!sel || !Number.isFinite(n)) return;
      sel.obj.position[k] = n; record(); redraw();
    });
  }
  slider.addEventListener("input", () => {
    if (!sel) return;
    const f = Number(slider.value), base = entry(sel).original.scale;
    sel.obj.scale.set(base[0] * f, base[1] * f, base[2] * f);
    q(".ed-s").textContent = f.toFixed(2);
    record(); redraw();
  });

  // click (no drag) on an object selects it; capture phase so the page's own click does nothing
  let down = null;
  addEventListener("pointerdown", (e) => { if (e.target === canvas) down = { x: e.clientX, y: e.clientY }; }, true);
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function hitAt(x, y) {
    const rc = canvas.getBoundingClientRect();
    ndc.set(((x - rc.left) / rc.width) * 2 - 1, -((y - rc.top) / rc.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    for (const h of ray.intersectObjects(o.pickFrom(), true)) {
      let v = true; for (let p = h.object; p; p = p.parent) if (!p.visible) { v = false; break; }
      if (!v) continue;
      for (let p = h.object; p; p = p.parent) { const s = o.identify(p); if (s) return s; }
    }
    return null;
  }
  // `consumed`: this pointer-up belonged to the editor (gizmo drag or a selection); the page
  // checks it and skips its own click. (TransformControls needs the pointerup itself, so it isn't stopped.)
  let consumed = false;
  addEventListener("pointerup", (e) => {
    consumed = false;
    if (e.target !== canvas || !down) return;
    if (tc.dragging || tc.axis) { consumed = true; return; }
    if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
    const s = hitAt(e.clientX, e.clientY);
    if (s) { consumed = true; select(s); }
  }, true);
  addEventListener("click", (e) => { if (e.target === canvas && consumed) e.stopImmediatePropagation(); down = null; }, true);

  addEventListener("keydown", (e) => {
    if (!sel || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    const step = e.shiftKey ? 10 : 1;
    const d = { ArrowLeft: ["x", -step], ArrowRight: ["x", step], ArrowUp: ["z", -step], ArrowDown: ["z", step], PageUp: ["y", step], PageDown: ["y", -step] }[e.key];
    if (!d) return;
    e.preventDefault(); e.stopImmediatePropagation();
    sel.obj.position[d[0]] += d[1]; record(); fill(); redraw();
  }, true);

  function setFreeCam(on) {
    freeCam = on;
    if (on) { orbit.target.copy(o.look()); orbit.update(); }
    orbit.enabled = on;
    q('[data-a="cam"]').classList.toggle("on", on);
    o.onFreeCam?.(on);
    redraw();
  }

  async function doExport() {
    const items = {};
    for (const c of changes.values()) if (c.position) items[c.id] = { label: c.label, original: c.original, position: c.position, scale: c.scale };
    const vs = {};
    for (const [k, v] of views) vs[k] = v;
    msg("正在保存……");
    try {
      const res = await fetch(`/api/editor/${name}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ items, views: vs }) });
      if (!res.ok) throw new Error(String(res.status));
      msg(`已保存到 assets/editor/${name}.json`);
    } catch (err) { msg(`没存上（${err.message}）`, true); }
  }

  panel.addEventListener("click", (e) => {
    const a = e.target instanceof HTMLElement && e.target.dataset.a;
    if (a === "reset" && sel) {
      const c = entry(sel);
      sel.obj.position.fromArray(c.original.position); sel.obj.scale.fromArray(c.original.scale);
      c.position = c.scale = null; counts(); fill(); redraw();
    } else if (a === "drop") select(null);
    else if (a === "cam") setFreeCam(!freeCam);
    else if (a === "view") {
      const view = o.viewId();
      const key = Object.values(view).join(":");
      const target = freeCam ? orbit.target : o.look();
      views.set(key, { view, camera: { position: vec(camera.position), target: vec(target), fov: r1(camera.fov) } });
      counts(); msg(`记下了视角 ${key}`);
    } else if (a === "export") doExport();
  });
  fill(); counts();

  return {
    get freeCam() { return freeCam; },
    get consumed() { return consumed; },
    setFreeCam,
    select,
    update() { if (freeCam) orbit.update(); },
  };
}
