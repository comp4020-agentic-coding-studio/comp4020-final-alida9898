// Zone `bar` (level 0) — FOCAL point of the ground floor: the coffee bar, the bean-jar wall
// behind it, the pastry case, and the entrance by the door. Coords storey-local (cm).
//
// Layout (top view):
//   counter      straight bar x 45…295, z 122…178, top y 95; staff side behind it.
//                On it ONLY: pastry case (left end), espresso machine, grinder, pour-over.
//                No bar chairs: barFront walkway z 225…300 stays clear.
//   back wall    one wall shelf with five bean jars (the statement wall) + menu board.
//   entrance     door on the right wall (z 330…430): doormat inside it, OPEN sign + umbrella stand
//                + A-frame between the counter and the door. Nothing beyond z 420.
import { TIERS as SHELF_TIERS, DEPTH as SHELF_DEPTH } from "../../clay/models/wall-shelf.js";
import { FLOORS as CASE_FLOORS } from "../../clay/models/pastry-case.js";
import { INNER_Y as STAND_INNER } from "../../clay/models/umbrella-stand.js";

const L = (zh, en) => ({ zh, en });

export async function populate({ kit, group, model, place }) {
  const add = (obj, at, tag) => {
    place(obj, at);
    obj.userData.item = { parent: null, layer: 1, ...tag };
    group.add(obj);
    return obj;
  };
  const item = async (name, opts, at, tag) => add(await model(name, { name: tag.id, ...opts }), at, tag);

  // ---------------------------------------------------------------- counter
  const TOP = 95, CZ = 150;
  await item("counter", { width: 250 }, { x: 170, y: 0, z: CZ },
    { id: "l0-bar-counter", label: L("吧台", "Counter"), focus: true });
  const on = { parent: "l0-bar-counter", layer: 2 };

  await item("coffee-machine", {}, { x: 150, y: TOP, z: CZ - 10 },
    { id: "l0-bar-machine", ...on, label: L("咖啡机", "Espresso machine") });
  await item("grinder", {}, { x: 212, y: TOP, z: CZ - 12 },
    { id: "l0-bar-grinder", ...on, label: L("磨豆机", "Grinder") });
  await item("pour-over", {}, { x: 262, y: TOP, z: CZ - 10 },
    { id: "l0-bar-pour-over", ...on, label: L("手冲滤杯", "Pour-over") });

  // ---------------------------------------------------------------- pastry case (left end of the counter)
  const PX = 75;
  await item("pastry-case", {}, { x: PX, y: TOP, z: CZ },
    { id: "l0-bar-pastry-case", ...on, label: L("糕点柜", "Pastry case"), focus: true });
  const inCase = { parent: "l0-bar-pastry-case", layer: 3 };
  const cakes = [
    { sponge: "mustard", frost: "cream", berry: "terracotta", zh: "芒果蛋糕", en: "Mango cake" },
    { sponge: "soil", frost: "brown", berry: "cream", zh: "巧克力蛋糕", en: "Chocolate cake" },
    { sponge: "cream", frost: 0xe9b7a4, berry: "terracotta", zh: "草莓蛋糕", en: "Strawberry cake" },
  ];
  for (const [i, c] of cakes.entries()) {
    await item("cake-slice", c, { x: PX - 17 + i * 17, y: TOP + CASE_FLOORS[0], z: CZ + 3 },
      { id: `l0-bar-cake-${i + 1}`, ...inCase, label: L(c.zh, c.en) });
  }
  for (let i = 0; i < 2; i++) {
    await item("croissant", {}, { x: PX - 11 + i * 22, y: TOP + CASE_FLOORS[1], z: CZ + 2, turn: i ? 20 : -15 },
      { id: `l0-bar-croissant-${i + 1}`, ...inCase, label: L(`可颂 ${i + 1}`, `Croissant ${i + 1}`) });
  }

  // ---------------------------------------------------------------- bean-jar wall (back wall)
  const SX = 150, SY = 128;
  await item("wall-shelf", { width: 130 }, { x: SX, y: SY, z: 0 },
    { id: "l0-bar-bean-shelf", label: L("咖啡豆墙", "Bean wall shelf"), focus: true });
  const beans = [
    { fill: 0xc9a46a, zh: "浅烘豆", en: "Light roast", tier: 0, x: 105 },
    { fill: "brown", zh: "中烘豆", en: "Medium roast", tier: 0, x: 150 },
    { fill: "charcoal", zh: "深烘豆", en: "Dark roast", tier: 0, x: 195 },
    { fill: 0x7a8a4a, zh: "生豆", en: "Green beans", tier: 1, x: 128 },
    { fill: "terracotta", zh: "日晒豆", en: "Natural-process beans", tier: 1, x: 172 },
  ];
  for (const [i, b] of beans.entries()) {
    await item("bean-jar", { fill: b.fill, seed: 3 + i }, { x: b.x, y: SY + SHELF_TIERS[b.tier], z: SHELF_DEPTH / 2 },
      { id: `l0-bar-bean-jar-${i + 1}`, parent: "l0-bar-bean-shelf", layer: 2, label: L(b.zh, b.en) });
  }

  // ---------------------------------------------------------------- entrance
  await item("menu-board", { width: 64, height: 56 }, { x: 258, y: 125, z: 0 },
    { id: "l0-bar-menu", label: L("菜单板", "Menu board") });
  await item("doormat", { width: 80, depth: 50 }, { x: 270, y: 0, z: 380, turn: -90 },
    { id: "l0-bar-doormat", label: L("门垫", "Doormat") });
  await item("open-sign", {}, { x: 300, y: 150, z: 296, turn: -90 },
    { id: "l0-bar-open-sign", label: L("营业牌", "OPEN sign") });
  await item("umbrella-stand", {}, { x: 286, y: 0, z: 282 },
    { id: "l0-bar-umbrella-stand", label: L("伞架", "Umbrella stand") });
  await item("umbrella", { color: "terracotta", lean: 0.1 }, { x: 286, y: STAND_INNER, z: 282, turn: -20 },
    { id: "l0-bar-umbrella", parent: "l0-bar-umbrella-stand", layer: 2, label: L("雨伞", "Umbrella") });
  await item("a-frame-sign", {}, { x: 250, y: 0, z: 290, turn: -70 },
    { id: "l0-bar-a-frame", label: L("立式黑板", "A-frame sign") });
}
