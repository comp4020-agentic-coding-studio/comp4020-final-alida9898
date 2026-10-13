// Glass jar of spring flowers (tulips + daisies): one part `<name>`. Origin: bottom-centre.
// Front +Z. ~14 Ø × 34 h.
export function build(kit, { name = "book-flower-jar", seed = 3 } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const r = kit.rng(seed), m = [];
  const glass = new THREE.MeshStandardMaterial({ color: 0xcfe3dc, roughness: 0.3, transparent: true, opacity: 0.55 });
  m.push(kit.lathe([[0, 0], [6, 0], [6.5, 12], [5, 15], [5.4, 16.5], [0, 16.5]], glass, { round: 1 }));
  const water = kit.roundedCylinder(5.3, 9, 1, 0xa8cfc4); m.push(water);
  const heads = [0xf2b8c6, 0xf7d36a, 0xfaf6ef, 0xe98a8a, 0xf2b8c6];
  heads.forEach((c, i) => {
    const a = (i / heads.length) * Math.PI * 2 + r(), tilt = 0.18 + r() * 0.15, h = 22 + r() * 8;
    const s = new THREE.Group(); s.rotation.set(Math.sin(a) * tilt, 0, Math.cos(a) * tilt); s.position.y = 6;
    const stem = kit.capsule(0.9, h, "leaf"); stem.position.y = h / 2; s.add(stem);
    const head = i % 2 ? kit.blob(3.2, 1.4, 3.2, c) : kit.blob(3, 4, 3, c); head.position.y = h + 1; s.add(head);
    if (i % 2) { const eye = kit.blob(1.3, 1, 1.3, "mustard"); eye.position.y = h + 2; s.add(eye); }
    m.push(s);
  });
  const leaf = kit.blob(2, 7, 1, "leaf"); leaf.position.set(4, 20, 2); leaf.rotation.z = -0.5; m.push(leaf);
  g.add(kit.part(name, { mount: "surface", order: 1 }, ...m));
  return g;
}
