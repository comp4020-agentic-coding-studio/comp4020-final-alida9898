// Seedling tray for a window sill: a terracotta tray of four little peat pots, each with a
// pair of bright new leaves. One part `<name>` (surface). Origin: bottom-centre. Front +Z.
// ~42 w × 11 d × 12 h cm (fits a 16 cm sill).
export function build(kit, { name = "seedling-tray", width = 42 } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const m = [];
  const tray = kit.roundedBox(width, 3, 11, 1.2, "terracotta"); tray.position.y = 1.5; m.push(tray);
  const n = 4, green = 0x9cc46a;
  for (let i = 0; i < n; i++) {
    const x = -width / 2 + 5.5 + (i * (width - 11)) / (n - 1);
    const pot = kit.lathe([[0, 0], [3.2, 0], [4.2, 5.5], [0, 5.5]], 0x9a6a48, { round: 0.8 }); pot.position.set(x, 3, 0); m.push(pot);
    const soil = kit.blob(3.8, 1, 3.8, "soil"); soil.position.set(x, 8.3, 0); m.push(soil);
    const stem = kit.capsule(0.5, 4, green); stem.position.set(x, 10, 0); m.push(stem);
    for (const s of [-1, 1]) {
      const lf = kit.blob(2.2, 0.9, 1.4, i % 2 ? green : "leaf"); lf.position.set(x + s * 2, 12, 0); lf.rotation.z = s * 0.35; m.push(lf);
    }
  }
  g.add(kit.part(name, { mount: "surface", order: 1 }, ...m));
  return g;
}
