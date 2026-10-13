// Syrup bottle: tall square-shouldered bottle with a coloured syrup, a cream label with
// a fruit/bean dot, and a charcoal pump. One part `<name>` (surface). Origin: bottom-centre.
// opts: `color` (syrup), `dot` (label dot). ~8 cm across, 30 cm tall.
export function build(kit, { name = "syrup-bottle", color = "terracotta", dot = "leaf" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const body = kit.lathe([[0, 0], [3.8, 0], [4, 1], [4, 16], [2.4, 19.5], [1.6, 20.5], [1.6, 22], [0, 22]], color, { round: 1 });
  const label = kit.roundedBox(6.6, 7, 1, 0.8, "cream"); label.position.set(0, 9, 3.7);
  const d = kit.blob(1.6, 1.6, 0.6, dot); d.position.set(0, 9.6, 4.3);
  const line = kit.roundedBox(4, 1, 0.5, 0.4, "brown"); line.position.set(0, 7, 4.3);
  const collar = kit.roundedCylinder(2.4, 2.4, 0.8, "charcoal"); collar.position.y = 21.4;
  const stem = kit.capsule(0.8, 5, "charcoal"); stem.position.y = 25.6;
  const head = kit.roundedBox(2.4, 1.8, 6, 0.8, "charcoal"); head.position.set(0, 28, 1.8);
  g.add(kit.part(name, { mount: "surface", order: 1 }, body, label, d, line, collar, stem, head));
  return g;
}
