// The copper bean tube: a tall cask running up through every storey near the
// back wall, with bands, a hopper cap and a couple of pipes into the wall.
// World coords (it spans storeys). Shell-owned — the thing that will later
// connect players' storeys. Footprint: TUBE in zones.js.
import { TUBE, STOREY_H } from "./zones.js";

export function buildTube(kit, { levels }) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = "bean-tube";
  const copper = kit.clay(0xb8703f, { roughness: 0.5, sheen: 0.4 });
  const band = kit.clay(0x8a4f2c, { roughness: 0.55 });
  const glass = kit.clay(0xd9b88a, { roughness: 0.4 });
  const H = levels * STOREY_H + 40, { x, z, r } = TUBE;

  const body = kit.roundedCylinder(r, H, 4, copper); body.position.set(x, -10, z); g.add(body);
  // bands every 50 cm and a chunky collar where it passes each floor
  for (let y = 40; y < H - 20; y += 50) {
    const b = kit.roundedCylinder(r + 2.5, 6, 2, band); b.position.set(x, y, z); g.add(b);
  }
  for (let n = 1; n < levels; n++) {
    const c = kit.roundedCylinder(r + 7, 14, 4, band); c.position.set(x, n * STOREY_H - 14, z); g.add(c);
  }
  // a little sight-glass window on each storey showing the beans
  for (let n = 0; n < levels; n++) {
    const sg = kit.roundedBox(16, 46, 6, 3, glass); sg.position.set(x, n * STOREY_H + 140, z + r - 1); g.add(sg);
    for (let k = 0; k < 4; k++) {
      const bean = kit.blob(3.2, 2, 2.4, "soil"); bean.position.set(x - 4 + (k % 2) * 8, n * STOREY_H + 124 + k * 8, z + r + 2); g.add(bean);
    }
  }
  // domed hopper cap on top
  const cap = kit.lathe([[0, 0], [r + 6, 0], [r + 6, 8], [r - 6, 26], [8, 34], [0, 36]], copper, { round: 3 });
  cap.position.set(x, H - 10, z); g.add(cap);
  // pipes: one elbow into the back wall per storey
  for (let n = 0; n < levels; n++) {
    const y = n * STOREY_H + 230;
    const out = kit.capsule(6, 40, copper); out.rotation.z = Math.PI / 2; out.position.set(x + r + 12, y, z); g.add(out);
    const up = kit.capsule(6, 40, copper); up.rotation.x = Math.PI / 2; up.position.set(x + r + 30, y, z - 22); g.add(up);
  }
  return g;
}
