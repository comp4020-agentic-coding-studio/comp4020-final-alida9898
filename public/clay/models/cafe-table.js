// Small round café table: thick wooden top, chunky pedestal, round foot.
// One part `<name>` (floor). Origin: bottom-centre. Top surface at y = `height`.
export function build(kit, { name = "cafe-table", radius = 30, height = 74, top = "brown", base = "charcoal" } = {}) {
  const g = new kit.THREE.Group(); g.name = name;
  const slab = kit.roundedCylinder(radius, 5, 2, top); slab.position.y = height - 5;
  const lip = kit.roundedCylinder(radius - 4, 1.2, 0.5, 0xa06d4a); lip.position.y = height - 0.6;
  const collar = kit.roundedCylinder(9, 4, 1.5, base); collar.position.y = height - 9;
  const leg = kit.capsule(4, height - 8, base); leg.position.y = (height - 8) / 2 + 2;
  const foot = kit.roundedCylinder(22, 4, 1.8, base);
  g.add(kit.part(name, { mount: "floor", order: 1 }, slab, lip, collar, leg, foot));
  return g;
}
