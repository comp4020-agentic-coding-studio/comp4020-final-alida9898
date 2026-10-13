// The bookshop's yard: right of the building (right wall outer face x = 212), ground level,
// world cm, x 212…480, z 0…360. One zone, `garden`.
//   path    stepping stones from the door (z 190…290) out to the front
//   tree    scenery at (410, 80); the bench under it, facing the viewer
//   cart    sidewalk book cart beside the path (355, 225)
export const YARD = {
  label: { zh: "院子", en: "Yard" },
  box: { x: [212, 480], y: [0, 280], z: [0, 360] },
  zones: {
    garden: {
      label: { zh: "院子", en: "Yard" },
      boxes: [{ x: [212, 480], y: [0, 280], z: [0, 360] }],
      notes: "Book cart + bench. Tree, grass, path and the season's scatter are scenery.",
    },
  },
  zone: (id) => import(`./${id}.js`),
  scenery: (ctx) => import("./scenery.js").then((m) => m.build(ctx)),
  tree: { x: 410, z: 80 },
  stones: [[236, 250], [266, 272], [292, 296], [312, 322], [326, 346]],
};
