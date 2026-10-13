// The café's world frame, storeys and zone boundaries. Single source of truth —
// see public/cafe/README.md. All numbers in cm (1 unit = 1 cm), +Y up.
//
//   origin  = ground-floor level, centre of the BACK wall's inner face
//   +X      = to the right (viewer's right, looking in through the open front)
//   +Z      = out of the building toward the open front (the viewer)
//   back wall  = plane z = 0     (faces +Z)
//   left wall  = plane x = -300  (faces +X)
//   right wall = plane x = +300  (faces -X)
//   open front = z = 480 on every storey; no roof
//
// The building is a stack of storeys. Storey `level` n has its floor top at
// world y = levelY(n) = n * STOREY_H. Everything inside a storey (zones,
// openings, walkways) is written in STOREY-LOCAL coords: x and z are world,
// y is measured from that storey's floor top (0 = standing on the floor).
//
// A box is { x: [min, max], y: [min, max], z: [min, max] } in cm.

export const STOREY_H = 300;
export const SLAB = 20; // floor slab thickness of an upper storey (sits just under its floor top)
export const ROOM = { x: [-300, 300], z: [0, 480], wall: 12 };
export const levelY = (n) => n * STOREY_H;

// Staircase from a storey up to the next, along the LEFT wall: foot at the
// front (z = 440), rising toward the back, arriving on the storey above at
// z = 160. 15 rises of 20 cm, 14 treads of 20 cm. The storey above has a
// stairwell hole at STAIRWELL with a railing on its open sides.
export const STAIRS = { x: [-300, -210], z: [160, 440], rises: 15, rise: STOREY_H / 15, tread: 20 };
export const STAIRWELL = { x: [-300, -210], z: [160, 440] };

// The copper bean tube runs up through every storey near the back wall.
// It is shell-owned; nothing may be placed in TUBE.keepout on any storey.
export const TUBE = { x: -20, z: 50, r: 30, keepout: { x: [-65, 25], z: [0, 95] } };

// Per-storey layout. `theme` colours the walls; `openings` are door/window
// models (`along` = world x for the back wall, world z for side walls; `y` = sill
// height above that storey's floor). Zones: each owned by ONE file
// public/cafe/zones/<id>.js. Zone ids are unique across the whole building.
export const LEVELS = [
  {
    level: 0,
    name: { zh: "一楼 咖啡吧", en: "Ground floor · coffee bar" },
    theme: { paper: 0xf0dcc0, wainscot: 0x9fae86 },
    openings: [
      { kind: "door", wall: "right", along: 380, y: 0, width: 100, height: 220 },
      { kind: "window", wall: "right", along: 200, y: 105, width: 100, height: 120 },
      { kind: "window", wall: "back", along: -200, y: 110, width: 100, height: 120, arch: true },
    ],
    zones: {
      bar: {
        label: { zh: "吧台", en: "Bar" },
        boxes: [
          { id: "main", x: [40, 300], y: [0, 280], z: [0, 300] },
          { id: "door", x: [180, 300], y: [0, 280], z: [300, 420] },
        ],
        notes: "FOCAL. Straight counter x 45…295, z 122…178 (no counter chairs)." +
          " Bean-jar wall shelf + menu board on the back wall. Entrance by the door " +
          "(right wall z 330–430): OPEN sign, doormat, umbrella stand, A-frame — all inside, z ≤ 420.",
      },
      window: {
        label: { zh: "窗边", en: "Window & booth" },
        boxes: [
          { id: "bay", x: [-300, -65], y: [0, 280], z: [0, 100] },
          { id: "booth", x: [-210, -50], y: [0, 280], z: [180, 360] },
        ],
        notes: "Bay seat under the back arched window; chalkboard on the back wall right of it; banquette along " +
          "the stair side (x −210…−155, z 190…350) with one long table and two backed chairs.",
      },
      seating: {
        label: { zh: "座位", en: "Tables" },
        boxes: [
          { id: "mid", x: [-50, 40], y: [0, 280], z: [180, 360] },
          { id: "front", x: [40, 180], y: [0, 280], z: [330, 420] },
        ],
        notes: "Two round tables with backed chairs. Everything z ≤ 420 (nothing near the open front).",
      },
    },
    walkways: {
      entry: { x: [180, 300], y: [0, 220], z: [320, 420] },
      barFront: { x: [40, 230], y: [0, 220], z: [225, 300] },
      toStairs: { x: [-170, 40], y: [0, 220], z: [360, 440] },
      stairFoot: { x: [-300, -170], y: [0, 220], z: [440, 480] },
      toWindow: { x: [-150, 40], y: [0, 220], z: [100, 180] },
    },
  },
  {
    level: 1,
    name: { zh: "二楼 阅读角", en: "Upstairs · reading lounge" },
    theme: { paper: 0xf3e0c2, wainscot: 0xc98e6a },
    openings: [
      { kind: "window", wall: "back", along: 170, y: 90, width: 110, height: 140, arch: true },
      { kind: "window", wall: "right", along: 260, y: 90, width: 110, height: 140, arch: true },
      { kind: "window", wall: "left", along: 320, y: 110, width: 90, height: 120 },
    ],
    zones: {
      reading: {
        label: { zh: "读书角", en: "Reading corner" },
        boxes: [{ x: [25, 300], y: [0, 280], z: [0, 200] }],
        notes: "FOCAL. Armchair in front of the back arched window, floor lamp, side table with book + cup.",
      },
      lounge: {
        label: { zh: "客厅", en: "Lounge" },
        boxes: [{ x: [30, 300], y: [0, 280], z: [200, 420] }],
        notes: "Two loveseats facing across a low coffee table; mixed bookshelf on the right wall; plants on the " +
          "right window sill. Front 60 cm of the slab stays empty.",
      },
      brewing: {
        label: { zh: "手冲", en: "Slow bar" },
        boxes: [{ x: [-200, 30], y: [0, 280], z: [0, 120] }],
        notes: "Sideboard on the back wall x −200…−70, roaster at its right end next to the bean tube; the one " +
          "large artwork hangs above it.",
      },
    },
    walkways: {
      landing: { x: [-300, -200], y: [0, 220], z: [90, 160] },
      toLounge: { x: [-210, 30], y: [0, 220], z: [120, 190] },
    },
  },
];

/** Point-in-box helper for checks (same frame as the box). */
export const inBox = (b, p) =>
  p.x >= b.x[0] && p.x <= b.x[1] && p.y >= b.y[0] && p.y <= b.y[1] && p.z >= b.z[0] && p.z <= b.z[1];
