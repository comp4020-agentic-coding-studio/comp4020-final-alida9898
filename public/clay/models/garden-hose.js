// Coiled garden hose lying in the grass: a few loose loops with a tail running out to a
// brass nozzle. One part `<name>` (floor). Origin: centre of the coil, on the ground.
// ~38 Ø × 10 h cm. opts: `color` (hose).
export function build(kit, { name = "garden-hose", color = "leaf" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const m = [];
  const N = 4;
  for (let i = 0; i < N; i++) {
    const r = 16 - i * 2.6;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 1.6, 10, 28), kit.clay(color));
    ring.rotation.x = Math.PI / 2; ring.position.set(i * 0.6, 1.6 + i * 2.6, i * 0.3); ring.castShadow = true;
    m.push(ring);
  }
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(13, 1.6, 0), new THREE.Vector3(20, 1.4, 3), new THREE.Vector3(26, 1.3, 2), new THREE.Vector3(31, 1.2, -1),
  ]);
  const tail = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 1.6, 10), kit.clay(color)); tail.castShadow = true; m.push(tail);
  const nozzle = kit.roundedCylinder(1.8, 6, 0.6, "mustard"); nozzle.rotation.x = Math.PI / 2; nozzle.position.set(33, 1.2, -2); m.push(nozzle);
  const tip = kit.roundedCylinder(1.1, 2, 0.4, "charcoal"); tip.rotation.x = Math.PI / 2; tip.position.set(33, 1.2, 1.2); m.push(tip);
  g.add(kit.part(name, { mount: "floor", order: 1 }, ...m));
  return g;
}
