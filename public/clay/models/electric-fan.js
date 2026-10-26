// Small electric desk fan: a round base, a short pole, and a wire-caged head with three
// blades between two guard rings. One part `<name>` (surface). Origin: bottom-centre.
// Front faces +Z (the grille faces the room). ~14 w × 26 h × 13 d cm.
export function build(kit, { name = "electric-fan", color = "cream", accent = "charcoal" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const m = [];
  const base = kit.roundedCylinder(6.2, 1.6, 0.6, accent); m.push(base);
  const neck = kit.capsule(1.1, 14, accent); neck.position.y = 8; m.push(neck);
  const hub = kit.roundedCylinder(4.4, 5.6, 1.3, color); hub.rotation.x = Math.PI / 2; hub.position.set(0, 16, 0); m.push(hub);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const bl = kit.blob(3.2, 1.0, 1.7, 0xeceae2);
    bl.position.set(Math.cos(a) * 2.2, 16 + Math.sin(a) * 2.2, 2.6); bl.rotation.z = a;
    m.push(bl);
  }
  const ringF = new THREE.Mesh(new THREE.TorusGeometry(5.2, 0.4, 8, 24), kit.clay(accent)); ringF.position.set(0, 16, 4); m.push(ringF);
  const ringB = new THREE.Mesh(new THREE.TorusGeometry(5.2, 0.4, 8, 24), kit.clay(accent)); ringB.position.set(0, 16, -3.4); m.push(ringB);
  for (const rx of [0, Math.PI / 2]) {
    const spoke = kit.capsule(0.18, 10.2, accent); spoke.rotation.z = rx; spoke.rotation.x = Math.PI / 2; spoke.position.set(0, 16, 4);
    m.push(spoke);
  }
  const knob = kit.blob(1, 0.9, 1, "terracotta"); knob.position.set(0, 9, 1.2); m.push(knob);
  g.add(kit.part(name, { mount: "surface", order: 1 }, ...m));
  return g;
}
