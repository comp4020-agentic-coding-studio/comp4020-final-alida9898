// Zone `nook` — reading corner on the left wall: armchair facing into the shop, a floor
// lamp behind its shoulder, an empty cat bed in front. Storey-local cm.
const L = (zh, en) => ({ zh, en });

export async function populate({ group, model, place }) {
  const item = async (name, opts, at, tag) => {
    const obj = place(await model(name, { name: tag.id, ...opts }), at);
    obj.userData.item = { parent: null, layer: 1, ...tag };
    group.add(obj);
    return obj;
  };
  await item("armchair", { fabric: "terracotta", pillow: "cream" }, { x: -150, y: 0, z: 200, turn: 90 },
    { id: "l0-nook-armchair", label: L("阅读扶手椅", "Reading armchair") });
  await item("floor-lamp", {}, { x: -178, y: 0, z: 140 },
    { id: "l0-nook-lamp", label: L("落地灯", "Floor lamp") });
  await item("book-cat-bed", {}, { x: -80, y: 0, z: 262 },
    { id: "l0-nook-cat-bed", label: L("猫窝", "Cat bed") });
}
