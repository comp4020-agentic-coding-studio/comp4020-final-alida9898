// Shared clay kit. Models receive this module as `kit` — see public/clay/README.md.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export { THREE };

// ---- units & canvas -------------------------------------------------------
// 1 world unit = 1 cm. Each wall half is WALL_W cm wide and maps onto the
// 1000×1000 half-canvas at PX_PER_CM; the floor (y = 0) sits on FLOOR_LINE.
export const WALL_W = 400;
export const WALL_H = 300;
export const CANVAS = 1000;
export const PX_PER_CM = CANVAS / WALL_W; // 2.5
export const FLOOR_LINE = 790;

// ---- palette --------------------------------------------------------------
export const PALETTE = {
  brown: 0x8a5a3c,
  cream: 0xf1e4cc,
  mustard: 0xd9a63a,
  blue: 0x7f9bb3,
  terracotta: 0xc8694a,
  leaf: 0x7a9a5a,
  soil: 0x5a3e2e,
  charcoal: 0x4a4440,
  white: 0xfaf6ef,
};

const matCache = new Map();
/** Matte clay material. `color` is a PALETTE name or a hex number. Cached per (color, opts). */
export function clay(color, { roughness = 0.85, sheen = 0.25 } = {}) {
  const hex = typeof color === "string" ? PALETTE[color] : color;
  if (hex === undefined) throw new Error(`unknown clay colour: ${color}`);
  const key = `${hex}|${roughness}|${sheen}`;
  if (!matCache.has(key)) {
    matCache.set(key, new THREE.MeshPhysicalMaterial({
      color: hex, roughness, metalness: 0, sheen, sheenRoughness: 0.8, sheenColor: 0xffffff,
    }));
  }
  return matCache.get(key);
}

// ---- shape helpers (all sizes in cm; every mesh is centred on its own origin
// unless noted, so position it with mesh.position) ---------------------------
function mesh(geo, color) {
  const m = new THREE.Mesh(geo, color instanceof THREE.Material ? color : clay(color));
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** Rounded box w×h×d, corner radius r (clamped to half the smallest side). */
export function roundedBox(w, h, d, r, color) {
  r = Math.min(r, w / 2, h / 2, d / 2) * 0.999;
  return mesh(new RoundedBoxGeometry(w, h, d, 4, r), color);
}

/** Capsule standing on Y: total height h (incl. caps), radius r. */
export function capsule(r, h, color) {
  return mesh(new THREE.CapsuleGeometry(r, Math.max(0, h - 2 * r), 8, 24), color);
}

/** Sphere / squashed blob: radii rx, ry, rz. */
export function blob(rx, ry, rz, color) {
  const m = mesh(new THREE.SphereGeometry(1, 32, 20), color);
  m.scale.set(rx, ry, rz);
  return m;
}

/**
 * Lathe from a profile of [radius, y] points (y going up), with every corner
 * rounded by `round` cm. Origin is at y = 0 of the profile (put 0 at the base).
 */
export function lathe(profile, color, { round = 1.5, segments = 48 } = {}) {
  const pts = roundPolyline(profile.map(([x, y]) => new THREE.Vector2(x, y)), round);
  return mesh(new THREE.LatheGeometry(pts, segments), color);
}

/** Cylinder of radius r, height h, with rounded top/bottom edges (radius e). Origin at the base. */
export function roundedCylinder(r, h, e, color) {
  return lathe([[0, 0], [r, 0], [r, h], [0, h]], color, { round: e });
}

function roundPolyline(pts, r) {
  if (r <= 0 || pts.length < 3) return pts;
  const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i], a = pts[i - 1], b = pts[i + 1];
    const da = a.clone().sub(p), db = b.clone().sub(p);
    const k = Math.min(r, da.length() / 2, db.length() / 2);
    const p0 = p.clone().add(da.normalize().multiplyScalar(k));
    const p1 = p.clone().add(db.normalize().multiplyScalar(k));
    for (let t = 0; t <= 1.0001; t += 1 / 6) {
      // quadratic Bézier p0 → p → p1
      const u = 1 - t;
      out.push(new THREE.Vector2(
        u * u * p0.x + 2 * u * t * p.x + t * t * p1.x,
        u * u * p0.y + 2 * u * t * p.y + t * t * p1.y,
      ));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/** Make a sticker part: a named Group with mount + order metadata. */
export function part(name, { mount, order = 0 } = {}, ...children) {
  if (!["wall", "floor", "surface", "flat"].includes(mount)) throw new Error(`${name}: bad mount ${mount}`);
  const g = new THREE.Group();
  g.name = name;
  g.userData = { part: true, mount, order };
  g.add(...children);
  return g;
}

/** Deterministic RNG for generators: returns () => [0, 1). */
export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- lighting -------------------------------------------------------------
/**
 * Standard rig, in a Group whose local frame is "viewer looks down -Z, up is +Y":
 * soft key from upper-left-front, cool fill from the right, warm hemisphere.
 * Rotate the group to face a wall; `shadows` turns on the key's shadow map.
 */
export function lightRig({ shadows = false } = {}) {
  const g = new THREE.Group();
  g.add(new THREE.HemisphereLight(0xfff4e6, 0xb89a80, 1.1));
  const key = new THREE.DirectionalLight(0xfff1de, 2.2);
  key.position.set(-300, 400, 500);
  key.target.position.set(0, 0, 0);
  g.add(key, key.target);
  if (shadows) {
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -500, right: 500, top: 500, bottom: -500, near: 10, far: 2000 });
    key.shadow.radius = 6;
    key.shadow.bias = -0.0005;
  }
  const fill = new THREE.DirectionalLight(0xe6eeff, 0.7);
  fill.position.set(400, 150, 300);
  g.add(fill);
  return g;
}

// ---- walls & projection ---------------------------------------------------
// The room corner is at the world origin. Room interior: x ∈ [-400, 0], z ∈ [0, 400].
//   left wall:  plane z = 0, viewer at +z looking -z, canvas x runs world x -400 → 0
//   right wall: plane x = 0, viewer at -x looking +x, canvas x runs world z 0 → 400
export const WALLS = {
  left: {
    normal: new THREE.Vector3(0, 0, 1),
    toWorld: (u, d) => new THREE.Vector3(u - WALL_W, 0, d),
    rotY: 0,
    toCanvasX: (p) => (p.x + WALL_W) * PX_PER_CM,
    depth: (p) => p.z,
  },
  right: {
    normal: new THREE.Vector3(-1, 0, 0),
    toWorld: (u, d) => new THREE.Vector3(-d, 0, u),
    rotY: -Math.PI / 2,
    toCanvasX: (p) => p.z * PX_PER_CM,
    depth: (p) => -p.x,
  },
};

/** World point → { x, y } on that wall's half-canvas (front orthographic view). */
export function toCanvas(wall, p) {
  return { x: WALLS[wall].toCanvasX(p), y: FLOOR_LINE - p.y * PX_PER_CM };
}

/** Canvas box {x,y,w,h} (rounded) of an object's world-space bounds, seen from `wall`. */
export function canvasBox(wall, obj) {
  const b = new THREE.Box3().setFromObject(obj, true);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const px of [b.min.x, b.max.x]) for (const py of [b.min.y, b.max.y]) for (const pz of [b.min.z, b.max.z]) {
    const c = toCanvas(wall, new THREE.Vector3(px, py, pz));
    x0 = Math.min(x0, c.x); x1 = Math.max(x1, c.x); y0 = Math.min(y0, c.y); y1 = Math.max(y1, c.y);
  }
  const depth = (WALLS[wall].depth(b.min) + WALLS[wall].depth(b.max)) / 2;
  return { x: Math.round(x0), y: Math.round(y0), w: Math.round(x1 - x0), h: Math.round(y1 - y0), depth };
}
