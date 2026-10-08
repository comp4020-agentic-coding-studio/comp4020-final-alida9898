// Vintage two-group espresso machine: cream body, mustard/copper accents.
// Parts: body, gauge, left/right group heads, left/right portafilters, cup on top.
// Origin: bottom-centre on the counter. Front faces +Z. ~60 w × 45 h × 45 d cm.
export function build(kit, { name = "coffee-machine" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group();
  g.name = name;
  const W = 60, H = 40, D = 44, F = D / 2; // F = front face z

  // body: cream block, mustard plinth, charcoal drip tray, mustard top rail
  const shell = kit.roundedBox(W, H - 4, D, 6, "cream"); shell.position.y = 4 + (H - 4) / 2;
  const plinth = kit.roundedBox(W + 2, 5, D + 2, 2.4, "mustard"); plinth.position.y = 2.5;
  const tray = kit.roundedBox(W - 12, 3, 12, 1.4, "charcoal"); tray.position.set(0, 6, F - 4);
  const rail = kit.roundedBox(W - 8, 2.4, D - 8, 1.2, "mustard"); rail.position.y = H + 0.8;
  const body = kit.part(`${name}-body`, { mount: "surface", order: 1 }, shell, plinth, tray, rail);

  // pressure gauge: round dial on the front, upper middle
  const ring = kit.roundedCylinder(6, 2.5, 1, "mustard");
  const face = kit.roundedCylinder(4.6, 1.2, 0.5, "white"); face.position.y = 2.2;
  const needle = kit.roundedBox(0.9, 3.6, 0.8, 0.4, "terracotta"); needle.position.set(0.8, 3.3, 1); needle.rotation.z = -0.6;
  const dial = new THREE.Group(); dial.add(ring, face, needle);
  dial.rotation.x = Math.PI / 2; dial.rotation.y = 0; // cylinder axis → +Z
  // after rotation.x = π/2, local +Y points to +Z: dial faces forward
  dial.position.set(0, 31, F - 0.5);
  const gauge = kit.part(`${name}-gauge`, { mount: "surface", order: 2 }, dial);

  // group heads: mustard domes hanging under the front lip
  const groupHead = (side, x) => {
    const collar = kit.roundedBox(14, 5, 6, 2, "mustard"); collar.position.set(0, 3, -2);
    const dome = kit.lathe([[0, 0], [5.5, 0], [6.2, 5], [0, 5.5]], "mustard", { round: 1.2 });
    dome.rotation.x = Math.PI; dome.position.y = 5.5; // flare up, round bottom
    const head = new THREE.Group(); head.add(collar, dome);
    head.position.set(x, 18, F + 3);
    return kit.part(`${name}-group-${side}`, { mount: "surface", order: side === "left" ? 3 : 4 }, head);
  };

  // portafilters: charcoal basket under the head + brown handle pointing out-forward
  const portafilter = (side, x) => {
    const basket = kit.roundedCylinder(5.4, 3.4, 1.2, "charcoal");
    const neck = kit.capsule(1.3, 6, "charcoal"); neck.rotation.x = Math.PI / 2; neck.position.set(0, 1.7, 6);
    const handle = kit.capsule(2.2, 13, "brown"); handle.rotation.x = Math.PI / 2; handle.position.set(0, 1.7, 14.5);
    const pf = new THREE.Group(); pf.add(basket, neck, handle);
    pf.rotation.y = (x < 0 ? -1 : 1) * 0.35; // handles splay outwards a little
    pf.position.set(x, 13.6, F + 3);
    return kit.part(`${name}-portafilter-${side}`, { mount: "surface", order: side === "left" ? 5 : 6 }, pf);
  };

  // cup warming on top
  const cupBody = kit.lathe([[0, 0], [3.4, 0], [4.6, 6.5], [4.0, 6.5], [0, 6.5]], "blue", { round: 0.8 });
  const saucer = kit.roundedCylinder(6, 1.2, 0.5, "white"); saucer.position.y = -1.2;
  const handle = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.7, 10, 20), kit.clay("blue"));
  handle.castShadow = true; handle.position.set(4.6, 3.5, 0);
  const cupG = new THREE.Group(); cupG.add(saucer, cupBody, handle);
  cupG.position.set(-14, H + 2 + 1.2, 2);
  const cup = kit.part(`${name}-cup`, { mount: "surface", order: 7 }, cupG);

  g.add(body, gauge, groupHead("left", -15), groupHead("right", 15),
    portafilter("left", -15), portafilter("right", 15), cup);
  return g;
}
