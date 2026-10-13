// Chunky ceramic mug with a loop handle (empty — it lives on a shelf). One part `<name>`
// (surface). Origin: bottom-centre. Front faces +Z; the handle points to +X.
// opts: `color` (body), `band` (stripe colour or null). ~9 cm across, 10 cm tall.
export function build(kit, { name = "mug", color = "blue", band = "cream" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const body = kit.lathe([[0, 0], [4.2, 0], [4.6, 1], [4.6, 10], [3.6, 10], [3.6, 1.6], [0, 1.6]], color, { round: 0.8 });
  const m = [body];
  if (band) { const b = kit.lathe([[4.5, 0], [4.85, 0], [4.85, 1.6], [4.5, 1.6]], band, { round: 0.4 }); b.position.y = 6.6; m.push(b); }
  const handle = new THREE.Mesh(new THREE.TorusGeometry(2.7, 1, 10, 20), kit.clay(color));
  handle.castShadow = true; handle.position.set(5.6, 5.2, 0); handle.scale.set(0.9, 1.1, 1);
  m.push(handle);
  g.add(kit.part(name, { mount: "surface", order: 1 }, ...m));
  return g;
}
