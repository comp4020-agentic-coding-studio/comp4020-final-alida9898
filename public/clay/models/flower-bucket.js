// Galvanised florist's bucket full of one kind of flower. `kind`: "tulip" | "rose" |
// "daisy" | "sunflower" | "blossom" (bare branches with pink blossom); `color` sets the
// bloom colour. One part `<name>` (floor/surface). Origin: bottom-centre. Front +Z. ~22 Ø.
export function build(kit, { name = "flower-bucket", kind = "tulip", color = 0xe07a8a, seed = 2, tall = 1 } = {}) {
  const g = new kit.THREE.Group(); g.name = name;
  const r = kit.rng(seed), m = [], H = 22 * tall;
  m.push(kit.lathe([[0, 0], [8, 0], [11, H], [11.8, H], [11.8, H + 1.5], [0, H + 1.5]], 0xb9c2c4, { round: 1 }));
  const band = kit.roundedCylinder(10.4, 2, 0.8, 0x9ea8ab); band.position.y = H * 0.55; m.push(band);
  if (kind === "blossom") {
    const pinks = [0xf2b8c6, 0xf7cfd8, 0xfaf6ef, 0xe9a0b4];
    for (const [tz, tx, len] of [[0.25, 0.05, 70], [-0.15, -0.1, 80], [-0.4, 0.12, 62]]) {
      const b = new kit.THREE.Group(); b.position.y = H; b.rotation.set(tx, 0, tz);
      const st = kit.capsule(1.1, len, "brown"); st.position.y = len / 2; b.add(st);
      for (let i = 0; i < 9; i++) {
        const s = 2.8 + r() * 1.6, f = kit.blob(s, s * 0.85, s, pinks[i % 4]);
        f.position.set((r() - 0.5) * 6, len * (0.4 + i * 0.07), (r() - 0.5) * 5); b.add(f);
      }
      m.push(b);
    }
  } else {
    const n = 9;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + r(), rr = i ? 4 + r() * 4 : 0;
      const x = Math.cos(a) * rr, z = Math.sin(a) * rr, h = 22 + r() * 12;
      const stem = kit.capsule(0.8, h, "leaf"); stem.position.set(x, H + h / 2 - 4, z); stem.rotation.set(z * 0.03, 0, -x * 0.03); m.push(stem);
      const y = H + h - 3, bx = x * 1.4, bz = z * 1.4;
      if (kind === "tulip") { const t = kit.blob(2.8, 3.8, 2.8, color); t.position.set(bx, y + 2, bz); m.push(t); }
      else if (kind === "rose") { const t = kit.blob(3.4, 2.8, 3.4, color); t.position.set(bx, y + 1, bz); m.push(t); const c = kit.blob(1.6, 1.4, 1.6, 0xb45a6a); c.position.set(bx, y + 3, bz); m.push(c); }
      else if (kind === "daisy") { const d = kit.blob(4, 1.2, 4, color); d.position.set(bx, y, bz); m.push(d); const e = kit.blob(1.5, 1, 1.5, "mustard"); e.position.set(bx, y + 1, bz); m.push(e); }
      else { const d = kit.blob(5.5, 1.4, 5.5, color); d.position.set(bx, y, bz); m.push(d); const e = kit.blob(2.6, 1.4, 2.6, "brown"); e.position.set(bx, y + 1.2, bz); m.push(e); }
    }
    for (let i = 0; i < 5; i++) { const l = kit.blob(2, 6, 1, 0x6a8a4c); const a = i * 1.26; l.position.set(Math.cos(a) * 9, H + 4, Math.sin(a) * 9); l.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); m.push(l); }
  }
  g.add(kit.part(name, { mount: "floor", order: 1 }, ...m));
  return g;
}
