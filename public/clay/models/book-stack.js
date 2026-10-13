// A stack of books lying flat, slightly askew: one part `<name>`. Origin: bottom-centre.
// Front +Z. ~26 w × ~16 h.
export function build(kit, { name = "book-stack", seed = 9, count = 4 } = {}) {
  const g = new kit.THREE.Group(); g.name = name;
  const r = kit.rng(seed), m = [];
  const cols = ["terracotta", "blue", "leaf", "mustard", 0x9b6b8e, "cream"];
  let y = 0;
  for (let i = 0; i < count; i++) {
    const t = 3 + r() * 2, w = 24 - i * 1.5 + r() * 3, d = 17 - i + r() * 2;
    const b = new kit.THREE.Group();
    const cover = kit.roundedBox(w, t, d, 1, cols[(i + Math.floor(r() * 3)) % cols.length]);
    const pages = kit.roundedBox(w - 1.2, t - 1.2, 1, 0.3, "white"); pages.position.z = d / 2;
    b.add(cover, pages); b.position.set((r() - 0.5) * 3, y + t / 2, 0); b.rotation.y = (r() - 0.5) * 0.35;
    m.push(b); y += t;
  }
  g.add(kit.part(name, { mount: "surface", order: 1 }, ...m));
  return g;
}
