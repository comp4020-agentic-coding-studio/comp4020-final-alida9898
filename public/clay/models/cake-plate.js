// Cake plate: small cream plate with a wedge of layered cake and a cherry on top.
// One part `<name>` (surface). Origin: bottom-centre of the plate.
export function build(kit, { name = "cake-plate", sponge = "mustard", icing = "white", berry = "terracotta" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const plate = kit.lathe([[0, 0], [6, 0], [9, 1.4], [8.8, 2], [0, 1.4]], "cream", { round: 0.5 });
  // wedge: a 60° cylinder sector, three layers
  const slice = new THREE.Group();
  const layer = (y, h, c, r = 7.5) => {
    const geo = new THREE.CylinderGeometry(r, r, h, 16, 1, false, -Math.PI / 6, Math.PI / 3);
    const mesh = new THREE.Mesh(geo, kit.clay(c)); mesh.position.y = y + h / 2; mesh.castShadow = true;
    slice.add(mesh);
  };
  layer(0, 2.6, sponge); layer(2.6, 1, icing); layer(3.6, 2.6, sponge); layer(6.2, 1.2, icing, 7.7);
  const cherry = kit.blob(1.4, 1.4, 1.4, berry); cherry.position.set(0, 8.4, 5);
  slice.add(cherry);
  slice.position.set(0, 1.4, -3.5); // tip near the back, round crust toward the viewer
  const fork = kit.roundedBox(1.2, 0.6, 8, 0.3, "charcoal"); fork.position.set(6, 1.8, 1); fork.rotation.y = 0.3;
  g.add(kit.part(name, { mount: "surface", order: 1 }, plate, slice, fork));
  return g;
}
