// Tiered flower stand: three wooden steps rising toward the back, painted sage, on short
// legs — buckets stand on the steps. One part `<name>` (floor). Origin: bottom-centre.
// Front +Z. Width default 110; step tops at TIERS[i].y, centres at TIERS[i].z (model-local).
export const TIERS = [{ y: 26, z: 22 }, { y: 50, z: 0 }, { y: 74, z: -22 }];
export function build(kit, { name = "flower-stand", width = 110 } = {}) {
  const g = new kit.THREE.Group(); g.name = name;
  const m = [], sage = 0x9db08a;
  for (const t of TIERS) {
    const b = kit.roundedBox(width, 5, 22, 1.8, 0xb07a52); b.position.set(0, t.y - 2.5, t.z); m.push(b);
    const lip = kit.roundedBox(width, 4, 2.5, 1, "cream"); lip.position.set(0, t.y - 1, t.z + 11); m.push(lip);
  }
  for (const sx of [-1, 1]) {
    for (const t of TIERS) { const leg = kit.roundedBox(5, t.y - 5, 5, 1.6, sage); leg.position.set(sx * (width / 2 - 4), (t.y - 5) / 2, t.z + 8); m.push(leg); }
    const side = kit.roundedBox(4, 4, 66, 1.4, sage); side.position.set(sx * (width / 2 - 4), 12, 0); m.push(side);
  }
  const backLeg = kit.roundedBox(width - 6, 4, 4, 1.4, sage); backLeg.position.set(0, 12, -30); m.push(backLeg);
  g.add(kit.part(name, { mount: "floor", order: 1 }, ...m));
  return g;
}
