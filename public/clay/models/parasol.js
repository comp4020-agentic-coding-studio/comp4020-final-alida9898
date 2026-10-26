// Garden parasol: a tall pole planted in the grass holding a wide striped dome canopy open
// over the bench. One part `<name>` (floor). Origin: bottom-centre of the pole on the
// ground. ~170 Ø canopy, ~210 cm tall. opts: `colors` (two alternating canopy stripes).
export function build(kit, { name = "parasol", colors = ["terracotta", "cream"], height = 210, radius = 80 } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const m = [];
  const poleH = height - 20;
  const pole = kit.capsule(2.2, poleH, "brown"); pole.position.y = poleH / 2; m.push(pole);
  const canopyY = poleH;
  const N = 10;
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * Math.PI * 2, len = (Math.PI * 2) / N;
    const geo = new THREE.SphereGeometry(radius, 6, 6, a0, len, 0, Math.PI * 0.4);
    const seg = new THREE.Mesh(geo, kit.clay(colors[i % colors.length])); seg.castShadow = true; seg.receiveShadow = true;
    seg.position.y = canopyY; m.push(seg);
  }
  const hub = kit.roundedCylinder(3, 2.4, 0.8, "brown"); hub.position.y = canopyY - 1; m.push(hub);
  const finial = kit.blob(2.2, 3.6, 2.2, "mustard"); finial.position.y = canopyY + radius * 0.02 + 4; m.push(finial);
  g.add(kit.part(name, { mount: "floor", order: 1 }, ...m));
  return g;
}
