// Layout-preview placeholders: simple clay blocks of the right real-world size and rough
// silhouette, for objects that don't have a proper model in ../clay/models/ yet.
// Each builder returns a THREE.Group holding ONE part (one carry-able thing), origin at
// bottom-centre, front +Z, with `userData.placeholder = true` so they're easy to find and
// replace later. Sizes in cm. Colours: palette names or hex.

/**
 * A single block or a few blocks glued into one part.
 * `pieces`: [{ w, h, d, x = 0, y = 0, z = 0, color, shape = "box" | "cyl", r }]
 * (y = bottom of the piece; "cyl" uses w as diameter).
 */
export function block(kit, { name = "placeholder", mount = "floor", pieces, w, h, d, color = "brown", shape = "box" } = {}) {
  const list = pieces ?? [{ w, h, d, color, shape }];
  const meshes = list.map((p) => {
    const { x = 0, y = 0, z = 0, shape: s = "box", color: c = color } = p;
    let m;
    if (s === "cyl") { m = kit.roundedCylinder(p.w / 2, p.h, Math.min(2, p.h / 3), c); m.position.set(x, y, z); }
    else if (s === "ball") { m = kit.blob(p.w / 2, p.h / 2, (p.d ?? p.w) / 2, c); m.position.set(x, y + p.h / 2, z); }
    else { m = kit.roundedBox(p.w, p.h, p.d, p.r ?? Math.min(4, p.h / 3, p.w / 3, p.d / 3), c); m.position.set(x, y + p.h / 2, z); }
    return m;
  });
  const g = new kit.THREE.Group();
  g.name = name;
  g.add(kit.part(name, { mount }, ...meshes));
  g.userData.placeholder = true;
  return g;
}

const legs = (w, d, h, color, inset = 4, r = 3) =>
  [-1, 1].flatMap((sx) => [-1, 1].map((sz) => ({ shape: "box", w: r, h, d: r, x: sx * (w / 2 - inset), z: sz * (d / 2 - inset), color })));

/** Dining chair with a back (seat 45 high, back to ~85). */
export const backedChair = (kit, { name, seat = "mustard", wood = "brown" } = {}) => block(kit, { name, pieces: [
  ...legs(42, 42, 42, wood),
  { w: 44, h: 6, d: 44, y: 41, color: seat },
  { w: 44, h: 40, d: 6, y: 47, z: -19, color: wood },
] });

/** Counter / bar chair: tall pedestal, seat ~72, low back. */
export const barChair = (kit, { name, seat = "terracotta", metal = "charcoal" } = {}) => block(kit, { name, pieces: [
  { shape: "cyl", w: 40, h: 4, color: metal },
  { shape: "cyl", w: 8, h: 66, color: metal },
  { shape: "cyl", w: 42, h: 7, y: 66, color: seat },
  { w: 40, h: 22, d: 6, y: 73, z: -17, color: seat },
] });

/** Sofa: base + back + arms. `w` along the seat. */
export const sofa = (kit, { name, w = 130, d = 72, color = "blue", wood = "brown" } = {}) => block(kit, { name, pieces: [
  ...legs(w - 6, d - 6, 10, wood, 6, 5),
  { w, h: 32, d, y: 10, color },
  { w: w - 28, h: 10, d: d - 20, y: 40, z: 6, color },
  { w, h: 42, d: 16, y: 40, z: -d / 2 + 8, color },
  { w: 14, h: 22, d, y: 40, x: -w / 2 + 7, color },
  { w: 14, h: 22, d, y: 40, x: w / 2 - 7, color },
] });

/** Banquette: long upholstered bench with a tall back, no arms. */
export const banquette = (kit, { name, w = 160, d = 55, color = "terracotta", wood = "brown" } = {}) => block(kit, { name, pieces: [
  { w, h: 38, d, color: wood },
  { w: w - 4, h: 9, d: d - 8, y: 38, z: 4, color },
  { w, h: 50, d: 12, y: 38, z: -d / 2 + 6, color },
] });

/** Square / rectangular table with four legs. */
export const table = (kit, { name, w = 60, d = 60, h = 74, top = "brown", wood = "soil" } = {}) => block(kit, { name, pieces: [
  ...legs(w, d, h - 4, wood, 6, 5),
  { w, h: 4, d, y: h - 4, color: top },
] });

/** Built-in bay window seat: a deep box bench under the window. */
export const baySeat = (kit, { name, w = 130, d = 60, h = 45 } = {}) => block(kit, { name, pieces: [
  { w, h: h - 6, d, color: "white" },
  { w: w - 4, h: 6, d: d - 4, y: h - 6, color: "cream" },
] });

export const cushion = (kit, { name, color = "mustard", w = 34 } = {}) =>
  block(kit, { name, mount: "surface", pieces: [{ w, h: 26, d: 12, color, r: 5 }] });

export const tray = (kit, { name, color = "brown" } = {}) =>
  block(kit, { name, mount: "surface", pieces: [{ w: 34, h: 2.5, d: 24, color, r: 1 }, { w: 34, h: 3, d: 2, y: 2, z: -11, color }, { w: 34, h: 3, d: 2, y: 2, z: 11, color }] });

export const teapot = (kit, { name, color = "cream" } = {}) => block(kit, { name, mount: "surface", pieces: [
  { shape: "ball", w: 18, h: 15, d: 18, color },
  { shape: "cyl", w: 7, h: 3, y: 14, color },
  { w: 9, h: 3, d: 3, x: 11, y: 8, color, r: 1 },
  { w: 3, h: 9, d: 3, x: -10, y: 4, color, r: 1 },
] });

export const recordPlayer = (kit, { name } = {}) => block(kit, { name, mount: "surface", pieces: [
  { w: 36, h: 9, d: 28, color: "brown" },
  { shape: "cyl", w: 24, h: 1.5, y: 9, x: -3, color: "charcoal" },
  { w: 2.5, h: 3, d: 14, x: 13, y: 9, color: "cream", r: 1 },
] });

export const vase = (kit, { name, color = "blue", flower = "terracotta" } = {}) => block(kit, { name, mount: "surface", pieces: [
  { shape: "cyl", w: 10, h: 18, color },
  { shape: "ball", w: 9, h: 9, y: 18, color: flower },
] });

export const flowerPot = (kit, { name } = {}) => block(kit, { name, mount: "surface", pieces: [
  { shape: "cyl", w: 9, h: 8, color: "terracotta" },
  { shape: "ball", w: 6, h: 6, y: 8, x: -2, color: "mustard" },
  { shape: "ball", w: 6, h: 6, y: 9, x: 2, color: 0xe9b7a4 },
] });

/** Large framed artwork for a wall (back flush at z 0). */
export const artwork = (kit, { name, w = 110, h = 80 } = {}) => block(kit, { name, mount: "wall", pieces: [
  { w, h, d: 4, z: 2, color: "brown" },
  { w: w - 12, h: h - 12, d: 2, y: 6, z: 4, color: "cream" },
  { shape: "ball", w: w * 0.5, h: h * 0.3, d: 2, x: -w * 0.12, y: 10, z: 5, color: "leaf" },
  { shape: "ball", w: w * 0.4, h: h * 0.22, d: 2, x: w * 0.18, y: 10, z: 5.4, color: "blue" },
  { shape: "ball", w: 16, h: 16, d: 2, x: w * 0.22, y: h * 0.55, z: 5, color: "mustard" },
] });
