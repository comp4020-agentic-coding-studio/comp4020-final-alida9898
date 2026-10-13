// Wicker bread basket with bread in it. `kind`: baguette | round | bun.
// One part `<name>` (surface) — basket + its bread are one carry-able thing.
// Origin: bottom-centre. Front faces +Z. ~38 × 26 cm.
export function build(kit, { name = "bakery-bread-basket", kind = "round" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const m = [], wick = 0xc8a06a, wickDk = 0xa98250, crust = 0xc4823e, crustLt = 0xdcab5c;
  const W = 38, D = 26;
  const bottom = kit.roundedBox(W, 4, D, 2, wickDk); bottom.position.y = 2; m.push(bottom);
  for (let i = 0; i < 2; i++) { const band = kit.roundedBox(W + 1, 4, D + 1, 2, i ? wick : wickDk); band.position.y = 6 + i * 4; m.push(band); }
  const inner = kit.roundedBox(W - 5, 2, D - 5, 1, 0xf1e4cc); inner.position.y = 10.5; m.push(inner);
  const r = kit.rng(kind.length);
  if (kind === "baguette") {
    for (let i = 0; i < 3; i++) {
      const b = kit.capsule(3.4, 44, i % 2 ? crustLt : crust); b.rotation.z = Math.PI / 2 - 0.25 + i * 0.12; b.rotation.y = 0.2 - i * 0.2;
      b.position.set(0, 13 + i * 3, -6 + i * 6); m.push(b);
      for (let k = -1; k <= 1; k++) { const s = kit.blob(4, 0.8, 1.2, 0xf1d9a0); s.position.set(k * 11, 16 + i * 3.2, -6 + i * 6 + 2.6); s.rotation.y = 0.5; m.push(s); }
    }
  } else if (kind === "round") {
    for (const [x, z] of [[-9, -3], [9, -2], [0, 6]]) {
      const b = kit.blob(9, 6.5, 8.5, r() < 0.5 ? crust : 0xb87436); b.position.set(x, 15, z); m.push(b);
      const cut = kit.blob(5, 0.8, 1, 0xf1d9a0); cut.position.set(x, 21.2, z); m.push(cut);
    }
  } else {
    for (let i = 0; i < 6; i++) {
      const b = kit.blob(5.5, 4.2, 5.5, i % 2 ? crustLt : 0xd49a4a);
      b.position.set(-11 + (i % 3) * 11, 13.5 + (i > 2 ? 2 : 0), i > 2 ? 5 : -4); m.push(b);
    }
  }
  g.add(kit.part(name, { mount: "surface", order: 1 }, ...m));
  return g;
}
