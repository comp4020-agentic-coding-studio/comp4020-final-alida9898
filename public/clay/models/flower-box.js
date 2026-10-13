// Blooming flower box: a low wooden trough full of tulips and daisies in pink, yellow
// and white. One part `<name>` (floor). Origin: bottom-centre. Front +Z. Default 70 × 26 cm, ~48 h.
export function build(kit, { name = "flower-box", width = 70, depth = 26, seed = 5 } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const r = kit.rng(seed), m = [];
  const W = width, D = depth, H = 24;
  const box = kit.roundedBox(W, H, D, 3, "brown"); box.position.y = H / 2; m.push(box);
  const rim = kit.roundedBox(W + 3, 3, D + 3, 1.4, 0xa06d4a); rim.position.y = H; m.push(rim);
  const soil = kit.roundedBox(W - 6, 2, D - 6, 1, "soil"); soil.position.y = H + 0.5; m.push(soil);
  const colors = [0xf2b8c6, "mustard", "white", 0xe07a8a, 0xf7cfd8];
  const n = Math.round(W / 8);
  for (let i = 0; i < n; i++) {
    const x = -W / 2 + 6 + (i * (W - 12)) / (n - 1), z = (i % 2 ? 4 : -4) + (r() - 0.5) * 3;
    const h = 12 + r() * 10;
    const stem = kit.capsule(0.8, h, "leaf"); stem.position.set(x, H + h / 2, z); m.push(stem);
    const leaf = kit.blob(1.6, 5, 0.8, 0x6a8a4c); leaf.position.set(x + 2, H + 4, z); leaf.rotation.z = -0.5; m.push(leaf);
    const c = colors[i % colors.length];
    if (i % 3 === 2) {
      // daisy: flat petals + a yellow eye
      const d = kit.blob(3.6, 1.2, 3.6, "white"); d.position.set(x, H + h, z); m.push(d);
      const eye = kit.blob(1.4, 1, 1.4, "mustard"); eye.position.set(x, H + h + 0.9, z); m.push(eye);
    } else {
      // tulip: an egg-shaped cup
      const t = kit.blob(2.6, 3.6, 2.6, c); t.position.set(x, H + h + 1.5, z); m.push(t);
    }
  }
  g.add(kit.part(name, { mount: "floor", order: 1 }, ...m));
  return g;
}
