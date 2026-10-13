// A bouquet in progress lying on the table: a cone of cream paper, stems sticking out the
// narrow end, roses / tulips / daisies fanning out the wide end, a twine bow. One part
// `<name>` (surface). Origin: bottom-centre. Lies along X (flowers toward +X). ~50 w × 16 h.
export function build(kit, { name = "flower-bouquet", seed = 3 } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const r = kit.rng(seed), m = [];
  const cone = new THREE.Mesh(new THREE.ConeGeometry(11, 32, 20, 1, true), kit.clay("cream"));
  cone.material = cone.material.clone(); cone.material.side = THREE.DoubleSide;
  cone.rotation.z = Math.PI / 2; cone.position.set(2, 9, 0); cone.castShadow = true; m.push(cone);
  for (let i = 0; i < 5; i++) { const s = kit.capsule(0.8, 14, "leaf"); s.rotation.z = Math.PI / 2; s.position.set(-18, 2 + (i % 2) * 1.5, (i - 2) * 1.6); m.push(s); }
  const bow = kit.blob(2.2, 3.2, 5, 0xc8a070); bow.position.set(-11, 6, 0); m.push(bow);
  const cols = [0xe07a8a, 0xf2b8c6, "mustard", "white", 0xc8694a, 0xf7cfd8, 0xe07a8a];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2, rr = i ? 6 : 0;
    const y = 9 + Math.sin(a) * rr, z = Math.cos(a) * rr, x = 18 + r() * 3;
    const c = cols[i % cols.length];
    if (c === "white") {
      const d = kit.blob(1.2, 3.6, 3.6, "white"); d.position.set(x + 1, y, z); m.push(d);
      const e = kit.blob(1, 1.4, 1.4, "mustard"); e.position.set(x + 2, y, z); m.push(e);
    } else { const f = kit.blob(3.4, 3, 3, c); f.position.set(x, y, z); m.push(f); }
  }
  for (let i = 0; i < 4; i++) { const l = kit.blob(4, 1, 2, 0x6a8a4c); l.position.set(14, 9 + (i - 1.5) * 5, (i % 2 ? 1 : -1) * 7); l.rotation.y = 0.4; m.push(l); }
  g.add(kit.part(name, { mount: "surface", order: 1 }, ...m));
  return g;
}
