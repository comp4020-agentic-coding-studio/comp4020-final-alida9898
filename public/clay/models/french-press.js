// French press: one part `<name>` (glass carafe with coffee inside, metal frame
// base + band, lid, plunger knob, side handle). Origin: bottom-centre. Front +Z.
// ~14 w (+ handle) × 26 h cm. opts: `color` (frame/lid), `coffee` colour.
export function build(kit, { name = "french-press", color = "charcoal", coffee = "soil" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group();
  g.name = name;
  // glass: pale, low-opacity clay so the coffee shows through but the outline still reads
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xdfe9ef, roughness: 0.35, transparent: true, opacity: 0.4, depthWrite: false });
  const carafe = kit.lathe([[0, 0], [6.2, 0], [6.2, 19], [0, 19]], glass, { round: 1 }); carafe.position.y = 1.5;
  carafe.castShadow = false;
  const brew = kit.lathe([[0, 0], [5.6, 0], [5.6, 12], [0, 12]], coffee, { round: 0.8 }); brew.position.y = 2;
  const foot = kit.roundedCylinder(7, 2, 0.8, color);
  const band = kit.roundedCylinder(6.6, 1.6, 0.6, color); band.position.y = 10;
  const lid = kit.lathe([[0, 0], [6.8, 0], [6.4, 2.4], [0, 2.8]], color, { round: 0.8 }); lid.position.y = 20.4;
  const rod = kit.capsule(0.7, 4, color); rod.position.y = 24.5;
  const knob = kit.blob(1.9, 1.7, 1.9, "mustard"); knob.position.y = 27;
  const grip = kit.roundedBox(2.6, 14, 3, 1.2, color); grip.position.set(10, 11.5, 0);
  const armT = kit.roundedBox(4.4, 2.2, 2.6, 1, color); armT.position.set(7.8, 18, 0);
  const armB = kit.roundedBox(4.4, 2.2, 2.6, 1, color); armB.position.set(7.8, 5, 0);
  const p = kit.part(name, { mount: "surface", order: 1 }, brew, carafe, foot, band, lid, rod, knob, grip, armT, armB);
  p.userData.zBias = 30; // stands on a sideboard/counter: drawn over it
  g.add(p);
  return g;
}
