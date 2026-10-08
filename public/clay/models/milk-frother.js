// Electric milk frother: one part `<name>` (power base with button, jug with
// steel-ish lid, spout and side handle). Origin: bottom-centre. Front +Z.
// ~13 w (+ handle) × 20 h cm. opts: `color` (jug), `base`, `steel` colours.
export function build(kit, { name = "milk-frother", color = "cream", base = "charcoal", steel = "blue" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group();
  g.name = name;
  const plate = kit.roundedCylinder(7.4, 3, 1.2, base);
  const button = kit.roundedBox(3, 1.6, 1.4, 0.6, "terracotta"); button.position.set(0, 1.5, 7.2);
  const jug = kit.lathe([[0, 0], [6, 0], [6.4, 13], [0, 13]], color, { round: 1.6 }); jug.position.y = 3;
  const lid = kit.lathe([[0, 0], [6.6, 0], [5.4, 2.4], [0, 2.8]], steel, { round: 0.9 }); lid.position.y = 15.8;
  const knob = kit.blob(1.6, 1.3, 1.6, steel); knob.position.y = 18.8;
  const spout = kit.roundedBox(3.4, 2.4, 3, 1, color); spout.position.set(-6.4, 15, 0); spout.rotation.z = 0.5;
  const grip = kit.capsule(1.7, 10, base); grip.position.set(8.8, 9.6, 0);
  const armT = kit.roundedBox(3.6, 2, 2.4, 0.9, base); armT.position.set(7.2, 14, 0);
  const p = kit.part(name, { mount: "surface", order: 1 }, plate, button, jug, lid, knob, spout, grip, armT);
  p.userData.zBias = 30; // stands on a sideboard/counter: drawn over it
  g.add(p);
  return g;
}
