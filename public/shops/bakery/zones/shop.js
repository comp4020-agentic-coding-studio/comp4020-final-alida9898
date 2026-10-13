// Zone `shop` (bakery): the bread display counter (focus) with three baskets on top,
// and the kneading table under the back window with a rolling pin on it.
// Coords: storey-local cm. Ids `l0-shop-<thing>`.
import { TOP_Y as DISPLAY_TOP } from "../../../clay/models/bakery-display.js";
import { TOP_Y as TABLE_TOP } from "../../../clay/models/bakery-table.js";

const L = (zh, en) => ({ zh, en });

export async function populate({ group, model, place }) {
  const item = async (name, opts, at, tag) => {
    const obj = place(await model(name, { name: tag.id, ...opts }), at);
    obj.userData.item = { parent: null, layer: 1, ...tag };
    group.add(obj);
    return obj;
  };
  await item("bakery-display", { width: 150 }, { x: 55, y: 0, z: 165 },
    { id: "l0-shop-display", label: L("面包柜", "Bread display"), focus: true });
  const baskets = [["baguette", "法棍篮", "Baguette basket"], ["round", "圆面包篮", "Round loaf basket"], ["bun", "小餐包篮", "Bun basket"]];
  for (const [i, [kind, zh, en]] of baskets.entries()) {
    await item("bakery-bread-basket", { kind }, { x: 8 + i * 47, y: DISPLAY_TOP, z: 165, turn: (i - 1) * 6 },
      { id: `l0-shop-basket-${kind}`, parent: "l0-shop-display", layer: 2, label: L(zh, en) });
  }
  await item("bakery-table", { width: 120 }, { x: 125, y: 0, z: 42 },
    { id: "l0-shop-table", label: L("揉面台", "Kneading table"), focus: true });
  await item("bakery-rolling-pin", {}, { x: 150, y: TABLE_TOP, z: 50, turn: 12 },
    { id: "l0-shop-rolling-pin", parent: "l0-shop-table", layer: 2, label: L("擀面杖", "Rolling pin") });
}
