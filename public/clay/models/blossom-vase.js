// Vase of cherry blossom: a cream clay vase with three bare brown branches carrying
// pink-and-white blossom clusters. One part `<name>` (surface). Origin: bottom-centre.
// Front +Z. ~14 Ø × 46 h cm.
export function build(kit, { name = "blossom-vase", vase = "cream", seed = 11 } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const r = kit.rng(seed), m = [];
  m.push(kit.lathe([[0, 0], [5, 0], [7, 6], [6.5, 12], [3.4, 17], [3.8, 19], [0, 19]], vase, { round: 1.2 }));
  const band = kit.roundedCylinder(6.9, 2, 0.8, "blue"); band.position.y = 7; m.push(band);
  const pinks = [0xf2b8c6, 0xf7cfd8, 0xfaf6ef, 0xe9a0b4];
  // a branch: a tilted capsule from the vase mouth, blossoms along its upper half
  const branch = (len, tz, tx) => {
    const b = new THREE.Group(); b.position.y = 17; b.rotation.set(tx, 0, tz);
    const stick = kit.capsule(0.9, len, "brown"); stick.position.y = len / 2; b.add(stick);
    const twig = kit.capsule(0.6, len * 0.4, "brown"); twig.position.set(len * 0.1, len * 0.7, 0); twig.rotation.z = -0.7; b.add(twig);
    for (let i = 0; i < 6; i++) {
      const t = 0.45 + i * 0.1, s = 2.2 + r() * 1.2;
      const f = kit.blob(s, s * 0.85, s, pinks[i % pinks.length]);
      f.position.set((r() - 0.5) * 4 + (i % 2 ? len * 0.12 : 0), len * t, (r() - 0.5) * 3); b.add(f);
    }
    return b;
  };
  m.push(branch(28, 0.28, 0.05), branch(32, -0.12, -0.1), branch(24, -0.42, 0.12));
  g.add(kit.part(name, { mount: "surface", order: 1 }, ...m));
  return g;
}
