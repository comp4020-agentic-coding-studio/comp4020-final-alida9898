// The flower shop (花店) — a DEMO shop type: one small storey and a yard that does
// most of the talking (it shows the seasons best). Shape: ../README.md.
// One storey, 400 wide × 320 deep (interior), origin = centre of the back wall's inner face.
import { YARD } from "./yard/index.js";

const ROOM = { x: [-200, 200], z: [0, 320], wall: 12 };

export default {
  name: { zh: "花店", en: "Flower shop" },
  loading: { zh: "正在把花店捏出来……", en: "Shaping the flower shop out of clay…" },
  room: ROOM,
  levels: [
    {
      level: 0,
      name: { zh: "店里", en: "Inside" },
      theme: { paper: 0xf6e3e0, wainscot: 0x9db08a },
      openings: [
        { kind: "door", wall: "right", along: 200, y: 0, width: 100, height: 220 },
        { kind: "window", wall: "back", along: -110, y: 100, width: 110, height: 120, arch: true },
      ],
      zones: {
        work: {
          label: { zh: "包花台", en: "Work table" },
          boxes: [{ x: [-200, 200], y: [0, 280], z: [0, 260] }],
          notes: "Work table mid-room, plant shelf on the back wall. Everything z ≤ 260 (front 60 cm clear).",
        },
      },
      walkways: { entry: { x: [100, 200], y: [0, 220], z: [140, 260] } },
    },
  ],
  tube: null,
  zone: (id) => import(`./zones/${id}.js`),
  yard: YARD,
  seasons: {
    spring: () => import("./seasons/spring.js"),
  },
};
