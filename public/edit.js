import { loadSizes, settle } from "./layout.js";

const side = new URLSearchParams(location.search).get("side") === "right" ? "right" : "left";
const $ = (id) => document.getElementById(id);
const scene = $("scene");
const legend = $("legend");
const inspector = $("inspector");
const statusEl = $("status");
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
const byId = Object.fromEntries(stickers.map((s) => [s.id, s]));

const sizes = await loadSizes(stickers, src);
// start from what's already in stickers.json, not an empty tray
const placed = Object.fromEntries(stickers.map((s) => [s.id, { x: s.x, y: s.y }]));
const ctx = { stickers, sizes, byId, placed, FLOOR };
// one settle pass up front: fills in `host` for surface items and clamps
// anything that drifted, so depth() is right from the very first render
for (const s of stickers) {
  const settled = settle(ctx, s, placed[s.id]);
  if (settled) placed[s.id] = settled;
}

let selected = null;
const pct = (v) => `${(v / W) * 100}%`;

// things resting on a host (e.g. the espresso machine on the counter) need to
// follow it when it moves or resizes, instead of being left stranded
function resettleDependents(hostId) {
  for (const o of stickers) {
    const p = placed[o.id];
    if (p && p.host === hostId) placed[o.id] = settle(ctx, o, p) ?? p;
  }
}

function render() {
  scene.replaceChildren();
  const base = document.createElement("img");
  base.src = src(bg);
  base.alt = "";
  Object.assign(base.style, { left: 0, top: 0, width: "100%", height: "100%", zIndex: 0 });
  scene.append(base);

  for (const s of stickers) {
    const pos = placed[s.id];
    const box = document.createElement("div");
    box.className = "editable" + (s.id === selected ? " selected" : "");
    Object.assign(box.style, {
      left: pct(pos.x), top: pct(pos.y), width: pct(sizes[s.id].w), height: pct(sizes[s.id].h),
      zIndex: s.z,
    });
    const img = document.createElement("img");
    img.src = src(s);
    img.alt = "";
    box.append(img);
    const handle = document.createElement("div");
    handle.className = "handle";
    box.append(handle);
    box.addEventListener("pointerdown", (e) => {
      selected = s.id;
      if (e.target === handle) startResize(e, s);
      else startMove(e, s);
    });
    scene.append(box);
  }

  // listed front-to-back (highest z first), so dragging a row up in this
  // list and bringing a sticker to the front mean the same thing
  legend.replaceChildren();
  for (const s of [...stickers].sort((a, b) => b.z - a.z)) {
    const row = document.createElement("button");
    row.textContent = s.id;
    row.className = s.id === selected ? "active" : "";
    row.draggable = true;
    row.dataset.id = s.id;
    const tag = document.createElement("span");
    tag.className = "mount";
    tag.textContent = ` · ${s.mount}${s.sit ? " · 可坐" : ""}${typeof s.top === "number" ? " · 可依附" : ""}`;
    row.append(tag);
    row.addEventListener("click", () => { selected = s.id; render(); });
    row.addEventListener("dragstart", () => row.classList.add("dragging"));
    row.addEventListener("dragend", () => row.classList.remove("dragging"));
    legend.append(row);
  }

  renderInspector();
}

// dragging a row reorders the list live; dropping re-numbers every sticker's
// z from that order (top of the list = front = highest z)
legend.addEventListener("dragover", (e) => {
  e.preventDefault();
  const dragging = legend.querySelector(".dragging");
  if (!dragging) return;
  const after = [...legend.children].find((row) => {
    if (row === dragging) return false;
    const rect = row.getBoundingClientRect();
    return e.clientY < rect.top + rect.height / 2;
  });
  legend.insertBefore(dragging, after ?? null);
});
legend.addEventListener("drop", (e) => {
  e.preventDefault();
  const ids = [...legend.children].map((el) => el.dataset.id);
  ids.forEach((id, i) => { byId[id].z = ids.length - i; });
  render();
});

const MOUNTS = [["wall", "贴墙 wall"], ["flat", "铺地 flat"], ["floor", "落地 floor"], ["surface", "台面 surface"]];

function renderInspector() {
  inspector.replaceChildren();
  if (!selected) {
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = "点一个贴纸来调它的类型 / 依附";
    inspector.append(p);
    return;
  }
  const s = byId[selected];

  const resettle = () => { placed[s.id] = settle(ctx, s, placed[s.id]) ?? placed[s.id]; resettleDependents(s.id); render(); };

  const h3 = document.createElement("h3");
  h3.textContent = s.id;
  inspector.append(h3);

  const zRow = document.createElement("label");
  zRow.append("图层（数字越大越靠前）");
  const zInput = document.createElement("input");
  Object.assign(zInput, { type: "number", step: "1", value: s.z });
  zInput.addEventListener("change", () => {
    const v = Number(zInput.value);
    if (Number.isFinite(v)) { s.z = Math.round(v); render(); }
  });
  zRow.append(zInput);
  inspector.append(zRow);

  const mountRow = document.createElement("label");
  mountRow.append("类型");
  const mountSel = document.createElement("select");
  for (const [v, label] of MOUNTS) {
    const opt = new Option(label, v, false, s.mount === v);
    mountSel.append(opt);
  }
  mountSel.addEventListener("change", () => { s.mount = mountSel.value; resettle(); });
  mountRow.append(mountSel);
  inspector.append(mountRow);

  const sitRow = document.createElement("label");
  sitRow.append("可坐");
  const sitBox = document.createElement("input");
  sitBox.type = "checkbox";
  sitBox.checked = !!s.sit;
  sitBox.addEventListener("change", () => { if (sitBox.checked) s.sit = true; else delete s.sit; resettle(); });
  sitRow.append(sitBox);
  inspector.append(sitRow);

  if (s.mount === "surface") {
    const hostRow = document.createElement("label");
    hostRow.append("依附");
    const hostSel = document.createElement("select");
    hostSel.append(new Option("自动（离得最近）", "", false, !s.pinHost));
    for (const o of stickers) {
      if (o.id === s.id || typeof o.top !== "number") continue;
      hostSel.append(new Option(o.id, o.id, false, s.pinHost === o.id));
    }
    hostSel.addEventListener("change", () => { if (hostSel.value) s.pinHost = hostSel.value; else delete s.pinHost; resettle(); });
    hostRow.append(hostSel);
    inspector.append(hostRow);
  }

  const hostableRow = document.createElement("label");
  hostableRow.append("可以被依附（台面）");
  const hostableBox = document.createElement("input");
  hostableBox.type = "checkbox";
  hostableBox.checked = typeof s.top === "number";
  hostableBox.addEventListener("change", () => {
    if (hostableBox.checked) s.top = typeof s.top === "number" ? s.top : 0.05;
    else delete s.top;
    resettle();
  });
  hostableRow.append(hostableBox);
  inspector.append(hostableRow);

  if (typeof s.top === "number") {
    const topRow = document.createElement("label");
    topRow.append("台面高度");
    const topInput = document.createElement("input");
    Object.assign(topInput, { type: "number", min: "0", max: "1", step: "0.01", value: s.top });
    topInput.addEventListener("change", () => {
      const v = Number(topInput.value);
      if (Number.isFinite(v)) { s.top = v; resettle(); }
    });
    topRow.append(topInput);
    inspector.append(topRow);
  }
}

function startMove(e, s) {
  e.preventDefault();
  statusEl.textContent = "";
  const box = scene.getBoundingClientRect();
  const scale = box.width / W;
  const start = { x: e.clientX, y: e.clientY };
  const origin = { ...placed[s.id] };
  const move = (ev) => {
    placed[s.id] = { x: origin.x + (ev.clientX - start.x) / scale, y: origin.y + (ev.clientY - start.y) / scale };
    render();
  };
  const up = () => {
    removeEventListener("pointermove", move);
    removeEventListener("pointerup", up);
    placed[s.id] = settle(ctx, s, placed[s.id]) ?? origin;
    resettleDependents(s.id);
    render();
  };
  addEventListener("pointermove", move);
  addEventListener("pointerup", up);
}

function startResize(e, s) {
  e.preventDefault();
  e.stopPropagation();
  statusEl.textContent = "";
  const box = scene.getBoundingClientRect();
  const scale = box.width / W;
  const start = { x: e.clientX, y: e.clientY };
  const startSize = { ...sizes[s.id] };
  const ratio = startSize.w / startSize.h;
  const move = (ev) => {
    const w = Math.max(20, startSize.w + (ev.clientX - start.x) / scale);
    sizes[s.id] = { w, h: w / ratio };
    render();
  };
  const up = () => {
    removeEventListener("pointermove", move);
    removeEventListener("pointerup", up);
    placed[s.id] = settle(ctx, s, placed[s.id]) ?? placed[s.id];
    resettleDependents(s.id);
    render();
  };
  addEventListener("pointermove", move);
  addEventListener("pointerup", up);
}

$("save").addEventListener("click", async () => {
  const payload = Object.fromEntries(
    stickers.map((s) => [
      s.id,
      {
        x: Math.round(placed[s.id].x), y: Math.round(placed[s.id].y),
        w: Math.round(sizes[s.id].w), h: Math.round(sizes[s.id].h),
        mount: s.mount, sit: !!s.sit, pinHost: s.pinHost ?? "", top: typeof s.top === "number" ? s.top : null,
        z: s.z,
      },
    ]),
  );
  statusEl.textContent = "保存中…";
  try {
    const res = await fetch(`/api/layout/${side}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    statusEl.textContent = res.ok ? "已保存" : "保存失败（生产环境关闭了这个接口）";
  } catch {
    statusEl.textContent = "保存失败";
  }
});

render();
