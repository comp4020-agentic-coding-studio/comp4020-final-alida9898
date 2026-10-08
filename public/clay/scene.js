// Scene layout — the single source of truth for where things are.
//   model: file in ./models/ (without .js)   wall: "left" | "right"
//   u: cm along the wall from its canvas-left edge (0–400) to the object's origin
//   d: cm out from the wall to the object's origin (its back should touch d − depth/2)
//   y: cm above the floor (0 for floor things; a surface's height for things sitting on it)
//   turn: extra rotation in degrees about Y (0 = facing straight out of the wall)
//   opts: passed to build(kit, opts); `name` overrides the object name / id prefix
//   todo: true → placeholder, skipped until the model file exists
export const SCENE = [
  { model: "plant", wall: "left", u: 330, d: 40, y: 0, opts: { name: "plant", potScale: 1.6, leafScale: 1.2 } }, // pot + soil + leaves, one sticker
  { model: "pot", wall: "right", u: 70, d: 30, y: 0, opts: { name: "smallpot", scale: 1 } }, // exercises the right-wall projection
  { model: "armchair", wall: "right", u: 150, d: 45, y: 0, opts: { name: "armchair" } },
  // coffee bar: counter on the left wall (u 80–260, top at 95 cm, 55 deep) with the machine and cups on top
  { model: "counter", wall: "left", u: 170, d: 27.5, y: 0, opts: { name: "counter" } },
  { model: "coffee-machine", wall: "left", u: 150, d: 24, y: 95, opts: { name: "coffee-machine" } }, // sits on the counter top at 95 cm; back touches the wall
  { model: "glass-tea", wall: "left", u: 93, d: 30, y: 95, opts: { name: "glass-tea" } },
  { model: "sugar-cubes", wall: "left", u: 109, d: 40, y: 95, opts: { name: "sugar-cubes" } },
  { model: "takeaway-cup", wall: "left", u: 199, d: 26, y: 95, opts: { name: "takeaway-cup", seed: 3, count: 2 } }, // generator: 2 variants
  { model: "coffee-beans", wall: "left", u: 214, d: 44, y: 95, opts: { name: "coffee-beans", seed: 5, count: 1, beans: 3 } },
  { model: "coffee-cup", wall: "left", u: 235, d: 26, y: 95, opts: { name: "coffee-cup", colors: ["blue", "terracotta", "charcoal"] } }, // generator: 3 colours
  { model: "a-frame-sign", wall: "left", u: 248, d: 95, y: 0, turn: 10, opts: { name: "a-frame-sign" } }, // on the floor in front of the counter end
  { model: "books", wall: "left", u: 150, d: 10, y: 175, opts: { name: "books", seed: 7, count: 10 } }, // generator: wall shelf + 10 books, above the coffee machine
  // brewing corner: sideboard on the right wall (u 210–390, top at 90 cm) with the gear on top
  { model: "sideboard", wall: "right", u: 300, d: 23, y: 0, opts: { name: "sideboard" } },
  { model: "roaster", wall: "right", u: 232, d: 20, y: 90, opts: { name: "roaster" } },
  { model: "grinder", wall: "right", u: 268, d: 14, y: 90, opts: { name: "grinder" } },
  { model: "moka-pot", wall: "right", u: 294, d: 18, y: 90, opts: { name: "moka-pot" } },
  { model: "french-press", wall: "right", u: 320, d: 18, y: 90, opts: { name: "french-press" } },
  { model: "pour-over", wall: "right", u: 346, d: 18, y: 90, opts: { name: "pour-over" } },
  { model: "milk-frother", wall: "right", u: 372, d: 18, y: 90, opts: { name: "milk-frother" } },
];
