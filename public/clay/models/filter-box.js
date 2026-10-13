// Box of paper filters: one part `<name>` (open-topped card box, front label band,
// a few cone filters poking out). Origin: bottom-centre. Front +Z. ~14 w × 16 h × 10 d cm.
// opts: `color` (box), `label`, `paper` colours.
export function build(kit, { name = "filter-box", color = "mustard", label = "cream", paper = "white" } = {}) {
  const g = new kit.THREE.Group(); g.name = name;
  const box = kit.roundedBox(14, 11, 10, 1.4, color); box.position.y = 5.5;
  const lab = kit.roundedBox(9, 4, 0.6, 0.3, label); lab.position.set(0, 6, 5.1);
  const m = [box, lab];
  [-3.2, 0, 3.2].forEach((x, i) => {
    const f = kit.lathe([[0, 0], [1.2, 0], [4.2, 9], [0, 9]], paper, { round: 0.6 });
    f.scale.z = 0.35; f.position.set(x, 4 + (i === 1 ? 2 : 0), -1 + i * 0.6); f.rotation.z = (1 - i) * 0.12;
    m.push(f);
  });
  g.add(kit.part(name, { mount: "surface", order: 1 }, ...m));
  return g;
}
