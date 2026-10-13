// Zone `stacks` — two tall shelves on the back wall (focus) and the rolling ladder leaning
// on the right one. Shelf 1 holds a book row and a globe, not just books. Storey-local cm.
import { SHELF_Y, D } from "../../../clay/models/book-tall-shelf.js";

const L = (zh, en) => ({ zh, en });

export async function populate({ group, model, place }) {
  const item = async (name, opts, at, tag) => {
    const obj = place(await model(name, { name: tag.id, ...opts }), at);
    obj.userData.item = { parent: null, layer: 1, ...tag };
    group.add(obj);
    return obj;
  };
  const Z = D / 2; // back against the wall
  const S1 = "l0-stacks-shelf-1", S2 = "l0-stacks-shelf-2";
  await item("book-tall-shelf", {}, { x: -135, y: 0, z: Z },
    { id: S1, label: L("高书架 1", "Tall shelf 1"), focus: true });
  await item("book-tall-shelf", { wood: 0x8c5c3e }, { x: -35, y: 0, z: Z },
    { id: S2, label: L("高书架 2", "Tall shelf 2"), focus: true });
  // on shelf 1: a row of books between bookends (middle board) and a globe (board above)
  await item("book-row", { seed: 4 }, { x: -145, y: SHELF_Y[2], z: Z + 4 },
    { id: "l0-stacks-book-row", parent: S1, layer: 2, label: L("一排书", "Row of books") });
  await item("book-globe", {}, { x: -120, y: SHELF_Y[3], z: Z + 3, turn: -15 },
    { id: "l0-stacks-globe", parent: S1, layer: 2, label: L("地球仪", "Globe") });
  // the ladder: hooks on shelf 2's crown, feet out on the floor
  await item("book-ladder", { height: 228, lean: 58 }, { x: -35, y: 0, z: D + 60 },
    { id: "l0-stacks-ladder", label: L("滑轮书梯", "Rolling ladder") });
}
