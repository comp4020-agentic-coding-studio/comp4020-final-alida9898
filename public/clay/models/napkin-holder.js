// Napkin holder: two arched mustard side plates on a little base, a stack of white napkins
// standing between them. One part `<name>` (surface). Origin: bottom-centre. Front faces +Z
// (the napkins' faces). ~14 w × 11 h × 7 d cm.
export function build(kit, { name = "napkin-holder", color = "mustard" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const base = kit.roundedBox(14, 1.6, 7, 0.7, color); base.position.y = 0.8;
  const side = (z) => {
    const s = kit.roundedBox(14, 9, 1.2, 4, color); s.position.set(0, 5.4, z); return s;
  };
  const stack = kit.roundedBox(12.5, 9.5, 3.6, 1, "white"); stack.position.y = 6.2;
  const fold = kit.roundedBox(12, 1.2, 3.8, 0.5, "cream"); fold.position.y = 10.6;
  g.add(kit.part(name, { mount: "surface", order: 1 }, base, side(-2.8), side(2.8), stack, fold));
  return g;
}
