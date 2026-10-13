// Knit throw blanket draped over a chair arm: one part `<name>` — a soft fold lying
// on top of the arm with both ends hanging down its sides, plus a few stripe bands.
// Origin: bottom-centre of the arm it hangs over (top of the fold at y ≈ 9). The fold
// runs along Z; hanging flaps at x = ±(arm/2). opts: `color`, `stripe`, `arm` (arm width cm), `drop` (hang length).
export function build(kit, { name = "blanket", color = "terracotta", stripe = "cream", arm = 16, drop = 34 } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const L = 44, T = 3.4, m = [];
  const top = kit.roundedBox(arm + 2 * T, T + 1, L, T / 2, color); top.position.y = T / 2 + 0.5; m.push(top);
  const roll = kit.capsule(T, L, color); roll.rotation.x = Math.PI / 2; roll.position.set(0, T + 1, 0);
  roll.scale.set(1.5, 1, 1); m.push(roll);
  for (const s of [-1, 1]) {
    const flap = kit.roundedBox(T, drop, L - 2 * (s > 0 ? 2 : 0), T / 2, color);
    flap.position.set(s * (arm / 2 + T / 2), -drop / 2 + T, 0); flap.rotation.z = s * 0.06; m.push(flap);
    const hem = kit.capsule(T * 0.75, L - 2, stripe); hem.rotation.x = Math.PI / 2; hem.position.set(s * (arm / 2 + T / 2 + 0.3), -drop + T + 1, 0); m.push(hem);
    const band = kit.roundedBox(T + 0.6, 3, L - 1, 1, stripe); band.position.set(s * (arm / 2 + T / 2), -drop * 0.55 + T, 0); m.push(band);
  }
  g.add(kit.part(name, { mount: "surface", order: 1 }, ...m));
  return g;
}
