// The street: one road running from the bottom-left of the screen to the top-right,
// four clay shops along it (café nearest, bakery furthest), trees and lamp posts,
// a cat who walks the pavement and stops at each door. Shared by the landing page
// and the town page (/w/<world>).
//
//   const street = await createStreet(container, { season, lang, shops, onPick });
//   shops: [{ type, label?, meta?, tag?, flag? }] — each shop wears a clay roof banner
//     (fixed bilingual name, English first); meta (e.g. progress) and flag (help-request
//     text, also raises a clay pennant) are added to that shop's hover bubble. label/tag
//     are accepted for compatibility but not drawn.
//   onPick(type) — a shop was clicked (or tapped twice on touch)
//   padTop — px at the top of the container covered by other UI; framing keeps shops below it
//   padLeft — px on the left kept clear for copy; the town is framed in the lower-right of what remains
//   street.setShops(shops) · street.setLang(lang) · street.destroy()
//
// World units are cm (the clay kit's). The road runs along +X; shops sit on the
// -Z side with their doors facing +Z; the camera looks from the front-left so +X
// climbs toward the top-right of the screen.
import * as kit from "/clay/clay.js";
import { build as buildCat, createCatAnimator } from "/clay/models/cat.js";
import { build as buildTree } from "/clay/models/yard-tree.js";
import { build as buildLamp } from "/clay/models/lamp-post.js";
import { build as buildSign } from "/clay/models/a-frame-sign.js";
import { build as buildBucket } from "/clay/models/flower-bucket.js";
import { build as buildCart } from "/clay/models/book-cart.js";
import { build as buildBasket } from "/clay/models/bakery-bread-basket.js";
import { createWeather } from "/shops/weather.js";

const { THREE } = kit;

export const TYPES = ["cafe", "flower", "book", "bakery"];
export const SAYS = {
  zh: { cafe: "嘿，来杯咖啡吗？", flower: "今天的郁金香开得正好", book: "进来翻翻书吧", bakery: "刚出炉，还热着呢", cat: "喵～" },
  en: { cafe: "Hey, grab a coffee?", flower: "Fresh tulips today!", book: "Come in and browse", bakery: "Fresh out of the oven!", cat: "Meow~" },
};

// grass / light match the yard scenery (shops/cafe/yard/scenery.js)
const LOOK = {
  spring: { grass: 0xa9c07e, sky: "#f6ecdc", light: 0xffe1ea, scatter: [0xf2b8c6, 0xf7cfd8, 0xfaf6ef] },
  summer: { grass: 0x8fae68, sky: "#f4ecd2", light: 0xfff1c4, scatter: null },
  autumn: { grass: 0xb5b075, sky: "#f3e3cf", light: 0xffc890, scatter: [0xd9822f, 0xc8694a, 0xe0a23a, 0xb5532e] },
  winter: { grass: 0xbcc2a8, sky: "#eef0f2", light: 0xdce8ff, scatter: [0xfaf6ef, 0xf3f1ec] },
};

const SHOP = {
  cafe: { x: -900, w: 380, h: 300, wall: 0xf1e4cc, trim: 0x8a5a3c, roof: 0x8a5a3c, awning: [0x8a5a3c, 0xf1e4cc], door: 0x6e4630 },
  flower: { x: -300, w: 320, h: 260, wall: 0xfaf0ec, trim: 0xd98fa3, roof: 0x7a9a5a, awning: [0xe39bb0, 0xfaf6ef], door: 0x7a9a5a },
  book: { x: 300, w: 340, h: 340, wall: 0xe8dcc4, trim: 0x5e6f8a, roof: 0x5e6f8a, awning: [0x7f9bb3, 0xf1e4cc], door: 0x4f5f78 },
  bakery: { x: 900, w: 360, h: 280, wall: 0xf6e7c8, trim: 0xc8694a, roof: 0xc8694a, awning: [0xc8694a, 0xf6e7c8], door: 0x8a5a3c },
};
const BANNER = { cafe: ["CAFÉ", "咖啡馆"], flower: ["FLOWERS", "花店"], book: ["BOOKS", "书店"], bakery: ["BAKERY", "面包店"] };
const FONT = '"Songti SC", "Noto Serif SC", Georgia, serif';
const css = (hex) => `#${hex.toString(16).padStart(6, "0")}`;
const RISE = 110;
const DEPTH = 300, FRONT_Z = -120;          // shop footprint: z ∈ [FRONT_Z - DEPTH, FRONT_Z]
const WALK_Z = 45;                          // the cat's line along the pavement
const ROAD_Z = [80, 380];

function shadowed(o, cast = true) {
  o.traverse((m) => { if (m.isMesh) { m.castShadow = cast; m.receiveShadow = true; } });
  return o;
}

/** A little clay shop: plinth, walls, gabled roof, striped awning, door, windows, sign. */
function buildShop(type) {
  const s = SHOP[type], g = new THREE.Group(); g.name = `shop-${type}`;
  const W = s.w, H = s.h, D = DEPTH;
  const zf = D / 2;                         // front face (local); group sits at z = FRONT_Z - D/2
  const add = (m, x, y, z) => { m.position.set(x, y, z); g.add(m); return m; };
  add(kit.roundedBox(W + 30, 16, D + 30, 6, 0xd8ccb6), 0, 8, 0);                  // plinth
  add(kit.roundedBox(W, H, D, 14, s.wall), 0, 16 + H / 2, 0);                    // walls
  add(kit.roundedBox(W + 8, 14, D + 8, 6, s.trim), 0, 16 + H, 0);                 // eave band
  // gabled roof: two slabs meeting at a ridge along X
  const rise = RISE, half = D / 2 + 30, slope = Math.atan2(rise, half), len = Math.hypot(rise, half) + 10;
  for (const side of [-1, 1]) {
    const slab = add(kit.roundedBox(W + 50, 22, len, 10, s.roof), 0, 16 + H + 8 + rise / 2, side * half / 2);
    slab.rotation.x = side * slope;
  }
  // gable ends (triangles of wall colour)
  const tri = new THREE.Shape([new THREE.Vector2(-half + 34, 0), new THREE.Vector2(half - 34, 0), new THREE.Vector2(0, rise - 18)]);
  for (const side of [-1, 1]) {
    const geo = new THREE.ExtrudeGeometry(tri, { depth: 10, bevelEnabled: true, bevelSize: 4, bevelThickness: 4, bevelSegments: 3 });
    const m = new THREE.Mesh(geo, kit.clay(s.wall));
    m.rotation.y = Math.PI / 2; m.position.set(side * (W / 2 - 14) - 5, 16 + H + 6, 0); g.add(m);
  }
  add(kit.roundedCylinder(16, 60, 4, s.trim), W * 0.28, 16 + H + rise * 0.55, -half * 0.4);  // chimney
  // door + frame + knob, slightly left of centre
  const dx = -W * 0.18;
  add(kit.roundedBox(104, 200, 12, 8, s.trim), dx, 16 + 100, zf + 2);
  add(kit.roundedBox(84, 186, 14, 10, s.door), dx, 16 + 94, zf + 6);
  add(kit.roundedBox(56, 60, 4, 8, 0xcfe0e6), dx, 16 + 150, zf + 13);
  add(kit.blob(5, 5, 4, 0xd9a63a), dx + 30, 16 + 90, zf + 14);
  // shop window
  const wx = W * 0.22;
  add(kit.roundedBox(W * 0.38 + 16, 120, 12, 8, s.trim), wx, 16 + 120, zf + 2);
  add(kit.roundedBox(W * 0.38, 104, 14, 8, 0xd6e6ea), wx, 16 + 120, zf + 4);
  add(kit.roundedBox(W * 0.38, 6, 16, 3, s.trim), wx, 16 + 120, zf + 6);
  add(kit.roundedBox(W * 0.38 + 24, 10, 34, 4, s.trim), wx, 16 + 56, zf + 14);    // sill
  // striped awning over door and window
  const aw = new THREE.Group(), stripes = 8, aW = W * 0.9;
  for (let i = 0; i < stripes; i++) {
    const st = kit.roundedBox(aW / stripes + 1, 8, 90, 4, s.awning[i % 2]);
    st.position.set(-aW / 2 + (i + 0.5) * aW / stripes, 0, 45); aw.add(st);
    const sc = kit.blob(aW / stripes / 2, 12, 5, s.awning[i % 2]); sc.position.set(st.position.x, -4, 90); aw.add(sc);
  }
  aw.position.set(0, 16 + 222, zf); aw.rotation.x = 0.42; g.add(aw);
  // sign board on the front, above the awning, with the shop's emblem
  add(kit.roundedBox(150, 50, 12, 12, 0xfaf6ef), 0, 16 + H - 34, zf + 4);
  add(kit.roundedBox(162, 60, 8, 14, s.trim), 0, 16 + H - 34, zf);
  const em = new THREE.Group(); em.position.set(0, 16 + H - 34, zf + 14); g.add(em);
  if (type === "cafe") {
    const cup = kit.roundedCylinder(12, 22, 4, 0x8a5a3c); cup.position.y = -12; em.add(cup);
    const h = new THREE.Mesh(new THREE.TorusGeometry(6, 2.4, 8, 16), kit.clay(0x8a5a3c)); h.position.set(13, -1, 0); em.add(h);
  } else if (type === "flower") {
    for (let i = 0; i < 5; i++) { const p = kit.blob(7, 7, 4, 0xe39bb0); p.position.set(Math.cos(i * 1.257) * 9, Math.sin(i * 1.257) * 9, 0); em.add(p); }
    em.add(kit.blob(6, 6, 5, 0xd9a63a));
  } else if (type === "book") {
    for (const sd of [-1, 1]) { const pg = kit.roundedBox(22, 28, 4, 3, sd < 0 ? 0x7f9bb3 : 0x5e6f8a); pg.position.x = sd * 12; pg.rotation.y = sd * -0.3; em.add(pg); }
  } else {
    const loaf = kit.blob(24, 12, 8, 0xd9a63a); em.add(loaf);
    for (const x of [-9, 0, 9]) { const c = kit.roundedBox(3, 14, 4, 1.5, 0xb8693a); c.position.set(x, 2, 7); c.rotation.z = 0.5; em.add(c); }
  }
  shadowed(g);
  g.userData.banner = buildBanner(type, g);
  return g;
}

/** Paint the banner face: English name large, Chinese small underneath, cream border. */
function paintBanner(type, canvas) {
  const s = SHOP[type], [en, zh] = BANNER[type], c = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  c.clearRect(0, 0, W, H);
  const rr = (x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, w, h, r); };
  rr(0, 0, W, H, 70); c.fillStyle = "#faf3e4"; c.fill();
  rr(18, 18, W - 36, H - 36, 54); c.fillStyle = css(s.awning[0]); c.fill();
  c.setLineDash([14, 12]); c.lineWidth = 5; c.strokeStyle = "rgba(250,243,228,0.75)";
  rr(36, 36, W - 72, H - 72, 40); c.stroke(); c.setLineDash([]);
  const light = s.awning[0] === 0xe39bb0;
  c.fillStyle = light ? "#5a2e3a" : "#fbf3e2"; c.textAlign = "center"; c.textBaseline = "alphabetic";
  let size = 190; c.font = `italic 700 ${size}px ${FONT}`;
  while (c.measureText(en).width > W - 120 && size > 60) { size -= 6; c.font = `italic 700 ${size}px ${FONT}`; }
  c.fillText(en, W / 2, H * 0.58);
  c.font = `700 92px ${FONT}`; c.globalAlpha = 0.9; c.fillText(zh, W / 2, H * 0.84); c.globalAlpha = 1;
}

/** A rounded clay board standing on the roof ridge, facing the road, plus a hidden pennant. */
function buildBanner(type, shop) {
  const s = SHOP[type], bw = Math.min(260, s.w * 0.72), bh = bw * 0.42;
  const ridge = 16 + s.h + 8 + RISE + 6;
  const b = new THREE.Group(); b.position.set(0, ridge + bh / 2 + 10, 8);
  b.add(kit.roundedBox(bw + 14, bh + 14, 12, 18, s.trim));
  for (const x of [-bw * 0.32, bw * 0.32]) { const post = kit.roundedCylinder(5, 34, 2, s.trim); post.position.set(x, -bh / 2 - 12, -2); b.add(post); }
  const canvas = document.createElement("canvas"); canvas.width = 1024; canvas.height = Math.round(1024 * bh / bw);
  paintBanner(type, canvas);
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(bw, bh), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, transparent: true }));
  face.position.z = 6.5; b.add(face);
  // help-request pennant: a stick and a small triangular flag that waves
  const pen = new THREE.Group(); pen.position.set(bw / 2 + 30, -bh / 2 - 20, 0); pen.visible = false;
  const stick = kit.roundedCylinder(3, 110, 1.5, 0x8a5a3c); stick.position.y = 55; pen.add(stick);
  const knob = kit.blob(6, 6, 6, 0xd9a63a); knob.position.y = 112; pen.add(knob);
  const tri = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(52, -14), new THREE.Vector2(0, -30)]);
  const flag = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 3, bevelEnabled: true, bevelSize: 2, bevelThickness: 2, bevelSegments: 2 }), kit.clay(0xd2553f));
  const flagPivot = new THREE.Group(); flagPivot.position.set(2, 104, 0); flagPivot.add(flag); pen.add(flagPivot);
  b.add(pen);
  shop.add(shadowed(b));
  return { canvas, tex, pen, flagPivot, repaint() { paintBanner(type, canvas); tex.needsUpdate = true; } };
}

async function buildProps(type, x) {
  const z = FRONT_Z + 60, g = new THREE.Group();
  const put = (o, dx, dz = 0, ry = 0) => { o.position.set(x + dx, 0, z + dz); o.rotation.y = ry; g.add(o); };
  const W = SHOP[type].w;
  if (type === "cafe") put(buildSign(kit, { name: "street-sign" }), -W * 0.18 - 110, 20, 0.4);
  if (type === "flower") {
    put(buildBucket(kit, { kind: "tulip", color: 0xe07a8a, seed: 3, tall: 1.4 }), W * 0.12, 0);
    put(buildBucket(kit, { kind: "daisy", color: 0xfaf6ef, seed: 5, tall: 1.2 }), W * 0.26, 10);
    put(buildBucket(kit, { kind: "tulip", color: 0xd9a63a, seed: 8, tall: 1.3 }), W * 0.4, -4);
  }
  if (type === "book") put(buildCart(kit, { seed: 4 }), W * 0.25, 10, -0.15);
  if (type === "bakery") {
    const bench = kit.roundedBox(110, 50, 44, 8, 0x9a6644); bench.position.set(x + W * 0.25, 25, z); g.add(bench);
    const b1 = buildBasket(kit, { kind: "baguette" }); b1.position.set(x + W * 0.25 - 26, 50, z); g.add(b1);
    const b2 = buildBasket(kit, { kind: "round" }); b2.position.set(x + W * 0.25 + 28, 50, z); g.add(b2);
  }
  return shadowed(g);
}

export async function createStreet(container, { season = "spring", lang = "zh", shops = [], onPick = () => {}, padTop = 0, padLeft = 0 } = {}) {
  const look = LOOK[season] || LOOK.spring;
  // ?editor (local dev): pick shops / trees / lamps / the cat and tune them by hand, see /editor.js
  const editMode = new URLSearchParams(location.search).has("editor");
  const editables = [];
  let edit = null;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const r = kit.rng(11);

  container.classList.add("street");
  container.style.background = look.sky;   // until the first frame paints the sky
  const canvas = document.createElement("canvas");
  canvas.className = "street-canvas"; canvas.setAttribute("aria-hidden", "true");
  const overlay = document.createElement("div"); overlay.className = "street-overlay";
  const bubble = document.createElement("div"); bubble.className = "street-bubble"; bubble.hidden = true; bubble.setAttribute("role", "status");
  const say = document.createElement("span"); say.className = "say";
  const sayLine = document.createElement("span"); sayLine.className = "say-main";
  const sayMeta = document.createElement("span"); sayMeta.className = "say-meta";
  const sayFlag = document.createElement("span"); sayFlag.className = "say-flag";
  say.append(sayLine, sayMeta, sayFlag); bubble.append(say);
  overlay.append(bubble);
  container.append(canvas, overlay);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 10, 20000);

  scene.add(new THREE.HemisphereLight(0xfff4e6, 0xb89a80, 1.25));
  const sun = new THREE.DirectionalLight(look.light, 2.0);
  sun.position.set(-700, 1600, 1100); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -1700, right: 1700, top: 1200, bottom: -1200, near: 100, far: 4000 });
  sun.shadow.bias = -0.0006; sun.shadow.radius = 4;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xe6eeff, 0.5); fill.position.set(900, 500, 900); scene.add(fill);

  // ---- ground: grass, pavement, road with a dashed centre line ----
  const weather = createWeather(scene, { season, renderer, camera, bounds: { x: [-1700, 1700], z: [-700, 900] }, groundY: 0 });
  const pave = kit.roundedBox(6000, 6, 200, 3, 0xe6dccb); pave.position.set(0, 2, (FRONT_Z + ROAD_Z[0]) / 2 + 20); scene.add(pave);
  const road = kit.roundedBox(6000, 4, ROAD_Z[1] - ROAD_Z[0], 2, 0xb9ad9c); road.position.set(0, 1, (ROAD_Z[0] + ROAD_Z[1]) / 2); scene.add(road);
  for (let x = -2900; x < 2900; x += 160) { const d = kit.roundedBox(80, 2, 12, 1, 0xf3ece0); d.position.set(x, 3.5, (ROAD_Z[0] + ROAD_Z[1]) / 2); scene.add(d); }
  const far = kit.roundedBox(6000, 6, 140, 3, 0xe6dccb); far.position.set(0, 2, ROAD_Z[1] + 70); scene.add(far);
  for (const m of [pave, road, far]) { m.castShadow = false; m.receiveShadow = true; }

  // ---- shops ----
  const shopGroups = {};
  for (const type of TYPES) {
    const g = buildShop(type);
    g.position.set(SHOP[type].x, 0, FRONT_Z - DEPTH / 2);
    g.userData.pick = type;
    scene.add(g); shopGroups[type] = g;
    editables.push({ id: `shop-${type}`, label: `店铺 ${type}`, obj: g });
    scene.add(await buildProps(type, SHOP[type].x));
  }

  const propList = [];   // trees and lamps you can poke (see "props" below)
  // ---- trees behind/between the shops and across the road, lamp posts on the kerb ----
  const trees = [[-1300, -260], [-600, -380], [0, -400], [600, -360], [1250, -300], [-1100, 620], [-200, 640], [700, 600], [1500, 640], [-1650, 300]];
  for (const [i, [x, z]] of trees.entries()) {
    const t = shadowed(buildTree(kit, { season, seed: 3 + i }));
    t.position.set(x, 0, z); t.rotation.y = r() * Math.PI * 2; t.scale.setScalar(0.85 + r() * 0.3); scene.add(t);
    editables.push({ id: `tree-${i}`, label: `树 ${i}`, obj: t });
    t.userData.prop = { kind: "tree", obj: t, shake: 0, rx: t.rotation.x, rz: t.rotation.z };
    propList.push(t);
  }
  for (const [i, x] of [-1200, -600, 0, 600, 1200].entries()) {
    const l = shadowed(buildLamp(kit, { name: "street-lamp" })); l.position.set(x, 0, ROAD_Z[0] - 18); scene.add(l);
    editables.push({ id: `lamp-${i}`, label: `路灯 ${i}`, obj: l });
    // give each lamp its own lantern material so one can glow alone, plus a light kept at 0
    // (lights exist from the start, so switching one on never recompiles the shaders)
    let glass = null;
    l.traverse((o) => { if (o.isMesh && o.material?.color?.getHex() === 0xffd98f) { o.material = o.material.clone(); glass = o.material; } });
    const bulb = new THREE.PointLight(0xffc970, 0, 520, 1.2); bulb.position.y = 171; l.add(bulb);
    l.userData.prop = { kind: "lamp", obj: l, glass, bulb, glow: 0, hold: 0 };
    propList.push(l);
  }
  if (look.scatter) {
    for (let i = 0; i < 120; i++) {
      const s = season === "winter" ? 20 + r() * 30 : 5 + r() * 4;
      const b = kit.blob(s, season === "winter" ? 2.5 : 0.8, s * (0.6 + r() * 0.4), look.scatter[i % look.scatter.length]);
      const across = r() < 0.4;
      b.position.set(-1700 + r() * 3400, 1, across ? ROAD_Z[1] + 160 + r() * 600 : -480 - r() * 400);
      b.rotation.y = r() * Math.PI; b.castShadow = false; scene.add(b);
    }
  }

  // ---- the cat ----
  const cat = buildCat(kit, { coat: "tabby" });
  cat.scale.setScalar(3.4);
  shadowed(cat);
  const catHolder = new THREE.Group(); catHolder.add(cat); catHolder.userData.pick = "cat";
  scene.add(catHolder);
  const anim = createCatAnimator(cat, { reduced });
  // a route: walk the pavement end to end, stopping at each door
  const doors = TYPES.map((t) => SHOP[t].x - SHOP[t].w * 0.18);
  const END = 1400;
  const walker = { x: doors[0] + 70, dir: 1, pause: 0, nextStop: 1, speed: 55 };
  if (reduced) { anim.setPose("sit"); catHolder.position.set(doors[0] + 90, 6, WALK_Z + 20); catHolder.rotation.y = -Math.PI / 2 + 0.6; }
  else { anim.setPose("walk"); }
  function stepCat(dt) {
    if (reduced || edit) return; // the editor holds the cat still so it can be moved

    const w = walker;
    if (w.pause > 0) {
      w.pause -= dt;
      if (w.pause <= 0) { anim.setPose("walk"); }
    } else {
      w.x += w.dir * w.speed * dt;
      const target = w.nextStop >= 0 && w.nextStop < doors.length ? doors[w.nextStop] : null;
      if (target !== null && (w.x - target) * w.dir >= 0) {
        w.x = target; w.pause = 4 + r() * 2.5; anim.setPose("sit");
        setTimeout(() => anim.play("lookUp", new THREE.Vector3(target - w.dir * 200, 260, -100)), 900);
        w.nextStop += w.dir;
      } else if (Math.abs(w.x) > END) {          // turn around at the ends
        w.dir *= -1; w.x = Math.sign(w.x) * END;
        w.nextStop = w.dir > 0 ? 0 : doors.length - 1;
        w.pause = 1.5; anim.setPose("sit");
      }
    }
    // heading: walk along ±X; when sitting at a door, half-turn toward the viewer
    const walking = w.pause <= 0;
    const want = walking ? (w.dir > 0 ? 0 : Math.PI) : (w.dir > 0 ? -0.9 : Math.PI + 0.9);
    let d = want - catHolder.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d));
    catHolder.rotation.y += d * Math.min(1, dt * 3);
    catHolder.position.set(w.x, 6, WALK_Z);
  }

  // ---- per-shop extras for the bubble (meta / flag) and the banner pennant ----
  let info = {};
  function setShops(list) {
    info = {};
    for (const type of TYPES) {
      const s = list.find((x) => x.type === type);
      const g = shopGroups[type];
      g.visible = true;
      info[type] = { meta: s?.meta || "", flag: s?.flag || "" };
      g.userData.banner.pen.visible = !!s?.flag;
    }
    if (hover) fillBubble(hover);
    dirty = true;
  }
  function fillBubble(what) {
    sayLine.textContent = SAYS[lang][what];
    const i = info[what] || {};
    sayMeta.textContent = i.meta || ""; sayMeta.hidden = !i.meta;
    sayFlag.textContent = i.flag ? `🚩 ${i.flag}` : ""; sayFlag.hidden = !i.flag;
  }
  // canvas text needs the page fonts: repaint banners once they are ready
  document.fonts?.ready.then(() => { if (!alive) return; for (const g of Object.values(shopGroups)) g.userData.banner.repaint(); dirty = true; });

  // ---- hover / tap: speech bubble + a small lift ----
  let hover = null, dirty = true, alive = true;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const pickables = [...Object.values(shopGroups), catHolder];
  // One raycast decides what is under the pointer: a shop / the cat (userData.pick, a string)
  // or a prop (userData.prop: tree or lamp). Later "pick up the cat" can hook in here: a
  // pointerdown on "cat" would start a carry instead of an orbit drag (see the drag code below).
  function hitAt(e) {
    const rc = canvas.getBoundingClientRect();
    ndc.set((e.clientX - rc.left) / rc.width * 2 - 1, -((e.clientY - rc.top) / rc.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects([...pickables, ...propList], true)[0];
    let o = hit?.object;
    while (o && !o.userData.pick && !o.userData.prop) o = o.parent;
    if (!o) return null;
    return o.userData.pick ? { pick: o.userData.pick } : { prop: o.userData.prop };
  }
  function pickAt(e) { return hitAt(e)?.pick || null; }
  function show(what) {
    if (what === hover) return;
    if (hover && shopGroups[hover]) shopGroups[hover].userData.lift = 0;
    hover = what;
    if (what && shopGroups[what]) shopGroups[what].userData.lift = 1;
    canvas.style.cursor = what ? "pointer" : "";
    if (what) {
      fillBubble(what);
      bubble.hidden = false; bubble.classList.remove("out");
      bubble.classList.remove("pop"); void bubble.offsetWidth; bubble.classList.add("pop");
    } else if (!bubble.hidden) {
      bubble.classList.add("out");
      setTimeout(() => { if (!hover) bubble.hidden = true; }, 260);
    }
    dirty = true;
  }
  let lastTouch = null;
  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse" || editMode || drag) return;
    const h = hitAt(e);
    show(h?.pick || null);
    if (h?.prop) canvas.style.cursor = "pointer";
  });
  canvas.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") show(null); });
  canvas.addEventListener("click", (e) => {
    if (editMode) return; // no walking into shops while editing
    if (dragged) { dragged = false; return; }   // that was a turn of the view, not a click
    const h = hitAt(e);
    if (h?.prop) { poke(h.prop); return; }
    const what = h?.pick || null;
    const touch = lastPointerType !== "mouse";
    if (touch && what && what !== lastTouch) { lastTouch = what; show(what); return; }   // first tap: just say hello
    lastTouch = null;
    if (what && what !== "cat") onPick(what);
    else show(what);
  });
  let lastPointerType = "mouse";
  canvas.addEventListener("pointerdown", (e) => { lastPointerType = e.pointerType; });

  // ---- turning the view: press and drag to orbit the street (no zoom) ----
  // A press only becomes a drag after ~6px, so a plain click / tap still picks. To add
  // "pick up the cat" later: on pointerdown, if hitAt(e)?.pick === "cat", start a carry
  // here instead of an orbit and skip the orbit branch in pointermove.
  let drag = null, dragged = false;
  const view = { az: 0, elev: 0, dist: 2400, dAz: 0, dElev: 0, back: null };
  const AZ = [-0.35, 1.35], EL = [0.14, 1.05];   // keep the shop fronts in sight, never under the ground
  if (!editMode) canvas.style.touchAction = "none";
  canvas.addEventListener("pointerdown", (e) => {
    if (editMode || (e.pointerType === "mouse" && e.button !== 0)) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moving: false };
    dragged = false;
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moving) {
      if (Math.hypot(dx, dy) < 6) return;
      drag.moving = true; dragged = true; view.back = null;
      try { canvas.setPointerCapture(e.pointerId); } catch {}
      show(null); canvas.style.cursor = "grabbing";
    }
    drag.x = e.clientX; drag.y = e.clientY;
    const h = canvas.clientHeight || 600;
    setTurn(view.dAz - dx / h * 2.2, view.dElev + dy / h * 1.6);
  });
  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const moved = drag.moving; drag = null;
    if (moved) { canvas.style.cursor = ""; if (e.type === "pointercancel") dragged = false; }
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  function setTurn(dAz, dElev) {
    view.dAz = Math.min(AZ[1], Math.max(AZ[0], view.az + dAz)) - view.az;
    view.dElev = Math.min(EL[1], Math.max(EL[0], view.elev + dElev)) - view.elev;
    placeCamera();
    resetBtn.hidden = Math.abs(view.dAz) < 1e-3 && Math.abs(view.dElev) < 1e-3;
  }
  function placeCamera() {
    const az = view.az + view.dAz, el = view.elev + view.dElev;
    camera.position.copy(TARGET).addScaledVector(new THREE.Vector3(-Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)), view.dist);
    camera.lookAt(TARGET); camera.updateMatrixWorld();
    dirty = true;
  }
  const RESET = { zh: "回到原位", en: "Reset view" };
  const resetBtn = document.createElement("button");
  resetBtn.type = "button"; resetBtn.className = "street-reset"; resetBtn.hidden = true;
  resetBtn.textContent = RESET[lang] || RESET.zh;
  resetBtn.addEventListener("click", () => { view.back = { az: view.dAz, el: view.dElev, t: 0 }; });
  if (!editMode) container.append(resetBtn);
  function stepView(dt) {
    const b = view.back; if (!b) return;
    b.t = Math.min(1, b.t + dt / (reduced ? 0.01 : 0.7));
    const k = 1 - (1 - b.t) ** 3;
    view.dAz = b.az * (1 - k); view.dElev = b.el * (1 - k);
    placeCamera();
    if (b.t >= 1) { view.back = null; view.dAz = view.dElev = 0; resetBtn.hidden = true; }
  }

  // ---- props: shake a tree (something falls, by season), light a lamp ----
  const FALL = {
    spring: { colors: [0xf7cfd8, 0xf2b8c6, 0xfbe3e8], n: 7, size: [5, 1, 4] },
    summer: { colors: [0x6b9850, 0x7aa65a], n: 2, size: [6, 1.2, 4] },
    autumn: { colors: [0xe0a23a, 0xd9822f, 0xf0c050], n: 7, size: [6, 1.2, 4.5] },
    winter: { colors: [0xffffff, 0xf4f7fb], n: 10, size: [3.5, 3.5, 3.5] },
  }[season] || null;
  const bits = [];
  function poke(p) {
    if (p.kind === "lamp") { p.hold = 2.5; return; }
    p.shake = 1; p.t = 0;
    if (!FALL) return;
    const n = reduced ? Math.min(2, FALL.n) : FALL.n;
    const geo = new THREE.SphereGeometry(1, 8, 6);
    const mats = FALL.colors.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, transparent: true }));
    const s = p.obj.scale.x;
    const group = { geo, mats, items: [], age: 0 };
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(geo, mats[i % mats.length]);
      m.scale.set(...FALL.size);
      const a = Math.random() * Math.PI * 2, rad = Math.random() * 80 * s;
      m.position.set(p.obj.position.x + Math.cos(a) * rad, (210 + Math.random() * 90) * s, p.obj.position.z + Math.sin(a) * rad);
      m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      m.userData.v = { vy: season === "winter" ? 60 : 35 + Math.random() * 20, ph: Math.random() * 6, spin: (Math.random() - 0.5) * 3, delay: Math.random() * 0.5 };
      scene.add(m); group.items.push(m);
    }
    bits.push(group);
  }
  function stepProps(dt, now) {
    let busy = false;
    for (const t of propList) {
      const p = t.userData.prop;
      if (p.kind === "tree" && p.shake > 0) {
        p.t += dt; p.shake = Math.max(0, 1 - p.t / 1.6);
        const amp = (reduced ? 0.012 : 0.06) * p.shake * p.shake;
        t.rotation.z = p.rz + Math.sin(p.t * 14) * amp;
        t.rotation.x = p.rx + Math.sin(p.t * 11 + 1) * amp * 0.6;
        if (p.shake === 0) { t.rotation.z = p.rz; t.rotation.x = p.rx; }
        busy = true;
      } else if (p.kind === "lamp" && (p.hold > 0 || p.glow > 0)) {
        if (p.hold > 0) { p.hold -= dt; p.glow = Math.min(1, p.glow + dt * 4); }
        else p.glow = Math.max(0, p.glow - dt / 2.5);
        if (p.glass) { p.glass.emissive.setHex(0xffb640); p.glass.emissiveIntensity = p.glow * 1.4; }
        p.bulb.intensity = p.glow * 3.5;
        busy = true;
      }
    }
    for (let i = bits.length - 1; i >= 0; i--) {
      const g = bits[i]; g.age += dt; busy = true;
      for (const m of g.items) {
        const v = m.userData.v; if (g.age < v.delay) continue;
        m.position.y = Math.max(4, m.position.y - v.vy * dt);
        m.position.x += Math.sin(now / 500 + v.ph) * 25 * dt;
        if (m.position.y > 4) { m.rotation.x += v.spin * dt; m.rotation.z += v.spin * 0.7 * dt; }
      }
      const fade = Math.max(0, Math.min(1, (5 - g.age) / 1.2));
      for (const mat of g.mats) mat.opacity = fade;
      if (g.age > 5) { disposeBits(g); bits.splice(i, 1); }
    }
    if (busy) dirty = true;
  }
  function disposeBits(g) { for (const m of g.items) scene.remove(m); g.geo.dispose(); for (const mat of g.mats) mat.dispose(); }

  // ---- framing: fit the four shops; portrait turns the road to run more upward ----
  const TARGET = new THREE.Vector3(0, 60, -80);
  const pad = padTop; padTop = () => (typeof pad === "function" ? pad() : pad) || 0;
  const padL = padLeft; padLeft = () => (typeof padL === "function" ? padL() : padL) || 0;
  function resize() {
    const rc = container.getBoundingClientRect();
    if (!rc.width || !rc.height) return;
    if (edit?.freeCam) { renderer.setSize(rc.width, rc.height, false); camera.aspect = rc.width / rc.height; camera.updateProjectionMatrix(); dirty = true; return; }
    renderer.setSize(rc.width, rc.height, false);
    const aspect = rc.width / rc.height;
    camera.aspect = aspect;
    // azimuth: how far round from straight-front the camera sits (toward -X).
    const az = aspect >= 1.2 ? 0.62 : aspect >= 0.8 ? 0.8 : 1.12;
    const elev = aspect >= 0.8 ? 0.5 : 0.62;
    camera.fov = aspect >= 1 ? 30 : 38;
    let dist = 2400;
    // keep a left column clear for the copy: frame into the space right of it, nudged down
    const left = Math.min(padLeft(), rc.width * 0.5);
    if (left > 0) camera.setViewOffset(rc.width + left, rc.height + rc.height * 0.12, 0, 0, rc.width, rc.height);
    else camera.clearViewOffset();
    const off = new THREE.Vector3(-Math.sin(az) * Math.cos(elev), Math.sin(elev), Math.cos(az) * Math.cos(elev));
    // shrink-to-fit: back off until all four shops project inside the frame
    const pts = TYPES.flatMap((t) => [new THREE.Vector3(SHOP[t].x - SHOP[t].w / 2 - 40, 0, FRONT_Z + 40), new THREE.Vector3(SHOP[t].x - SHOP[t].w / 2 - 40, SHOP[t].h + 60, FRONT_Z - DEPTH - 30), new THREE.Vector3(SHOP[t].x + SHOP[t].w / 2, SHOP[t].h + 280, FRONT_Z - DEPTH / 2)]);
    if (Math.abs(view.dAz) > 1e-3 || Math.abs(view.dElev) > 1e-3 || view.back) {
      // turned by hand: keep that view, only refit the projection
      camera.updateProjectionMatrix(); placeCamera(); return;
    }
    for (let k = 0; k < 30; k++) {
      camera.position.copy(TARGET).addScaledVector(off, dist);
      camera.lookAt(TARGET); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
      const top = 0.9 - 2 * Math.min(padTop(), rc.height * 0.4) / rc.height;
      // the town may tuck under the copy column; only its left edge has to clear about a quarter of the width
      const xMin = left > 0 ? -1 + 2 * Math.min(left + 24, rc.width * 0.27) / rc.width : -0.92;
      const ok = pts.every((p) => { const q = p.clone().project(camera); return q.x > xMin && q.x < 0.97 && q.y < top && q.y > -0.95; });
      if (ok) break;
      dist *= 1.04;
    }
    Object.assign(view, { az, elev, dist });
    dirty = true;
  }
  const ro = new ResizeObserver(resize); ro.observe(container);
  if (typeof pad === "function" || typeof padL === "function") addEventListener("resize", resize);
  resize();

  // ---- loop ----
  function placeOverlay() {
    const rc = container.getBoundingClientRect();
    const toPx = (v) => { const q = v.clone().project(camera); return [(q.x + 1) / 2 * rc.width, (1 - q.y) / 2 * rc.height]; };
    if (hover && !bubble.hidden) {
      const p = hover === "cat"
        ? catHolder.position.clone().add(new THREE.Vector3(0, 110, 0))
        : new THREE.Vector3(SHOP[hover].x, SHOP[hover].h + 290, FRONT_Z - DEPTH / 2);
      const [x, y] = toPx(p);
      bubble.style.transform = `translate(${x}px, ${y}px)`;
    }
  }
  let last = performance.now(), raf = 0;
  function frame(now) {
    if (!alive) return;
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    stepCat(dt);
    anim.update(dt);
    stepView(dt);
    stepProps(dt, now);
    if (!reduced) {
      weather.update(dt);
      for (const g of Object.values(shopGroups)) { const p = g.userData.banner; if (p.pen.visible) p.flagPivot.rotation.y = Math.sin(now / 600 + g.position.x) * 0.35; }
    }
    edit?.update();
    for (const g of Object.values(shopGroups)) {
      if (edit) break; // the lift would fight the editor's own y
      const want = (g.userData.lift || 0) * 14;
      if (Math.abs(g.position.y - want) > 0.1) { g.position.y += (want - g.position.y) * Math.min(1, dt * 10); dirty = true; }
    }
    if (!reduced || dirty) { renderer.render(scene, camera); placeOverlay(); dirty = false; }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  renderer.render(scene, camera); // first frame even if the tab is hidden
  placeOverlay();

  setShops(shops);
  if (editMode) {
    editables.push({ id: "cat", label: "猫", obj: catHolder });
    const { createEditor } = await import("/editor.js");
    const byObj = new Map(editables.map((e) => [e.obj, e]));
    edit = createEditor({
      name: "street", scene, camera, canvas,
      pickFrom: () => editables.map((e) => e.obj),
      identify: (o) => byObj.get(o) || null,
      viewId: () => ({ kind: "street", aspect: camera.aspect >= 1.2 ? "wide" : camera.aspect >= 0.8 ? "square" : "tall" }),
      look: () => TARGET,
      onFreeCam: (on) => { if (!on) resize(); },
      requestRender: () => { dirty = true; },
    });
  }
  const api = {
    setShops,
    reframe: resize,
    setLang(l) { lang = l; resetBtn.textContent = RESET[l] || RESET.zh; if (hover) fillBubble(hover); },
    pick: (type) => onPick(type),
    /** for tests / scripted checks */
    _debug: { show, walker, view, poke: (kind, i = 0) => poke(propList.filter((o) => o.userData.prop.kind === kind)[i].userData.prop), anim, camera, catHolder, step: (dt) => { stepCat(dt); anim.update(dt); renderer.render(scene, camera); placeOverlay(); } },
    destroy() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); weather.dispose(); for (const g of bits) disposeBits(g); bits.length = 0; renderer.dispose(); container.replaceChildren(); },
  };
  container.street = api;   // reachable from devtools / scripted checks
  return api;
}
