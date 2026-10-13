// Yard zone `garden` (bakery): a bench and the bread rack by the door. World cm. Ids `yard-garden-<thing>`.
const L = (zh, en) => ({ zh, en });

export async function populate({ group, model, place }) {
  const item = async (name, opts, at, tag) => {
    const obj = place(await model(name, { name: tag.id, ...opts }), at);
    obj.userData.item = { parent: null, layer: 1, ...tag };
    group.add(obj);
    return obj;
  };
  await item("garden-bench", { width: 110 }, { x: 330, y: 0, z: 60 },
    { id: "yard-garden-bench", label: L("长椅", "Garden bench") });
  await item("bakery-bread-rack", {}, { x: 430, y: 0, z: 250, turn: -20 },
    { id: "yard-garden-bread-rack", label: L("门口面包架", "Bread rack") });
}
