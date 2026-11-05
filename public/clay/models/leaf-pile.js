// Pile of raked fallen leaves on the ground: a loose, uneven little heap built from many
// separate leaves (maple-shaped and oval) in mixed autumn colours — orange, red, yellow,
// green, brown — a few sticking up at an angle and a few blown loose around the edge.
// All the leaves are baked into ONE merged mesh with vertex colours (two shared leaf
// outlines, ~240 leaves), so it stays cheap. A dark low-poly core sits underneath so
// gaps between leaves read as shadow, not as grass showing through.
// One part `<name>` (floor). Origin: bottom-centre of the pile.
// ~2·radius Ø (plus strays) × ~0.55·radius h — default radius 26 → ~52 Ø × 15 h cm.
export function build(kit, {
  name = "leaf-pile", radius = 26,
  colors = [0xd9772a, 0xc4452e, 0xe6b23a, 0x8a9a3c, 0x8a5a32, 0xe08a2e, 0xa8372a],
} = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const r = kit.rng(29);
  const R = radius, H = R * 0.55;

  // ---- two leaf outlines (flat, lying in XY, tip toward +Y, stem at origin) ----
  const maple = new THREE.Shape();
  {
    // five pointed lobes; alternate outer tips and inner notches around the stem
    const lobes = [-1.35, -0.7, 0, 0.7, 1.35]; // angles from +Y
    const lens = [0.62, 0.9, 1.0, 0.9, 0.62];
    maple.moveTo(0, -0.12);
    const pts = [];
    for (let i = 0; i < lobes.length; i++) {
      const a = lobes[i], L = lens[i];
      if (i === 0) pts.push([Math.sin(a - 0.45) * 0.25, Math.cos(a - 0.45) * 0.25]);
      pts.push([Math.sin(a - 0.12) * L * 0.72, Math.cos(a - 0.12) * L * 0.72]);
      pts.push([Math.sin(a) * L, Math.cos(a) * L]);
      pts.push([Math.sin(a + 0.12) * L * 0.72, Math.cos(a + 0.12) * L * 0.72]);
      const na = i < lobes.length - 1 ? (a + lobes[i + 1]) / 2 : a + 0.45;
      pts.push([Math.sin(na) * (i < lobes.length - 1 ? 0.36 : 0.25), Math.cos(na) * (i < lobes.length - 1 ? 0.36 : 0.25)]);
    }
    for (const [x, y] of pts) maple.lineTo(x, y + 0.1);
    maple.lineTo(0, -0.12);
  }
  const oval = new THREE.Shape();
  {
    // pointed-oval leaf: two arcs meeting at stem and tip
    oval.moveTo(0, 0);
    oval.quadraticCurveTo(0.5, 0.35, 0, 1.1);
    oval.quadraticCurveTo(-0.5, 0.35, 0, 0);
  }
  const leafGeos = [new THREE.ShapeGeometry(maple, 2), new THREE.ShapeGeometry(oval, 5)]
    .map((sg) => { const ni = sg.toNonIndexed(); sg.dispose(); return ni; });
  // a gentle cup: bend each leaf so it is not a dead-flat card
  for (const lg of leafGeos) {
    const p = lg.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, 0.12 * p.getX(i) * p.getX(i) - 0.06 * p.getY(i));
    lg.computeVertexNormals();
  }

  // ---- collect leaves into one merged buffer ----
  const pos = [], nor = [], col = [];
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const v = new THREE.Vector3(), n3 = new THREE.Matrix3(), c = new THREE.Color();
  const Y = new THREE.Vector3(0, 1, 0), qa = new THREE.Quaternion(), qs = new THREE.Quaternion();
  // `up` = the surface normal the leaf rests on; tiltX/tiltZ jitter it off that surface
  function addLeaf(kind, size, x, y, z, tiltX, tiltZ, spin, colIdx, up = Y) {
    const geo = leafGeos[kind];
    e.set(-Math.PI / 2 + tiltX, 0, tiltZ, "XYZ");
    q.setFromEuler(e);                       // lie flat (+ jitter)
    qs.setFromAxisAngle(Y, spin);            // spin around the vertical
    qa.setFromUnitVectors(Y, up);            // then follow the slope
    q.premultiply(qs).premultiply(qa);
    mtx.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(size, size, size));
    n3.getNormalMatrix(mtx);
    c.setHex(colors[colIdx % colors.length]);
    c.offsetHSL((r() - 0.5) * 0.02, (r() - 0.5) * 0.08, (r() - 0.5) * 0.08);
    const P = geo.attributes.position, N = geo.attributes.normal;
    for (let i = 0; i < P.count; i++) {
      v.fromBufferAttribute(P, i).applyMatrix4(mtx); pos.push(v.x, v.y, v.z);
      v.fromBufferAttribute(N, i).applyMatrix3(n3).normalize(); nor.push(v.x, v.y, v.z);
      col.push(c.r, c.g, c.b);
    }
  }
  // height of the (lumpy) heap surface at a given radius/angle
  const lumps = [
    { a: 0.4, k: 0.18 }, { a: 2.3, k: -0.14 }, { a: 4.1, k: 0.12 },
  ];
  const surf = (rad, a) => {
    let h = H * Math.max(0, 1 - (rad / R) ** 2);
    for (const l of lumps) h *= 1 + l.k * Math.cos(a - l.a) * (rad / R);
    return h;
  };
  // edge radius wobbles so the outline is ragged, not a circle
  const edge = (a) => R * (1 + 0.12 * Math.sin(a * 3 + 1) + 0.08 * Math.sin(a * 5 + 2));

  // layered from the bottom up so the top layers cover the gaps underneath
  const N = 260;
  for (let i = 0; i < N; i++) {
    const a = r() * Math.PI * 2;
    const u = Math.sqrt(r()); // even over the disc
    const rad = u * edge(a);
    const y = surf(Math.min(rad, R * 0.98), a) * (0.85 + 0.15 * (i / N)) + 0.6 + r() * 1.2;
    // surface normal from the height-field slope, so leaves on the flanks face outward
    const rr = Math.min(rad, R * 0.98), dr = 0.5;
    const dh = (surf(Math.min(rr + dr, R), a) - surf(Math.max(rr - dr, 0), a)) / (2 * dr);
    const s = Math.max(-1.1, Math.min(1.1, dh));
    const up = new THREE.Vector3(-s * Math.sin(a), 1, -s * Math.cos(a)).normalize();
    const steep = r() < 0.08 ? 0.9 + r() * 0.4 : 0; // a few stuck in at an angle
    const size = 4.6 + r() * 3.4;
    addLeaf(r() < 0.55 ? 0 : 1, size, Math.sin(a) * rad, y, Math.cos(a) * rad,
      (r() - 0.5) * 0.6 + steep, (r() - 0.5) * 0.6, r() * Math.PI * 2,
      Math.floor(r() * colors.length), up);
  }
  // a few loose leaves blown out on the grass around the heap
  for (let i = 0; i < 9; i++) {
    const a = r() * Math.PI * 2, rad = edge(a) * (1.08 + r() * 0.35);
    addLeaf(i % 2, 4 + r() * 2.5, Math.sin(a) * rad, 0.35 + r() * 0.3, Math.cos(a) * rad,
      (r() - 0.5) * 0.25, (r() - 0.5) * 0.25, r() * Math.PI * 2, i * 3 + 1);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  geo.computeBoundingBox(); geo.computeBoundingSphere();
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, vertexColors: true, roughness: 0.8, metalness: 0,
    sheen: 0.25, sheenRoughness: 0.8, sheenColor: 0xffffff, side: THREE.DoubleSide,
  });
  mat.shadowSide = THREE.BackSide; // thin cards: avoid self-shadow stripes
  const leaves = new THREE.Mesh(geo, mat);
  leaves.castShadow = true; leaves.receiveShadow = true;
  for (const lg of leafGeos) lg.dispose();

  // dark, low-poly core under the leaves
  const core = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 5, 0, Math.PI * 2, 0, Math.PI / 2), kit.clay(0x6e4224));
  core.scale.set(R * 0.85, H * 0.8, R * 0.82);
  core.position.y = 0;
  core.receiveShadow = true;

  g.add(kit.part(name, { mount: "floor", order: 1 }, core, leaves));
  return g;
}
