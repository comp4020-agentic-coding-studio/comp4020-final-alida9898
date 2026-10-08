// Wooden coffee-bar counter: brown slatted front, cream top, dark kick plinth.
// One part `<name>` (floor, order 1) — the whole counter is one stuck object.
// Origin: bottom-centre on the floor. Front faces +Z. Top surface at y = H (95).
export function build(kit, { name = "counter", width = 180, depth = 55, height = 95 } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const W = width, D = depth, H = height, T = 5;
  const P = kit.PALETTE;
  const tint = (hex, k) => new THREE.Color(hex).multiplyScalar(k).getHex();

  const plinth = kit.roundedBox(W - 6, 8, D - 6, 2, tint(P.brown, 0.62)); plinth.position.set(0, 4, -2);
  const body = kit.roundedBox(W - 2, H - T - 8, D - 4, 3, tint(P.brown, 0.9)); body.position.set(0, 8 + (H - T - 8) / 2, -1);
  const top = kit.roundedBox(W + 4, T, D, 2, "cream"); top.position.set(0, H - T / 2, 0);
  const meshes = [plinth, body, top];

  // vertical slats across the front, alternating tone
  const n = Math.round(W / 12), sw = (W - 8) / n;
  for (let i = 0; i < n; i++) {
    const s = kit.roundedBox(sw - 1.6, H - T - 14, 3, 1.2, i % 2 ? P.brown : tint(P.brown, 1.08));
    s.position.set(-W / 2 + 4 + sw * (i + 0.5), 8 + (H - T - 8) / 2, D / 2 - 2.5);
    meshes.push(s);
  }
  // mustard trim rail just under the top
  const rail = kit.roundedBox(W - 2, 3, 3, 1.2, "mustard"); rail.position.set(0, H - T - 3, D / 2 - 0.5);
  meshes.push(rail);

  const p = kit.part(name, { mount: "floor", order: 1 }, ...meshes);
  p.userData.zBias = -40; // everything resting on it must draw over it in 2D
  g.add(p);
  return g;
}
