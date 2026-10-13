// Umbrella stand: a chunky open clay tube with a rolled rim and a mustard band.
// One part `<name>` (floor). Origin: bottom-centre on the floor. Front faces +Z.
// ~19 cm across, 45 cm tall; inner floor at y = INNER_Y.
export const INNER_Y = 3;
export function build(kit, { name = "umbrella-stand", color = "blue", radius = 9.5, height = 45 } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const R = radius, H = height;
  const tube = kit.lathe([[0, 0], [R - 1, 0], [R, 2], [R - 0.6, H - 3], [R + 0.4, H], [R - 2.2, H], [R - 2.6, INNER_Y], [0, INNER_Y]], color, { round: 1 });
  const band = kit.lathe([[R - 0.4, 0], [R + 0.5, 0], [R + 0.5, 4], [R - 0.4, 4]], "mustard", { round: 0.6 }); band.position.y = H * 0.55;
  g.add(kit.part(name, { mount: "floor", order: 1 }, tube, band));
  return g;
}
