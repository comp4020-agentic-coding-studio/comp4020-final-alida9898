// Open book lying face-up: one part `<name>` (cover + two curved page blocks + ribbon).
// Origin: bottom-centre on the surface. Front +Z (spine runs along Z). ~30 w × 4 h × 21 d cm.
// opts: `cover`, `page` colours.
export function build(kit, { name = "open-book", cover = "terracotta", page = "white" } = {}) {
  const g = new kit.THREE.Group(); g.name = name;
  const c = kit.roundedBox(31, 1.4, 22, 0.6, cover); c.position.y = 0.7;
  const m = [c];
  for (const s of [-1, 1]) {
    const p = kit.roundedBox(14, 2.4, 20, 1.1, page); p.position.set(s * 7.4, 2.4, 0); p.rotation.z = s * 0.07; m.push(p);
  }
  const rib = kit.roundedBox(1.4, 0.6, 9, 0.3, "mustard"); rib.position.set(0.6, 3.1, 13); m.push(rib);
  g.add(kit.part(name, { mount: "flat", order: 1 }, ...m));
  return g;
}
