// Burr coffee grinder: one part `<name>` (bean hopper with beans + lid, body with
// dial, catch cup in its slot). Origin: bottom-centre. Front +Z. ~16 w × 34 h × 18 d cm.
// opts: `color` (body), `accent` (dial / cup).
export function build(kit, { name = "grinder", color = "terracotta", accent = "cream" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group();
  g.name = name;
  const body = kit.roundedBox(16, 20, 18, 3.5, color); body.position.y = 10;
  const slot = kit.roundedBox(12, 9, 2, 1, "charcoal"); slot.position.set(0, 6, 8.4);
  const cup = kit.roundedBox(9, 6.5, 6, 1.6, accent); cup.position.set(0, 4.8, 9);
  const dial = kit.roundedCylinder(3, 1.6, 0.6, accent); dial.rotation.x = Math.PI / 2; dial.position.set(0, 15, 8.6);
  const tick = kit.roundedBox(0.9, 2.4, 0.8, 0.4, "charcoal"); tick.position.set(0, 16, 10.4);
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xdfe9ef, roughness: 0.35, transparent: true, opacity: 0.45, depthWrite: false });
  const hopper = kit.lathe([[0, 0], [3, 0], [6.6, 9], [0, 9]], glass, { round: 1 }); hopper.position.y = 20; hopper.castShadow = false;
  const beans = kit.lathe([[0, 0], [2.6, 0], [5.4, 6.5], [0, 7.2]], "soil", { round: 1.2 }); beans.position.y = 20.4;
  const lid = kit.lathe([[0, 0], [7, 0], [5, 2.2], [0, 2.6]], color, { round: 0.9 }); lid.position.y = 29;
  const knob = kit.blob(1.6, 1.4, 1.6, accent); knob.position.y = 32.2;
  const p = kit.part(name, { mount: "surface", order: 1 }, body, slot, cup, dial, tick, beans, hopper, lid, knob);
  p.userData.zBias = 30; // stands on a sideboard/counter: drawn over it
  g.add(p);
  return g;
}
