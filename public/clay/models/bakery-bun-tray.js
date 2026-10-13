// Tray of hot cross buns: a dark baking tray with nine glossy buns, each with a pale
// cross. One part `<name>` (surface). Origin: bottom-centre. Front +Z. ~36 × 30 cm.
export function build(kit, { name = "bakery-bun-tray" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const m = [];
  const tray = kit.roundedBox(36, 2.5, 30, 1.2, "charcoal"); tray.position.y = 1.25; m.push(tray);
  const rim = kit.roundedBox(37, 1.6, 31, 0.8, 0x5c5550); rim.position.y = 2.8; m.push(rim);
  for (let i = 0; i < 9; i++) {
    const x = -11 + (i % 3) * 11, z = -9 + Math.floor(i / 3) * 9;
    const b = kit.blob(5, 3.6, 4.4, i % 2 ? 0xc0783a : 0xb36c32); b.position.set(x, 5.6, z); m.push(b);
    const c1 = kit.roundedBox(7, 0.9, 1.6, 0.4, "cream"); c1.position.set(x, 9.1, z); m.push(c1);
    const c2 = kit.roundedBox(1.6, 0.9, 6, 0.4, "cream"); c2.position.set(x, 9.1, z); m.push(c2);
  }
  g.add(kit.part(name, { mount: "surface", order: 1 }, ...m));
  return g;
}
