// Wall-mounted chalkboard: dark slate in a chunky wooden frame with a chalk ledge.
// One part `<name>` (wall). Origin: bottom-centre of the frame, back flat on the wall.
// Front faces +Z. The slate face sits at z = FACE (exported) for decals.
export const FACE = 3;
export function build(kit, { name = "chalkboard", width = 84, height = 64, frame = "brown" } = {}) {
  const g = new kit.THREE.Group(); g.name = name;
  const F = 6;
  const slate = kit.roundedBox(width - 2 * F + 2, height - 2 * F + 2, 2, 0.4, 0x3d4a42);
  slate.position.set(0, height / 2, FACE - 1);
  const m = [slate];
  for (const s of [-1, 1]) {
    const v = kit.roundedBox(F, height, 5, 2, frame); v.position.set(s * (width / 2 - F / 2), height / 2, 2.5);
    const h = kit.roundedBox(width, F, 5, 2, frame); h.position.set(0, s < 0 ? F / 2 : height - F / 2, 2.5);
    m.push(v, h);
  }
  const ledge = kit.roundedBox(width - 10, 3, 7, 1.2, frame); ledge.position.set(0, F + 1, 4.5);
  const chalk = kit.capsule(1, 7, "white"); chalk.rotation.z = Math.PI / 2; chalk.position.set(width / 4, F + 3.6, 5);
  m.push(ledge, chalk);
  g.add(kit.part(name, { mount: "wall", order: 1 }, ...m));
  return g;
}
