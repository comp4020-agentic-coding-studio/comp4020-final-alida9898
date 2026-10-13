// Spring decor for the bakery: a tray of hot cross buns on the kneading table, and a
// little pot of tulips on the back window's sill (x 70…170, sill top y 110, 16 cm deep).
// `season: "spring"` is added to every tag. Ids `l0-spring-<thing>`.
import { TOP_Y as TABLE_TOP } from "../../../clay/models/bakery-table.js";

const L = (zh, en) => ({ zh, en });

export const decor = [
  {
    level: 0, zone: "shop",
    async populate({ group, model, place }) {
      const tray = place(await model("bakery-bun-tray", { name: "l0-spring-bun-tray" }), { x: 95, y: TABLE_TOP, z: 42, turn: -6 });
      tray.userData.item = { id: "l0-spring-bun-tray", parent: "l0-shop-table", layer: 2, label: L("十字面包", "Hot cross buns") };
      group.add(tray);
      const pot = place(await model("bakery-flower-pot", { name: "l0-spring-flower-pot" }), { x: 140, y: 110, z: 8 });
      pot.userData.item = { id: "l0-spring-flower-pot", parent: null, layer: 1, label: L("窗台郁金香", "Tulips on the sill") };
      group.add(pot);
    },
  },
];
