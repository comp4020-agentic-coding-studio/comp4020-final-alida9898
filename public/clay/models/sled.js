// Little wooden sled in pale raw wood, standing on the snow: two side boards that run
// along the ground and curl up into a round scroll at the front, a seat of five cross
// slats on short posts, a curved backrest on two posts at the back, and a pull rope
// tied to the front bar that drops to the ground and ends in a loose coil.
// One part `<name>` (floor) — the rope comes with it. Built a little oversize so it
// reads from the yard view: ~96 long × 40 wide × 50 to the top of the backrest.
// Origin: on the ground, centre of the runners' footprint. Faces +Z (front scroll +
// rope); +X is its left side. opts: `wood` (colour), `rope` (colour).
// (`metal` / `lean` from the old leaning sled are accepted and ignored.)
export function build(kit, { name = "sled", wood = 0xdcbf94, rope = 0xc8b18a } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const m = [];
  const L = 96, W = 40, SEAT = 26;          // length, outer width, seat top height
  const woodC = typeof wood === "string" ? kit.PALETTE[wood] : wood;
  const tone = (k) => new THREE.Color(woodC).multiplyScalar(k).getHex();
  const woodM = kit.clay(woodC, { roughness: 0.8, sheen: 0.2 });
  const add = (o) => { o.castShadow = true; o.receiveShadow = true; m.push(o); return o; };
  const zF = L / 2 - 12, zB = -L / 2;        // where the runner starts to curl / the back end
  const RC = 9.5;                             // scroll radius

  // ---- side boards: a flat clay strip along the ground that curls up and back into a round scroll
  for (const s of [-1, 1]) {
    const x = s * (W / 2 - 2);
    const pts = [new THREE.Vector3(x, 2.4, zB + 2), new THREE.Vector3(x, 2.2, zB + 20), new THREE.Vector3(x, 2.2, zF - 10)];
    const cy = 2.2 + RC, cz = zF;
    for (let a = -90; a <= 250; a += 20) {
      const r = a < 150 ? RC : RC - (RC - 5) * ((a - 150) / 100);
      const t = (a * Math.PI) / 180;
      pts.push(new THREE.Vector3(x, cy + r * Math.sin(t), cz + r * Math.cos(t)));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const board = add(new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 2.4, 10, false), woodM));
    // flatten the round tube into a board: thin side to side, tall in its own plane
    board.geometry.translate(-x, 0, 0); board.scale.set(0.62, 1, 1); board.position.x = x;
    // round end cap at the back of the runner
    const cap = add(kit.blob(1.5, 2.4, 2.4, woodM)); cap.position.set(x, 2.4, zB + 2);
    // seat posts: short legs from the runner up to the seat rail
    for (const z of [zB + 12, -2, zF - 12]) {
      const post = add(kit.roundedBox(2.8, SEAT - 6, 4.2, 1.2, tone(0.97))); post.position.set(x, 2.2 + (SEAT - 6) / 2 + 1, z);
    }
    // seat rail along the top of the posts
    const rail = add(kit.roundedBox(3.4, 3.2, zF - zB - 6, 1.4, tone(0.95))); rail.position.set(x, SEAT - 4, (zF + zB) / 2 - 1);
  }
  // round bar between the two scrolls, where the rope is tied
  const bar = add(new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, W - 2, 14), woodM));
  bar.rotation.z = Math.PI / 2; bar.position.set(0, 2.2 + RC, zF);
  // a low cross brace between the runners at the back
  const brace = add(kit.roundedBox(W - 4, 2.6, 3, 1.1, tone(0.93))); brace.position.set(0, 8, zB + 12);

  // ---- seat: five cross slats with small gaps, alternating a touch lighter/darker
  const NS = 5, SL = 11, GAP = 2.6, run = NS * SL + (NS - 1) * GAP, z0 = (zF + zB) / 2 - run / 2 + 2;
  for (let i = 0; i < NS; i++) {
    const slat = add(kit.roundedBox(W + 3, 2.6, SL, 1.1, tone(i % 2 ? 1.0 : 1.06)));
    slat.position.set(0, SEAT - 1.3, z0 + SL / 2 + i * (SL + GAP));
  }

  // ---- backrest: two posts at the back corners, a curved board across their tops
  const BH = 22, R = 21, pz = zB + 5;
  const ang = Math.asin((W / 2 - 2) / R), cz = pz + R * Math.cos(ang);
  for (const s of [-1, 1]) {
    const post = add(kit.roundedBox(3, BH, 3.6, 1.3, tone(0.97)));
    post.position.set(s * (W / 2 - 2), SEAT + BH / 2 - 2, pz); post.rotation.x = -0.08;
  }
  const back = new THREE.Shape();
  const T = 3;                                 // board thickness
  back.absarc(0, 0, R + T / 2, -Math.PI / 2 - ang, -Math.PI / 2 + ang, false);
  back.absarc(0, 0, R - T / 2, -Math.PI / 2 + ang, -Math.PI / 2 - ang, true);
  const bg = new THREE.ExtrudeGeometry(back, { depth: 7, bevelEnabled: true, bevelThickness: 1.2, bevelSize: 1.1, bevelSegments: 3, curveSegments: 24 });
  bg.rotateX(Math.PI / 2);                     // shape's XY plane → XZ, extrude depth → −Y
  const board = add(new THREE.Mesh(bg, woodM));
  board.position.set(0, SEAT + BH - 1, cz);

  // ---- pull rope: knotted on the front bar, down to the ground, a loose coil at the end
  const ropeM = kit.clay(rope, { roughness: 0.95, sheen: 0.3 });
  const knotZ = zF, knotY = 2.2 + RC;
  for (const s of [-1, 1]) {
    const knot = add(new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.8, 8, 16), ropeM));
    knot.position.set(s * 9, knotY, knotZ); knot.rotation.y = Math.PI / 2;
  }
  const cx = 12, cz2 = L / 2 + 22;             // coil centre on the ground, ahead and to one side
  const rp = [
    new THREE.Vector3(-9, knotY - 2, knotZ + 1), new THREE.Vector3(-4, knotY - 6, knotZ + 9),
    new THREE.Vector3(0, 1, L / 2 + 6), new THREE.Vector3(9, 0.9, L / 2 + 10), new THREE.Vector3(9, knotY - 6, knotZ + 9),
    new THREE.Vector3(9, knotY - 2, knotZ + 1),
  ];
  add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rp), 48, 0.8, 8, false), ropeM));
  const tail = [new THREE.Vector3(9, 0.9, L / 2 + 10), new THREE.Vector3(cx - 2, 0.9, cz2 - 9)];
  // the coil: a flat spiral lying on the ground, ~2 turns
  for (let a = 0; a <= Math.PI * 4.2; a += Math.PI / 8) {
    const r = 8 - a * 0.42;
    tail.push(new THREE.Vector3(cx + r * Math.sin(a + Math.PI), 0.9 + 0.12 * a, cz2 + r * Math.cos(a + Math.PI)));
  }
  add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tail), 120, 0.85, 8, false), ropeM));

  g.add(kit.part(name, { mount: "floor", order: 1 }, ...m));
  return g;
}
