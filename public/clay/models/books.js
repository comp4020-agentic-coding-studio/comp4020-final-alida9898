// Book row generator on a plain wooden wall shelf.
// Parts: `<name>-shelf` (order 1, wall), then `<name>-0 … <name>-(count-1)` (surface, left → right).
// Origin: bottom-centre of the shelf board. Front faces +Z. All randomness via kit.rng(seed).
export function build(kit, { name = "books", seed = 7, count = 10 } = {}) {
  const { THREE } = kit;
  const r = kit.rng(seed);
  const g = new THREE.Group();
  g.name = name;
  const P = kit.PALETTE;
  const tint = (hex, k) => new THREE.Color(hex).multiplyScalar(k).getHex();
  const colours = ["terracotta", "mustard", "blue", "cream", "brown", "leaf", "charcoal"];

  // lay the books out first so the shelf can fit them
  const books = [];
  for (let i = 0; i < count; i++) {
    const t = 3.5 + r() * 3.5, h = 19 + r() * 10, d = 14 + r() * 3;
    const c = colours[Math.floor(r() * colours.length)];
    const col = r() < 0.4 ? tint(P[c], 0.82) : P[c];
    const band = r() < 0.5 ? "cream" : "mustard";
    books.push({ t, h, d, col, band: c === "cream" || c === "mustard" ? "brown" : band, bands: 1 + Math.floor(r() * 2) });
  }
  // a couple of leaners at the right end, tipping toward the last upright
  const lean = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0].slice(0, count);
  if (count >= 4) { lean[count - 1] = 0.22; lean[count - 2] = 0.1; }
  const gap = 0.4;
  const rowW = books.reduce((s, b) => s + b.t + gap, 0) + 6;
  const shelfW = Math.ceil(rowW + 10), T = 3, SD = 20;

  const board = kit.roundedBox(shelfW, T, SD, 1.2, "brown"); board.position.set(0, T / 2, 0);
  const bracket = (x) => { const b = kit.roundedBox(2.5, 9, 10, 1, tint(P.brown, 0.8)); b.position.set(x, -4.5, -SD / 2 + 5); return b; };
  g.add(kit.part(`${name}-shelf`, { mount: "wall", order: 1 }, board, bracket(-shelfW / 2 + 8), bracket(shelfW / 2 - 8)));

  let x = -rowW / 2 + 3;
  books.forEach((b, i) => {
    const cover = kit.roundedBox(b.t, b.h, b.d, Math.min(1.2, b.t / 3), b.col);
    cover.position.y = b.h / 2;
    const parts = [cover];
    for (let k = 0; k < b.bands; k++) {
      const s = kit.roundedBox(b.t + 0.2, 1.6, 1, 0.4, b.band);
      s.position.set(0, b.h * (k === 0 ? 0.78 : 0.2), b.d / 2);
      parts.push(s);
    }
    const bk = new THREE.Group(); bk.add(...parts);
    // pivot at the bottom-right corner for leaners so they rest on their corner
    bk.rotation.z = lean[i]; // tops tip left; shifted right so they rest against the previous book
    const sx = lean[i] ? Math.sin(lean[i]) * b.h * 0.9 : 0;
    bk.position.set(x + b.t / 2 + sx, T, -SD / 2 + b.d / 2 + 2.5);
    x += b.t + gap + sx;
    const p = kit.part(`${name}-${i}`, { mount: "surface", order: i + 2 }, bk);
    p.userData.zBias = 1; // always in front of the shelf board in 2D
    g.add(p);
  });
  return g;
}
