// Desk globe: one part `<name>` — wooden foot, brass half-ring, blue sphere with clay
// continents. Origin: bottom-centre. Front +Z. ~24 Ø × 34 h.
export function build(kit, { name = "book-globe", seed = 2 } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const r = kit.rng(seed), m = [];
  m.push(kit.lathe([[0, 0], [9, 0], [8, 3], [2.5, 6], [2.5, 9], [0, 9]], "brown", { round: 1 }));
  const ball = new THREE.Group(); ball.position.y = 21;
  ball.add(kit.blob(11, 11, 11, "blue"));
  for (let i = 0; i < 6; i++) {
    const th = r() * Math.PI * 2, ph = 0.6 + r() * 1.9;
    const land = kit.blob(4 + r() * 3, 3, 1.6, "leaf");
    land.position.set(10.4 * Math.sin(ph) * Math.cos(th), 10.4 * Math.cos(ph), 10.4 * Math.sin(ph) * Math.sin(th));
    land.lookAt(0, 0, 0); ball.add(land);
  }
  ball.rotation.z = 0.4; m.push(ball);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(13, 0.9, 8, 32, Math.PI), kit.clay("mustard"));
  ring.position.y = 21; ring.rotation.z = Math.PI / 2 + 0.4; m.push(ring);
  g.add(kit.part(name, { mount: "surface", order: 1 }, ...m));
  return g;
}
