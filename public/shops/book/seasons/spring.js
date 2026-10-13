// Spring decor for the bookshop: a jar of spring flowers on the counter.
// `season: "spring"` is added to the tag by the builder. Ids `<l0|yard>-spring-<thing>`.
import { COUNTER } from "../zones/counter.js";

const L = (zh, en) => ({ zh, en });

export const decor = [
  {
    level: 0, zone: "counter",
    async populate({ group, model, place }) {
      const o = place(await model("book-flower-jar", { name: "l0-spring-flower-jar" }), { x: COUNTER.x + 32, y: COUNTER.top, z: COUNTER.z - 4 });
      o.userData.item = { id: "l0-spring-flower-jar", parent: "l0-counter-counter", layer: 2, label: L("一罐春花", "Jar of spring flowers") };
      group.add(o);
    },
  },
];
