// Outdoor bread rack: a small wooden two-shelf stand with a cream awning board on
// top, loaves and a baguette bundle on the shelves. One part `<name>` (floor) — the
// rack and its bread are one display piece. Origin: bottom-centre. Front +Z. ~70 w × 120 h.
export function build(kit, { name = "bakery-bread-rack" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const m = [], W = 70, D = 36;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const post = kit.roundedBox(5, 110, 5, 1.5, "brown"); post.position.set(sx * (W / 2 - 3), 55, sz * (D / 2 - 3)); m.push(post);
  }
  for (const y of [30, 66]) { const s = kit.roundedBox(W, 4, D, 1.5, 0xb3824f); s.position.y = y; m.push(s); }
  const awn = kit.roundedBox(W + 10, 16, 4, 2, "cream"); awn.position.set(0, 114, D / 2 - 2); awn.rotation.x = -0.2; m.push(awn);
  const stripe = kit.roundedBox(W + 10, 4, 4.4, 1.5, "terracotta"); stripe.position.set(0, 108, D / 2 - 1); stripe.rotation.x = -0.2; m.push(stripe);
  const roofTop = kit.roundedBox(W + 6, 4, D + 4, 1.5, "brown"); roofTop.position.y = 110; m.push(roofTop);
  const r = kit.rng(21);
  for (let i = 0; i < 4; i++) { const b = kit.blob(7, 5, 6.5, r() < 0.5 ? 0xc4823e : 0xd9a050); b.position.set(-24 + i * 16, 37, 2); m.push(b); }
  for (let i = 0; i < 3; i++) { const b = kit.capsule(2.8, 50, 0xd49a4a); b.rotation.z = Math.PI / 2; b.position.set(0, 71 + i * 4, -6 + i * 5); m.push(b); }
  g.add(kit.part(name, { mount: "floor", order: 1 }, ...m));
  return g;
}
