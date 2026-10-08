// Small countertop drum roaster: one part `<name>` (housing with drum window,
// funnel hopper on top, chaff spout, round cooling tray with beans at the front-
// left, crank). Origin: bottom-centre. Front +Z. ~36 w × 34 h × 26 d cm.
// opts: `color` (housing), `accent` (hopper / tray), `beans` colour.
export function build(kit, { name = "roaster", color = "mustard", accent = "charcoal", beans = "soil" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group();
  g.name = name;
  const housing = kit.roundedBox(22, 20, 22, 4, color); housing.position.set(4, 12, -2);
  const legs = [-1, 1].map((s) => { const l = kit.roundedBox(20, 2, 20, 0.9, accent); l.position.set(4, 1, -2); return l; })[0];
  // drum seen end-on through the front: round window
  const rim = kit.roundedCylinder(7, 1.6, 0.6, accent); rim.rotation.x = Math.PI / 2; rim.position.set(4, 12, 8.6);
  const drum = kit.roundedCylinder(5.6, 1.2, 0.5, "brown"); drum.rotation.x = Math.PI / 2; drum.position.set(4, 12, 9.4);
  const fin = kit.roundedBox(9, 1.2, 0.8, 0.4, beans); fin.position.set(4, 12, 10.6); fin.rotation.z = 0.5;
  // funnel hopper
  const neck = kit.roundedCylinder(2.4, 3, 0.6, accent); neck.position.set(4, 22, -2);
  const funnel = kit.lathe([[0, 0], [2.4, 0], [7, 8], [6.2, 8], [0, 1.2]], accent, { round: 0.8 }); funnel.position.set(4, 24.6, -2);
  // crank on the right side
  const axle = kit.capsule(1, 5, accent); axle.rotation.z = Math.PI / 2; axle.position.set(16.5, 12, -2);
  const crankArm = kit.roundedBox(1.8, 8, 1.8, 0.8, accent); crankArm.position.set(19, 15, -2);
  const crankKnob = kit.capsule(1.4, 4, "brown"); crankKnob.position.set(19, 19.5, -2);
  // cooling tray on the left, lower and to the front
  const trayStand = kit.roundedCylinder(2.4, 6, 0.8, accent); trayStand.position.set(-11, 0, 3);
  const tray = kit.lathe([[0, 0], [8, 0], [9, 3], [8.2, 3], [7.4, 1], [0, 1]], accent, { round: 0.6 }); tray.position.set(-11, 6, 3);
  const pile = kit.blob(7, 1.6, 7, beans); pile.position.set(-11, 7.4, 3);
  const chute = kit.roundedBox(8, 2, 4, 1, accent); chute.position.set(-5, 9, 4); chute.rotation.z = 0.5;
  const p = kit.part(name, { mount: "surface", order: 1 }, housing, legs, rim, drum, fin, neck, funnel, axle, crankArm, crankKnob, trayStand, tray, pile, chute);
  p.userData.zBias = 30; // stands on a sideboard/counter: drawn over it
  g.add(p);
  return g;
}
