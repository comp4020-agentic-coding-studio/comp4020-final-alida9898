// Gooseneck pour-over kettle: one part `<name>` (squat body, lid + knob, long
// S-curved spout, loop handle). Origin: bottom-centre. Front +Z (spout points +X).
// ~28 w × 22 h × 14 d cm. opts: `color` (body), `handle` colour.
export function build(kit, { name = "kettle", color = "charcoal", handle = "brown" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const body = kit.lathe([[0, 0], [7, 0], [7.4, 9], [5.6, 13], [0, 13]], color, { round: 1.6 });
  const lid = kit.lathe([[0, 0], [5.2, 0], [4, 1.8], [0, 2.2]], color, { round: 0.7 }); lid.position.y = 12.6;
  const knob = kit.blob(1.8, 1.6, 1.8, handle); knob.position.y = 15.8;
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(6, 3, 0), new THREE.Vector3(10, 5, 0), new THREE.Vector3(12, 12, 0),
    new THREE.Vector3(14.5, 19, 0), new THREE.Vector3(19, 19.5, 0),
  ]);
  const spout = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 1.1, 10), kit.clay(color)); spout.castShadow = true;
  const tip = kit.blob(1.4, 1.2, 1.4, color); tip.position.set(19.2, 19.4, 0);
  const hcurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-6.6, 3, 0), new THREE.Vector3(-11, 5, 0), new THREE.Vector3(-11.5, 11, 0), new THREE.Vector3(-5, 12.5, 0),
  ]);
  const hd = new THREE.Mesh(new THREE.TubeGeometry(hcurve, 24, 1.8, 10), kit.clay(handle)); hd.castShadow = true;
  g.add(kit.part(name, { mount: "surface", order: 1 }, body, lid, knob, spout, tip, hd));
  return g;
}
