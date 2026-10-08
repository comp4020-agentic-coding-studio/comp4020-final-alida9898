// Coffee beans generator: each sticker is a little cluster of 1–3 chunky beans.
// Parts `<name>-0 … <name>-(count-1)` (surface), left → right, `gap` cm apart.
// Beans are oversized (~4 cm) so they read. Randomness via kit.rng(seed).
export function build(kit, { name = "coffee-beans", seed = 5, count = 1, beans = 3, gap = 12, order = 1 } = {}) {
  const { THREE } = kit;
  const r = kit.rng(seed);
  const P = kit.PALETTE;
  const roast = [0x6b4228, 0x5a3622, 0x7a4c2e];
  const g = new THREE.Group(); g.name = name;
  for (let i = 0; i < count; i++) {
    const n = Math.max(1, Math.min(3, beans));
    const cluster = new THREE.Group();
    for (let k = 0; k < n; k++) {
      const col = roast[Math.floor(r() * roast.length)];
      const bean = kit.blob(2.2, 1.5, 1.6, col);
      const crease = kit.capsule(0.35, 3.4, new THREE.Color(P.soil).multiplyScalar(0.7).getHex());
      crease.rotation.z = Math.PI / 2; crease.position.set(0, 0.2, 1.45);
      const b = new THREE.Group(); b.add(bean, crease);
      b.rotation.z = (r() - 0.5) * 0.9;
      const offs = [[0, 1.5, 0], [-3.4, 1.4, 0.8], [3.1, 1.4, -0.4]][k];
      if (k === 2) { offs[0] = 0.8; offs[1] = 4.1; } // third bean piled on top
      b.position.set(...offs);
      cluster.add(b);
    }
    cluster.position.x = (i - (count - 1) / 2) * gap;
    g.add(kit.part(`${name}-${i}`, { mount: "surface", order: order + i }, cluster));
  }
  return g;
}
