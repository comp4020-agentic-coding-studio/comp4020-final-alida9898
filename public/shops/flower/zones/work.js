// Zone `work` — the flower shop's one room: the work table (focus) with a wrapping-paper
// roll and a bouquet in progress, and a plant shelf with a trailing pot on the back wall.
// Coords: storey-local cm. Ids `l0-work-<thing>`.
import { TOP_Y } from "../../../clay/models/flower-table.js";
import { TIERS } from "../../../clay/models/flower-shelf.js";

const L = (zh, en) => ({ zh, en });
const SHELF = { x: 100, y: 120 };

export async function populate({ group, model, place }) {
  const item = async (name, opts, at, tag) => {
    const obj = place(await model(name, { name: tag.id, ...opts }), at);
    obj.userData.item = { parent: null, layer: 1, ...tag };
    group.add(obj);
    return obj;
  };
  await item("flower-table", {}, { x: -40, y: 0, z: 130 },
    { id: "l0-work-table", label: L("包花台", "Work table"), focus: true });
  await item("flower-paper-roll", {}, { x: -70, y: TOP_Y, z: 116 },
    { id: "l0-work-paper-roll", parent: "l0-work-table", layer: 2, label: L("包装纸卷", "Wrapping paper roll") });
  await item("flower-bouquet", {}, { x: -10, y: TOP_Y, z: 140, turn: 20 },
    { id: "l0-work-bouquet", parent: "l0-work-table", layer: 2, label: L("包到一半的花束", "Bouquet in progress") });
  await item("flower-shelf", {}, { x: SHELF.x, y: SHELF.y, z: 0 },
    { id: "l0-work-shelf", label: L("植物架", "Plant shelf"), focus: true });
  await item("flower-trailing-pot", {}, { x: SHELF.x + 25, y: SHELF.y + TIERS[1], z: 10 },
    { id: "l0-work-trailing-pot", parent: "l0-work-shelf", layer: 2, label: L("垂吊绿萝", "Trailing ivy pot") });
}
