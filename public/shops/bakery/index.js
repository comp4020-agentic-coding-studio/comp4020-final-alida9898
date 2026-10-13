// The bakery shop type (面包店) — a DEMO type: one storey + a small yard, ~10 items.
// A big brick oven is the focal point on the left; a bread display counter on the
// right. Shape: ../README.md.
//
// Layout (top view, origin = centre of the back wall's inner face, +Z toward the viewer):
//   zone `oven` (x −220…0): brick oven against the back wall (−120, 50), the peel leaning
//     on its left, a flour sack right of it, the chalkboard menu on the left wall.
//   zone `shop` (x 0…220): display counter (60, 200) with three bread baskets on top,
//     kneading table against the back wall (120, 45) under the window, rolling pin on it.
//   door: right wall, z 210…310 → the yard. Nothing past z 300 (the open front).
import { YARD } from "./yard/index.js";

const ROOM = { x: [-220, 220], z: [0, 360], wall: 12 };
const L = (zh, en) => ({ zh, en });

export default {
  name: L("面包店", "Bakery"),
  loading: L("正在把面包店捏出来……", "Shaping the bakery out of clay…"),
  room: ROOM,
  levels: [
    {
      level: 0,
      name: L("店里", "Inside"),
      theme: { paper: 0xf6e3c4, wainscot: 0xc98b5e },
      openings: [
        { kind: "door", wall: "right", along: 260, y: 0, width: 100, height: 220 },
        { kind: "window", wall: "back", along: 120, y: 110, width: 100, height: 110, arch: true },
      ],
      zones: {
        oven: {
          label: L("烤炉", "Oven corner"),
          boxes: [{ x: [-220, 0], y: [0, 280], z: [0, 300] }],
          notes: "Brick oven, peel, flour sack; chalkboard on the left wall.",
        },
        shop: {
          label: L("面包柜", "Bread counter"),
          boxes: [{ x: [0, 200], y: [0, 280], z: [0, 260] }],
          notes: "Display counter with bread baskets; kneading table under the window.",
        },
      },
      walkways: { entry: { x: [140, 220], y: [0, 220], z: [200, 320] } },
    },
  ],
  tube: null,
  zone: (id) => import(`./zones/${id}.js`),
  yard: YARD,
  seasons: {
    spring: () => import("./seasons/spring.js"),
  },
};
