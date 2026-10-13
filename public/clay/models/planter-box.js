// Raised wooden planter box (flower bed) with soil and low green herb clumps.
// One part `<name>` (floor). Origin: bottom-centre. Front +Z. Default 110 × 40 × 38 cm.
export const SOIL_Y = 34;

export function build(kit, { name = "planter-box", width = 110, depth = 40, wood = "brown", seed = 7 } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const W = width, D = depth, m = [], r = kit.rng(seed);
  const light = new THREE.Color(kit.PALETTE[wood]).multiplyScalar(1.15).getHex();
  // three stacked boards on each side
  for (let i = 0; i < 3; i++) {
    const y = 6 + i * 11, c = i % 2 ? light : wood;
    for (const sz of [-1, 1]) { const b = kit.roundedBox(W, 10, 4, 1.6, c); b.position.set(0, y, sz * (D / 2 - 2)); m.push(b); }
    for (const sx of [-1, 1]) { const b = kit.roundedBox(4, 10, D - 6, 1.6, c); b.position.set(sx * (W / 2 - 2), y, 0); m.push(b); }
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const p = kit.roundedBox(6, 38, 6, 2, wood); p.position.set(sx * (W / 2 - 2), 19, sz * (D / 2 - 2)); m.push(p);
  }
  const soil = kit.roundedBox(W - 8, 4, D - 8, 1.5, "soil"); soil.position.set(0, SOIL_Y - 2, 0); m.push(soil);
  // low herb clumps
  const n = Math.round(W / 18);
  for (let i = 0; i < n; i++) {
    const x = -W / 2 + 12 + (i * (W - 24)) / Math.max(1, n - 1);
    const shade = i % 2 ? "leaf" : 0x6a8a4c;
    const c = kit.blob(7 + r() * 2, 6 + r() * 3, 7, shade); c.position.set(x, SOIL_Y + 4, (r() - 0.5) * 8); m.push(c);
  }
  g.add(kit.part(name, { mount: "floor", order: 1 }, ...m));
  return g;
}
