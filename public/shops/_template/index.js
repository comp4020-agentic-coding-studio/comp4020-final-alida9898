// TEMPLATE shop type — copy this folder to public/shops/<type>/ and register it in
// ../index.js. Shape documented in ../README.md. View it with /play.html?shop=<id>&type=_template.

// one storey, 400 wide × 360 deep (interior), origin = centre of the back wall's inner face
const ROOM = { x: [-200, 200], z: [0, 360], wall: 12 };

export default {
  name: { zh: "小店", en: "Little shop" },
  loading: { zh: "正在把小店捏出来……", en: "Shaping the shop out of clay…" },
  room: ROOM,
  levels: [
    {
      level: 0,
      name: { zh: "店里", en: "Inside" },
      theme: { paper: 0xf3e2c8, wainscot: 0xb7c49a },
      // the door goes on the RIGHT wall, so the yard (x > room.x[1]) meets it
      openings: [
        { kind: "door", wall: "right", along: 260, y: 0, width: 100, height: 220 },
        { kind: "window", wall: "back", along: -80, y: 100, width: 100, height: 120, arch: true },
      ],
      zones: {
        main: {
          label: { zh: "店堂", en: "Shop floor" },
          boxes: [{ x: [-200, 200], y: [0, 280], z: [0, 300] }],
          notes: "Everything z ≤ 300 (the open front stays clear).",
        },
      },
      walkways: { entry: { x: [100, 200], y: [0, 220], z: [200, 320] } },
    },
  ],
  tube: null,
  zone: (id) => import(`./zones/${id}.js`),
  yard: {
    label: { zh: "院子", en: "Yard" },
    box: { x: [212, 480], y: [0, 280], z: [0, 360] },
    zones: { garden: { label: { zh: "院子", en: "Yard" }, boxes: [{ x: [212, 480], y: [0, 280], z: [0, 360] }] } },
    zone: (id) => import(`./yard/${id}.js`),
    // optional: seasonal scenery. Return { group } in world coords; see ../cafe/yard/scenery.js
    scenery: null,
  },
  seasons: {
    spring: () => import("./seasons/spring.js"),
  },
};
