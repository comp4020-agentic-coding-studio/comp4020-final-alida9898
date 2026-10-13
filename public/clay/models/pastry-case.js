// Countertop pastry display case: wooden plinth, four brown corner posts, pale
// translucent glass sides/top and a glass middle shelf. One part `<name>` (surface) —
// the empty case; the pastries inside are separate objects.
// Origin: bottom-centre on the counter. Front faces +Z. Default 58 w × 44 h × 40 d cm.
// Surfaces inside (local y): FLOORS[0] = case floor, FLOORS[1] = glass shelf top.
export const FLOORS = [6, 23];
export function build(kit, { name = "pastry-case", width = 58, depth = 40, height = 44 } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const W = width, D = depth, H = height;
  const glass = kit.clay(0xdcebef, { roughness: 0.25, sheen: 0.05 }).clone();
  glass.transparent = true; glass.opacity = 0.26; glass.depthWrite = false;
  const m = [];
  const base = kit.roundedBox(W, FLOORS[0], D, 1.8, "brown"); base.position.y = FLOORS[0] / 2; m.push(base);
  const trim = kit.roundedBox(W + 0.6, 2, 2, 0.8, "mustard"); trim.position.set(0, FLOORS[0] - 1.5, D / 2); m.push(trim);
  const lid = kit.roundedBox(W, 3, D, 1.4, "cream"); lid.position.y = H - 1.5; m.push(lid);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const post = kit.roundedBox(3, H - FLOORS[0] - 3, 3, 1, "brown");
    post.position.set(sx * (W / 2 - 1.5), FLOORS[0] + (H - FLOORS[0] - 3) / 2, sz * (D / 2 - 1.5)); m.push(post);
  }
  const ph = H - FLOORS[0] - 3, py = FLOORS[0] + ph / 2;
  const pane = (w, d, x, z) => { const p = new THREE.Mesh(new THREE.BoxGeometry(w, ph, d), glass); p.position.set(x, py, z); p.renderOrder = 2; return p; };
  m.push(pane(W - 4, 0.8, 0, D / 2 - 1), pane(W - 4, 0.8, 0, -D / 2 + 1), pane(0.8, D - 4, -W / 2 + 1, 0), pane(0.8, D - 4, W / 2 - 1, 0));
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(W - 4, 1, D - 4), glass); shelf.position.y = FLOORS[1] - 0.5; shelf.renderOrder = 2; m.push(shelf);
  const p = kit.part(name, { mount: "surface", order: 1 }, ...m);
  p.userData.zBias = -10;
  g.add(p);
  return g;
}
