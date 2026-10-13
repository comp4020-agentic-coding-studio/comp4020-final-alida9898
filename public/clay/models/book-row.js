// A short row of books held by two clay bookends — one carry-able bundle, one part `<name>`.
// Origin: bottom-centre. Front +Z. ~40 w × 28 h × 18 d. All randomness via kit.rng(seed).
export function build(kit, { name = "book-row", seed = 4, count = 6 } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const r = kit.rng(seed), m = [];
  const cols = ["terracotta", "blue", "mustard", "leaf", 0xb98a6a, "cream", 0x9b6b8e];
  const books = Array.from({ length: count }, (_, i) => ({ t: 3.6 + r() * 2.6, h: 20 + r() * 7, c: cols[(i * 3 + Math.floor(r() * 2)) % cols.length] }));
  const rowW = books.reduce((s, b) => s + b.t + 0.3, 0);
  let x = -rowW / 2;
  for (const b of books) {
    const c = kit.roundedBox(b.t, b.h, 16, Math.min(1.2, b.t / 3), b.c); c.position.set(x + b.t / 2, b.h / 2, 0); m.push(c);
    const band = kit.roundedBox(b.t + 0.2, 1.6, 1, 0.4, b.c === "mustard" || b.c === "cream" ? "brown" : "cream");
    band.position.set(x + b.t / 2, b.h * 0.8, 8); m.push(band);
    x += b.t + 0.3;
  }
  for (const s of [-1, 1]) {
    const end = kit.roundedBox(3, 16, 14, 1.2, "charcoal"); end.position.set(s * (rowW / 2 + 2), 8, 0); m.push(end);
    const foot = kit.roundedBox(8, 2, 14, 0.8, "charcoal"); foot.position.set(s * (rowW / 2 + 2) - s * 3, 1, 0); m.push(foot);
  }
  g.add(kit.part(name, { mount: "surface", order: 1 }, ...m));
  return g;
}
