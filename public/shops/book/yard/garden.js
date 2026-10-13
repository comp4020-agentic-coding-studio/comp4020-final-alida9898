// Yard zone `garden` (bookshop) — a sidewalk book cart and a bench. World cm, ground y = 0.
const L = (zh, en) => ({ zh, en });

export async function populate({ group, model, place }) {
  const item = async (name, opts, at, tag) => {
    const obj = place(await model(name, { name: tag.id, ...opts }), at);
    obj.userData.item = { parent: null, layer: 1, ...tag };
    group.add(obj);
    return obj;
  };
  await item("book-cart", {}, { x: 370, y: 0, z: 225 },
    { id: "yard-garden-book-cart", label: L("书摊推车", "Sidewalk book cart") });
  await item("garden-bench", { width: 110 }, { x: 330, y: 0, z: 50 },
    { id: "yard-garden-bench", label: L("长椅", "Bench") });
}
