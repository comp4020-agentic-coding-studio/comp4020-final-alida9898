// Little flower cart: a wooden tray-box on two big cream wheels with a handle bar and a
// front prop leg, a striped canopy on two posts, and a heap of mixed blooms in the box.
// One part `<name>` (floor). Origin: bottom-centre. Front +Z. ~110 w × 60 d × 150 h.
export function build(kit, { name = "flower-cart", seed = 6 } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const r = kit.rng(seed), m = [];
  const box = kit.roundedBox(96, 24, 50, 3, 0x9db08a); box.position.y = 56; m.push(box);
  const rim = kit.roundedBox(100, 4, 54, 1.6, 0xb07a52); rim.position.y = 69; m.push(rim);
  for (const sz of [-1, 1]) {
    const w = kit.roundedCylinder(18, 5, 1.6, "cream"); w.rotation.x = Math.PI / 2; w.position.set(-22, 18, sz * 29 - (sz > 0 ? 5 : 0) + (sz > 0 ? 0 : 0)); m.push(w);
    const hub = kit.blob(4, 4, 3, "brown"); hub.position.set(-22, 18, sz * 32); m.push(hub);
  }
  const prop = kit.roundedBox(5, 44, 5, 1.6, "brown"); prop.position.set(40, 22, 0); m.push(prop);
  const handle = kit.capsule(1.8, 50, "brown"); handle.rotation.x = Math.PI / 2; handle.position.set(-62, 70, 0); m.push(handle);
  for (const sz of [-1, 1]) { const arm = kit.capsule(1.6, 20, "brown"); arm.rotation.z = Math.PI / 2; arm.position.set(-54, 66, sz * 22); m.push(arm); }
  for (const sx of [-1, 1]) { const p = kit.capsule(1.6, 76, "brown"); p.position.set(sx * 44, 106, -20); m.push(p); }
  for (let i = 0; i < 6; i++) {
    const s = kit.roundedBox(18, 3, 56, 1.2, i % 2 ? "white" : 0xe07a8a); s.position.set(-45 + i * 18, 145, -6); s.rotation.x = 0.18; m.push(s);
  }
  for (let i = 0; i < 6; i++) { const f = kit.blob(5, 6, 3, i % 2 ? "white" : 0xe07a8a); f.position.set(-45 + i * 18, 137, 21); m.push(f); }
  const cols = [0xe07a8a, "mustard", "white", 0xf2b8c6, 0xc8694a, 0xb7a0d0];
  for (let i = 0; i < 22; i++) {
    const x = -40 + r() * 80, z = -18 + r() * 36, s = 3.5 + r() * 1.5;
    const f = kit.blob(s, s * 0.9, s, cols[i % cols.length]); f.position.set(x, 72 + r() * 5, z); m.push(f);
    if (i % 3 === 0) { const l = kit.blob(4, 1.2, 2.4, "leaf"); l.position.set(x + 3, 71, z - 2); l.rotation.y = r() * 3; m.push(l); }
  }
  g.add(kit.part(name, { mount: "floor", order: 1 }, ...m));
  return g;
}
