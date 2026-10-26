// Wicker basket heaped with apples: a woven basket with a looped handle, filled with
// glossy red and green apples (a couple with a little stem and leaf). One part `<name>`
// (surface). Origin: bottom-centre. ~30 Ø × 34 h cm — a generously full, prominent basket.
export function build(kit, { name = "apple-basket" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const m = [];
  const r = kit.rng(31);
  const wick = 0xc8a06a, wickDk = 0xa98250;

  const basket = kit.lathe([[0, 0], [14, 0], [15, 2], [14.6, 14], [15.2, 15], [15.2, 16], [13.6, 16], [13, 2.4]], wick, { round: 0.8 });
  m.push(basket);
  for (const y of [5, 9.5]) {
    const band = kit.roundedCylinder(14.9, 1.6, 0.6, wickDk); band.position.y = y; m.push(band);
  }
  // looped handle over the top
  const handle = new THREE.Mesh(new THREE.TorusGeometry(13, 1.1, 8, 20, Math.PI), kit.clay(wickDk));
  handle.rotation.z = Math.PI; handle.position.y = 16; handle.castShadow = true; m.push(handle);

  const reds = [0xc23b2e, 0xd14a3a];
  const greens = [0x8aa64a, 0x7a9a3e];
  const n = 11;
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2, rad = r() * 10;
    const s = 4.4 + r() * 1.2;
    const h = 17 + (1 - rad / 11) * 6 + r() * 2;
    const useGreen = i % 4 === 0;
    const apple = kit.blob(s, s * 0.92, s, (useGreen ? greens : reds)[i % 2]);
    apple.position.set(Math.sin(a) * rad, h, Math.cos(a) * rad);
    m.push(apple);
    // small dimple + stem on the top ones
    if (i % 3 === 0) {
      const stem = kit.capsule(0.35, 2.2, "soil"); stem.position.set(apple.position.x, apple.position.y + s * 0.85, apple.position.z);
      const leaf = kit.blob(1.6, 0.3, 0.9, "leaf"); leaf.position.set(apple.position.x + 1.2, apple.position.y + s * 0.8, apple.position.z);
      leaf.rotation.y = r() * Math.PI;
      m.push(stem, leaf);
    }
  }

  g.add(kit.part(name, { mount: "surface", order: 1 }, ...m));
  return g;
}
