// Pour-over set: one part `<name>` — the dripper cone sitting on its glass carafe
// (carried together as one thing; the dripper isn't kept anywhere else in the
// scene, so splitting it would only be a finer slice of the same object).
// Origin: bottom-centre. Front +Z. ~15 w × 26 h cm. opts: `color` (dripper), `coffee`.
export function build(kit, { name = "pour-over", color = "white", coffee = "soil" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group();
  g.name = name;
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xdfe9ef, roughness: 0.35, transparent: true, opacity: 0.4, depthWrite: false });
  // carafe: hourglass-ish, wooden collar at the waist
  const carafe = kit.lathe([[0, 0], [6.8, 0], [7, 5], [4, 11], [4.4, 14], [0, 14]], glass, { round: 1.5 }); carafe.castShadow = false;
  const brew = kit.lathe([[0, 0], [6.2, 0], [6.4, 4.5], [0, 5]], coffee, { round: 1 }); brew.position.y = 0.5;
  const collar = kit.lathe([[0, 0], [4.8, 0], [5.4, 1.8], [4.8, 3.6], [0, 3.6]], "brown", { round: 0.8 }); collar.position.y = 8.5;
  const tie = kit.roundedBox(2, 2, 1.6, 0.6, "brown"); tie.position.set(0, 10.3, 5.2);
  // dripper: cone with a flat flange, little side handle
  const flange = kit.roundedCylinder(5.2, 1.4, 0.5, color); flange.position.y = 14;
  const cone = kit.lathe([[0, 0], [3, 0], [7.6, 8.5], [6.8, 8.5], [0, 2]], color, { round: 0.9 }); cone.position.y = 15.2;
  const grip = kit.roundedBox(3.4, 4.6, 2.2, 1, color); grip.position.set(8.2, 19, 0);
  const p = kit.part(name, { mount: "surface", order: 1 }, brew, carafe, collar, tie, flange, cone, grip);
  p.userData.zBias = 30; // stands on a sideboard/counter: drawn over it
  g.add(p);
  return g;
}
