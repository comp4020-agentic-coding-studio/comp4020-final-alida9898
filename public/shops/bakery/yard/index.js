// The bakery's yard: a small outdoor patch to the RIGHT of the building, where the
// door is (right wall z 210…310). World coords (cm), ground y = 0; the right wall's
// outer face is x = 232. One zone, `garden`.
//   tree     scenery at (440, 90); the bench in front of it (330, 70), back to the fence line.
//   rack     the bread rack out front-right (430, 250), turned toward the path.
//   path     stepping stones from the door out to the front edge (scenery).
export const YARD = {
  label: { zh: "院子", en: "Yard" },
  box: { x: [232, 500], y: [0, 280], z: [0, 360] },
  zones: {
    garden: {
      label: { zh: "院子", en: "Yard" },
      boxes: [{ x: [232, 500], y: [0, 280], z: [0, 360] }],
      notes: "Bench and bread rack. Tree, grass, path and the season's scatter are scenery.",
    },
  },
  zone: (id) => import(`./${id}.js`),
  scenery: (ctx) => import("./scenery.js").then((m) => m.build(ctx)),
  tree: { x: 440, z: 90 },
};
