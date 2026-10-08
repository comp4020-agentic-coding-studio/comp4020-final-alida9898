// Terracotta flowerpot: one part `<name>` (vessel + soil mound — one carry-able pot).
// Origin: bottom-centre on the floor/surface. Front faces +Z. ~24 cm wide, 22 cm tall.

/** The pot's meshes (vessel + soil), unscaled, rim top at y = 21. Reused by plant.js. */
export function potMeshes(kit) {
  const vessel = kit.lathe(
    [[0, 0], [9, 0], [11.2, 16], [12.4, 16.4], [12.4, 21], [10.6, 21], [10.2, 17.5], [0, 17.5]],
    "terracotta",
    { round: 1.2 },
  );
  const mound = kit.blob(10.4, 3.2, 10.4, "soil");
  mound.position.y = 19.6;
  return [vessel, mound];
}

export function build(kit, { name = "pot", scale = 1 } = {}) {
  const g = new kit.THREE.Group();
  g.name = name;
  g.add(kit.part(name, { mount: "floor", order: 1 }, ...potMeshes(kit)));
  g.scale.setScalar(scale);
  return g;
}
