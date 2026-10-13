// Little spring pot: a terracotta flowerpot with three tulips (pink, yellow, white)
// on green stems. One part `<name>` (surface). Origin: bottom-centre. ~13 Ø × 30 h cm.
import { potMeshes } from "./pot.js";
export function build(kit, { name = "bakery-flower-pot" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const pot = new THREE.Group(); pot.add(...potMeshes(kit)); pot.scale.setScalar(0.55);
  const m = [pot];
  const cols = [0xf2b8c6, 0xf3dc8e, 0xfaf6ef];
  [[-3, 0, 0.2], [3, 1, -0.15], [0, -2, 0]].forEach(([x, z, tilt], i) => {
    const h = 14 + i * 2;
    const stem = kit.capsule(0.8, h, "leaf"); stem.position.set(x, 10 + h / 2, z); stem.rotation.z = tilt; m.push(stem);
    const leaf = kit.blob(1.4, 4, 0.8, "leaf"); leaf.position.set(x + (i - 1) * 1.6, 14, z + 0.8); leaf.rotation.z = (i - 1) * 0.5; m.push(leaf);
    const bloom = kit.blob(2.6, 3.6, 2.6, cols[i]); bloom.position.set(x - Math.sin(tilt) * h, 10 + h + 2, z); m.push(bloom);
  });
  g.add(kit.part(name, { mount: "surface", order: 1 }, ...m));
  return g;
}
