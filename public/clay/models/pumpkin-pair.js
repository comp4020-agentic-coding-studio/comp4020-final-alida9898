// A pair of pumpkins (one big, one small) set together with a curled stem and a couple
// of dry leaves at their base — a single autumn display, the kind a person sets down as
// one cluster by a doorway. One part `<name>` (floor). Origin: bottom-centre, between the
// two pumpkins. Front +Z. ~54 w × 34 h cm footprint (deliberately chunky so it reads from
// across the room). opts: `colors` [big, small].
export function build(kit, { name = "pumpkin-pair", colors = [0xd9822f, 0xe0a23a] } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const m = [];
  const r = kit.rng(9);

  const pumpkin = (R, H, x, color, seed) => {
    const grp = new THREE.Group(); grp.position.x = x;
    const rr = kit.rng(seed);
    // ribbed body: a squashed sphere with vertical grooves suggested by thin darker wedges
    const body = kit.blob(R, H, R, color); body.position.y = H; grp.add(body);
    const dark = new THREE.Color(color).multiplyScalar(0.82).getHex();
    const ribs = 8;
    for (let i = 0; i < ribs; i++) {
      const a = (i / ribs) * Math.PI * 2;
      const rib = kit.blob(R * 0.1, H * 0.94, R * 1.01, dark);
      rib.position.set(Math.sin(a) * R * 0.92, H, Math.cos(a) * R * 0.92);
      rib.rotation.y = a;
      grp.add(rib);
    }
    // base dimple
    const base = kit.blob(R * 0.5, H * 0.1, R * 0.5, dark); base.position.y = H * 0.08; grp.add(base);
    // cap + curled stem
    const cap = kit.roundedCylinder(R * 0.22, H * 0.22, H * 0.06, "soil"); cap.position.y = H * 1.88; grp.add(cap);
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, H * 2.0, 0),
      new THREE.Vector3(R * 0.12, H * 2.18, R * 0.04),
      new THREE.Vector3(R * 0.08, H * 2.3, -R * 0.1),
      new THREE.Vector3(-R * 0.08, H * 2.3, -R * 0.18),
    ]);
    const stem = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, R * 0.08, 8), kit.clay("soil"));
    stem.castShadow = true; grp.add(stem);
    void rr;
    return grp;
  };

  m.push(pumpkin(17, 15, -14, colors[0], 4));
  m.push(pumpkin(11.5, 10, 15, colors[1], 6));

  // a couple of dry fallen leaves tucked at the base
  const leafColors = [0xb5532e, 0xc8694a, 0xd9822f];
  for (let i = 0; i < 4; i++) {
    const a = r() * Math.PI * 2, rad = 18 + r() * 10;
    const s = 4 + r() * 2;
    const leaf = kit.blob(s, 0.6, s * 0.7, leafColors[i % leafColors.length]);
    leaf.position.set(Math.sin(a) * rad, 0.6, Math.cos(a) * rad);
    leaf.rotation.y = r() * Math.PI;
    m.push(leaf);
  }

  g.add(kit.part(name, { mount: "floor", order: 1 }, ...m));
  return g;
}
