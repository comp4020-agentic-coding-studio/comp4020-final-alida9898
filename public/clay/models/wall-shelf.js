// Two-tier wall shelf for a back bar: two chunky wooden boards on mustard brackets,
// with a cream back rail. One part `<name>` (wall) — the shelf alone; what stands on it is separate.
// Origin: bottom-centre of the lower brackets, back flush with the wall (z = 0). Front faces +Z.
// Board tops (surfaces to put things on) at y = TIERS[0] and TIERS[1]; depth DEPTH.
export const TIERS = [10, 48];
export const DEPTH = 22;
export function build(kit, { name = "wall-shelf", width = 130, wood = "brown" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const W = width, D = DEPTH, T = 4;
  const m = [];
  for (const top of TIERS) {
    const board = kit.roundedBox(W, T, D, 1.6, wood); board.position.set(0, top - T / 2, D / 2); m.push(board);
    for (const s of [-1, 1]) {
      const br = kit.roundedBox(3.5, 9, D - 6, 1.4, "mustard"); br.position.set(s * (W / 2 - 14), top - T - 4.5, (D - 6) / 2); m.push(br);
    }
  }
  const rail = kit.roundedBox(W - 4, 3, 2, 1, "cream"); rail.position.set(0, TIERS[1] + 14, 1); m.push(rail);
  for (const s of [-1, 1]) { const post = kit.roundedBox(3, 18, 2, 1, "cream"); post.position.set(s * (W / 2 - 4), TIERS[1] + 7, 1); m.push(post); }
  const p = kit.part(name, { mount: "wall", order: 1 }, ...m);
  p.userData.zBias = -20;
  g.add(p);
  return g;
}
