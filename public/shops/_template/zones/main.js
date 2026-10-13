// Zone `main` (template) — replace with the shop's own things. Coords: storey-local cm.
// One item = one carry-able thing. Ids `l0-main-<thing>`; children name their parent.
const L = (zh, en) => ({ zh, en });

export async function populate({ group, model, place }) {
  const item = async (name, opts, at, tag) => {
    const obj = place(await model(name, { name: tag.id, ...opts }), at);
    obj.userData.item = { parent: null, layer: 1, ...tag };
    group.add(obj);
    return obj;
  };
  await item("counter", { width: 160 }, { x: 40, y: 0, z: 120 },
    { id: "l0-main-counter", label: L("柜台", "Counter"), focus: true });
  await item("coffee-cup", { colors: ["cream"], count: 1 }, { x: 20, y: 95, z: 128 },
    { id: "l0-main-cup", parent: "l0-main-counter", layer: 2, label: L("杯子", "Cup") });
  await item("plant", {}, { x: -160, y: 0, z: 60 },
    { id: "l0-main-plant", label: L("盆栽", "Potted plant") });
}
