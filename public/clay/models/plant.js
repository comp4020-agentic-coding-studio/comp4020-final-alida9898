// Potted plant: ONE part `<name>` — the terracotta pot (from pot.js) + soil + three
// leaf clumps. A person carries the whole plant, so it is one sticker.
// Origin: bottom-centre of the pot on the floor. Front faces +Z.
// opts: `potScale` (pot size), `leafScale` (leaf size), `color` (leaf colour).
import { potMeshes } from "./pot.js";

export function build(kit, { name = "plant", potScale = 1.6, leafScale = 1.2, color = "leaf" } = {}) {
  const g = new kit.THREE.Group();
  g.name = name;
  const dark = new kit.THREE.Color(typeof color === "string" ? kit.PALETTE[color] : color).multiplyScalar(0.82).getHex();

  // a chunky clay leaf: a flattened blob tilted outward from its base
  const leaf = (len, wid, tiltZ, tiltX, shade) => {
    const pivot = new kit.THREE.Group();
    const b = kit.blob(wid, len / 2, wid * 0.45, shade);
    b.position.y = len / 2;
    pivot.add(b);
    pivot.rotation.set(tiltX, 0, tiltZ);
    return pivot;
  };

  const clump = (x, leaves) => {
    const grp = new kit.THREE.Group();
    grp.position.x = x;
    for (const [len, wid, tz, tx, shade, dx = 0, dz = 0] of leaves) {
      const l = leaf(len, wid, tz, tx, shade);
      l.position.set(dx, 0, dz);
      grp.add(l);
    }
    return grp;
  };

  const pot = new kit.THREE.Group();
  pot.add(...potMeshes(kit));
  pot.scale.setScalar(potScale);

  const leaves = new kit.THREE.Group();
  leaves.position.y = 21 * potScale + 1.4; // stems enter the soil just below the rim top
  leaves.scale.setScalar(leafScale);
  leaves.add(
    clump(-6, [
      [26, 6, 0.95, 0.1, color, 0, -2],
      [22, 5.5, 0.6, 0.35, dark, 0, 2],
    ]),
    clump(6, [
      [26, 6, -0.95, 0.1, color, 0, -2],
      [22, 5.5, -0.6, 0.35, dark, 0, 2],
    ]),
    clump(0, [
      [36, 7, 0.08, -0.15, color, 0, -3],
      [28, 6, -0.3, 0.25, dark, 1, 2],
      [26, 6, 0.32, 0.3, dark, -1, 3],
    ]),
  );

  g.add(kit.part(name, { mount: "floor", order: 1 }, pot, leaves));
  return g;
}
