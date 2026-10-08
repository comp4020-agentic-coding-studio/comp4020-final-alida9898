// Coffee cup on saucer generator: one cup + saucer = one sticker.
// Parts `<name>-0 … <name>-(count-1)` (surface), left → right, `gap` cm apart.
// `colors` picks the cup colours in order (saucer contrasts). Origin: bottom-centre of the row.
const SAUCER = { blue: "cream", cream: "blue", terracotta: "cream", charcoal: "cream", mustard: "cream", white: "terracotta" };

export function build(kit, { name = "coffee-cup", colors = ["blue", "cream", "terracotta", "charcoal"], count = colors.length, gap = 18, order = 1 } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  for (let i = 0; i < count; i++) {
    const c = colors[i % colors.length];
    const saucer = kit.lathe([[0, 0], [5.5, 0], [7.6, 1.4], [7.4, 1.9], [0, 1.4]], SAUCER[c] ?? "cream", { round: 0.5 });
    const cup = kit.lathe([[0, 0], [3.6, 0], [4.9, 6.5], [5.2, 8], [4.4, 8], [0, 7.2]], c, { round: 0.9 });
    cup.position.y = 1.4;
    const crema = kit.roundedCylinder(4.4, 0.6, 0.2, "brown"); crema.position.y = 1.4 + 6.8;
    const handle = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.85, 10, 20), kit.clay(c));
    handle.castShadow = true; handle.position.set(5.3, 5.6, 0);
    const one = new THREE.Group(); one.add(saucer, cup, crema, handle);
    one.position.x = (i - (count - 1) / 2) * gap;
    g.add(kit.part(`${name}-${i}`, { mount: "surface", order: order + i }, one));
  }
  return g;
}
