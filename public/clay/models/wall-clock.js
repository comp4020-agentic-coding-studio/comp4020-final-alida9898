// Round wall clock: brown rim, cream face, four mustard hour dots, charcoal hands.
// One part `<name>` (wall). Origin: bottom-centre of the rim, back flush with the wall (z = 0).
// Front faces +Z. Diameter 2 × `radius` (default 32 cm).
export function build(kit, { name = "wall-clock", radius = 16, rim = "brown" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const R = radius, cy = R;
  const disc = (r, h, e, c, z) => { const m = kit.roundedCylinder(r, h, e, c); m.rotation.x = Math.PI / 2; m.position.set(0, cy, z); return m; };
  // after rotation.x = π/2 the cylinder runs from z to z + h (axis → +Z)
  const body = disc(R, 4, 1.4, rim, 0);
  const face = disc(R - 3, 1, 0.4, "cream", 4);
  const dots = [0, 1, 2, 3].map((k) => { const a = (k * Math.PI) / 2; const d = kit.blob(1.4, 1.4, 0.8, "mustard"); d.position.set(Math.sin(a) * (R - 6), cy + Math.cos(a) * (R - 6), 5.4); return d; });
  const hand = (len, w, ang) => { const h = kit.roundedBox(w, len, 0.8, w / 2.2, "charcoal"); h.geometry.translate(0, len / 2 - 1, 0); h.position.set(0, cy, 5.8); h.rotation.z = ang; return h; };
  const hub = kit.blob(1.4, 1.4, 1, "terracotta"); hub.position.set(0, cy, 6.3);
  g.add(kit.part(name, { mount: "wall", order: 1 }, body, face, ...dots, hand(R * 0.5, 2.2, 1.0), hand(R * 0.72, 1.6, -0.5), hub));
  return g;
}
