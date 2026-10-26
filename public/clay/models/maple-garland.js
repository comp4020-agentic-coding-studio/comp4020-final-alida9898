// Maple-leaf garland: a string hung along a shelf edge with chunky maple leaves in
// alternating autumn colours clipped to it, two of them drooping down over the front edge.
// One part `<name>` (surface — rests along the surface it's set on, front +Z overhangs the
// edge). Origin: left end of the string, at the surface. opts: `width` (span), `colors`.
export function build(kit, { name = "maple-garland", width = 120, colors = [0xc8694a, 0xd9822f, 0xe0a23a, 0xb5532e] } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const m = [];
  const r = kit.rng(21);
  const W = width;

  // the string: a shallow catenary sag between two tied-off ends
  const sag = 3.5;
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.5, 0),
    new THREE.Vector3(W * 0.25, 0.5 - sag * 0.8, 0),
    new THREE.Vector3(W * 0.5, 0.5 - sag, 0),
    new THREE.Vector3(W * 0.75, 0.5 - sag * 0.8, 0),
    new THREE.Vector3(W, 0.5, 0),
  ]);
  const string = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 0.35, 6), kit.clay("brown"));
  string.castShadow = true; m.push(string);

  const leaf = (color, s, droop) => {
    const grp = new THREE.Group();
    // three-lobed maple leaf: a flattened blob body + two side lobes (no separate vein —
    // kept low-poly since many of these are tiled along the string)
    const body = kit.blob(s, s * 0.22, s * 0.95, color); grp.add(body);
    for (const sx of [-1, 1]) {
      const lobe = kit.blob(s * 0.55, s * 0.2, s * 0.6, color);
      lobe.position.set(sx * s * 0.68, 0, -s * 0.15);
      lobe.rotation.y = sx * 0.5;
      grp.add(lobe);
    }
    const stem = kit.capsule(s * 0.09, s * 0.7, "soil");
    stem.rotation.x = Math.PI / 2 + droop; stem.position.set(0, s * 0.1, s * 1.0); grp.add(stem);
    grp.rotation.x = -droop * 1.4;
    return grp;
  };

  const n = Math.max(4, Math.round(W / 22));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = curve.getPoint(t);
    const s = 5 + r() * 1.6;
    const hanging = i % 3 === 1; // every third leaf droops down over the edge
    const L = leaf(colors[i % colors.length], s, hanging ? 1.1 : 0.15 + r() * 0.3);
    L.position.set(p.x, p.y - (hanging ? s * 0.6 : 0.2), hanging ? s * 0.3 : 0);
    L.rotation.y = (r() - 0.5) * 0.8;
    m.push(L);
  }

  g.add(kit.part(name, { mount: "surface", order: 1 }, ...m));
  return g;
}
