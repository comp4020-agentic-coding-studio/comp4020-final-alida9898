// The flower yard's scenery (copied from the café's) — never placed by the player, always there: grass, the
// stepping-stone path from the door to the front, the tree, and the season's touch
// (tree crown colour, ground scatter, a faint tint of light over the yard).
// Returns { group, light } in the shop's world frame (ground y = 0).
import { YARD } from "./index.js";

const SCATTER = {
  spring: { colors: [0xf2b8c6, 0xf7cfd8, 0xfaf6ef], n: 46, size: [3, 4.5], flat: 0.5 },
  summer: null,
  autumn: { colors: [0xd9822f, 0xc8694a, 0xe0a23a, 0xb5532e], n: 60, size: [5, 7], flat: 0.8 },
  winter: { colors: [0xfaf6ef, 0xf3f1ec], n: 16, size: [16, 30], flat: 2.2 },
};
const GRASS = { spring: 0xa9c07e, summer: 0x8fae68, autumn: 0xb5b075, winter: 0xbcc2a8 };
const LIGHT = { spring: 0xffe1ea, summer: 0xfff1c4, autumn: 0xffc890, winter: 0xdce8ff };

export async function build({ kit, model, place, season = "spring" }) {
  const { THREE } = kit;
  const group = new THREE.Group(); group.name = "yard-scenery";
  const r = kit.rng(17);
  const [x0, x1] = YARD.box.x, [z0, z1] = YARD.box.z;
  const W = x1 - x0 + 30, D = z1 - z0 + 30, cx = (x0 + x1) / 2 + 12, cz = (z0 + z1) / 2;

  // ground: a soil slab with a grass top, its top just below the shop floor (y 0)
  const soil = kit.roundedBox(W, 10, D, 3, 0x9a7454); soil.position.set(cx, -6, cz);
  const grass = kit.roundedBox(W - 4, 3, D - 4, 1.5, GRASS[season] || GRASS.spring); grass.position.set(cx, -1.2, cz);
  for (const m of [soil, grass]) { m.castShadow = false; m.receiveShadow = true; group.add(m); }

  // stepping stones: out of the door (right wall, z ≈ 200), curving to the front
  for (const [i, [x, z]] of YARD.path.entries()) {
    const s = kit.blob(14 + (i % 2) * 2, 2.2, 12, i % 2 ? 0xc9c0b0 : 0xbdb3a2);
    s.position.set(x, 0.2, z); s.rotation.y = r() * 3; s.castShadow = false; s.receiveShadow = true; group.add(s);
  }

  // the tree (crown follows the season)
  const tree = place(await model("yard-tree", { name: "yard-tree", season }), { x: YARD.tree.x, y: 0, z: YARD.tree.z });
  group.add(tree);

  // ground scatter: petals / nothing / fallen leaves / snow patches, mostly under the tree
  const sc = SCATTER[season];
  if (sc) {
    for (let i = 0; i < sc.n; i++) {
      const nearTree = i < sc.n * 0.6;
      const x = nearTree ? YARD.tree.x + (r() - 0.5) * 200 : x0 + 20 + r() * (x1 - x0 - 40);
      const z = nearTree ? YARD.tree.z + 20 + r() * 150 : z0 + 30 + r() * (z1 - z0 - 60);
      const s = sc.size[0] + r() * (sc.size[1] - sc.size[0]);
      const b = kit.blob(s, sc.flat, s * (0.6 + r() * 0.4), sc.colors[i % sc.colors.length]);
      b.position.set(Math.min(x1 - 10, Math.max(x0 + 10, x)), 0.6, Math.min(z1 - 10, Math.max(z0 + 10, z)));
      b.rotation.y = r() * Math.PI; b.castShadow = false; group.add(b);
    }
  }

  // a faint wash of seasonal light, a narrow cone straight down onto the yard only
  const light = new THREE.SpotLight(LIGHT[season] || LIGHT.spring, 0.5, 1200, 0.3, 1, 0);
  light.position.set(cx, 700, cz);
  light.target.position.set(cx, 0, cz);
  group.add(light, light.target);
  return { group, light };
}
