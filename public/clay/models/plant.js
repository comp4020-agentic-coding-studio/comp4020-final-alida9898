// Leafy top for a potted plant: three leaf clumps `leaves-left`, `leaves-centre`,
// `leaves-right`. Leaves only — it sits on an existing `pot` entry in scene.js
// (y = the soil top), so the pot stays one model and is not duplicated.
// Origin: bottom-centre where the stems enter the soil. Front faces +Z. ~44 wide, ~42 tall.
export function build(kit, { name = "plant", scale = 1, color = "leaf" } = {}) {
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

  const clump = (id, order, x, leaves, zBias) => {
    const grp = new kit.THREE.Group();
    grp.position.x = x;
    for (const [len, wid, tz, tx, shade, dx = 0, dz = 0] of leaves) {
      const l = leaf(len, wid, tz, tx, shade);
      l.position.set(dx, 0, dz);
      grp.add(l);
    }
    const p = kit.part(`${name}-leaves-${id}`, { mount: "surface", order }, grp);
    p.userData.zBias = zBias;
    return p;
  };

  g.add(
    clump("left", 1, -6, [
      [26, 6, 0.95, 0.1, color, 0, -2],
      [22, 5.5, 0.6, 0.35, dark, 0, 2],
    ], 0),
    clump("right", 2, 6, [
      [26, 6, -0.95, 0.1, color, 0, -2],
      [22, 5.5, -0.6, 0.35, dark, 0, 2],
    ], 0),
    clump("centre", 3, 0, [
      [36, 7, 0.08, -0.15, color, 0, -3],
      [28, 6, -0.3, 0.25, dark, 1, 2],
      [26, 6, 0.32, 0.3, dark, -1, 3],
    ], 1),
  );
  g.scale.setScalar(scale);
  return g;
}
