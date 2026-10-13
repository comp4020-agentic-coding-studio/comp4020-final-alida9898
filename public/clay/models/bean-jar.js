// Bean storage jar: translucent glass jar filled with chunky beans (or other contents),
// cork stopper. One part `<name>` (surface). Origin: bottom-centre. ~12 cm across, 19 cm tall.
// opts: `fill` = contents colour (default brown), `level` 0..1 how full, `seed`.
export function build(kit, { name = "bean-jar", fill = "brown", level = 0.8, seed = 3 } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const r = kit.rng(seed);
  const glass = kit.clay(0xdcebef, { roughness: 0.25, sheen: 0.05 }).clone();
  glass.transparent = true; glass.opacity = 0.3; glass.depthWrite = false;
  const H = 15;
  const jar = kit.lathe([[0, 0], [5.8, 0], [6.2, 2], [6.2, H - 2], [4.6, H], [4.6, H + 0.6], [4, H + 0.6], [4, H - 0.6], [5.6, H - 2], [5.6, 2], [0, 0.8]], glass, { round: 0.8 });
  jar.renderOrder = 2;
  const fillH = (H - 3) * level;
  const mass = kit.roundedCylinder(5.3, fillH, 1.6, fill); mass.position.y = 0.9;
  const P = kit.PALETTE, base = typeof fill === "string" ? P[fill] : fill;
  const dark = new THREE.Color(base).multiplyScalar(0.7).getHex();
  const beans = [];
  for (let i = 0; i < 7; i++) {
    const a = r() * Math.PI * 2, rad = 2 + r() * 3;
    const b = kit.blob(1.5, 1.1, 1.1, i % 2 ? dark : base);
    b.position.set(Math.cos(a) * rad, 0.9 + fillH - 0.2, Math.sin(a) * rad); b.rotation.y = r() * 3;
    beans.push(b);
  }
  const cork = kit.roundedCylinder(4.2, 3.6, 1, 0xc49a6c); cork.position.y = H - 0.6;
  g.add(kit.part(name, { mount: "surface", order: 1 }, mass, ...beans, jar, cork));
  return g;
}
