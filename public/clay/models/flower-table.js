// Florist's work table: a thick wooden top on four chunky legs with a slatted lower
// shelf holding a cream crate. One part `<name>` (floor). Origin: bottom-centre. Front +Z.
// Default 140 × 66 cm; top surface at TOP_Y.
export const TOP_Y = 82;
export function build(kit, { name = "flower-table", width = 140, depth = 66 } = {}) {
  const g = new kit.THREE.Group(); g.name = name;
  const m = [], W = width, D = depth;
  const top = kit.roundedBox(W, 6, D, 2.4, 0xb07a52); top.position.y = TOP_Y - 3; m.push(top);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const leg = kit.roundedBox(7, TOP_Y - 6, 7, 2, "brown");
    leg.position.set(sx * (W / 2 - 8), (TOP_Y - 6) / 2, sz * (D / 2 - 8)); m.push(leg);
  }
  const shelf = kit.roundedBox(W - 14, 3, D - 14, 1.2, 0xa06d4a); shelf.position.y = 18; m.push(shelf);
  const crate = kit.roundedBox(40, 16, 28, 2, "cream"); crate.position.set(-W / 4, 27.5, 0); m.push(crate);
  const apron = kit.roundedBox(W - 16, 8, 2, 1, "mustard"); apron.position.set(0, TOP_Y - 10, D / 2 - 6); m.push(apron);
  g.add(kit.part(name, { mount: "floor", order: 1 }, ...m));
  return g;
}
