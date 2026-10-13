// Tea tin: a squat round tin with a fitted lid, a contrasting band and a leaf emblem.
// One part `<name>` (surface). Origin: bottom-centre. Front faces +Z.
// opts: `color` (tin), `band`. ~10 cm across, 13 cm tall.
export function build(kit, { name = "tea-tin", color = "leaf", band = "cream" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const can = kit.roundedCylinder(5, 10, 0.8, color);
  const lid = kit.roundedCylinder(5.3, 3, 1, color); lid.position.y = 10;
  const b = kit.lathe([[4.95, 0], [5.25, 0], [5.25, 3.6], [4.95, 3.6]], band, { round: 0.4 }); b.position.y = 3.4;
  const leaf = kit.blob(1.4, 2.2, 0.6, "mustard"); leaf.position.set(0, 5.2, 5.3); leaf.rotation.z = 0.5;
  const knob = kit.blob(1.4, 0.9, 1.4, band); knob.position.y = 13.1;
  g.add(kit.part(name, { mount: "surface", order: 1 }, can, lid, b, leaf, knob));
  return g;
}
