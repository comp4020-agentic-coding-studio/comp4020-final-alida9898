// Plain wooden sideboard for the brewing gear: one part `<name>` (carcass, top,
// two doors with knobs, plinth — one carry-able piece of furniture).
// Origin: bottom-centre on the floor. Front faces +Z. ~180 w × 90 h × 45 d cm (top at y = 90).
// opts: `wood` (body), `top` (worktop), `knob` colours.
export function build(kit, { name = "sideboard", wood = "brown", top = "cream", knob = "mustard", width = 180 } = {}) {
  const g = new kit.THREE.Group();
  g.name = name;
  const W = width, D = 45;
  const plinth = kit.roundedBox(W - 8, 8, D - 6, 2, "charcoal"); plinth.position.y = 4;
  const body = kit.roundedBox(W, 78, D, 4, wood); body.position.y = 8 + 39;
  const slab = kit.roundedBox(W + 4, 4, D + 2, 1.8, top); slab.position.y = 88;
  const parts = [plinth, body, slab];
  const dw = (W - 12) / 2;
  for (const s of [-1, 1]) {
    const door = kit.roundedBox(dw, 66, 3, 1.5, wood); door.position.set(s * (dw / 2 + 2), 47, D / 2 + 0.8);
    const k = kit.blob(2.4, 2.4, 2, knob); k.position.set(s * 6, 55, D / 2 + 3);
    parts.push(door, k);
  }
  g.add(kit.part(name, { mount: "floor", order: 1 }, ...parts));
  return g;
}
