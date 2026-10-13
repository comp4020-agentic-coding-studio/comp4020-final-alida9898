// Cake slice: a fat wedge of sponge with a cream filling layer, frosting on top and a
// berry. One part `<name>` (surface). Origin: bottom-centre. Point faces +Z (the viewer).
// opts: `sponge`, `frost`, `berry` colours (palette names or hex). ~12 × 9 cm, 8 cm tall.
export function build(kit, { name = "cake-slice", sponge = "mustard", frost = "cream", berry = "terracotta" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const R = 11, A = 0.85; // radius, wedge angle (rad)
  // a sector shape extruded upward; apex (the point) at z = 0 facing +Z, arc toward -Z
  const wedge = (h, y, c, r = R) => {
    const sh = new THREE.Shape(); sh.moveTo(0, 0);
    for (let k = 0; k <= 12; k++) { const a = -A / 2 + (A * k) / 12; sh.lineTo(Math.sin(a) * r, Math.cos(a) * r); }
    sh.lineTo(0, 0);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: h - 0.8, bevelEnabled: true, bevelThickness: 0.4, bevelSize: 0.5, bevelSegments: 3, curveSegments: 12 });
    geo.translate(0, 0, 0.4);
    const m = new THREE.Mesh(geo, kit.clay(c)); m.castShadow = true; m.receiveShadow = true;
    m.rotation.x = -Math.PI / 2; m.position.y = y; return m;
  };
  const parts = [wedge(3, 0, sponge), wedge(1.2, 3, frost), wedge(3, 4.2, sponge), wedge(1.6, 7.2, frost, R + 0.3)];
  const b = kit.blob(1.8, 1.6, 1.8, berry); b.position.set(0, 9.6, -R * 0.65);
  const inner = new THREE.Group(); inner.add(...parts, b);
  inner.position.z = R / 2; // centre the slice on the origin
  g.add(kit.part(name, { mount: "surface", order: 1 }, inner));
  return g;
}
