// Kneading table: a thick pale-wood worktop with a flour-dusted patch, four sturdy
// legs and a low shelf. One part `<name>` (floor). Origin: bottom-centre. Front +Z.
// Default 120 w × 60 d; top at y = TOP_Y.
export const TOP_Y = 86;
export function build(kit, { name = "bakery-table", width = 120, depth = 60 } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const W = width, D = depth, m = [];
  const top = kit.roundedBox(W, 8, D, 2.5, 0xd9b483); top.position.y = TOP_Y - 4; m.push(top);
  const flour = kit.blob(22, 0.6, 14, "white"); flour.position.set(-W / 6, TOP_Y + 0.1, 2); m.push(flour);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const leg = kit.roundedBox(7, TOP_Y - 8, 7, 2, "brown"); leg.position.set(sx * (W / 2 - 7), (TOP_Y - 8) / 2, sz * (D / 2 - 7)); m.push(leg);
  }
  const shelf = kit.roundedBox(W - 12, 4, D - 10, 1.5, 0xb3824f); shelf.position.y = 18; m.push(shelf);
  g.add(kit.part(name, { mount: "floor", order: 1 }, ...m));
  return g;
}
