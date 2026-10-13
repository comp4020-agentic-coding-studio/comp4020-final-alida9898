// Flour sack: a plump cream cloth sack, tied at the neck with string, flour on the
// rolled-down lip and a blue stripe. One part `<name>` (floor). Origin: bottom-centre. ~44 w × 62 h.
export function build(kit, { name = "bakery-flour-sack" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const m = [];
  const body = kit.blob(22, 26, 18, 0xeadbc0); body.position.y = 25; m.push(body);
  const base = kit.roundedCylinder(19, 8, 3, 0xeadbc0); m.push(base);
  const stripe = kit.roundedBox(24, 5, 2, 1, "blue"); stripe.position.set(0, 26, 17.2); m.push(stripe);
  const neck = kit.lathe([[0, 0], [9, 0], [6, 6], [7.5, 12], [0, 12]], 0xe3d2b4); neck.position.y = 47; m.push(neck);
  const tie = kit.roundedCylinder(6.6, 2.4, 1, "brown"); tie.position.y = 51; m.push(tie);
  const dust = kit.blob(9, 1.6, 8, "white"); dust.position.y = 59; m.push(dust);
  g.add(kit.part(name, { mount: "floor", order: 1 }, ...m));
  return g;
}
