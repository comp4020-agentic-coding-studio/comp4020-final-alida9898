// Coir doormat: a low rounded brown slab with a cream border and three mustard stripes.
// One part `<name>` (flat). Origin: bottom-centre on the floor. Front faces +Z.
// opts: width (along X) × depth (along Z), default 80 × 50 cm.
export function build(kit, { name = "doormat", width = 80, depth = 50 } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const base = kit.roundedBox(width, 1.6, depth, 0.7, "cream"); base.position.y = 0.8;
  const pile = kit.roundedBox(width - 8, 1.4, depth - 8, 0.6, "brown"); pile.position.y = 1.4;
  const stripes = [-1, 0, 1].map((k) => { const s = kit.roundedBox(width - 20, 0.8, 4, 0.4, "mustard"); s.position.set(0, 2.1, k * (depth - 8) / 4); return s; });
  g.add(kit.part(name, { mount: "flat", order: 1 }, base, pile, ...stripes));
  return g;
}
