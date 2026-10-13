// L-shaped coffee bar: the straight counter plus a return at its RIGHT end that
// runs toward the front (+Z), its slatted face turned to -X (into the room).
// Built from two `counter` bodies merged into ONE part `<name>` — one stuck object.
// Origin: bottom-centre of the main run on the floor. Main front faces +Z. Top at y = H.
import { build as counter } from "./counter.js";

export function build(kit, { name = "counter-l", width = 250, depth = 55, height = 95, ret = 80 } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const take = (grp) => grp.children[0].children.slice();
  const main = take(counter(kit, { width, depth, height }));
  const back = new THREE.Group();
  back.add(...take(counter(kit, { width: ret, depth, height })));
  back.rotation.y = -Math.PI / 2; // front +Z -> -X
  back.position.set(width / 2 - depth / 2, 0, depth / 2 + ret / 2);
  const p = kit.part(name, { mount: "floor", order: 1 }, ...main, back);
  p.userData.zBias = -40;
  g.add(p);
  return g;
}
