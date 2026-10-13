// Plant shelf for the back wall: two wooden boards on cream brackets, a little ladder of
// ledges for pots. One part `<name>` (wall) — the shelf alone. Origin: bottom-centre of the
// lower brackets, back flush with the wall (z = 0). Front +Z. Board tops at TIERS; depth DEPTH.
export const TIERS = [6, 46];
export const DEPTH = 24;
export function build(kit, { name = "flower-shelf", width = 110 } = {}) {
  const g = new kit.THREE.Group(); g.name = name;
  const m = [];
  for (const y of TIERS) {
    const b = kit.roundedBox(width, 4, DEPTH, 1.5, 0xb07a52); b.position.set(0, y - 2, DEPTH / 2); m.push(b);
    for (const sx of [-1, 1]) { const br = kit.roundedBox(4, 12, DEPTH - 4, 1.4, "cream"); br.position.set(sx * (width / 2 - 12), y - 10, (DEPTH - 4) / 2); m.push(br); }
  }
  const rail = kit.roundedBox(width - 10, 4, 3, 1.2, "leaf"); rail.position.set(0, TIERS[1] + 22, 1.5); m.push(rail);
  g.add(kit.part(name, { mount: "wall", order: 1 }, ...m));
  return g;
}
