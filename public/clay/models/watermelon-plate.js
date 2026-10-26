// Watermelon slice on a plate: a cream plate holding a wedge of watermelon — dark green
// skin, a thin pale rind ring, red flesh dotted with seeds. One part `<name>` (surface).
// Origin: bottom-centre of the plate. ~18 Ø × 5 h cm.
export function build(kit, { name = "watermelon-plate" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const plate = kit.lathe([[0, 0], [7, 0], [9.4, 1.4], [9.2, 1.9], [0, 1.4]], "cream", { round: 0.5 });
  const A = 1.15; // wedge angle (rad)
  const wedge = (r, h, y, color) => {
    const sh = new THREE.Shape(); sh.moveTo(0, 0);
    for (let k = 0; k <= 10; k++) { const a = -A / 2 + (A * k) / 10; sh.lineTo(Math.sin(a) * r, Math.cos(a) * r); }
    sh.lineTo(0, 0);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.3, bevelSegments: 2, curveSegments: 10 });
    const mesh = new THREE.Mesh(geo, kit.clay(color)); mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.rotation.x = -Math.PI / 2; mesh.position.y = y; return mesh;
  };
  const rind = wedge(7.4, 1.4, 1.5, 0x3f7a3a);
  const white = wedge(6.8, 1.0, 1.9, 0xeef1d8);
  const flesh = wedge(6.0, 1.6, 2.3, 0xdb4f4a);
  const r2 = kit.rng(11), seeds = [];
  for (let i = 0; i < 7; i++) {
    const a = -A / 2 + A * (0.15 + 0.7 * r2()), rr = 2 + r2() * 3.3;
    const sd = kit.blob(0.45, 0.3, 0.6, "charcoal");
    sd.position.set(Math.sin(a) * rr, 3.95, Math.cos(a) * rr); sd.rotation.y = r2() * Math.PI;
    seeds.push(sd);
  }
  const inner = new THREE.Group(); inner.add(rind, white, flesh, ...seeds);
  inner.position.z = 3; // sit on the plate, point toward the back
  g.add(kit.part(name, { mount: "surface", order: 1 }, plate, inner));
  return g;
}
