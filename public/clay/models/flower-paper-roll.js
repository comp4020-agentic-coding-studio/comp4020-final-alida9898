// Wrapping-paper roll on a little wooden holder: a fat pink kraft roll with a tongue of
// paper pulled out across the table. One part `<name>` (surface). Origin: bottom-centre.
// Front +Z; roll axis along X. ~44 w × 22 h cm.
export function build(kit, { name = "flower-paper-roll", color = 0xf2c4c8 } = {}) {
  const g = new kit.THREE.Group(); g.name = name;
  const m = [];
  const base = kit.roundedBox(46, 3, 18, 1.4, "brown"); base.position.y = 1.5; m.push(base);
  for (const sx of [-1, 1]) { const post = kit.roundedBox(3, 18, 6, 1.2, "brown"); post.position.set(sx * 21.5, 11, 0); m.push(post); }
  const roll = kit.roundedCylinder(7, 38, 2, color); roll.rotation.z = Math.PI / 2; roll.position.set(19, 13, 0); m.push(roll);
  const core = kit.roundedCylinder(2.2, 44, 0.8, "cream"); core.rotation.z = Math.PI / 2; core.position.set(22, 13, 0); m.push(core);
  const tongue = kit.roundedBox(36, 0.8, 16, 0.4, color); tongue.position.set(0, 3.6, 12); m.push(tongue);
  g.add(kit.part(name, { mount: "surface", order: 1 }, ...m));
  return g;
}
