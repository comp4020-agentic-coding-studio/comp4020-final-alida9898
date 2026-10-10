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
        boxes: [{ x: [40, 300], y: [0, 280], z: [0, 480] }],
        notes: "Counter, its front at ~z 200 (staff side behind, z 60–150). Back bar + menu board on the back wall " +
          "(z 0–50, x 40–290). Entrance by the door on the right wall (z 330–430): OPEN sign, doormat, " +
          "umbrella stand, A-frame (A-frame may stand just outside the front, z ≤ 520). Pastry case on/at the counter.",
      },
      seating: {
        label: { zh: "座位", en: "Seating" },
        boxes: [
          { id: "main", x: [-200, 40], y: [0, 280], z: [180, 480] },
          { id: "nook", x: [-300, -75], y: [0, 280], z: [0, 150] },
        ],
        notes: "4–5 small round tables + chairs; ≥ 60 cm between tables. The nook is the back-left corner " +
          "under the back window (one table). Keep the walkways clear.",
      },
    },
    walkways: {
      entry: { x: [180, 300], y: [0, 220], z: [300, 460] },
      barFront: { x: [40, 300], y: [0, 220], z: [215, 300] },
      stairFoot: { x: [-300, -170], y: [0, 220], z: [440, 480] },
      toNook: { x: [-210, 40], y: [0, 220], z: [100, 180] },
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
      lounge: {
        label: { zh: "阅读角", en: "Lounge" },
        boxes: [
          { id: "main", x: [30, 300], y: [0, 280], z: [0, 480] },
          { id: "front", x: [-200, 30], y: [0, 280], z: [190, 480] },
        ],
        notes: "Armchair nook, blanket, side tables, floor lamp, bookshelf + books, frames, window plants, " +
          "optional cat spot. The stairwell rail runs along x = -210 (z 160–440) and z = 440 (x -300..-210).",
      },
      brewing: {
        label: { zh: "手冲台", en: "Brewing" },
        boxes: [{ x: [-200, 30], y: [0, 280], z: [0, 120] }],
        notes: "Sideboard against the back wall LEFT of the tube (x -200..-70) with the six brewing tools on " +
          "its top (y = 90): roaster, grinder, moka pot, French press, pour-over, milk frother. Shelves above.",
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
