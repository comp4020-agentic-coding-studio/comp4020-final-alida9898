// The flower shop's yard: to the RIGHT of the building (outer face of the right wall
// x = 212), ground level, world cm, x 212…580, z 0…320. One zone, `garden`.
//   stand    tiered flower stand by the door (300, 120) with three buckets on its steps
//   cart     flower cart under the tree's edge (430, 110)
//   sign     shop sign by the front edge (500, 270), beside the stone path
//   tree     scenery at (530, 60); path from the door (z 150…250) out to the front
export const YARD = {
  label: { zh: "院子", en: "Yard" },
  box: { x: [212, 580], y: [0, 280], z: [0, 320] },
  zones: {
    garden: {
      label: { zh: "花院", en: "Flower yard" },
      boxes: [{ x: [212, 580], y: [0, 280], z: [0, 320] }],
      notes: "Flower stand + buckets, cart, sign. Tree, grass, path and the season's scatter are scenery.",
    },
  },
  zone: (id) => import(`./${id}.js`),
  scenery: (ctx) => import("./scenery.js").then((m) => m.build(ctx)),
  tree: { x: 530, z: 50 },
  path: [[236, 205], [266, 228], [296, 250], [330, 268], [366, 284], [400, 300]],
};
