// Sidewalk book cart: one part `<name>` — a slanted two-tier wooden display on four
// wheels with a push handle, books standing in both tiers (one cart, carried as one).
// Origin: bottom-centre on the ground. Front +Z. ~100 w × 50 d × 95 h.
export function build(kit, { name = "book-cart", wood = 0x9a6644, seed = 6 } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const r = kit.rng(seed), m = [], W = 100;
  const body = kit.roundedBox(W, 34, 44, 3, wood); body.position.y = 30; m.push(body);
  const trim = kit.roundedBox(W + 2, 3, 46, 1.2, "mustard"); trim.position.y = 47; m.push(trim);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const w = kit.roundedCylinder(7, 5, 2, "charcoal"); w.rotation.z = Math.PI / 2; w.position.set(sx * (W / 2 - 12), 7, sz * 15); m.push(w);
  }
  // two tiers of books, the back one raised, their tops tipped back
  const cols = ["terracotta", "blue", "leaf", "mustard", "cream", 0x9b6b8e, 0xb98a6a];
  for (const [tz, ty] of [[10, 47], [-10, 62]]) {
    if (ty > 47) { const step = kit.roundedBox(W - 6, 15, 18, 2, wood); step.position.set(0, 54.5, tz); m.push(step); }
    let x = -W / 2 + 6;
    while (x < W / 2 - 10) {
      const t = 4 + r() * 3, h = 18 + r() * 8;
      const b = kit.roundedBox(t, h, 14, 1, cols[Math.floor(r() * cols.length)]);
      b.position.set(x + t / 2, ty + h / 2, tz); b.rotation.x = -0.18; m.push(b); x += t + 0.6;
    }
  }
  const post = kit.roundedBox(4, 40, 4, 1.5, "charcoal"); post.position.set(W / 2 + 4, 52, -16); post.rotation.z = -0.25; m.push(post);
  const handle = kit.capsule(2.4, 40, "charcoal"); handle.rotation.x = Math.PI / 2; handle.position.set(W / 2 + 9, 72, -6); m.push(handle);
  g.add(kit.part(name, { mount: "floor", order: 1 }, ...m));
  return g;
}
