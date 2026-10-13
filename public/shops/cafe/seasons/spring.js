// Spring decor for the café: six seasonal items, only built / listed / placeable in
// spring (see ../../README.md, "Seasons"). Each entry populates into an existing zone
// (`level` = storey number or "yard"); every tag gets `season: "spring"` added for it.
// Ids: `<l0|yard>-spring-<thing>`.
import { TRUNK_R } from "../../../clay/models/yard-tree.js";
import { YARD } from "../yard/index.js";

const L = (zh, en) => ({ zh, en });

export const decor = [
  {
    level: 0, zone: "window",
    // seedlings on the sill of the back arched window (x −250…−150, sill top y 110, 16 cm deep)
    async populate({ group, model, place }) {
      const o = place(await model("seedling-tray", { name: "l0-spring-seedlings" }), { x: -200, y: 110, z: 8 });
      o.userData.item = { id: "l0-spring-seedlings", parent: null, layer: 1, label: L("窗台小苗", "Seedlings on the sill") };
      group.add(o);
    },
  },
  {
    level: 0, zone: "seating",
    // cherry blossom on round table 1 (15, 290; top 74), clear of its cup and flower pot
    async populate({ group, model, place }) {
      const o = place(await model("blossom-vase", { name: "l0-spring-blossom-vase" }), { x: 0, y: 74, z: 280, turn: 15 });
      o.userData.item = { id: "l0-spring-blossom-vase", parent: "l0-seating-table-1", layer: 2, label: L("一瓶樱花", "Cherry blossom vase") };
      group.add(o);
    },
  },
  {
    level: 0, zone: "bar",
    // a spring menu card at the front of the counter, between the pastry case and the machine
    async populate({ group, model, place }) {
      const o = place(await model("menu-card", { name: "l0-spring-menu-card" }), { x: 113, y: 95, z: 168, turn: -10 });
      o.userData.item = { id: "l0-spring-menu-card", parent: "l0-bar-counter", layer: 2, label: L("春季菜单卡", "Spring menu card") };
      group.add(o);
    },
  },
  {
    level: "yard", zone: "garden",
    async populate({ group, model, place }) {
      // blooming flower box against the café's outer wall, just in front of the door
      const box = place(await model("flower-box", { name: "yard-spring-flower-box", width: 70 }), { x: 327, y: 0, z: 292, turn: 90 });
      box.userData.item = { id: "yard-spring-flower-box", parent: null, layer: 1, label: L("门边花箱", "Flower box by the door") };
      // bird house hung on the tree trunk, facing the viewer
      const bird = place(await model("bird-house", { name: "yard-spring-bird-house" }), { x: YARD.tree.x, y: 130, z: YARD.tree.z + TRUNK_R - 1 });
      bird.userData.item = { id: "yard-spring-bird-house", parent: null, layer: 1, label: L("树上的鸟屋", "Bird house on the tree") };
      // watering can on the grass beside the planter box (x 566…606, z 245…355)
      const can = place(await model("watering-can", { name: "yard-spring-watering-can" }), { x: 556, y: 0, z: 372, turn: 30 });
      can.userData.item = { id: "yard-spring-watering-can", parent: null, layer: 1, label: L("浇水壶", "Watering can") };
      group.add(box, bird, can);
    },
  },
];
