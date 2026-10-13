// Spring decor (template). `level` = storey number or "yard"; `zone` = an existing zone.
// `season: "spring"` is added to every tag automatically. Ids `<l0|yard>-spring-<thing>`.
const L = (zh, en) => ({ zh, en });

export const decor = [
  {
    level: "yard", zone: "garden",
    async populate({ group, model, place }) {
      const o = place(await model("flower-box", { name: "yard-spring-flower-box" }), { x: 232, y: 0, z: 200, turn: 90 });
      o.userData.item = { id: "yard-spring-flower-box", parent: null, layer: 1, label: L("花箱", "Flower box") };
      group.add(o);
    },
  },
];
