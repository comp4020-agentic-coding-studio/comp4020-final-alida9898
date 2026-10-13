// Standing wooden bookshelf: one part `<name>` (two sides, top, plinth, back panel,
// shelf boards). Books are separate (books.js generator, shelf part dropped).
// Origin: bottom-centre on the floor. Front faces +Z, back at z = −depth/2.
// ~64 w × 172 h × 30 d cm. Exported SHELF_Y = top surfaces of the boards books stand on.
// opts: `width`, `wood`, `back` (panel colour).
export const SHELF_Y = [12, 54, 96, 138];

export function build(kit, { name = "bookshelf", width = 64, wood = "brown", back = "cream" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const W = width, H = 172, D = 30, T = 4;
  const dark = new THREE.Color(kit.PALETTE[wood] ?? wood).multiplyScalar(0.8).getHex();
  const m = [];
  for (const s of [-1, 1]) { const side = kit.roundedBox(T, H, D, 1.6, wood); side.position.set(s * (W / 2 - T / 2), H / 2, 0); m.push(side); }
  const top = kit.roundedBox(W + 4, 5, D + 3, 2, wood); top.position.y = H - 2.5; m.push(top);
  const plinth = kit.roundedBox(W - 2, 8, D - 2, 2, dark); plinth.position.y = 4; m.push(plinth);
  const panel = kit.roundedBox(W - 2 * T, H - 8, 2, 0.8, back); panel.position.set(0, H / 2, -D / 2 + 1); m.push(panel);
  for (const y of SHELF_Y) { const b = kit.roundedBox(W - 2 * T + 1, 3, D - 3, 1.2, wood); b.position.set(0, y - 1.5, 1); m.push(b); }
  g.add(kit.part(name, { mount: "floor", order: 1 }, ...m));
  return g;
}
