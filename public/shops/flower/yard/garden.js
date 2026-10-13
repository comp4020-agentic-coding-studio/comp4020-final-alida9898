// Yard zone `garden` — the flower stand (focus) by the door with three buckets on its
// steps, the cart, the sign. Coords: world cm, ground y = 0. Ids `yard-garden-<thing>`.
import { TIERS } from "../../../clay/models/flower-stand.js";

const L = (zh, en) => ({ zh, en });
const STAND = { x: 300, z: 110 };

export async function populate({ group, model, place }) {
  const item = async (name, opts, at, tag) => {
    const obj = place(await model(name, { name: tag.id, ...opts }), at);
    obj.userData.item = { parent: null, layer: 1, ...tag };
    group.add(obj);
    return obj;
  };
  await item("flower-stand", {}, { x: STAND.x, y: 0, z: STAND.z },
    { id: "yard-garden-stand", label: L("阶梯花架", "Tiered flower stand"), focus: true });
  const buckets = [
    ["tulip", 0xe07a8a, -28, 0, L("一桶郁金香", "Bucket of tulips"), "tulips"],
    ["sunflower", 0xe6b53a, 22, 1, L("一桶向日葵", "Bucket of sunflowers"), "sunflowers"],
    ["rose", 0xf2b8c6, -10, 2, L("一桶玫瑰", "Bucket of roses"), "roses"],
  ];
  for (const [kind, color, dx, t, label, id] of buckets) {
    await item("flower-bucket", { kind, color, seed: t + 2 }, { x: STAND.x + dx, y: TIERS[t].y, z: STAND.z + TIERS[t].z },
      { id: `yard-garden-${id}`, parent: "yard-garden-stand", layer: 2, label });
  }
  await item("flower-cart", {}, { x: 445, y: 0, z: 130, turn: -15 },
    { id: "yard-garden-cart", label: L("卖花小推车", "Flower cart") });
  await item("flower-sign", {}, { x: 500, y: 0, z: 275, turn: -20 },
    { id: "yard-garden-sign", label: L("店招", "Shop sign") });
}
