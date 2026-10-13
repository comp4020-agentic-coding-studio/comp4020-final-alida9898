// Floor lamp: one part `<name>` (round base, pole, warm glowing drum shade) plus a
// soft, shadowless point light inside the shade (scenery, not a sticker).
// Origin: bottom-centre on the floor. Front +Z. ~40 Ø × 160 h cm.
// opts: `shade` colour, `metal` colour, `light` (false = no PointLight).
export function build(kit, { name = "floor-lamp", shade = 0xf6d9a0, metal = "charcoal", light = true } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const base = kit.roundedCylinder(15, 4, 1.6, metal);
  const pole = kit.capsule(1.8, 128, metal); pole.position.y = 66;
  const glow = new THREE.MeshStandardMaterial({ color: shade, emissive: 0xffc070, emissiveIntensity: 0.55, roughness: 0.8, side: THREE.DoubleSide });
  const drum = kit.lathe([[16, 0], [11, 26]], glow, { round: 0 }); drum.position.y = 126;
  const rimB = new THREE.Mesh(new THREE.TorusGeometry(16, 1.1, 8, 32), kit.clay("cream")); rimB.rotation.x = Math.PI / 2; rimB.position.y = 126;
  const rimT = new THREE.Mesh(new THREE.TorusGeometry(11, 1, 8, 32), kit.clay("cream")); rimT.rotation.x = Math.PI / 2; rimT.position.y = 152;
  const bulb = kit.blob(4.5, 5, 4.5, glow); bulb.position.y = 134; bulb.castShadow = false;
  g.add(kit.part(name, { mount: "floor", order: 1 }, base, pole, drum, rimB, rimT, bulb));
  if (light) { const l = new THREE.PointLight(0xffc27a, 1800, 260, 2); l.position.y = 136; l.castShadow = false; g.add(l); }
  return g;
}
