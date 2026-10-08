// A little stack of three lumpy sugar cubes: two side by side, one on top.
// One part `<name>` (surface). Origin: bottom-centre.
export function build(kit, { name = "sugar-cubes", seed = 11 } = {}) {
  const { THREE } = kit;
  const r = kit.rng(seed);
  const g = new THREE.Group(); g.name = name;
  const S = 3.6;
  const cube = (x, y, z) => {
    const c = kit.roundedBox(S * (0.94 + r() * 0.1), S * (0.94 + r() * 0.1), S * (0.94 + r() * 0.1), 0.9, "white");
    c.position.set(x, y + S / 2, z);
    c.rotation.set((r() - 0.5) * 0.12, (r() - 0.5) * 0.5, (r() - 0.5) * 0.14);
    return c;
  };
  g.add(kit.part(name, { mount: "surface", order: 1 }, cube(-S / 2 - 0.2, 0, 0), cube(S / 2 + 0.2, 0, 0.3), cube(0.2, S - 0.1, 0.1)));
  return g;
}
