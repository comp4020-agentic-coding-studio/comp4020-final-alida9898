// Glass cookie jar: a translucent squat jar, a stack of chunky cookies inside, cream lid with
// a terracotta knob. One part `<name>` (surface). Origin: bottom-centre. ~16 cm across, 22 cm tall.
export function build(kit, { name = "cookie-jar", seed = 7, lid = "cream" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const r = kit.rng(seed);
  const glass = kit.clay(0xdcebef, { roughness: 0.25, sheen: 0.05 }).clone();
  glass.transparent = true; glass.opacity = 0.3; glass.depthWrite = false;
  const jar = kit.lathe([[0, 0], [7, 0], [8, 3], [8, 15], [6, 17], [6, 18], [5.4, 18], [5.4, 17.2], [7.2, 15], [7.2, 3], [6.4, 1], [0, 1]], glass, { round: 1 });
  jar.renderOrder = 2;
  const cookies = [];
  for (let i = 0; i < 4; i++) {
    const c = kit.roundedCylinder(5.2, 2.2, 0.9, "mustard"); c.position.set((r() - 0.5) * 2, 1.2 + i * 2.6, (r() - 0.5) * 2); c.rotation.set((r() - 0.5) * 0.3, 0, (r() - 0.5) * 0.3);
    const chip = kit.blob(1, 0.6, 1, "soil"); chip.position.set(c.position.x + 1.8, c.position.y + 2.2, c.position.z + 2.4);
    cookies.push(c, chip);
  }
  const cap = kit.roundedCylinder(7, 2.6, 1, lid); cap.position.y = 17.6;
  const knob = kit.blob(2.2, 2, 2.2, "terracotta"); knob.position.y = 21.4;
  g.add(kit.part(name, { mount: "surface", order: 1 }, ...cookies, jar, cap, knob));
  return g;
}
