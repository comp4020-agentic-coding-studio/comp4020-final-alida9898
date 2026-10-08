// Upholstered armchair: parts `armchair` (legs, base, seat, back, arms — one
// carry-able chair) and `armchair-pillow`. ~80 wide × 85 tall × 80 deep.
// Origin: bottom-centre on the floor. Front faces +Z, back at z ≈ −40.
// opts: `fabric` / `pillow` / `wood` colours (palette name or hex).
export function build(kit, { name = "armchair", fabric = "blue", pillow = "mustard", wood = "brown" } = {}) {
  const g = new kit.THREE.Group();
  g.name = name;

  // 1. frame: four chunky tapered-looking legs + the upholstered base block
  const legs = [];
  for (const x of [-32, 32]) for (const z of [-30, 30]) {
    const leg = kit.capsule(3.6, 16, wood);
    leg.position.set(x, 8, z);
    legs.push(leg);
  }
  const base = kit.roundedBox(78, 20, 76, 6, fabric);
  base.position.set(0, 22, 0);

  // 2. seat cushion, puffy, sitting on the base between the arms
  const cushion = kit.roundedBox(54, 13, 60, 6, fabric);
  cushion.position.set(0, 38, 6);

  // 3. backrest, tall slab across the back
  const backSlab = kit.roundedBox(78, 54, 18, 8, fabric);
  backSlab.position.set(0, 58, -31);

  // 4–5. arms, rolled-top blocks on each side
  const arm = (side) => {
    const block = kit.roundedBox(14, 30, 72, 7, fabric);
    block.position.set(side * 33, 45, 2);
    return block;
  };

  // 6. throw pillow leaning on the backrest
  const pad = kit.roundedBox(34, 30, 11, 5.5, pillow);
  pad.position.set(0, 58, -17);
  pad.rotation.x = -0.18;
  const pil = kit.part(`${name}-pillow`, { mount: "surface", order: 2 }, pad);
  pil.userData.zBias = 20; // leans on the back but sits in the chair: drawn over it

  const chair = kit.part(name, { mount: "floor", order: 1 }, ...legs, base, cushion, backSlab, arm(-1), arm(1));
  g.add(chair, pil);
  return g;
}
