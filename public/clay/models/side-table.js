// Small round side table: one part `<name>` (round top with lip, pedestal, splayed foot).
// Origin: bottom-centre on the floor. Front +Z. ~46 Ø × 55 h cm (top surface at y = 55).
// opts: `top`, `wood` colours, `radius`.
export const TOP_Y = 55;

export function build(kit, { name = "side-table", top = "brown", wood = "brown", radius = 23 } = {}) {
  const g = new kit.THREE.Group(); g.name = name;
  const foot = kit.lathe([[0, 0], [15, 0], [13, 4], [4, 7], [0, 7]], wood, { round: 1.5 });
  const post = kit.capsule(3.6, 48, wood); post.position.y = 28;
  const slab = kit.roundedCylinder(radius, 5, 1.8, top); slab.position.y = TOP_Y - 5;
  g.add(kit.part(name, { mount: "floor", order: 1 }, foot, post, slab));
  return g;
}
