// The bookshop (书店) shop type — a DEMO: one storey, interior-forward (two tall shelves,
// a rolling ladder, a reading nook, a small counter) + a little yard. Shape: ../README.md.
//
// Layout (top view, +X right, +Z toward the viewer; interior x −200…200, z 0…360):
//   stacks   two tall shelves against the back wall (x −130, −30), the ladder leaning on the right one
//   nook     armchair on the left wall facing +X, floor lamp behind it, cat bed in front
//   counter  small counter at the back right (x 115, z 115), the door on the right wall (z 190…290)
//   Front 60 cm (z > 300) is left empty.
import { YARD } from "./yard/index.js";

const ROOM = { x: [-200, 200], z: [0, 360], wall: 12 };

export default {
  name: { zh: "书店", en: "Bookshop" },
  loading: { zh: "正在把书店捏出来……", en: "Shaping the bookshop out of clay…" },
  room: ROOM,
  levels: [
    {
      level: 0,
      name: { zh: "店里", en: "Inside" },
      theme: { paper: 0xefdcc0, wainscot: 0x8f6a52 },
      openings: [
        { kind: "door", wall: "right", along: 240, y: 0, width: 100, height: 220 },
        { kind: "window", wall: "left", along: 90, y: 100, width: 90, height: 120, arch: true },
      ],
      zones: {
        stacks: {
          label: { zh: "书架", en: "Stacks" },
          boxes: [{ x: [-200, 40], y: [0, 280], z: [0, 120] }],
          notes: "Two tall shelves on the back wall + the rolling ladder.",
        },
        nook: {
          label: { zh: "阅读角", en: "Reading nook" },
          boxes: [{ x: [-200, -40], y: [0, 280], z: [120, 300] }],
          notes: "Armchair, floor lamp, cat bed.",
        },
        counter: {
          label: { zh: "柜台", en: "Counter" },
          boxes: [{ x: [40, 200], y: [0, 280], z: [0, 180] }],
          notes: "Small counter with a stack of books.",
        },
      },
      walkways: { entry: { x: [60, 200], y: [0, 220], z: [180, 300] } },
    },
  ],
  tube: null,
  zone: (id) => import(`./zones/${id}.js`),
  yard: YARD,
  seasons: {
    spring: () => import("./seasons/spring.js"),
  },
};
