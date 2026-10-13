// Bakery display counter: a wooden cabinet with a slanted glass front, a cream top
// where bread baskets sit, and a mustard trim. One part `<name>` (floor).
// Origin: bottom-centre on the floor. Front faces +Z. Default 150 w × 60 d × 95 h.
// Top surface at y = TOP_Y.
export const TOP_Y = 95;
export function build(kit, { name = "bakery-display", width = 150, depth = 60 } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const W = width, D = depth, m = [];
  const base = kit.roundedBox(W, 40, D, 3, "brown"); base.position.y = 20; m.push(base);
  const kick = kit.roundedBox(W - 6, 8, 2, 1, 0x6e452d); kick.position.set(0, 4, D / 2); m.push(kick);
  for (const x of [-W / 3, 0, W / 3]) {
    const panel = kit.roundedBox(W / 3 - 10, 24, 2, 2, 0x9a6a48); panel.position.set(x, 22, D / 2 + 0.4); m.push(panel);
  }
  const trim = kit.roundedBox(W + 1, 3, D + 1, 1.2, "mustard"); trim.position.y = 41.5; m.push(trim);
  // glass box (back half solid wood, front glass) with bread shapes inside
  const glass = kit.clay(0xdcebef, { roughness: 0.25, sheen: 0.05 }).clone();
  glass.transparent = true; glass.opacity = 0.28; glass.depthWrite = false;
  const front = new THREE.Mesh(new THREE.BoxGeometry(W - 6, 50, 1), glass); front.position.set(0, 68, D / 2 - 6); front.rotation.x = -0.18; front.renderOrder = 2; m.push(front);
  for (const sx of [-1, 1]) { const side = kit.roundedBox(3, 50, D - 4, 1, "brown"); side.position.set(sx * (W / 2 - 1.5), 68, 0); m.push(side); }
  const back = kit.roundedBox(W - 4, 50, 3, 1, 0x9a6a48); back.position.set(0, 68, -D / 2 + 1.5); m.push(back);
  const top = kit.roundedBox(W, 4, D, 1.6, "cream"); top.position.y = TOP_Y - 2; m.push(top);
  const r = kit.rng(9);
  for (let i = 0; i < 7; i++) { // loaves on the inner shelf, part of the display
    const b = kit.blob(8 + r() * 3, 5, 6, i % 2 ? 0xd9a050 : 0xc4823e);
    b.position.set(-W / 2 + 16 + i * ((W - 32) / 6), 48, -4 + r() * 6); m.push(b);
  }
  g.add(kit.part(name, { mount: "floor", order: 1 }, ...m));
  return g;
}
