// Trailing plant: a terracotta pot with long ivy strands spilling over the front edge
// (they hang down past the shelf board). One part `<name>` (surface). Origin: bottom-centre.
// Front +Z. ~18 Ø pot, strands drop ~34 cm below its base.
export function build(kit, { name = "flower-trailing-pot", pot = "terracotta", seed = 8 } = {}) {
  const g = new kit.THREE.Group(); g.name = name;
  const r = kit.rng(seed), m = [];
  m.push(kit.lathe([[0, 0], [6.5, 0], [8.5, 14], [9.5, 14], [9.5, 17], [0, 17]], pot, { round: 1.2 }));
  const soil = kit.roundedCylinder(8, 1.5, 0.6, "soil"); soil.position.y = 15.5; m.push(soil);
  const tops = kit.blob(10, 5, 9, "leaf"); tops.position.y = 19; m.push(tops);
  for (let s = 0; s < 4; s++) {
    const x = -6 + s * 4, len = 26 + r() * 22;
    for (let i = 0; i < 8; i++) {
      const t = i / 7, y = 17 - t * len, z = 9 + Math.min(1, t * 4) * 5;
      const l = kit.blob(2.4, 1.8, 1.4, i % 2 ? 0x6a8a4c : "leaf"); l.position.set(x + (i % 2 ? 1.2 : -1.2), y, z); m.push(l);
    }
  }
  g.add(kit.part(name, { mount: "surface", order: 1 }, ...m));
  return g;
}
