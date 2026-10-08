// Stovetop moka pot: one part `<name>` (faceted base, waist, faceted jug, lid +
// knob, side handle). Origin: bottom-centre. Front +Z. ~12 w (+ handle) × 22 h cm.
// opts: `color` (metal body), `handle` colour.
export function build(kit, { name = "moka-pot", color = "blue", handle = "charcoal" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group();
  g.name = name;
  const seg = { round: 0.6, segments: 8 }; // 8 sides → the octagonal facets
  const base = kit.lathe([[0, 0], [5.6, 0], [4.4, 9], [0, 9]], color, seg);
  const waist = kit.roundedCylinder(4.2, 1.6, 0.4, "charcoal"); waist.position.y = 8.6;
  const jug = kit.lathe([[0, 0], [4.4, 0], [5.6, 8.5], [0, 8.5]], color, seg); jug.position.y = 10;
  const lid = kit.lathe([[0, 0], [5.8, 0], [4.2, 2], [0, 2.4]], color, { round: 0.8, segments: 8 }); lid.position.y = 18.3;
  const knob = kit.blob(1.6, 1.4, 1.6, handle); knob.position.y = 21.2;
  const spout = kit.roundedBox(3, 3, 3, 1, color); spout.position.set(-5.6, 17.4, 0); spout.rotation.z = 0.5;
  const grip = kit.capsule(1.6, 9, handle); grip.position.set(8.6, 13.5, 0); grip.rotation.z = 0.25;
  const arm = kit.roundedBox(4, 2, 2.4, 0.9, handle); arm.position.set(6.6, 17.6, 0);
  const p = kit.part(name, { mount: "surface", order: 1 }, base, waist, jug, lid, knob, spout, grip, arm);
  p.userData.zBias = 30; // stands on a sideboard/counter: drawn over it
  g.add(p);
  return g;
}
