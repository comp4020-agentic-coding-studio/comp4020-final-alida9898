// Takeaway paper cup generator: tapered cup + domed lid + sleeve with a bean dot.
// Parts `<name>-0 … <name>-(count-1)` (surface), laid left → right, ~14 cm apart.
// Origin: bottom-centre of the row. Front faces +Z. Randomness via kit.rng(seed).
const CUPS = ["white", "cream", "white", "terracotta"];
const SLEEVES = ["brown", "mustard", "terracotta", "blue"];
const LIDS = ["charcoal", "white", "brown"];

export function build(kit, { name = "takeaway-cup", seed = 3, count = 2, gap = 13, scale = 1, order = 1 } = {}) {
  const { THREE } = kit;
  const r = kit.rng(seed);
  const g = new THREE.Group(); g.name = name;
  for (let i = 0; i < count; i++) {
    const cupC = CUPS[Math.floor(r() * CUPS.length)];
    let sleeveC = SLEEVES[Math.floor(r() * SLEEVES.length)];
    if (sleeveC === cupC) sleeveC = "brown";
    const lidC = LIDS[Math.floor(r() * LIDS.length)];
    const tall = 12 + r() * 3; // 12–15 cm

    const body = kit.lathe([[0, 0], [3.6, 0], [4.7, tall], [0, tall]], cupC, { round: 0.8 });
    const lidRim = kit.roundedCylinder(5.1, 1.4, 0.6, lidC); lidRim.position.y = tall - 0.3;
    const lidDome = kit.lathe([[0, 0], [4.6, 0], [3.9, 1.8], [0, 2.1]], lidC, { round: 0.8 }); lidDome.position.y = tall + 1;
    const sip = kit.capsule(0.7, 2.6, lidC); sip.rotation.z = Math.PI / 2; sip.position.set(0, tall + 2.2, 2.8);
    const s0 = tall * 0.3, s1 = tall * 0.68, rr = (y) => 3.6 + (1.1 * y) / tall + 0.35;
    const sleeve = kit.lathe([[0, s0], [rr(s0), s0], [rr(s1), s1], [0, s1]], sleeveC, { round: 0.4 });
    const dotC = sleeveC === "brown" || sleeveC === "blue" ? "cream" : "brown";
    const ym = (s0 + s1) / 2;
    const dot = kit.blob(1.5, 1.9, 0.7, dotC); dot.position.set(0, ym, rr(ym) + 0.2);
    const cup = new THREE.Group(); cup.add(body, sleeve, dot, lidRim, lidDome, sip);
    cup.scale.setScalar(scale);
    cup.position.x = (i - (count - 1) / 2) * gap;
    const p = kit.part(`${name}-${i}`, { mount: "surface", order: order + i }, cup);
    g.add(p);
  }
  return g;
}
