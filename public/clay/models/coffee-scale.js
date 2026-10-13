// Flat coffee scale: one part `<name>` (low slab, round weighing pad, small display).
// Origin: bottom-centre. Front +Z. ~18 w × 3 h × 20 d cm (pad top at y = TOP_Y).
// opts: `color` (body), `pad`, `screen` colours.
export const TOP_Y = 3.4;

export function build(kit, { name = "coffee-scale", color = "charcoal", pad = "cream", screen = "blue" } = {}) {
  const g = new kit.THREE.Group(); g.name = name;
  const slab = kit.roundedBox(18, 2.6, 20, 1.2, color); slab.position.y = 1.3;
  const p = kit.roundedCylinder(7.4, 0.8, 0.3, pad); p.position.set(0, 2.6, -1.5);
  const disp = kit.roundedBox(8, 1, 3, 0.4, screen); disp.position.set(0, 2.6, 7.6);
  g.add(kit.part(name, { mount: "surface", order: 1 }, slab, p, disp));
  return g;
}
