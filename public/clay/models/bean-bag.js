// Bag of coffee beans: one part `<name>` (plump paper pouch, folded top with a clip,
// round label). Origin: bottom-centre. Front +Z. ~12 w × 20 h × 8 d cm.
// opts: `color` (bag), `label`, `clip` colours.
export function build(kit, { name = "bean-bag", color = "brown", label = "cream", clip = "mustard" } = {}) {
  const g = new kit.THREE.Group(); g.name = name;
  const pouch = kit.roundedBox(12, 15, 8, 3.4, color); pouch.position.y = 7.5;
  const belly = kit.blob(6, 6, 4.4, color); belly.position.y = 6;
  const fold = kit.roundedBox(11, 4.5, 3, 1.2, color); fold.position.y = 16.8;
  const cl = kit.roundedBox(12.4, 1.8, 3.8, 0.8, clip); cl.position.y = 15.4;
  const lab = kit.roundedCylinder(3.2, 0.7, 0.3, label); lab.rotation.x = Math.PI / 2; lab.position.set(0, 8, 4.1);
  const bean = kit.blob(1.4, 1.9, 0.6, "soil"); bean.position.set(0, 8, 4.9);
  g.add(kit.part(name, { mount: "surface", order: 1 }, belly, pouch, fold, cl, lab, bean));
  return g;
}
