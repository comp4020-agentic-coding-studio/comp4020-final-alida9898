// Bowl of roasted chestnuts: a wide terracotta bowl heaped with glossy brown chestnuts,
// each with a pale scored cross on top. One part `<name>` (surface). Origin: bottom-centre.
// ~22 Ø × 15 h cm — bigger than a single place-setting bowl so it reads on a round table.
export function build(kit, { name = "chestnut-bowl", bowl = "terracotta" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const m = [];
  const r = kit.rng(13);

  const bowlMesh = kit.lathe([[0, 0], [7.2, 0], [10.8, 3.5], [11, 7.5], [9.6, 9], [8.6, 9], [9, 8], [7.6, 1]], bowl, { round: 0.6 });
  m.push(bowlMesh);
  const rim = kit.roundedCylinder(11.2, 1, 0.5, new THREE.Color(kit.PALETTE[bowl] ?? bowl).multiplyScalar(1.1).getHex());
  rim.position.y = 9; m.push(rim);

  const shades = [0x7a4a2e, 0x8a5a3c, 0x6a3f28];
  const n = 8; // fewer, slightly bigger chestnuts — keeps the heaped look at a lower tri cost
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2, rad = r() * 7.4;
    const s = 2.6 + r() * 1.3;
    const h = 7 + (1 - rad / 8) * 4 + r() * 1.5;
    const nut = kit.blob(s, s * 0.95, s * 0.9, shades[i % shades.length]);
    nut.position.set(Math.sin(a) * rad, h, Math.cos(a) * rad);
    nut.rotation.set(r() * Math.PI, r() * Math.PI, r() * Math.PI);
    m.push(nut);
    // scored cross on top, pale — one flattened cross-shaped blob stands in for both bars
    const cx = nut.position.x, cz = nut.position.z, cy = nut.position.y + s * 0.78;
    const cross = kit.blob(s * 0.75, 0.2, s * 0.18, 0xe9c79a);
    cross.position.set(cx, cy, cz); cross.rotation.y = r() * Math.PI;
    m.push(cross);
  }

  g.add(kit.part(name, { mount: "surface", order: 1 }, ...m));
  return g;
}
