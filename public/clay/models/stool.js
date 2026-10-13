// Café stool: round cushioned seat on four splayed wooden legs with a foot ring.
// One part `<name>` (floor). Origin: bottom-centre. Seat top at y ≈ `height`.
export function build(kit, { name = "stool", height = 46, seat = "mustard", wood = "brown" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const m = [];
  const cushion = kit.roundedCylinder(16, 5, 2.4, seat); cushion.position.y = height - 5;
  const board = kit.roundedCylinder(15, 3, 1.2, wood); board.position.y = height - 8;
  m.push(cushion, board);
  const L = height - 7;
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    const leg = kit.capsule(2.2, L + 2, wood);
    leg.position.set(Math.cos(a) * 11, L / 2, Math.sin(a) * 11);
    leg.rotation.set(Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12);
    m.push(leg);
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(12, 1.3, 8, 28), kit.clay(wood));
  ring.rotation.x = Math.PI / 2; ring.position.y = 16; ring.castShadow = true;
  m.push(ring);
  g.add(kit.part(name, { mount: "floor", order: 1 }, ...m));
  return g;
}
