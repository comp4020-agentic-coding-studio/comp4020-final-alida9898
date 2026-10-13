// Zone `counter` — a small counter at the back right with a stack of books on it. Storey-local cm.
const L = (zh, en) => ({ zh, en });
export const COUNTER = { x: 115, z: 115, top: 95 };

export async function populate({ group, model, place }) {
  const item = async (name, opts, at, tag) => {
    const obj = place(await model(name, { name: tag.id, ...opts }), at);
    obj.userData.item = { parent: null, layer: 1, ...tag };
    group.add(obj);
    return obj;
  };
  await item("counter", { width: 120, depth: 50 }, { x: COUNTER.x, y: 0, z: COUNTER.z },
    { id: "l0-counter-counter", label: L("柜台", "Counter"), focus: true });
  await item("book-stack", {}, { x: COUNTER.x - 30, y: COUNTER.top, z: COUNTER.z, turn: 10 },
    { id: "l0-counter-book-stack", parent: "l0-counter-counter", layer: 2, label: L("一摞书", "Stack of books") });
}
