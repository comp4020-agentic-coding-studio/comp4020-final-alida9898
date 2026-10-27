// String of fairy lights: a sagging wire with chunky warm-glow bulbs at intervals, big
// enough to read from across the room. One part `<name>` (wall).
// Two shapes:
//   default   swagged straight along a wall in two scallops. Origin: the lowest point of
//             the sag, back flush with the wall (z ≈ 0). `width` = total span.
//   `arch: R` draped over an arched window frame, pegged at five points around a half
//             circle of radius R and drooping a little between pegs. Origin: the arch's
//             centre, at the wall face (z = 0); the string stands `depth` cm out from the
//             wall so it hangs in FRONT of the window frame, not inside it.
// opts: `width`, `arch`, `depth`, `bulb` (bulb size scale), `colors` (bulb palette).
export function build(kit, { name = "fairy-lights", width = 130, arch = 0, depth = 0.6, bulb = 1, colors = ["mustard", "terracotta", "cream", 0x7f9bb3] } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const m = [];
  let anchors, pts;
  if (arch) {
    // pegs at 8°, 50°, 90°, 130°, 172° round the arch; each span droops 6 cm at its middle
    const angs = [8, 50, 90, 130, 172].map((a) => (a * Math.PI) / 180);
    anchors = angs.map((a) => [arch * Math.cos(a), arch * Math.sin(a)]);
    pts = [];
    for (let i = 0; i < anchors.length; i++) {
      pts.push(new THREE.Vector3(anchors[i][0], anchors[i][1], depth));
      if (i < anchors.length - 1) {
        const a = (angs[i] + angs[i + 1]) / 2;
        pts.push(new THREE.Vector3(arch * Math.cos(a), arch * Math.sin(a) - 6, depth));
      }
    }
    // the two ends hang down a little past the last pegs
    pts.unshift(new THREE.Vector3(anchors[0][0] + 1, anchors[0][1] - 10, depth));
    pts.push(new THREE.Vector3(anchors[4][0] - 1, anchors[4][1] - 10, depth));
  } else {
    const W = width;
    // three anchor points (left end, centre peg, right end) with the wire sagging between them
    anchors = [[-W / 2, 20], [-W / 4, 4], [0, 14], [W / 4, 4], [W / 2, 20]];
    pts = anchors.map(([x, y]) => new THREE.Vector3(x, y, depth));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const wire = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.5 * Math.max(1, bulb * 0.8), 8, false), kit.clay("charcoal"));
  wire.castShadow = false; m.push(wire);
  // little cream cleats at each anchor (on a short stand-off back to the wall when hung out front)
  for (const [x, y] of anchors) {
    const cleat = kit.roundedBox(1.6 * bulb, 1.6 * bulb, Math.max(1.6, depth + 0.6), 0.5, "cream");
    cleat.position.set(x, y, Math.max(1, depth / 2)); m.push(cleat);
  }
  // bulbs along the curve, a glowing drop under the wire, alternating colours
  const N = arch ? 21 : 15;
  const glow = (hex) => new THREE.MeshStandardMaterial({ color: hex, emissive: hex, emissiveIntensity: arch ? 0.9 : 0.6, roughness: 0.6 });
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const p = curve.getPoint(t);
    const hex = typeof colors[i % colors.length] === "string" ? kit.PALETTE[colors[i % colors.length]] : colors[i % colors.length];
    const b = kit.blob(1.5 * bulb, 2 * bulb, 1.5 * bulb, glow(hex));
    b.position.set(p.x, p.y - 1.6 * bulb, p.z + 0.3);
    b.castShadow = false;
    m.push(b);
    // a short lead wire from the string down to each bulb
    const lead = kit.capsule(0.22 * bulb, 1.8 * bulb, "charcoal"); lead.position.set(p.x, p.y - 0.9 * bulb, p.z + 0.3); m.push(lead);
  }
  g.add(kit.part(name, { mount: "wall", order: 1 }, ...m));
  return g;
}
