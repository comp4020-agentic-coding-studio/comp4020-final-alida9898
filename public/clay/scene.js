// Scene layout — the single source of truth for where things are.
//   model: file in ./models/ (without .js)   wall: "left" | "right"
//   u: cm along the wall from its canvas-left edge (0–400) to the object's origin
//   d: cm out from the wall to the object's origin (its back should touch d − depth/2)
//   y: cm above the floor (0 for floor things; a surface's height for things sitting on it)
//   turn: extra rotation in degrees about Y (0 = facing straight out of the wall)
//   opts: passed to build(kit, opts); `name` overrides the object name / id prefix
//   todo: true → placeholder, skipped until the model file exists
export const SCENE = [
  { model: "pot", wall: "left", u: 330, d: 40, y: 0, opts: { name: "pot", scale: 1.6 } },
  { model: "pot", wall: "right", u: 70, d: 30, y: 0, opts: { name: "smallpot", scale: 1 } }, // exercises the right-wall projection

  // --- placeholders for the model agents (remove `todo` when the file exists) ---
  { model: "plant", wall: "left", u: 330, d: 40, y: 35, opts: { name: "plant", scale: 1.2 } }, // leaves sitting in the pot (pot rim at y ≈ 34 with scale 1.6)
  { model: "armchair", wall: "right", u: 150, d: 45, y: 0, opts: { name: "armchair" } },
  { model: "coffee-machine", wall: "left", u: 150, d: 24, y: 95, opts: { name: "coffee-machine" } }, // sits on a (future) counter top at 95 cm; back touches the wall
  { model: "books", wall: "left", u: 150, d: 10, y: 175, opts: { name: "books", seed: 7, count: 10 } }, // generator: wall shelf + 10 books, above the coffee machine
];
