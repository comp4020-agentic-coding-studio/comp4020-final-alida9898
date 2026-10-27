// Knitted scarf draped over a round stand's rim: a loosely coiled pile sitting on the
// rim with ribbed stripe bands, and two long tails hanging down the outside with
// frayed tassel ends. One part `<name>` (surface — rests on top of whatever it drapes
// over). Origin: bottom-centre of the pile, at the rim's height. `angle` picks which
// way (deg, 0 = +Z) the two tails hang, away from anything already in the stand.
// opts: `color`, `stripe`, `stripe2`, `radius` (rim radius it drapes over), `drop` (tail length).
export function build(kit, { name = "knitted-scarf", color = "terracotta", stripe = "cream", stripe2 = "blue", radius = 9.5, drop = 34, angle = 0 } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const m = [];
  const R = radius;

  // the loosely coiled pile resting ON the rim's lip (near its own full radius, not
  // down inside the opening — the stand's inner cavity is much narrower than its lip)
  for (const [i, yy, tilt, c] of [[0, 1.4, 0.08, color], [1, 3.1, -0.1, stripe2]]) {
    const torus = new THREE.Mesh(new THREE.TorusGeometry(R * 0.98 - i * 0.9, 2.3, 10, 28), kit.clay(c));
    torus.rotation.x = Math.PI / 2 + tilt;
    torus.position.y = yy;
    torus.castShadow = true; torus.receiveShadow = true;
    m.push(torus);
  }
  const lump = kit.blob(R * 0.7, 2.8, R * 0.65, color); lump.position.y = 4.6; m.push(lump);
  // ribbed stripe bands over the pile for a knit texture
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const band = kit.roundedBox(3.6, 1.8, 3.6, 0.7, i % 2 ? stripe : stripe2);
    band.position.set(Math.cos(a) * R * 0.96, 1.6 + (i % 2) * 1.3, Math.sin(a) * R * 0.96);
    band.rotation.y = a;
    m.push(band);
  }

  // two tails: folded over the rim, hanging down the outside, ends fraying into tassels
  const rad = (angle * Math.PI) / 180;
  const W = 6.4, T = 1.6;
  for (const s of [-1, 1]) {
    const a = rad + s * 0.24; // the two tails fall a little apart from each other
    const dir = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
    const out = R + T * 0.6;
    const tail = new THREE.Group();
    tail.position.set(dir.x * out, 1, dir.z * out);
    tail.rotation.y = a;
    const seg = kit.roundedBox(W, drop, T, T / 2, color);
    seg.position.y = -drop / 2 + 1;
    tail.add(seg);
    for (let k = 0; k < 2; k++) {
      const stripeBand = kit.roundedBox(W + 0.4, 2.6, T + 0.3, 0.8, k ? stripe2 : stripe);
      stripeBand.position.y = -drop * (0.35 + k * 0.35) + 1;
      tail.add(stripeBand);
    }
    // frayed tassel ends
    for (let k = 0; k < 4; k++) {
      const t = kit.capsule(0.45, 7, color);
      t.position.set(-W / 2 + 1 + k * (W - 2) / 3, -drop - 2, 0);
      tail.add(t);
    }
    m.push(tail);
  }

  g.add(kit.part(name, { mount: "surface", order: 1 }, ...m));
  return g;
}
