// Rolling pin: a fat pale-wood roller with two darker handles. One part `<name>`
// (surface). Origin: bottom-centre, lying along X. ~44 cm long.
export function build(kit, { name = "bakery-rolling-pin" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const roll = kit.capsule(3.6, 30, 0xe0c08e); roll.rotation.z = Math.PI / 2; roll.position.y = 3.6;
  const hs = [-1, 1].map((s) => { const h = kit.capsule(1.6, 10, "brown"); h.rotation.z = Math.PI / 2; h.position.set(s * 18, 3.6, 0); return h; });
  g.add(kit.part(name, { mount: "surface", order: 1 }, roll, ...hs));
  return g;
}
