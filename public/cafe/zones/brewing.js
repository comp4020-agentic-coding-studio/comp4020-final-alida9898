// Zone `brewing` (level 1) — the slow bar beside the copper bean tube. Coords storey-local (cm).
// Sideboard on the back wall x −200…−70, top y 90. The roaster sits at its RIGHT end, right next
// to the tube (beans go up the tube from it); kettle, scale + pour-over and two bean bags to its
// left. The floor's one large artwork hangs above the sideboard.
import { TOP_Y as SCALE_Y } from "../../clay/models/coffee-scale.js";
import { artwork } from "../placeholder.js";

const L = (zh, en) => ({ zh, en });

export async function populate({ kit, group, model, place }) {
  const add = (obj, at, tag) => {
    place(obj, at);
    obj.userData.item = { parent: null, layer: 1, ...tag };
    group.add(obj);
    return obj;
  };
  const item = async (name, opts, at, tag) => add(await model(name, { name: tag.id, ...opts }), at, tag);

  const SB = "l1-brewing-sideboard", TOP = 90;
  await item("sideboard", { width: 130 }, { x: -135, y: 0, z: 23 },
    { id: SB, label: L("手冲餐边柜", "Slow-bar sideboard"), focus: true });
  const on = { parent: SB, layer: 2 };
  await item("roaster", {}, { x: -92, y: TOP, z: 20 }, { id: "l1-brewing-roaster", ...on, label: L("烘豆机", "Roaster") });
  await item("coffee-scale", {}, { x: -140, y: TOP, z: 28 }, { id: "l1-brewing-scale", ...on, label: L("咖啡秤", "Coffee scale") });
  await item("pour-over", {}, { x: -140, y: TOP + SCALE_Y, z: 27 },
    { id: "l1-brewing-pour-over", parent: "l1-brewing-scale", layer: 3, label: L("手冲滤杯", "Pour-over") });
  await item("kettle", {}, { x: -116, y: TOP, z: 30, turn: -25 }, { id: "l1-brewing-kettle", ...on, label: L("手冲壶", "Kettle") });
  await item("bean-bag", { color: "brown" }, { x: -180, y: TOP, z: 16 },
    { id: "l1-brewing-bean-bag-1", ...on, label: L("咖啡豆袋 1", "Bean bag 1") });
  await item("bean-bag", { color: "terracotta", clip: "cream" }, { x: -164, y: TOP, z: 18, turn: -12 },
    { id: "l1-brewing-bean-bag-2", ...on, label: L("咖啡豆袋 2", "Bean bag 2") });

  add(artwork(kit, { name: "l1-brewing-artwork", w: 110, h: 80 }), { x: -138, y: 140, z: 0 },
    { id: "l1-brewing-artwork", label: L("大幅画作", "Large artwork") });
}
