// Round cat bed: one part `<name>` — a plump terracotta ring with a cream cushion inside
// (no cat). Origin: bottom-centre on the floor. Front +Z. ~54 Ø × 18 h.
export function build(kit, { name = "book-cat-bed", rim = "terracotta", cushion = "cream" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const base = kit.roundedCylinder(26, 6, 2.5, rim);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(21, 6.5, 12, 36), kit.clay(rim));
  ring.rotation.x = Math.PI / 2; ring.position.y = 10; ring.scale.z = 1.3;
  const pad = kit.blob(19, 4, 19, cushion); pad.position.y = 7;
  g.add(kit.part(name, { mount: "floor", order: 1 }, base, ring, pad));
  return g;
}
