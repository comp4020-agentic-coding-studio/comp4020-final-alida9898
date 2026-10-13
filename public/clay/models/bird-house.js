// Little wooden bird house: a cream box with a round entrance hole and a perch, under a
// terracotta pitched roof, on a back plate that hangs on a trunk or post.
// One part `<name>` (wall). Origin: bottom-centre of the back plate (z = 0). Front +Z. ~22 w × 30 h.
export function build(kit, { name = "bird-house", body = "cream", roof = "terracotta" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const m = [];
  const plate = kit.roundedBox(8, 32, 2, 1, "brown"); plate.position.set(0, 16, 1); m.push(plate);
  const box = kit.roundedBox(16, 17, 14, 2, body); box.position.set(0, 10, 9); m.push(box);
  const hole = kit.roundedCylinder(2.6, 1, 0.4, "charcoal"); hole.rotation.x = Math.PI / 2; hole.position.set(0, 13, 16.4); m.push(hole);
  const perch = kit.capsule(0.7, 6, "brown"); perch.rotation.x = Math.PI / 2; perch.position.set(0, 7.5, 18); m.push(perch);
  for (const s of [-1, 1]) {
    const r = kit.roundedBox(13, 2.2, 18, 1, roof); r.position.set(s * 5.2, 21.5, 9); r.rotation.z = -s * 0.62; m.push(r);
  }
  const ridge = kit.capsule(1.3, 18, roof); ridge.rotation.x = Math.PI / 2; ridge.position.set(0, 25.5, 9); m.push(ridge);
  g.add(kit.part(name, { mount: "wall", order: 1 }, ...m));
  return g;
}
