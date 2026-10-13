// Watering can: a rounded blue body, a long spout with a rose head, an arched handle.
// One part `<name>` (surface/floor). Origin: bottom-centre. Front +Z (spout points +X). ~34 w × 24 h.
export function build(kit, { name = "watering-can", color = 0x8fb0a0 } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const m = [];
  m.push(kit.lathe([[0, 0], [8, 0], [8.6, 3], [8.2, 15], [6, 17.5], [0, 17.5]], color, { round: 1.5 }));
  const cap = kit.roundedCylinder(3.4, 2, 0.8, color); cap.position.y = 17; m.push(cap);
  const spout = kit.capsule(1.3, 18, color); spout.position.set(12, 13, 0); spout.rotation.z = -1.0; m.push(spout);
  const rose = kit.roundedCylinder(2.6, 2.4, 0.9, color); rose.position.set(19.5, 17.5, 0); rose.rotation.z = -1.0; m.push(rose);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(6, 1.2, 10, 20, Math.PI), kit.clay(color));
  handle.position.set(-3, 17.5, 0); handle.castShadow = true; m.push(handle);
  g.add(kit.part(name, { mount: "surface", order: 1 }, ...m));
  return g;
}
