// Autumn decor for the café: six seasonal items, only built / listed / placeable in
// autumn (see ../../README.md, "Seasons"). Each entry populates into an existing zone
// (`level` = storey number or "yard"); every tag gets `season: "autumn"` added for it.
// Ids: `<l0|l1|yard>-autumn-<thing>`. Sized deliberately large/prominent per the brief —
// bigger than a strictly realistic object would be, so each one reads in the room's
// overview/panorama camera, not just up close.

import { TIERS as SHELF_TIERS, DEPTH as SHELF_DEPTH } from "../../../clay/models/wall-shelf.js";

const L = (zh, en) => ({ zh, en });
// bean-jar wall shelf (see ../../../cafe/zones/bar.js): placed at world (x 150, y 128, z 0),
// so its lower board TOP sits at world y = 128 + TIERS[0], front edge at world z = DEPTH.
const SHELF_SY = 128;

export const decor = [
  {
    level: 0, zone: "bar",
    // pumpkin pair by the door, tucked between the bar's main box and the door box
    // (z 300…320, just short of the `entry` walkway which starts at z 320 — the same
    // strip the A-frame sign (250, 290) and umbrella stand (286, 282) already sit in,
    // just closer to the wall at x 300). Doormat is 80×50 turned -90° at (270, 380) →
    // world footprint x 245…295, z 340…420, well clear at this z. Scaled down slightly
    // (0.8) so the pair's ~55 cm spread fits this narrow strip without reaching the
    // walkway or the A-frame.
    async populate({ group, model, place }) {
      const o = place(await model("pumpkin-pair", { name: "l0-autumn-pumpkins" }), { x: 284, y: 0, z: 304, turn: 15, scale: 0.8 });
      o.userData.item = { id: "l0-autumn-pumpkins", parent: null, layer: 1, label: L("一对南瓜", "A pair of pumpkins") };
      group.add(o);
    },
  },
  {
    level: 0, zone: "seating",
    // chestnut bowl on round table 2 (110, 375; top 74) — table 1 already holds the cherry
    // blossom vase (spring) at its centre and a cup/flowers; table 2 only has one cup
    // (cream, at x 102 z 383), so the bowl goes on the free side of the table.
    async populate({ group, model, place }) {
      const o = place(await model("chestnut-bowl", { name: "l0-autumn-chestnuts" }), { x: 120, y: 74, z: 367, turn: -20 });
      o.userData.item = { id: "l0-autumn-chestnuts", parent: "l0-seating-table-2", layer: 2, label: L("糖炒栗子碗", "Bowl of chestnuts") };
      group.add(o);
    },
  },
  {
    level: 0, zone: "bar",
    // maple-leaf garland draped along the UPPER board's front edge of the bean-jar wall
    // shelf (shelf at x 150 z 0, width 130 → x 85…215; upper tier top at y 48, shelf depth
    // 22 so its front edge is z = 22). The bean jars all sit further back on the boards
    // (z ≈ 11), so stringing the garland along the very front lip keeps it clear of them;
    // hanging leaves droop down in front of the lower tier's row of jars, not onto them.
    // Garland origin is its LEFT end, so start near the shelf's left edge.
    async populate({ group, model, place }) {
      const o = place(await model("maple-garland", { name: "l0-autumn-garland", width: 120 }),
        { x: 90, y: SHELF_SY + SHELF_TIERS[1], z: SHELF_DEPTH, turn: 0 });
      o.userData.item = { id: "l0-autumn-garland", parent: "l0-bar-bean-shelf", layer: 2, label: L("枫叶花环", "Maple-leaf garland") };
      group.add(o);
    },
  },
  {
    level: "yard", zone: "garden",
    async populate({ group, model, place }) {
      // rake leaning against the back fence (fence run z = 8), left of the bench (bench at
      // x 420 z 72) and well clear of the tree (540, 110) and planter (586, 300). turn: 0
      // keeps its lean pointing toward -Z, i.e. back toward the fence run.
      const rake = place(await model("rake", { name: "yard-autumn-rake" }), { x: 350, y: 0, z: 42, turn: 0 });
      rake.userData.item = { id: "yard-autumn-rake", parent: null, layer: 1, label: L("靠着篱笆的耙子", "Rake against the fence") };
      // pile of fallen leaves on open grass, between the path and the tree, clear of the
      // stepping stones (x 340…474, z 382…474) and the tree trunk
      const pile = place(await model("leaf-pile", { name: "yard-autumn-leafpile", radius: 34 }), { x: 470, y: 0, z: 170 });
      pile.userData.item = { id: "yard-autumn-leafpile", parent: null, layer: 1, label: L("一堆落叶", "A pile of fallen leaves") };
      // basket of apples on the bench seat (top y = 44), away from the armrests, opposite
      // end from summer's watermelon plate (which sits at x 400 z 78)
      const basket = place(await model("apple-basket", { name: "yard-autumn-apples" }), { x: 442, y: 44, z: 68, turn: -15 });
      basket.userData.item = { id: "yard-autumn-apples", parent: "yard-garden-bench", layer: 2, label: L("一篮苹果", "Basket of apples") };
      group.add(rake, pile, basket);
    },
  },
];
