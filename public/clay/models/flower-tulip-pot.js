// Spring tulip pot: a glazed blue clay pot with five tall tulips in pink and yellow.
// One part `<name>` (surface). Origin: bottom-centre. Front +Z. ~16 Ø × 40 h cm.
export function build(kit, { name = "flower-tulip-pot", pot = "blue" } = {}) {
  const g = new kit.THREE.Group(); g.name = name;
  const m = [];
  m.push(kit.lathe([[0, 0], [6, 0], [8, 12], [8.6, 12], [8.6, 14], [0, 14]], pot, { round: 1.2 }));
  const soil = kit.roundedCylinder(7.2, 1.4, 0.5, "soil"); soil.position.y = 12.6; m.push(soil);
  const cols = [0xf2b8c6, "mustard", 0xe07a8a, 0xf7cfd8, "mustard"];
  for (let i = 0; i < 5; i++) {
    const a = i * 1.26, x = Math.cos(a) * 3.5, z = Math.sin(a) * 3.5, h = 18 + (i % 3) * 4;
    const st = kit.capsule(0.8, h, "leaf"); st.position.set(x, 14 + h / 2, z); m.push(st);
    const t = kit.blob(2.6, 3.6, 2.6, cols[i]); t.position.set(x, 14 + h + 1.5, z); m.push(t);
    const l = kit.blob(1.6, 7, 0.8, 0x6a8a4c); l.position.set(x * 1.6, 19, z * 1.6); l.rotation.z = -x * 0.08; m.push(l);
  }
  g.add(kit.part(name, { mount: "surface", order: 1 }, ...m));
  return g;
}
