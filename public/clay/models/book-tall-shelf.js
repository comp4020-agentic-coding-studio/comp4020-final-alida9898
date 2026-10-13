// Tall bookshop shelf (floor to near ceiling): one part `<name>` — two sides, crown top,
// plinth, back panel and five boards. Contents are separate items.
// Origin: bottom-centre on the floor. Front +Z, back at z = −depth/2. ~90 w × 236 h × 34 d.
// Exported SHELF_Y = top surfaces of the boards things stand on.
export const SHELF_Y = [14, 60, 106, 152, 198];
export const H = 236, D = 34;

export function build(kit, { name = "book-tall-shelf", width = 90, wood = 0x9a6644, back = 0xe8d6b8 } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const W = width, T = 5;
  const dark = new THREE.Color(wood).multiplyScalar(0.75).getHex();
  const m = [];
  for (const s of [-1, 1]) { const side = kit.roundedBox(T, H, D, 2, wood); side.position.set(s * (W / 2 - T / 2), H / 2, 0); m.push(side); }
  const crown = kit.roundedBox(W + 8, 7, D + 5, 2.5, dark); crown.position.y = H - 3.5; m.push(crown);
  const plinth = kit.roundedBox(W - 2, 10, D - 2, 2, dark); plinth.position.y = 5; m.push(plinth);
  const panel = kit.roundedBox(W - 2 * T, H - 10, 2, 0.8, back); panel.position.set(0, H / 2, -D / 2 + 1); m.push(panel);
  for (const y of SHELF_Y) { const b = kit.roundedBox(W - 2 * T + 1, 3.5, D - 3, 1.4, wood); b.position.set(0, y - 1.75, 1); m.push(b); }
  // a mustard lip along the crown, the shop's accent
  const lip = kit.roundedBox(W + 6, 2.5, 2.5, 1, "mustard"); lip.position.set(0, H - 8, D / 2 + 1.5); m.push(lip);
  g.add(kit.part(name, { mount: "floor", order: 1 }, ...m));
  return g;
}
