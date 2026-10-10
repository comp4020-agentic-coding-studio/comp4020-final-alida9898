// One stackable storey: floor (slab + planks, with a stairwell hole on upper
// storeys), three panelled walls with door/window models, and optionally the
// staircase up to the next storey. Built in STOREY-LOCAL coords (y = 0 is this
// storey's floor top); the caller lifts the group to levelY(level).
import { ROOM, STOREY_H, SLAB, STAIRS, STAIRWELL } from "./zones.js";
import { model, place } from "./place.js";

const tint = (THREE, hex, k) => new THREE.Color(hex).multiplyScalar(k).getHex();

/**
 * @param kit  the clay kit
 * @param o.level      storey number (0 = ground)
 * @param o.theme      { paper, wainscot } hex colours
 * @param o.openings   door/window list from LEVELS[n].openings
 * @param o.stairsUp   build the staircase up to the next storey
 * @param o.top        last storey: finish the wall tops with a cornice
 * @returns { group, walls: { back, left, right } }
 */
export async function buildStorey(kit, { level, theme, openings = [], stairsUp = false, top = false }) {
  const { THREE } = kit;
  const P = kit.PALETTE;
  const group = new THREE.Group(); group.name = `storey-${level}`;
  const [x0, x1] = ROOM.x, D = ROOM.z[1], T = ROOM.wall, H = STOREY_H;
  const W = x1 - x0;
  const wood = tint(THREE, P.brown, 1.12), woodDark = tint(THREE, P.brown, 0.7), rail = P.cream;
  const hole = level > 0 ? STAIRWELL : null;

  // ---- floor: slab under the floor top, planks on it, both skipping the stairwell
  const floor = new THREE.Group(); floor.name = "floor";
  const slabT = level === 0 ? 10 : SLAB;
  // rectangles covering the footprint minus the hole: [xa, xb, za, zb]
  const rects = hole
    ? [[hole.x[1], x1, 0, D], [x0, hole.x[1], 0, hole.z[0]], [x0, hole.x[1], hole.z[1], D]]
    : [[x0, x1, 0, D]];
  for (const [xa, xb, za, zb] of rects) {
    const xl = xa === x0 ? x0 - T : xa, xr = xb === x1 ? x1 + T : xb, zl = za === 0 ? -T : za;
    const s = kit.roundedBox(xr - xl, slabT, zb - zl, 2, woodDark);
    s.position.set((xl + xr) / 2, -slabT / 2, (zl + zb) / 2);
    floor.add(s);
  }
  // planks run front-to-back, 20 cm wide; cut around the hole
  const pw = 20;
  for (let i = 0; i < W / pw; i++) {
    const k = [1, 0.94, 1.05, 0.97][i % 4];
    const cx = x0 + pw * (i + 0.5);
    const spans = hole && cx < hole.x[1] ? [[0, hole.z[0]], [hole.z[1], D]] : [[0, D]];
    for (const [za, zb] of spans) {
      const plank = kit.roundedBox(pw - 0.8, 1.2, zb - za - 0.8, 0.5, tint(THREE, P.brown, 1.12 * k));
      plank.position.set(cx, 0.2, (za + zb) / 2);
      plank.castShadow = false;
      floor.add(plank);
    }
  }
  // a wooden fascia on the open front edge of upper storeys so the slab reads as a floor line
  if (level > 0) {
    const fas = kit.roundedBox(W + 2 * T, slabT + 4, 6, 2, wood);
    fas.position.set(0, -slabT / 2, D + 1); floor.add(fas);
  }
  group.add(floor);

  // ---- walls: a run in local frame along +X, face at z = 0, room side +Z ------
  function wallRun(len) {
    const w = new THREE.Group();
    const slab = kit.roundedBox(len + 2 * T, H, T, 2, theme.paper);
    slab.position.set(0, H / 2, -T / 2);
    w.add(slab);
    const wh = 100;
    const board = kit.roundedBox(len, wh, 2, 1, theme.wainscot); board.position.set(0, wh / 2, 1); w.add(board);
    const n = Math.max(1, Math.round(len / 60)), pw2 = len / n;
    for (let i = 0; i < n; i++) {
      const p = kit.roundedBox(pw2 - 14, wh - 38, 2, 2, tint(THREE, theme.wainscot, 1.07));
      p.position.set(-len / 2 + pw2 * (i + 0.5), wh / 2 + 4, 2.4); w.add(p);
    }
    const cr = kit.roundedBox(len, 5, 4, 1.5, rail); cr.position.set(0, wh + 1, 2); w.add(cr);
    const sk = kit.roundedBox(len, 12, 3.5, 1.2, woodDark); sk.position.set(0, 6, 1.8); w.add(sk);
    if (top) { const c = kit.roundedBox(len + 2 * T, 6, T + 4, 2, rail); c.position.set(0, H - 3, -T / 2 + 2); w.add(c); }
    w.traverse((o) => { if (o.isMesh) o.castShadow = false; });
    return w;
  }
  const back = wallRun(W); back.name = "wall-back";
  const left = wallRun(D); left.name = "wall-left";
  left.rotation.y = Math.PI / 2; left.position.set(x0, 0, D / 2);
  const right = wallRun(D); right.name = "wall-right";
  right.rotation.y = -Math.PI / 2; right.position.set(x1, 0, D / 2);
  group.add(back, left, right);

  // ---- door & windows: models mounted on the wall runs ------------------------
  const walls = { back, left, right };
  // wall-run local x for a world position `along` the wall (see LEVELS openings)
  const toLocal = (o) => (o.wall === "back" ? o.along : o.wall === "left" ? D / 2 - o.along : o.along - D / 2);
  for (const [i, o] of openings.entries()) {
    const obj = await model(o.kind, { name: `${o.kind}-${level}-${i}`, width: o.width, height: o.height, arch: !!o.arch });
    walls[o.wall].add(place(obj, { x: toLocal(o), y: o.y, z: 0 }));
  }

  // ---- stairwell railing (upper storeys) ---------------------------------------
  const rh = 95;
  const railRun = (into, ax, bx, az, bz) => {
    const len = Math.hypot(bx - ax, bz - az), n = Math.max(2, Math.round(len / 22));
    for (let i = 0; i <= n; i++) {
      const t = i / n, big = i === 0 || i === n, s = big ? 7 : 3.4;
      const p = kit.roundedBox(s, rh, s, s / 2.2, big ? wood : rail);
      p.position.set(ax + (bx - ax) * t, rh / 2, az + (bz - az) * t); into.add(p);
    }
    const tr = kit.roundedBox(len + 6, 6, 9, 2.5, wood);
    tr.position.set((ax + bx) / 2, rh, (az + bz) / 2);
    tr.rotation.y = -Math.atan2(bz - az, bx - ax);
    into.add(tr);
  };
  if (hole) {
    const r = new THREE.Group(); r.name = "stairwell-rail";
    railRun(r, hole.x[1] + 3, hole.x[1] + 3, hole.z[0] + 40, hole.z[1] + 3); // open side, leave the top step clear
    railRun(r, hole.x[0] + 4, hole.x[1] + 3, hole.z[1] + 3, hole.z[1] + 3);  // front end
    group.add(r);
  }

  // ---- staircase up to the next storey (solid clay steps + handrail) ----------
  if (stairsUp) {
    const st = new THREE.Group(); st.name = "stairs";
    const sw = STAIRS.x[1] - STAIRS.x[0], scx = (STAIRS.x[0] + STAIRS.x[1]) / 2;
    const steps = STAIRS.rises - 1; // the last rise is onto the next floor
    for (let i = 0; i < steps; i++) {
      const topY = (i + 1) * STAIRS.rise, zb = STAIRS.z[1] - i * STAIRS.tread;
      const block = kit.roundedBox(sw, topY, STAIRS.tread, 2, tint(THREE, P.cream, i % 2 ? 0.9 : 0.86));
      block.position.set(scx, topY / 2, zb - STAIRS.tread / 2); st.add(block);
      const tr = kit.roundedBox(sw + 2, 4, STAIRS.tread + 3, 1.5, wood);
      tr.position.set(scx, topY - 1, zb - STAIRS.tread / 2 + 1); st.add(tr);
    }
    const sx = STAIRS.x[1] - 3;
    for (let i = 0; i < steps; i += 3) {
      const z = STAIRS.z[1] - (i + 0.5) * STAIRS.tread, y0 = (i + 1) * STAIRS.rise, big = i === 0;
      const p = kit.roundedBox(big ? 7 : 3.4, rh, big ? 7 : 3.4, 1.5, big ? wood : rail);
      p.position.set(sx, y0 + rh / 2, z); st.add(p);
    }
    const za = STAIRS.z[1] - 0.5 * STAIRS.tread, zb = STAIRS.z[0] + 0.5 * STAIRS.tread;
    const ya = STAIRS.rise + rh, yb = steps * STAIRS.rise + rh;
    const hand = kit.roundedBox(6, 6, Math.hypot(za - zb, yb - ya), 2.5, wood);
    hand.position.set(sx, (ya + yb) / 2, (za + zb) / 2);
    hand.rotation.x = Math.atan2(yb - ya, za - zb);
    st.add(hand);
    group.add(st);
  }

  group.traverse((o) => { if (o.isMesh) o.receiveShadow = true; });
  return { group, walls };
}
