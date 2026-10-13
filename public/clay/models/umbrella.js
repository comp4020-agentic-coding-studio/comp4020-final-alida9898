// Closed umbrella: furled canopy (a long rounded cone with a strap), ferrule tip at the
// bottom, wooden J-hook handle on top. One part `<name>` (surface — it stands in a stand).
// Origin: the tip, at the bottom. Front faces +Z. ~80 cm tall. `lean` tilts it about Z (rad).
export function build(kit, { name = "umbrella", color = "terracotta", lean = 0.12, length = 80 } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const L = length, c0 = L * 0.12, c1 = L * 0.72;
  const tip = kit.capsule(0.9, c0 + 2, "charcoal"); tip.position.y = (c0 + 2) / 2;
  const canopy = kit.lathe([[0, 0], [1.6, 0], [4.6, (c1 - c0) * 0.75], [3.4, c1 - c0], [0, c1 - c0]], color, { round: 1.2 }); canopy.position.y = c0;
  const strap = kit.roundedBox(9, 2.4, 3, 1, "cream"); strap.position.set(1.5, c0 + (c1 - c0) * 0.55, 1.5); strap.rotation.z = -0.2;
  const shaft = kit.capsule(1, L - c1 - 4, "charcoal"); shaft.position.y = c1 + (L - c1 - 4) / 2;
  const hook = new THREE.Mesh(new THREE.TorusGeometry(3.6, 1.5, 10, 20, Math.PI * 1.15), kit.clay("brown"));
  hook.castShadow = true; hook.position.set(3.4, L - 3, 0); hook.rotation.z = -0.1;
  const grip = kit.capsule(1.6, 7, "brown"); grip.position.y = L - 6;
  const inner = new THREE.Group(); inner.add(tip, canopy, strap, shaft, hook, grip);
  inner.rotation.z = lean;
  g.add(kit.part(name, { mount: "surface", order: 1 }, inner));
  return g;
}
