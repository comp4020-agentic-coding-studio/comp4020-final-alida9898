// Tip jar: small translucent glass jar with a few mustard coins and a folded note inside,
// and a terracotta heart tag on the front. One part `<name>` (surface). Origin: bottom-centre.
// ~11 cm across, 14 cm tall.
export function build(kit, { name = "tip-jar" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const glass = kit.clay(0xdcebef, { roughness: 0.25, sheen: 0.05 }).clone();
  glass.transparent = true; glass.opacity = 0.3; glass.depthWrite = false;
  const jar = kit.lathe([[0, 0], [5, 0], [5.4, 2], [5.2, 12], [5.8, 13.4], [5, 14], [4.4, 12.6], [4.6, 2], [0, 1]], glass, { round: 0.8 });
  jar.renderOrder = 2;
  const coins = [[-1.5, 1.4, 0.5], [1.6, 1.6, -0.5], [0, 2.8, 1], [-0.6, 4, -1]].map(([x, y, z]) => { const c = kit.roundedCylinder(1.9, 0.8, 0.3, "mustard"); c.position.set(x, y, z); c.rotation.z = x * 0.15; return c; });
  const note = kit.roundedBox(5, 6, 0.8, 0.4, "leaf"); note.position.set(0.4, 6, -1.4); note.rotation.z = 0.25;
  const heart = new THREE.Group();
  const l = kit.blob(1.6, 1.6, 0.7, "terracotta"); l.position.set(-1, 0.6, 0);
  const rr = kit.blob(1.6, 1.6, 0.7, "terracotta"); rr.position.set(1, 0.6, 0);
  const tipp = kit.blob(1.4, 2, 0.7, "terracotta"); tipp.position.set(0, -0.8, 0);
  heart.add(l, rr, tipp); heart.position.set(0, 7, 5.6);
  g.add(kit.part(name, { mount: "surface", order: 1 }, ...coins, note, jar, heart));
  return g;
}
