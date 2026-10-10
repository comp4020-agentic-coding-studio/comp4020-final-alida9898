// Zone `seating` (level 0) — small round tables. Owner: the seating agent.
// Coords are storey-local (x, z world; y = 0 on this floor). Box + walkways: ../zones.js, ../README.md.
export async function populate({ kit, group, zone, place }) {
  void zone;
  // placeholder table from kit shapes — replace with a models/cafe-table.js model
  const t = new kit.THREE.Group(); t.name = "table-placeholder";
  const top = kit.roundedCylinder(35, 4, 1.5, "cream"); top.position.y = 72;
  const leg = kit.capsule(3.5, 72, "charcoal"); leg.position.y = 36;
  const foot = kit.roundedCylinder(22, 3, 1.2, "charcoal");
  t.add(top, leg, foot);
  group.add(place(t, { x: -60, y: 0, z: 340 }));
}
