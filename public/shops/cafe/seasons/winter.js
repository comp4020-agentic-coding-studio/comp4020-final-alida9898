// Winter decor for the café: six seasonal items, only built / listed / placeable in
// winter (see ../../README.md, "Seasons"). Each entry populates into an existing zone
// (`level` = storey number or "yard"); every tag gets `season: "winter"` added for it.
// Ids: `<l0|yard>-winter-<thing>`.

const L = (zh, en) => ({ zh, en });

export const decor = [
  {
    level: 0, zone: "bar",
    // scarf draped over the rim of the entrance umbrella stand (centre 286, 282; radius
    // 9.5, rim top ≈ 45), beside the umbrella's shaft, both tails hanging down the front
    // (+Z, toward the viewer/door) clear of the a-frame sign (x ≤ 275) and the door (x ≥ 300).
    // Hot-chocolate mugs sit in the one open gap on the counter not used by any other
    // season or base item: x 180…204, between the espresso machine (spans ~120…180)
    // and the grinder (spans ~204…220) — summer's iced-coffee set instead fills the
    // gap at x 220…254, so the two seasons' counter items never share a spot.
    async populate({ group, model, place }) {
      const STAND = "l0-bar-umbrella-stand";
      // centred on the stand's rim, tails hung toward +Z (straight out over the open
      // floor toward the viewer) so they clear the a-frame sign (x ≤ 275, to the
      // stand's left) and the door (x ≥ 300, to its right); blue/mustard so it reads
      // apart from the umbrella's terracotta canopy and the green wall behind it
      const scarf = place(await model("knitted-scarf", {
        name: "l0-winter-scarf", radius: 10.5, drop: 36, angle: 0, color: "blue", stripe: "mustard", stripe2: "cream",
      }), { x: 286, y: 45, z: 282 });
      scarf.userData.item = { id: "l0-winter-scarf", parent: STAND, layer: 2, label: L("围脖架上的围巾", "Scarf on the stand") };
      const TOP = 95, Z = 140;
      const mug1 = place(await model("hot-chocolate-mug", { name: "l0-winter-mug-1", color: "blue" }), { x: 187, y: TOP, z: Z, turn: 12 });
      mug1.userData.item = { id: "l0-winter-mug-1", parent: "l0-bar-counter", layer: 2, label: L("热可可 1", "Hot chocolate 1") };
      const mug2 = place(await model("hot-chocolate-mug", { name: "l0-winter-mug-2", color: "terracotta" }), { x: 197, y: TOP, z: Z, turn: -10 });
      mug2.userData.item = { id: "l0-winter-mug-2", parent: "l0-bar-counter", layer: 2, label: L("热可可 2", "Hot chocolate 2") };
      group.add(scarf, mug1, mug2);
    },
  },
  {
    level: 0, zone: "window",
    // fairy lights draped over the back arched window (x −250…−150, sill y 110, height
    // 120: the arch is a half circle of radius 50 centred at (−200, 180), its cream frame
    // stands ~8 cm out from the wall). Was a swag at z 0 that sank into the frame and
    // wall; now the string follows the arch at radius 62, 14 cm out from the wall so it
    // hangs in front of the frame, with bigger bulbs. Lowest end ≈ y 178, clear of the
    // chalkboard (x ≥ −146 is right of the string's x ≤ −139 only above y ≈ 190).
    async populate({ group, model, place }) {
      const o = place(await model("fairy-lights", { name: "l0-winter-fairy-lights", arch: 62, depth: 14, bulb: 1.8 }), { x: -200, y: 180, z: 0 });
      o.userData.item = { id: "l0-winter-fairy-lights", parent: null, layer: 1, label: L("拱窗上的灯串", "Fairy lights on the arched window") };
      group.add(o);
    },
  },
  {
    level: "yard", zone: "garden",
    async populate({ group, model, place }) {
      // small snowman on open grass, clear of the tree, bench, planter and path stones
      const sm = place(await model("snowman", { name: "yard-winter-snowman", scarf: "blue" }), { x: 470, y: 0, z: 190 });
      sm.userData.item = { id: "yard-winter-snowman", parent: null, layer: 1, label: L("小雪人", "Snowman") };
      // sled on the snow beside the mailbox (385, 452), on its camera-facing +X side but
      // pulled well into the yard so the low front fence (z 472) doesn't cut across it:
      // side-on to the camera (front scroll and rope toward +X). Footprint ≈ x 377…473
      // (+ rope coil to ≈ 495), z 305…345: ~125 cm behind the fence, left of the lamp
      // post's column (x 525), on the snow by the path stones.
      // (Was at (455, 300) mid-yard, then (440, 420) where the fence crossed it.)
      const sled = place(await model("sled", { name: "yard-winter-sled" }), { x: 425, y: 0, z: 325, turn: 90 });
      sled.userData.item = { id: "yard-winter-sled", parent: null, layer: 1, label: L("木雪橇", "Wooden sled") };
      // lantern on the mailbox's roof ridge (mailbox at 385, 452; roof ridge top ≈ y 117),
      // centred so it clears the little flag at the roof's side
      const lan = place(await model("lantern", { name: "yard-winter-lantern" }), { x: 385, y: 117, z: 452 });
      lan.userData.item = { id: "yard-winter-lantern", parent: "yard-garden-mailbox", layer: 2, label: L("信箱上的灯笼", "Lantern on the mailbox") };
      group.add(sm, sled, lan);
    },
  },
];
