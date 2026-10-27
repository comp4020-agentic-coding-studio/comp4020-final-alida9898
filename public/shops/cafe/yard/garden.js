// Zone `garden` (the café's yard) — the five base yard items. Coords: café world
// frame, ground y = 0 (see ./index.js for the layout). Ids `yard-garden-<thing>`.
import { YARD } from "./index.js";

const L = (zh, en) => ({ zh, en });

// winter: the bed's herbs die back to dry straw-brown with a dusting of frost (colour only)
const HERBS = { winter: [0xa38f6c, 0xdcd8ce, 0x8f7c5c] };

export async function populate({ group, model, place, season }) {
  const item = async (name, opts, at, tag) => {
    const obj = place(await model(name, { name: tag.id, ...opts }), at);
    obj.userData.item = { parent: null, layer: 1, ...tag };
    group.add(obj);
    return obj;
  };
  // the fence's runs are in world coords, so it sits at the origin
  await item("yard-fence", { runs: YARD.fence }, { x: 0, y: 0, z: 0 },
    { id: "yard-garden-fence", label: L("矮篱笆", "Low fence") });
  await item("garden-bench", { width: 116 }, { x: 420, y: 0, z: 72 },
    { id: "yard-garden-bench", label: L("长椅", "Garden bench") });
  await item("planter-box", { width: 110, depth: 40, herbs: HERBS[season] || null }, { x: 586, y: 0, z: 300, turn: -90 },
    { id: "yard-garden-planter", label: L("花圃", "Planter box") });
  await item("mailbox", {}, { x: 385, y: 0, z: 452 },
    { id: "yard-garden-mailbox", label: L("信箱", "Mailbox") });
  await item("lamp-post", {}, { x: 525, y: 0, z: 452 },
    { id: "yard-garden-lamp", label: L("路灯", "Lamp post") });
}
