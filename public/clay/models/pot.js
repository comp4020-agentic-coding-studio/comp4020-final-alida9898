// Terracotta flowerpot: parts `pot` (the vessel) and `soil` (the mound on top).
// Origin: bottom-centre on the floor/surface. Front faces +Z. ~24 cm wide, 22 cm tall.
export function build(kit, { name = "pot", scale = 1 } = {}) {
  const g = new kit.THREE.Group();
  g.name = name;

  const vessel = kit.lathe(
    [[0, 0], [9, 0], [11.2, 16], [12.4, 16.4], [12.4, 21], [10.6, 21], [10.2, 17.5], [0, 17.5]],
    "terracotta",
    { round: 1.2 },
  );
  const pot = kit.part(`${name}-pot`, { mount: "floor", order: 1 }, vessel);

  const mound = kit.blob(10.4, 3.2, 10.4, "soil");
  mound.position.y = 19.6;
  // drawn just behind the pot so the rim covers the mound's lower edge
  const soil = kit.part(`${name}-soil`, { mount: "surface", order: 2 }, mound);
  soil.userData.zBias = -1;

  g.add(pot, soil);
  g.scale.setScalar(scale);
  return g;
}
