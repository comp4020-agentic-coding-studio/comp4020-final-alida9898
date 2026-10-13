// Spring decor for the flower shop: a tulip pot on the work table and a bucket of cherry
// blossom branches against the wall by the door. `season: "spring"` is added for us.
import { TOP_Y } from "../../../clay/models/flower-table.js";

const L = (zh, en) => ({ zh, en });

export const decor = [
  {
    level: 0, zone: "work",
    async populate({ group, model, place }) {
      const o = place(await model("flower-tulip-pot", { name: "l0-spring-tulip-pot" }), { x: 15, y: TOP_Y, z: 112 });
      o.userData.item = { id: "l0-spring-tulip-pot", parent: "l0-work-table", layer: 2, label: L("一盆郁金香", "Tulip pot") };
      group.add(o);
    },
  },
  {
    level: "yard", zone: "garden",
    async populate({ group, model, place }) {
      const o = place(await model("flower-bucket", { name: "yard-spring-blossom", kind: "blossom", seed: 9, tall: 1.3 }), { x: 250, y: 0, z: 40 });
      o.userData.item = { id: "yard-spring-blossom", parent: null, layer: 1, label: L("一桶樱花枝", "Cherry blossom branches") };
      group.add(o);
    },
  },
];
