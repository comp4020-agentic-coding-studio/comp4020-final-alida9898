// Zone `oven` (bakery): the brick oven (focus), its peel, a flour sack, and the
// chalkboard menu on the left wall. Coords: storey-local cm. Ids `l0-oven-<thing>`.
const L = (zh, en) => ({ zh, en });

export async function populate({ group, model, place }) {
  const item = async (name, opts, at, tag) => {
    const obj = place(await model(name, { name: tag.id, ...opts }), at);
    obj.userData.item = { parent: null, layer: 1, ...tag };
    group.add(obj);
    return obj;
  };
  await item("bakery-oven", {}, { x: -115, y: 0, z: 44 },
    { id: "l0-oven-oven", label: L("砖烤炉", "Brick oven"), focus: true });
  // the peel leans on the floor just left of the oven, against the back wall
  await item("bakery-peel", {}, { x: -196, y: 0, z: 14, turn: 10 },
    { id: "l0-oven-peel", label: L("面包铲", "Bread peel") });
  await item("bakery-flour-sack", {}, { x: -30, y: 0, z: 40, turn: -15 },
    { id: "l0-oven-flour-sack", label: L("面粉袋", "Flour sack") });
  await item("chalkboard", { width: 80, height: 60 }, { x: -220, y: 120, z: 190, turn: 90 },
    { id: "l0-oven-chalkboard", label: L("菜单黑板", "Chalkboard menu") });
}
