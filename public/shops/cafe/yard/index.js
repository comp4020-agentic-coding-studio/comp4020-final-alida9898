// The café's yard (院子): an outdoor area to the RIGHT of the building, where the
// door is. Ground level, coords in the café's world frame (cm): x 312…620 (the
// right wall's outer face is x = 312), z 0…480. One zone, `garden`.
//
// Layout (top view, +X right, +Z toward the viewer):
//   fence     low picket fence: back (z 8), right side (x 612), front (z 472) with a
//             gate gap at x 420…500 where the stone path leaves the yard.
//   path      stepping stones from the door (right wall z 330…430) curving out to the gate.
//   tree      scenery at (540, 110); the bench under it (420, 70) with its back to the fence.
//   bed       planter box along the right fence (585, 300), facing the path.
//   mailbox   by the front fence left of the gate (385, 452); lamp post right of it (525, 452).
export const YARD = {
  label: { zh: "院子", en: "Yard" },
  box: { x: [312, 620], y: [0, 280], z: [0, 480] },
  zones: {
    garden: {
      label: { zh: "院子", en: "Yard" },
      boxes: [{ x: [312, 620], y: [0, 280], z: [0, 480] }],
      notes: "Bench, planter box, mailbox, fence, lamp post. Tree, grass, path and the season's scatter are scenery.",
    },
  },
  zone: (id) => import(`./${id}.js`),
  scenery: (ctx) => import("./scenery.js").then((m) => m.build(ctx)),
  tree: { x: 540, z: 110 },
  fence: [[312, 8, 612, 8], [612, 8, 612, 472], [612, 472, 500, 472], [420, 472, 312, 472]],
};
