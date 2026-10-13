// Zone `seating` (level 0) — two round tables with backed chairs, in the open middle of the
// floor. Coords storey-local (cm). Everything stays at z ≤ 420 (nothing near the open front).
//
//   table 1  (15, 290): chairs north/south of it (z 245, 335), a cup and a small flower pot.
//   table 2  (110, 375): chairs west/east of it (x 65, 155), one cup — someone reading alone.
// Walkways kept clear: barFront (z 225…300 for x ≥ 40), toStairs (z 360…440, x −170…40),
// entry (x ≥ 180).
import { backedChair, flowerPot } from "../placeholder.js";

const L = (zh, en) => ({ zh, en });
const H = 74, OUT = 45;

const TABLES = [
  { x: 15, z: 290, axis: "z", seats: ["mustard", "blue"], cup: "terracotta", flowers: true },
  { x: 110, z: 375, axis: "x", seats: ["leaf", "terracotta"], cup: "cream" },
];

export async function populate({ kit, group, model, place }) {
  const add = (obj, at, tag) => {
    place(obj, at);
    obj.userData.item = { parent: null, layer: 1, ...tag };
    group.add(obj);
    return obj;
  };
  let chairN = 0;
  for (const [i, t] of TABLES.entries()) {
    const n = i + 1, tid = `l0-seating-table-${n}`;
    add(await model("cafe-table", { name: tid, height: H }), { x: t.x, y: 0, z: t.z },
      { id: tid, label: L(`小圆桌 ${n}`, `Round table ${n}`), focus: true });
    for (const s of [-1, 1]) {
      chairN++;
      const id = `l0-seating-chair-${chairN}`;
      // chair front faces the table
      const at = t.axis === "z"
        ? { x: t.x, z: t.z + s * OUT, turn: s < 0 ? 0 : 180 }
        : { x: t.x + s * OUT, z: t.z, turn: s < 0 ? 90 : -90 };
      add(backedChair(kit, { name: id, seat: t.seats[(s + 1) / 2] }), { ...at, y: 0 },
        { id, label: L(`靠背椅 ${chairN}`, `Chair ${chairN}`) });
    }
    const cupId = `l0-seating-cup-${n}`;
    add(await model("coffee-cup", { name: cupId, colors: [t.cup], count: 1 }), { x: t.x - 8, y: H, z: t.z + 8, turn: -15 + i * 30 },
      { id: cupId, parent: tid, layer: 2, label: L(`桌上咖啡杯 ${n}`, `Table cup ${n}`) });
    if (t.flowers) {
      add(flowerPot(kit, { name: "l0-seating-flowers" }), { x: t.x + 10, y: H, z: t.z - 8 },
        { id: "l0-seating-flowers", parent: tid, layer: 2, label: L("小花盆", "Little flower pot") });
    }
  }
}
