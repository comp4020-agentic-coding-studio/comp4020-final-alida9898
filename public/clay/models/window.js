// Framed wall window: pale glass, cross muntins, deep sill. Optional arched top.
// One part `<name>` (wall, order 1) — frame + glass + sill are one object.
// Origin: bottom-centre of the opening (top of the sill), flush with the wall face.
// Front faces +Z (the room side). `width` × `height` is the opening (incl. the arch).
// opts: `arch` (round top), `frame` / `sill` colours.
export function build(kit, { name = "window", width = 100, height = 120, arch = false, frame = "cream", sill = "brown" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const W = width, H = height, F = 7;
  const glass = kit.clay(0xcfe2e8, { roughness: 0.35, sheen: 0.1 });
  const m = [];
  const r = W / 2;
  const rectH = arch ? H - r : H; // straight-sided part

  // glass
  const pane = kit.roundedBox(W, rectH, 1.5, 0.5, glass); pane.position.set(0, rectH / 2, 1);
  m.push(pane);
  if (arch) {
    const disc = new THREE.Mesh(new THREE.CircleGeometry(r, 32, 0, Math.PI), glass);
    disc.position.set(0, rectH, 1.8); disc.receiveShadow = true;
    m.push(disc);
    // arched frame: a half torus
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r + F / 2, F / 2 + 0.5, 10, 32, Math.PI), kit.clay(frame));
    ring.position.set(0, rectH, 4); ring.castShadow = ring.receiveShadow = true;
    m.push(ring);
  } else {
    const head = kit.roundedBox(W + 2 * F, F, 7, 2.5, frame); head.position.set(0, H + F / 2, 3.5);
    m.push(head);
  }
  // side frames
  for (const s of [-1, 1]) {
    const j = kit.roundedBox(F, rectH, 7, 2.5, frame); j.position.set(s * (r + F / 2), rectH / 2, 3.5);
    m.push(j);
  }
  // muntins: one vertical, one horizontal
  const mv = kit.roundedBox(3.5, (arch ? H - 4 : H), 4, 1.2, frame); mv.position.set(0, (arch ? H - 4 : H) / 2, 2.5);
  const mh = kit.roundedBox(W, 3.5, 4, 1.2, frame); mh.position.set(0, rectH * 0.55, 2.5);
  m.push(mv, mh);
  // sill: chunky ledge, deep enough for a small pot
  const s = kit.roundedBox(W + 2 * F + 8, 5, 16, 2, sill); s.position.set(0, -2.5, 8);
  m.push(s);

  g.add(kit.part(name, { mount: "wall", order: 1 }, ...m));
  return g;
}
