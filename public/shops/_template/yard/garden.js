// Yard zone `garden` (template). Coords: world cm, ground y = 0. Ids `yard-garden-<thing>`.
const L = (zh, en) => ({ zh, en });

export async function populate({ group, model, place }) {
  const obj = place(await model("garden-bench", { name: "yard-garden-bench" }), { x: 340, y: 0, z: 80 });
  obj.userData.item = { id: "yard-garden-bench", parent: null, layer: 1, label: L("长椅", "Garden bench") };
  group.add(obj);
}
