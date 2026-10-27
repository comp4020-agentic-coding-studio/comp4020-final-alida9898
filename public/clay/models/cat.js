// A glazed clay tabby (狸花猫): one smooth skinned body — torso, legs, neck, head and tail
// are a single surface melted together from soft shapes, so legs grow out of the body with
// no seams, and the stripes are painted on by one function of the rest-pose position, so
// the bands on the back run on down the legs. Face details (eyes, ears, nose) ride the
// head bone. ~34 cm nose to rump standing (slender body), ~60 with the tail; paws rest on y = 0.
// Origin: on the ground under the belly. The cat faces / walks toward +X; +Y up.
// opts: `coat` — a key of COATS (default "tabby") or a coat object.
//
// Named joints (getObjectByName): cat-rig (moved by the jump) · cat-root · cat-hips ·
//   cat-chest · cat-neck · cat-head · cat-ear-l/-r · cat-eyelid-l/-r · cat-mouth ·
//   cat-leg-{fl,fr}-{shoulder,elbow,wrist} · cat-leg-{hl,hr}-{hip,knee,hock} · cat-tail-0…4
//   ("l" legs are on the +Z side.)

export const COATS = {
  tabby: { label: ["狸花", "Tabby"], base: 0x8f8f8c, stripe: 0x4a4846, belly: 0xf1ece2, spot: 0xb9ab9b, nose: 0xd99a9a, ear: 0xe6aaa4, eye: 0xb9c45a, pad: 0xd98c8c, paws: null, patches: null },
  calico: {
    label: ["三花", "Calico"], base: 0xf6efe3, stripe: null, belly: 0xf6efe3, nose: 0xd98c8c, ear: 0xe8b5a0, eye: 0x7a6a3a, pad: 0xd98c8c, paws: null,
    patches: [[0xd98a4a, -6, 15, 3, 5], [0x4a4440, 2, 16, -3, 4.5], [0xd98a4a, 12, 24, 1, 3]],
  },
  black: { label: ["黑猫", "Black"], base: 0x3d3835, stripe: null, belly: 0x4d4642, nose: 0x6b5450, ear: 0x6b5450, eye: 0xc9a43a, pad: 0x6b5450, paws: null, patches: null },
  tuxedo: { label: ["奶牛猫", "Tuxedo"], base: 0x3d3835, stripe: null, belly: 0xf6efe3, nose: 0xd98c8c, ear: 0x8a6a64, eye: 0x7a9a5a, pad: 0xd98c8c, paws: 0xf6efe3, patches: null },
};

// ---- rest skeleton (rig space, cm). Legs are straight down: the standing cat. ----
// Torso and neck/head pivots were pulled closer together (was: root/hips/chest spread over
// 10cm of x, neck reaching to x=8.5, head to x=11) so the head sits further back over a
// rounder, more compact body by default — see the head/body proportion note above `build`.
// Leg bones (shoulder…toe, hip…foot) are untouched: moving a torso bone's own position never
// shifts its children's rest-pose world position (bone() rebuilds each child's offset from
// its absolute coordinate), so the legs stay exactly where they were.
const B = {
  root: [-0.8, 13.0, 0], hips: [-4.2, 13.0, 0], chest: [3.0, 13.3, 0], neck: [5.3, 15.6, 0], head: [7.1, 18.2, 0],
  shoulder: [5.8, 10.5, 2.7], elbow: [5.2, 6, 2.7], wrist: [6, 1.7, 2.7], toe: [7.6, 1.15, 2.7],
  hip: [-6, 11, 3.1], knee: [-3.4, 6.6, 3.2], hock: [-7.4, 2.7, 3.2], foot: [-5.6, 1.15, 3.2],
  tail0: [-10, 14, 0],
};
const TAIL_SEG = 5.0, TAIL_N = 5;   // long thin tail
// Face numbers: tuned by eye in /cat.html?editor and exported to assets/editor/cat.json.
// The head is ONE lump of clay (an ellipsoid); every number here is in cm, rig space.
// headX/headY are the head's own position in rig space (independent of the `head` bone's
// pivot, B.head above — the bone is only the rotation hinge). Chibi proportion: a big head
// (headW/H/D bumped up) over a short round body.
// Slender-cat pass (2026-10-26): started from the user's editor export (headX 9.1, headY 20.85,
// headW 6.25, headH 5.55, headD 5.65, eyeY 21.65, eyeSpread 0.55, eyeSize 2.05, eyeSink 0.4,
// noseY -0.45, earSpread 3.1, earUp 4.4), then the whole head shrunk ×0.68 for the long thin
// body: every size and every offset from the head centre (eye row, nose, ears) scaled by the
// same factor, so the eyes and ears keep exactly the user's placement relative to the head.
// eyeSpread is a direction ratio, so it stays as is. The head moved forward/down to sit on the
// end of the longer neck.
export const FACE = {
  headX: 10.9, headY: 19.0,           // head centre
  headW: 4.25, headH: 3.8, headD: 3.85, // half width (side to side), half height, half depth (nose to back)
  eyeY: 19.54, eyeSpread: 0.55, eyeSize: 1.4, eyeSink: 0.27,
  noseY: -0.31, earSpread: 2.1, earUp: 3.0,
};

const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

export function build(kit, opts = {}) {
  const { THREE } = kit;
  const { name = "cat" } = opts;
  const coat = typeof opts.coat === "object" ? opts.coat : COATS[opts.coat || "tabby"] || COATS.tabby;
  const F = { ...FACE, ...(opts.face || {}) };
  const HEAD_C = [F.headX, F.headY, 0];
  const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  const mir = (a, s) => [a[0], a[1], a[2] * s];

  // ---- bones ----
  const bones = [], byName = {};
  const bone = (n, abs, parent) => {
    const b = new THREE.Bone(); b.name = `cat-${n}`; b.userData.abs = abs;
    const pa = parent ? parent.userData.abs : [0, 0, 0];
    b.position.set(abs[0] - pa[0], abs[1] - pa[1], abs[2] - pa[2]);
    if (parent) parent.add(b);
    bones.push(b); byName[n] = b; return b;
  };
  const root = bone("root", B.root, null);
  const hips = bone("hips", B.hips, root);
  const chest = bone("chest", B.chest, root);
  const neck = bone("neck", B.neck, chest);
  const head = bone("head", B.head, neck);
  head.rotation.order = "YZX";
  for (const [k, s] of [["l", 1], ["r", -1]]) {
    const sh = bone(`leg-f${k}-shoulder`, mir(B.shoulder, s), chest);
    const el = bone(`leg-f${k}-elbow`, mir(B.elbow, s), sh);
    bone(`leg-f${k}-wrist`, mir(B.wrist, s), el);
    const hp = bone(`leg-h${k}-hip`, mir(B.hip, s), hips);
    const kn = bone(`leg-h${k}-knee`, mir(B.knee, s), hp);
    bone(`leg-h${k}-hock`, mir(B.hock, s), kn);
  }
  let tp = hips;
  const tailAbs = [];
  for (let i = 0; i < TAIL_N; i++) {
    const a = [B.tail0[0] - TAIL_SEG * i, B.tail0[1], 0];
    tailAbs.push(a); tp = bone(`tail-${i}`, a, tp); tp.rotation.order = "YZX";
  }
  tailAbs.push([B.tail0[0] - TAIL_SEG * TAIL_N, B.tail0[1], 0]);

  // ---- the soft shapes the body is melted from, each tagged with the bone it follows ----
  const prims = [];
  const ell = (c, r, b, k = 1.6) => prims.push({ t: 0, c, r, b, k });
  const cap = (a, b2, ra, rb, b, k = 1.4) => prims.push({ t: 1, a, b: b2, ra, rb, bone: b, k });
  // torso: ONE primitive, not three balls smooth-unioned (three lobes always show three bumps
  // from the side, however big or blended). A tapered capsule was tried next and read as a
  // saddle (round end caps, flatter middle). So the torso is ONE egg: a single ellipsoid whose height and
  // width shrink a little toward the chest end (u = -1 rump … +1 chest). Fattest in the middle,
  // outward-curving everywhere, no interior dip possible. a/b are only used for skin weights.
  // Containment: normalized distance to B.shoulder ≈0.96, to B.hip ≈0.86 (both inside).
  // Slender-cat pass: the round egg became ONE long sausage with an oval cross-section and the
  // same thickness from chest to rump (t:3 below): a flat back line, ~25 cm nose-of-chest to
  // rump. Its core runs x −8.6…6.4; ends are rounded with the cross-section radii.
  // Containment: shoulder and hip joints sit at/just inside the surface (normalized ≈0.97 / 0.96).
  prims.push({ t: 3, a: [-8.6, 12.8, 0], b: [6.4, 12.8, 0], ry: 3.8, rz: 3.4,
    bone: "root", k: 1.8, torso: true });
  // neck: re-tuned to span the new, shorter neck→head bone gap (was built for
  // B.neck=[8.5,15.5,0]→B.head=[11,18.5,0]; now B.neck=[5.3,15.6,0]→B.head=[7.1,18.2,0]).
  // Endpoints keep the same offset from the head's actual visual centre (HEAD_C) as before,
  // so the neck still tucks under the back of the head lump the same way.
  // slender neck: rises out of the front of the sausage and runs into the back of the
  // (smaller) head with a wide blend, so head and neck read as one line
  cap([6.2, 14.0, 0], [HEAD_C[0] - 1.4, HEAD_C[1] - 1.0, 0], 2.5, 2.1, "neck", 2.0);
  // head: one lump of clay; its size comes from FACE. Narrower toward the chin (ty) so the
  // face reads as a soft triangle from the front: wide between the ears, small chin.
  prims.push({ t: 0, c: HEAD_C, r: [F.headD, F.headH, F.headW], b: "head", k: 1.6, ty: 0.28 });
  // ear roots: small bumps fused into the head surface (via the smooth union below) so each
  // ear's base has no seam — the decorative cone meshes (built further down) sit right on
  // top of these. Positioned the same way the ear group itself is (HEAD_C offset by
  // F.earUp/F.earSpread), just computed directly in rig space instead of head-bone-local space.
  for (const s of [1, -1]) {
    ell([HEAD_C[0] - 0.35, HEAD_C[1] + F.earUp, s * F.earSpread], [1.15, 1.4, 0.9], "head", 0.8);
  }
  for (const [k, s] of [["l", 1], ["r", -1]]) {
    // thin straight legs (slender-cat pass: about 2/3 of the old radii)
    cap(mir(B.shoulder, s), mir(B.elbow, s), 1.75, 1.35, `leg-f${k}-shoulder`, 1.2);
    cap(mir(B.elbow, s), mir(B.wrist, s), 1.35, 1.15, `leg-f${k}-elbow`, 0.8);
    ell(mir([6.8, 1.1, 2.7], s), [1.7, 1.0, 1.3], `leg-f${k}-wrist`, 0.8);
    cap(mir(B.hip, s), mir(B.knee, s), 2.3, 1.45, `leg-h${k}-hip`, 1.4);
    cap(mir(B.knee, s), mir(B.hock, s), 1.35, 1.1, `leg-h${k}-knee`, 0.8);
    cap(mir(B.hock, s), mir([-5.9, 1.35, 3.2], s), 1.05, 1.0, `leg-h${k}-hock`, 0.7);
    ell(mir([-5.5, 1.05, 3.2], s), [1.65, 0.98, 1.3], `leg-h${k}-hock`, 0.7);
  }
  // tail root: the base of segment 0 used to start at [-8,14.4,0], which is actually just
  // OUTSIDE the hips ellipsoid (normalized distance ≈1.08 from the hips centre below) — a
  // thin 1.5cm-radius tube meeting a much bigger round hip there, with only k=1.6 of blend,
  // reads as a notch/dent (confirmed in a rear-view screenshot: a visible step where the
  // tail starts). Fixed by starting the root well inside the hips lump, fattening the root
  // radius so it tapers down from something close to the hip's own curvature instead of
  // jumping straight to a thin tube, and widening k so the two surfaces melt together over
  // a wider area. (Normalized distance from the hips centre to this new start point ≈0.77,
  // comfortably inside.)
  // slender-cat pass: a thin tail rooted inside the rump end of the sausage
  const tailRootStart = [-10.0, 13.6, 0];
  for (let i = 0; i < TAIL_N; i++) {
    const a = i === 0 ? tailRootStart : tailAbs[i];
    const ra = i === 0 ? 1.7 : 1.05 - 0.06 * i, rb = 1.05 - 0.06 * (i + 1);
    cap(a, tailAbs[i + 1], ra, rb, `tail-${i}`, i === 0 ? 1.8 : 0.5);
  }
  for (const p of prims) { if (p.t === 0) { p.bone = p.b; } }

  const sdOne = (p, x, y, z) => {
    if (p.t === 0) {
      // ty: z radius shrinks toward the bottom of the ellipsoid (a chin), grows toward the top
      const rz = p.ty ? p.r[2] * (1 + p.ty * Math.min(1, Math.max(-1, (y - p.c[1]) / p.r[1]))) : p.r[2];
      const dx = (x - p.c[0]) / p.r[0], dy = (y - p.c[1]) / p.r[1], dz = (z - p.c[2]) / rz;
      return (Math.sqrt(dx * dx + dy * dy + dz * dz) - 1) * Math.min(p.r[0], p.r[1], rz);
    }
    if (p.t === 3) {
      // sausage along x (a→b) with an oval (ry × rz) cross-section and rounded ends
      const cx = Math.min(p.b[0], Math.max(p.a[0], x));
      const dx = (x - cx) / p.ry, dy = (y - p.a[1]) / p.ry, dz = (z - p.a[2]) / p.rz;
      return (Math.sqrt(dx * dx + dy * dy + dz * dz) - 1) * Math.min(p.ry, p.rz);
    }
    if (p.t === 2) {
      // egg: ellipsoid whose y/z radii scale by (1 - egg*u), u = clamped x position along it
      const u = Math.min(1, Math.max(-1, (x - p.c[0]) / p.r[0])), s = 1 - p.egg * u;
      const rx = p.r[0], ry = p.r[1] * s, rz = p.r[2] * s;
      const dx = (x - p.c[0]) / rx, dy = (y - p.c[1]) / ry, dz = (z - p.c[2]) / rz;
      return (Math.sqrt(dx * dx + dy * dy + dz * dz) - 1) * Math.min(rx, ry, rz);
    }
    const bx = p.b[0] - p.a[0], by = p.b[1] - p.a[1], bz = p.b[2] - p.a[2];
    const px = x - p.a[0], py = y - p.a[1], pz = z - p.a[2];
    const t = Math.min(1, Math.max(0, (px * bx + py * by + pz * bz) / (bx * bx + by * by + bz * bz)));
    const qx = px - bx * t, qy = py - by * t, qz = pz - bz * t;
    return Math.sqrt(qx * qx + qy * qy + qz * qz) - (p.ra + (p.rb - p.ra) * t);
  };
  const sdf = (x, y, z) => {
    let d = 1e9;
    for (const p of prims) {
      const e = sdOne(p, x, y, z);
      const k = p.k, h = Math.max(k - Math.abs(d - e), 0) / k;
      d = Math.min(d, e) - h * h * k * 0.25;                       // smooth union
    }
    return d;
  };

  // ---- surface nets over the field → one closed mesh ----
  const step = 0.36, min = [-37.2, -0.9, -7.2], max = [18.4, 26, 7.2];
  const nx = Math.ceil((max[0] - min[0]) / step) + 1, ny = Math.ceil((max[1] - min[1]) / step) + 1, nz = Math.ceil((max[2] - min[2]) / step) + 1;
  const val = new Float32Array(nx * ny * nz);
  const id = (i, j, k) => i + nx * (j + ny * k);
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const y = min[1] + j * step;
    // nothing below the ground: flatten the soles a touch
    val[id(i, j, k)] = Math.max(sdf(min[0] + i * step, y, min[2] + k * step), -(y - 0.02));
  }
  const cell = new Int32Array(nx * ny * nz).fill(-1);
  const pos = [];
  const EDGES = [];
  for (let a = 0; a < 8; a++) for (const bit of [1, 2, 4]) if (!(a & bit)) EDGES.push([a, a | bit]);
  for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const v = [];
    let mask = 0;
    for (let c = 0; c < 8; c++) { const f = val[id(i + (c & 1), j + ((c >> 1) & 1), k + ((c >> 2) & 1))]; v.push(f); if (f < 0) mask |= 1 << c; }
    if (mask === 0 || mask === 255) continue;
    let sx = 0, sy = 0, sz = 0, n = 0;
    for (const [a, b] of EDGES) {
      if ((v[a] < 0) === (v[b] < 0)) continue;
      const t = v[a] / (v[a] - v[b]);
      sx += (a & 1) + ((b & 1) - (a & 1)) * t; sy += ((a >> 1) & 1) + (((b >> 1) & 1) - ((a >> 1) & 1)) * t; sz += ((a >> 2) & 1) + (((b >> 2) & 1) - ((a >> 2) & 1)) * t; n++;
    }
    cell[id(i, j, k)] = pos.length / 3;
    pos.push(min[0] + (i + sx / n) * step, min[1] + (j + sy / n) * step, min[2] + (k + sz / n) * step);
  }
  const index = [];
  const quad = (a, b, c, d, flip) => { if (a < 0 || b < 0 || c < 0 || d < 0) return; if (flip) index.push(a, c, b, a, d, c); else index.push(a, b, c, a, c, d); };
  for (let k = 1; k < nz - 1; k++) for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
    const f0 = val[id(i, j, k)] < 0;
    if (f0 !== (val[id(i + 1, j, k)] < 0)) quad(cell[id(i, j - 1, k - 1)], cell[id(i, j, k - 1)], cell[id(i, j, k)], cell[id(i, j - 1, k)], !f0);
    if (f0 !== (val[id(i, j + 1, k)] < 0)) quad(cell[id(i - 1, j, k - 1)], cell[id(i - 1, j, k)], cell[id(i, j, k)], cell[id(i, j, k - 1)], !f0);
    if (f0 !== (val[id(i, j, k + 1)] < 0)) quad(cell[id(i - 1, j - 1, k)], cell[id(i, j - 1, k)], cell[id(i, j, k)], cell[id(i - 1, j, k)], !f0);
  }
  // two gentle smoothing passes (clay, not voxels)
  const nv = pos.length / 3, nb = Array.from({ length: nv }, () => new Set());
  for (let t = 0; t < index.length; t += 3) for (let e = 0; e < 3; e++) { const a = index[t + e], b = index[t + (e + 1) % 3]; nb[a].add(b); nb[b].add(a); }
  for (let pass = 0; pass < 2; pass++) {
    const nxt = pos.slice();
    for (let v = 0; v < nv; v++) {
      if (!nb[v].size || pos[v * 3 + 1] < 0.1) continue;
      let ax = 0, ay = 0, az = 0;
      for (const u of nb[v]) { ax += pos[u * 3]; ay += pos[u * 3 + 1]; az += pos[u * 3 + 2]; }
      const m = nb[v].size;
      nxt[v * 3] += (ax / m - pos[v * 3]) * 0.5; nxt[v * 3 + 1] += (ay / m - pos[v * 3 + 1]) * 0.5; nxt[v * 3 + 2] += (az / m - pos[v * 3 + 2]) * 0.5;
    }
    for (let q = 0; q < nxt.length; q++) pos[q] = nxt[q];
  }

  // ---- paint + skin weights, both from the rest position ----
  const colors = new Float32Array(nv * 3), skinI = new Uint16Array(nv * 4), skinW = new Float32Array(nv * 4);
  const boneIdx = Object.fromEntries(bones.map((b, i) => [b.name.slice(4), i]));
  const col = new THREE.Color(), tmp = new THREE.Color();
  for (let v = 0; v < nv; v++) {
    const x = pos[v * 3], y = pos[v * 3 + 1], z = pos[v * 3 + 2];
    paint(x, y, z, col);
    colors[v * 3] = col.r; colors[v * 3 + 1] = col.g; colors[v * 3 + 2] = col.b;
    const acc = new Map();
    let dmin = 1e9;
    const ds = prims.map((p) => { const d = sdOne(p, x, y, z); dmin = Math.min(dmin, d); return d; });
    prims.forEach((p, i) => {
      const w = Math.exp(-(ds[i] - dmin) / 0.55);
      if (p.torso) {
        // the one-piece torso spindle has no single bone to skin to: blend "hips" (rump end,
        // t=0 at TORSO_A) to "chest" (shoulder end, t=1 at TORSO_B) along its own axis, so the
        // always-on chest breathing scale and the sit/stretch chest/hips pose sway still move
        // this mesh the way they moved the old three-lobe torso, just as a smooth gradient
        // instead of three discrete 100%-weighted chunks.
        const bx = p.b[0] - p.a[0], by = p.b[1] - p.a[1], bz = p.b[2] - p.a[2];
        const px = x - p.a[0], py = y - p.a[1], pz = z - p.a[2];
        const t = Math.min(1, Math.max(0, (px * bx + py * by + pz * bz) / (bx * bx + by * by + bz * bz)));
        acc.set("hips", (acc.get("hips") || 0) + w * (1 - t));
        acc.set("chest", (acc.get("chest") || 0) + w * t);
      } else {
        acc.set(p.bone, (acc.get(p.bone) || 0) + w);
      }
    });
    const top = [...acc].sort((a, b) => b[1] - a[1]).slice(0, 4);
    const sum = top.reduce((s, [, w]) => s + w, 0);
    top.forEach(([bn, w], q) => { skinI[v * 4 + q] = boneIdx[bn]; skinW[v * 4 + q] = w / sum; });
  }

  /** The one coat function: rest-pose position → colour. */
  function paint(x, y, z, out) {
    out.set(coat.base);
    const az = Math.abs(z);
    const tail = smooth(-12.2, -13.8, x) * smooth(9.5, 11, y);
    const hd = Math.hypot((x - HEAD_C[0]) / (F.headD + 1), (y - HEAD_C[1]) / (F.headH + 1), (z - HEAD_C[2]) / (F.headW + 1));
    const inHead = smooth(1.15, 0.95, hd) * smooth(15.5, 17, y);
    if (coat.stripe) {
      const leg = smooth(8.8, 6.5, y) * (1 - tail);
      // body bands run down the flanks (constant-ish x) and turn into rings on the legs
      const uBody = x * 0.95 + 0.35 * Math.sin(y * 0.8 + az * 0.6) + 0.25 * Math.sin(x * 0.5);
      const uLeg = y * 1.2 + x * 0.25 + 0.6;
      let u = uBody + (uLeg - uBody) * leg;
      u = u + (x * 1.55 - u) * tail;
      let s = smooth(0.2, 0.85, Math.sin(u * 2.05));
      s *= 1 - inHead;
      let w = s * (0.92 - 0.25 * smooth(15, 11, y) * (1 - leg) * (1 - tail));
      w = Math.max(w, smooth(15.0, 16.0, y) * smooth(1.4, 0.5, az) * (1 - tail) * (1 - inHead) * 0.85);   // dark spine line
      w = Math.max(w, smooth(-32.5, -34.5, x) * tail);                                                     // dark tail tip
      // head: the forehead "M", stripes on the crown and back of head, a cheek line
      // head markings are placed relative to the head (hx = forward of centre, hy = up) so they follow FACE edits
      const hx = x - HEAD_C[0], hy = y - HEAD_C[1];
      const fore = smooth(0.6 + F.headD - 4.6, 1.8 + F.headD - 4.6, hx) * smooth(2.1 + F.headH - 4.4, 3.1 + F.headH - 4.4, hy) * inHead;
      const m = Math.min(az, Math.abs(az - 1.35));
      w = Math.max(w, smooth(0.4, 0.18, m) * fore);
      w = Math.max(w, smooth(0.4, 0.15, Math.abs(az - 0.7)) * smooth(15.4, 14.9, x) * smooth(23.2, 23.9, y) * smooth(14.4, 14.0, x) * inHead * 0);
      const crown = smooth(0.8, -0.2, hx) * smooth(0.7 + F.headH - 4.4, 2.2 + F.headH - 4.4, hy) * inHead;
      w = Math.max(w, smooth(0.45, 0.8, Math.sin(x * 2.2 + 1)) * crown);
      const cheek = smooth(F.headW - 1.1, F.headW - 0.4, az) * smooth(0.5, 0.15, Math.abs(hy + 1.3 + (hx - 1) * 0.25)) * smooth(-1.5, 0, hx) * inHead;
      w = Math.max(w, cheek * 0.9);
      out.lerp(tmp.set(coat.stripe), w);
    }
    for (const [c, px, py, pz, r] of coat.patches || []) {
      out.lerp(tmp.set(c), smooth(r, r - 1.2, Math.hypot(x - px, y - py, z - pz)));
    }
    // cream: belly, inner legs, chest and throat, muzzle and chin, white toes
    let cr = smooth(10.4, 9.2, y) * smooth(2.3, 1.6, az) * (1 - tail);
    cr = Math.max(cr, smooth(8.6, 10.0, x) * smooth(17.0, 15.0, y) * smooth(3.2, 2.1, az) * (1 - inHead));
    const fx = x - HEAD_C[0] - F.headD, fy = y - HEAD_C[1] - F.noseY;      // from the nose
    cr = Math.max(cr, smooth(-1.4, -0.6, fx) * smooth(0.2, -0.5, fy) * inHead);   // muzzle
    cr = Math.max(cr, smooth(-F.headH * 0.35, -F.headH * 0.55, y - HEAD_C[1]) * inHead * smooth(-0.5, 1, x - HEAD_C[0]));  // chin and throat
    cr = Math.max(cr, smooth(2.3, 1.7, y));
    out.lerp(tmp.set(coat.belly), cr);
    if (coat.paws) out.lerp(tmp.set(coat.paws), smooth(5, 4, y));
    if (coat.spot) {
      const sp = Math.sin(x * 2.1 + z * 0.7) * Math.sin(z * 2.9 - x * 0.9) * Math.sin(x * 1.3 + 2);
      out.lerp(tmp.set(coat.spot), smooth(0.45, 0.6, sp) * smooth(9.5, 8.5, y) * smooth(4, 3, y) * smooth(2.4, 1.6, az) * 0.75);
    }
    return out;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.setAttribute("skinIndex", new THREE.BufferAttribute(skinI, 4));
  geo.setAttribute("skinWeight", new THREE.BufferAttribute(skinW, 4));
  geo.setIndex(index);
  geo.computeVertexNormals();
  // a soft glaze: smoother than the furniture clay, not plastic
  const glaze = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.4, sheen: 0.15, sheenRoughness: 0.8 });
  const skin = new THREE.SkinnedMesh(geo, glaze);
  skin.name = "cat-skin"; skin.castShadow = true; skin.receiveShadow = true; skin.frustumCulled = false;

  const rig = new THREE.Group(); rig.name = "cat-rig";
  rig.add(root, skin);
  rig.updateMatrixWorld(true);
  skin.bind(new THREE.Skeleton(bones));

  // ---- face, ears and pads: small glazed pieces riding their bones ----
  const shiny = (c, r = 0.35) => new THREE.MeshPhysicalMaterial({ color: c, roughness: r, clearcoat: 0.5, clearcoatRoughness: 0.2 });
  const piece = (geo2, m) => { const o = new THREE.Mesh(geo2, m); o.castShadow = true; return o; };
  const sph = (rx, ry, rz, m, seg = [24, 16]) => { const o = piece(new THREE.SphereGeometry(1, seg[0], seg[1]), m); o.scale.set(rx, ry, rz); return o; };
  const hl = (a) => [a[0] - B.head[0], a[1] - B.head[1], a[2] - B.head[2]];   // rig → head-local
  const hc = hl(HEAD_C);
  const baseM = shiny(coat.base, 0.5);
  for (const [side, s] of [["l", 1], ["r", -1]]) {
    const ER = F.eyeSize, dir = new THREE.Vector3(1, -0.02, s * F.eyeSpread).normalize();
    // find the face surface along `dir` from the head centre, sink the ball so only a cap shows
    const EY = F.eyeY;                                                 // eye row
    let t = 0; while (sdf(HEAD_C[0] + dir.x * t, EY + dir.y * t, dir.z * t) < 0 && t < 12) t += 0.05;
    const eye = new THREE.Group();
    const sink = t - ER + F.eyeSink;
    const ec = [HEAD_C[0] + dir.x * sink, EY + dir.y * sink, dir.z * sink];
    eye.position.set(...hl(ec));
    // gaze: NOT along `dir` — `dir` only finds where the ball sits on the face, and aiming
    // along it made each eye stare outward by atan(eyeSpread) (≈27°, wall-eyed). Aiming dead
    // ahead instead pushes the pupil to the nose side of the bulging cap and reads cross-eyed,
    // so keep a small share (GAZE_SPLAY) of the outward tilt: the pupils then sit centred in
    // their sockets and both read as looking straight ahead. Same rule mirrored for both eyes,
    // in head-local axes, so it scales with the eyeSpread slider.
    const GAZE_SPLAY = 0.3;
    const gaze = new THREE.Vector3(1, -0.02, s * F.eyeSpread * GAZE_SPLAY).normalize();
    eye.quaternion.setFromRotationMatrix(new THREE.Matrix4().lookAt(gaze, new THREE.Vector3(), new THREE.Vector3(0, 1, 0)));
    // eye texture: painted per texel from the direction on the ball (crisp edges)
    const TW = 256, TH = 128, data = new Uint8Array(TW * TH * 4), cc = new THREE.Color(), cA2 = new THREE.Color();
    for (let ty = 0; ty < TH; ty++) for (let tx = 0; tx < TW; tx++) {
      const phi = (tx + 0.5) / TW * Math.PI * 2, th = (1 - (ty + 0.5) / TH) * Math.PI;   // SphereGeometry's UV layout
      const ux = -Math.cos(phi) * Math.sin(th), uy = Math.cos(th), uz = Math.sin(phi) * Math.sin(th);
      const r = Math.hypot(ux, uy) * (uz > 0 ? 1 : 2);
      // iris to the rim, a thin soft dark line, a wide oval pupil, two glints
      cc.set(coat.eye).lerp(cA2.set(0x4a4542), smooth(0.7, 0.76, r));
      cc.lerp(cA2.set(0x7d8a32), smooth(0.25, 0.7, r) * 0.35);
      if (uz > 0) {
        cc.lerp(cA2.set(0x1e1c1b), smooth(1.03, 0.97, Math.hypot(ux / 0.38, uy / 0.54)));
        // glints on the same side in both eyes (one light), so they don't fake a cross-eyed look
        cc.lerp(cA2.set(0xffffff), smooth(0.17, 0.15, Math.hypot(ux - 0.2, uy - 0.24)));
        cc.lerp(cA2.set(0xffffff), smooth(0.075, 0.06, Math.hypot(ux + 0.17, uy + 0.22)));
      }
      const o = (ty * TW + tx) * 4;
      cc.convertLinearToSRGB();
      data[o] = cc.r * 255; data[o + 1] = cc.g * 255; data[o + 2] = cc.b * 255; data[o + 3] = 255;
    }
    const tex = new THREE.DataTexture(data, TW, TH); tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = THREE.LinearFilter; tex.needsUpdate = true;
    // rotate the ball so the texture's +Z (phi = π/2 front) faces out
    const eg = new THREE.SphereGeometry(ER, 48, 32);
    const ball = piece(eg, new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.15, clearcoat: 0.8, clearcoatRoughness: 0.1 }));
    // eyelid: a thin face-coloured shell hugging the ball; hidden up inside the head when open
    const lid = new THREE.Group(); lid.name = `cat-eyelid-${side}`;
    const lidM = piece(new THREE.SphereGeometry(ER * 1.035, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: coat.base, roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.4, side: THREE.DoubleSide }));
    lid.add(lidM);
    lid.userData.open = -1.75; lid.userData.shut = 1.68;
    // the closed eye: a soft curved line where the lid meets the cheek, only shown when shut
    const arcPts = [];
    for (let q = -1; q <= 1.001; q += 0.125) {
      const ax = ER * 0.82 * q, ay = -ER * 0.32 * (1 - q * q) + 0.05, R2 = ER * 1.075;
      arcPts.push(new THREE.Vector3(ax, ay, Math.sqrt(Math.max(0, R2 * R2 - ax * ax - ay * ay))));
    }
    const arc = new THREE.CatmullRomCurve3(arcPts);
    const crease = piece(new THREE.TubeGeometry(arc, 16, 0.1, 6), shiny(0x3a3633, 0.5));
    crease.name = `cat-crease-${side}`; crease.visible = false; lid.userData.crease = crease;
    // the smiling eye: an upward arch (^), drawn over the shut lid
    const smPts = [];
    for (let q = -1; q <= 1.001; q += 0.125) {
      const ax = ER * 0.8 * q, ay = ER * 0.42 * (1 - q * q) - ER * 0.22, R2 = ER * 1.075;
      smPts.push(new THREE.Vector3(ax, ay, Math.sqrt(Math.max(0, R2 * R2 - ax * ax - ay * ay))));
    }
    const smile = piece(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(smPts), 16, 0.11, 6), shiny(0x3a3633, 0.5));
    smile.name = `cat-smile-${side}`; smile.visible = false; lid.userData.smile = smile;
    eye.add(crease, smile);
    lid.rotation.x = lid.userData.open;
    eye.add(ball, lid);
    head.add(eye);
    // ear: a soft flattened cone, grey outside, pink inside, facing forward
    const ear = new THREE.Group(); ear.name = `cat-ear-${side}`;
    ear.position.set(hc[0] - 0.5, hc[1] + F.earUp, s * F.earSpread);
    ear.rotation.x = s * 0.2;
    const face = new THREE.Group(); face.rotation.y = Math.PI / 2;      // cone's flat front (+Z) → +X
    const earShape = (r, h) => {
      const g2 = new THREE.ConeGeometry(r, h, 24, 6), ep = g2.attributes.position;
      for (let i = 0; i < ep.count; i++) {
        const t = (ep.getY(i) + h / 2) / h, k = 1 + 0.08 * Math.sin(Math.PI * t);
        ep.setX(i, ep.getX(i) * k); ep.setZ(i, ep.getZ(i) * k * 0.55);
        if (t > 0.9) ep.setY(i, ep.getY(i) - (t - 0.9) * h * 0.2);
      }
      g2.computeVertexNormals(); return g2;
    };
    // tall pointed ears for the smaller triangular head
    const outer = piece(earShape(1.6, 3.6), baseM); outer.position.y = 1.4;
    const inner = piece(earShape(0.95, 2.5), shiny(coat.ear, 0.5)); inner.position.set(0, 1.1, 0.45); inner.rotation.x = -0.1;
    face.add(outer, inner); ear.add(face); head.add(ear);
  }
  const nose = sph(0.55, 0.4, 0.72, shiny(coat.nose, 0.3)); nose.position.set(hc[0] + F.headD + 0.3, hc[1] + F.noseY, 0);
  head.add(nose);
  const lineM = shiny(0x5a4a48, 0.5);
  for (const s of [-1, 1]) {
    const c = new THREE.QuadraticBezierCurve3(new THREE.Vector3(hc[0] + F.headD + 0.3, hc[1] + F.noseY - 0.35, 0), new THREE.Vector3(hc[0] + F.headD + 0.35, hc[1] + F.noseY - 1.25, s * 0.45), new THREE.Vector3(hc[0] + F.headD, hc[1] + F.noseY - 1.1, s * 1.05));
    head.add(piece(new THREE.TubeGeometry(c, 8, 0.09, 5), lineM));
  }
  // sized for the smaller head (slender-cat pass) so the open mouth stays inside the muzzle
  const mouth = sph(0.42, 0.46, 0.4, shiny(0x7d4644, 0.6)); mouth.name = "cat-mouth";
  mouth.position.set(hc[0] + F.headD - 0.45, hc[1] + F.noseY - 1.55, 0); mouth.scale.setScalar(0.01);
  head.add(mouth);
  // paw pads: one heel pad and three toe beans under each paw, pink
  const padM = shiny(coat.pad || coat.nose, 0.45);
  const pads = (b, cx, cz) => {
    const bAbs = b.userData.abs;
    // sized for the thinner paws (slender-cat pass, ×0.8)
    const heel = sph(0.6, 0.14, 0.68, padM, [16, 8]); heel.position.set(cx - bAbs[0] - 0.2, 0.1 - bAbs[1], 0); b.add(heel);
    for (const dz of [-0.6, 0, 0.6]) {
      const t = sph(0.29, 0.12, 0.29, padM, [12, 8]); t.position.set(cx - bAbs[0] + 0.9 - Math.abs(dz) * 0.3, 0.12 - bAbs[1], dz); b.add(t);
    }
    void cz;
  };
  for (const k of ["l", "r"]) { pads(byName[`leg-f${k}-wrist`], 6.8, 0); pads(byName[`leg-h${k}-hock`], -5.5, 0); }

  const g = new THREE.Group(); g.name = name;
  g.add(kit.part(name, { mount: "surface", order: 1 }, rig));
  g.userData.coat = coat;
  g.userData.triangles = index.length / 3;
  void V;
  return g;
}

// ---------------------------------------------------------------------------
// Animation. Each pose is a small set of numbers (body height and pitch, head angles,
// where each foot is, tail curve). Poses blend, motions blend on top, and two-bone IK
// puts the legs where the feet are asked to be, so paws stay planted.

const ease = (u) => u * u * (3 - 2 * u);
const clamp01 = (u) => Math.min(1, Math.max(0, u));
/** 0 → 1 → 0 over u ∈ [0,1], holding at 1 between `a` and `b`. */
const hold = (u, a = 0.3, b = 0.7) => (u < a ? ease(u / a) : u > b ? ease((1 - u) / (1 - b)) : 1);
const DUR = { flick: 2.6, ear: 0.9, blink: 0.7, squint: 2.4, smile: 2.8, stretch: 7, lookUp: 4.5, jump: 2.4 };
const LEGS = ["fl", "fr", "hl", "hr"];

/** Pose params: y/rz body, chest/hips/neck pitch, head pitch (world)/yaw, feet [x, y, angle, twist], tail [rz, ry]×5. */
const P = (o) => ({
  y: 0, rz: 0, chest: 0, hips: 0, neck: 0, hp: 0, hy: 0,
  feet: { fl: [6.0, 1.7, 0, 0], fr: [6.0, 1.7, 0, 0], hl: [-7.4, 2.7, 0, 0], hr: [-7.4, 2.7, 0, 0] },
  tail: [[-0.9, 0], [-0.2, 0], [0.15, 0], [0.35, 0], [0.45, 0]], ...o,
});
const LOAF = P({
  y: -8.6, hp: 0.05, hy: -0.45, neck: -0.15,
  feet: { fl: [8.6, 1.35, 0, 0], fr: [8.9, 1.35, 0, 0], hl: [-9.2, 1.25, 0.82, 0], hr: [-9.2, 1.25, 0.82, 0] },
  tail: [[0.75, 0.55], [-0.75, 0.55], [0, 0.55], [0, 0.5], [0, 0.45]],
});
const SIT = P({
  y: -3.8, rz: 0.6, chest: 0.05, hips: -0.1, neck: -0.2, hp: 0.0, hy: -0.3,
  feet: { fl: [7.4, 1.7, 0, 0], fr: [7.6, 1.7, 0, 0], hl: [-5.6, 1.15, 0.82, 0], hr: [-5.6, 1.15, 0.82, 0] },
  tail: [[-1.3, 0.9], [1.05, 0.75], [0.05, 0.75], [0, 0.7], [0, 0.55]],
});
const STAND = P({});

function mix(a, b, w) {
  if (typeof a === "number") return a + (b - a) * w;
  if (Array.isArray(a)) return a.map((v, i) => mix(v, b[i], w));
  const o = {}; for (const k in a) o[k] = mix(a[k], b[k], w); return o;
}

/**
 * createCatAnimator(cat, { reduced, speed, amplitude, idle })
 * → { update(dt), play(name, arg), setPose, lick, gaitRate, speed, amplitude, idle, reduced }
 * names: "breathe" (no-op) · "flick" · "ear" · "blink" · "squint" · "smile" · "stretch" ·
 *        "lookUp" (arg: THREE.Vector3 world point) · "jump" (arg: {x,y,z} start offset in cat space)
 * Poses (blended over ~0.4 s): setPose("loaf" | "walk" | "sit"). walk: diagonal pairs of legs
 * step together; the caller moves the cat along its +X and may set gaitRate (strides/s, 1.6).
 */
export function createCatAnimator(cat, { reduced = false, speed = 1, amplitude = 1, idle = true } = {}) {
  const J = (n) => cat.getObjectByName(`cat-${n}`);
  const j = {
    rig: J("rig"), root: J("root"), hips: J("hips"), chest: J("chest"), neck: J("neck"), head: J("head"), mouth: J("mouth"),
    earL: J("ear-l"), earR: J("ear-r"), lidL: J("eyelid-l"), lidR: J("eyelid-r"),
    tail: [0, 1, 2, 3, 4].map((i) => J(`tail-${i}`)),
  };
  const chain = {};
  for (const k of ["l", "r"]) {
    chain[`f${k}`] = { a: J(`leg-f${k}-shoulder`), b: J(`leg-f${k}-elbow`), c: J(`leg-f${k}-wrist`), bend: -1, par: "chest", end: B.toe };
    chain[`h${k}`] = { a: J(`leg-h${k}-hip`), b: J(`leg-h${k}-knee`), c: J(`leg-h${k}-hock`), bend: 1, par: "hips", end: B.foot };
  }
  for (const ch of Object.values(chain)) {
    const A = ch.a.userData.abs, Bp = ch.b.userData.abs, C = ch.c.userData.abs, E = ch.end;
    ch.l1 = Math.hypot(Bp[0] - A[0], Bp[1] - A[1]); ch.l2 = Math.hypot(C[0] - Bp[0], C[1] - Bp[1]);
    ch.r1 = Math.atan2(Bp[1] - A[1], Bp[0] - A[0]); ch.r2 = Math.atan2(C[1] - Bp[1], C[0] - Bp[0]);
    void E;
  }
  const all = [...Object.values(j).flat(), ...Object.values(chain).flatMap((c) => [c.a, c.b, c.c])];
  const rest = new Map();
  for (const o of all) rest.set(o, { p: o.position.clone(), r: o.rotation.clone(), s: o.scale.clone() });

  const active = new Map();
  const rand = Math.random;
  const timers = { flick: 3 + rand() * 4, ear: 6 + rand() * 8, blink: 3 + rand() * 4, stretch: 60 + rand() * 60 };
  let clock = 0, phase = 0, lick = 0, lickTimer = 4 + rand() * 4;
  const pose = { walk: 0, sit: 0 }, poseTarget = { walk: 0, sit: 0 };
  const api = { speed, amplitude, idle, reduced, update, play, setPose, lick: () => { if (pose.sit >= 1) lick = 0.0001; }, gaitRate: 1.6 };
  const tmpV = cat.position.clone();

  function setPose(name) {
    if (!["loaf", "walk", "sit"].includes(name)) throw new Error(`cat: unknown pose ${name}`);
    poseTarget.walk = name === "walk" ? 1 : 0;
    poseTarget.sit = name === "sit" ? 1 : 0;
  }
  function play(name, arg) {
    if (name === "breathe") return;
    if (!(name in DUR)) throw new Error(`cat: unknown motion ${name}`);
    if (api.reduced && (name === "jump" || name === "stretch")) return;
    if (name === "lookUp" && arg) arg = lookAngles(arg);
    if (name === "jump" && active.has("jump")) return;
    active.set(name, { t: 0, dur: DUR[name], arg });
  }
  function lookAngles(world) {
    j.rig.updateMatrixWorld(true);
    const local = j.rig.worldToLocal(world.clone());
    const h = j.head.getWorldPosition(tmpV.clone()); j.rig.worldToLocal(h);
    const d = local.sub(h);
    const c = (v, m) => Math.max(-m, Math.min(m, v));
    return { yaw: c(Math.atan2(-d.z, d.x) + 0.3, 0.9), pitch: c(Math.atan2(d.y, Math.hypot(d.x, d.z)), 0.55) };
  }

  function walkParams(A) {
    const o = P({});
    const c0 = Math.cos(phase * 2);
    o.y = 0.35 * c0 * A; o.rz = 0.02 * Math.sin(phase) * A; o.hp = -0.12;
    const PH = { fl: 0, hr: 0, fr: Math.PI, hl: Math.PI };
    for (const k of LEGS) {
      const s = Math.sin(phase + PH[k]), c = Math.cos(phase + PH[k]), lift = Math.max(0, c) * A;
      const f = o.feet[k];
      o.feet[k] = k[0] === "f"
        ? [f[0] + 2.6 * s * A, f[1] + 1.9 * lift, -0.8 * lift, 0]
        : [f[0] + 2.6 * s * A, f[1] + 1.7 * lift, -0.5 * lift, 0];
    }
    const sw = Math.sin(phase) * 0.12;
    o.tail = [[-1.05, sw], [-0.25, sw], [0.15, sw], [0.4, sw * 1.5], [0.55, sw * 2]];
    return o;
  }

  function update(dt) {
    dt = Math.min(dt, 0.1) * api.speed;
    clock += dt;
    const A = api.amplitude;
    if (api.idle && !api.reduced && !active.has("jump")) {
      for (const k of Object.keys(timers)) {
        timers[k] -= dt;
        if (timers[k] <= 0) {
          if (!active.has("stretch") && !active.has("lookUp")) play(k === "blink" ? (rand() < 0.25 ? "squint" : rand() < 0.1 ? "smile" : k) : k);
          timers[k] = k === "stretch" ? 60 + rand() * 60 : k === "flick" ? 3 + rand() * 5 : k === "ear" ? 6 + rand() * 10 : 3 + rand() * 5;
        }
      }
    }
    for (const [o, s] of rest) { o.position.copy(s.p); o.rotation.copy(s.r); o.scale.copy(s.s); }
    for (const l of [j.lidL, j.lidR]) { l.userData.crease.visible = false; l.userData.smile.visible = false; }

    for (const k of ["walk", "sit"]) {
      const d = poseTarget[k] - pose[k];
      pose[k] += Math.sign(d) * Math.min(Math.abs(d), dt / 0.4);
    }
    if (pose.walk > 0) phase += dt * api.gaitRate * Math.PI * 2 * Math.max(0.3, pose.walk);
    // base pose: loaf ⇄ walk ⇄ sit
    let p = LOAF;
    if (pose.walk > 0) p = mix(p, walkParams(A), ease(pose.walk));
    if (pose.sit > 0) {
      lickTimer -= dt;
      if (lickTimer <= 0 && pose.sit >= 1 && !api.reduced) { lick = 0.0001; lickTimer = 6 + rand() * 6; }
      if (lick > 0) { lick += dt / 2.8; if (lick >= 1) lick = 0; }
      let sit = SIT;
      if (lick > 0) {
        const h = hold(lick, 0.22, 0.78), lap = Math.sin(lick * Math.PI * 10) * h;
        sit = mix(sit, P({
          ...SIT, hp: -0.55 + 0.08 * lap, hy: -0.45, neck: -0.05,
          feet: { ...SIT.feet, fl: [10.6, 13.4 + 0.3 * lap, 2.4, -0.5] },
        }), h * Math.min(1, A));
        j.mouth.scale.setScalar(0.01 + 0.45 * Math.max(0, lap));
        lid(0.55 * h);
      }
      p = mix(p, sit, ease(pose.sit));
    }
    // motions that move the whole body blend in as poses
    for (const [name, a] of active) {
      a.t += dt;
      const u = clamp01(a.t / a.dur);
      if (name === "stretch") p = stretch(p, u, A);
      else if (name === "jump") p = jump(p, u, a.arg);
    }
    apply(p);
    // 1. breathing — always on (≈ 4 s per breath)
    const br = Math.sin(clock * Math.PI * 2 / 4) * (api.reduced ? 0.4 : 1) * A;
    j.chest.scale.y *= 1 + 0.025 * br; j.chest.scale.z *= 1 + 0.02 * br;
    for (const [name, a] of active) if (MOTIONS[name]) MOTIONS[name](clamp01(a.t / a.dur), A, a.arg);
    for (const [name, a] of active) if (a.t >= a.dur) active.delete(name);
  }

  function apply(p) {
    j.root.position.y += p.y; j.root.rotation.z = p.rz;
    j.chest.rotation.z = p.chest; j.hips.rotation.z = p.hips; j.neck.rotation.z = p.neck;
    j.head.rotation.z = p.hp - p.rz - p.chest - p.neck; j.head.rotation.y = p.hy;
    p.tail.forEach(([rz, ry], i) => { j.tail[i].rotation.z = rz; j.tail[i].rotation.y = ry; });
    j.rig.updateMatrixWorld(true);
    for (const k of LEGS) ik(chain[k], p.feet[k], (k[0] === "f" ? p.chest : p.hips) + p.rz);
  }

  const wp = cat.position.clone();
  function ik(ch, [tx, ty, ang, tw], pa) {
    ch.a.getWorldPosition(wp); j.rig.worldToLocal(wp);
    const dx = tx - wp.x, dy = ty - wp.y;
    const D = Math.min(ch.l1 + ch.l2 - 0.001, Math.max(Math.abs(ch.l1 - ch.l2) + 0.05, Math.hypot(dx, dy)));
    const th = Math.atan2(dy, dx);
    const al = Math.acos(Math.min(1, Math.max(-1, (ch.l1 * ch.l1 + D * D - ch.l2 * ch.l2) / (2 * ch.l1 * D))));
    const ga = Math.acos(Math.min(1, Math.max(-1, (ch.l1 * ch.l1 + ch.l2 * ch.l2 - D * D) / (2 * ch.l1 * ch.l2))));
    const up = th + ch.bend * al, low = up - ch.bend * (Math.PI - ga);
    ch.a.rotation.z = wrap(up - ch.r1 - pa);
    ch.b.rotation.z = wrap(low - ch.r2 - pa - ch.a.rotation.z);
    ch.c.rotation.z = ang - pa - ch.a.rotation.z - ch.b.rotation.z;
    ch.c.rotation.x = tw;
  }
  const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

  // stretch: stand up into a long bow — front paws reach far ahead, rump up, a big yawn
  function stretch(p, u, A) {
    const s = hold(u, 0.25, 0.65), up = hold(u, 0.12, 0.8);
    const stand = mix(p, P({ hp: 0 }), up);
    const bow = P({
      y: -2.2, rz: -0.3, chest: -0.05, neck: 0.15, hp: 0.25, hy: 0,
      feet: { fl: [14.5, 1.6, 0, 0], fr: [14.0, 1.6, 0, 0], hl: [-7.6, 2.7, 0, 0], hr: [-7.6, 2.7, 0, 0] },
      tail: [[-1.2, 0], [-0.3, 0], [0.1, 0], [0.3, 0], [0.4, 0]],
    });
    return mix(stand, bow, s * Math.min(1, A));
  }
  // jump: crouch at the start point, spring up in an arc with the body long, land and settle
  function jump(p, u, from = { x: -45, y: -42, z: 25 }) {
    const fly = clamp01((u - 0.15) / 0.4), k = ease(fly), arc = Math.sin(Math.PI * fly);
    j.rig.position.set(from.x * (1 - k), from.y * (1 - k) + arc * 22, from.z * (1 - k));
    j.rig.rotation.z = 0.35 * Math.sin(Math.PI * clamp01(fly * 1.4)) - 0.25 * Math.sin(Math.PI * clamp01((fly - 0.5) * 2));
    const crouch = P({ y: -3.2, hp: 0.1, feet: { fl: [6.5, 1.7, 0, 0], fr: [6.5, 1.7, 0, 0], hl: [-8.0, 2.7, 0.3, 0], hr: [-8.0, 2.7, 0.3, 0] } });
    const long = P({ y: 1, hp: 0, feet: { fl: [11.5, 5.5, -0.5, 0], fr: [11.0, 5, -0.5, 0], hl: [-12.5, 6, 0.8, 0], hr: [-12.0, 5.5, 0.8, 0] }, tail: [[-0.3, 0], [0, 0], [0.1, 0], [0.1, 0], [0.1, 0]] });
    const land = P({ y: -2.5, feet: { fl: [8.0, 1.7, 0, 0], fr: [8.0, 1.7, 0, 0], hl: [-7.4, 2.7, 0, 0], hr: [-7.4, 2.7, 0, 0] } });
    let q;
    if (u < 0.15) q = mix(STAND, crouch, ease(u / 0.1 > 1 ? 1 : u / 0.1));
    else if (u < 0.55) q = fly < 0.5 ? mix(crouch, long, ease(fly * 2.5 > 1 ? 1 : fly * 2.5)) : mix(long, land, ease((fly - 0.5) * 2));
    else q = mix(land, p, ease(clamp01((u - 0.55) / 0.35)));
    return q;
  }

  const MOTIONS = {
    flick(u, A) {
      const env = Math.sin(Math.PI * u), sway = Math.sin(u * Math.PI * 4) * env;
      j.tail[3].rotation.z -= 0.25 * env * A; j.tail[3].rotation.y += 0.25 * sway * A;
      j.tail[4].rotation.y += 0.5 * sway * A; j.tail[4].rotation.z -= 0.2 * env * A;
    },
    ear(u, A) {
      const e = Math.sin(Math.PI * u) * Math.exp(-2 * u) * 2;
      j.earR.rotation.z += 0.5 * e * A; j.earR.rotation.x -= 0.25 * e * A;
    },
    blink(u) { lid(Math.sin(Math.PI * u)); },
    squint(u) { lid(0.58 * hold(u, 0.35, 0.65)); },
    // smile: eyes shut into upward arches (^ ^), head tips up a little, ears soften
    smile(u, A) {
      const h = hold(u, 0.15, 0.82);
      lid(h); if (h > 0.9) for (const l of [j.lidL, j.lidR]) { l.userData.crease.visible = false; l.userData.smile.visible = true; }
      j.head.rotation.z += 0.12 * h * A; j.head.rotation.x += 0.06 * h * A;
      j.earL.rotation.z -= 0.1 * h * A; j.earR.rotation.z -= 0.1 * h * A;
    },
    stretch(u, A) {
      const y = hold(clamp01((u - 0.2) / 0.45), 0.3, 0.6);
      j.mouth.scale.setScalar(0.01 + 0.75 * y * A);
      lid(0.85 * y);
      j.head.rotation.z += 0.3 * y * A;
      j.earL.rotation.z += 0.3 * y * A; j.earR.rotation.z += 0.3 * y * A;
    },
    lookUp(u, A, ang = { yaw: 0.2, pitch: 0.45 }) {
      const h = hold(u, 0.22, 0.7);
      j.neck.rotation.z += 0.15 * h * A;
      j.head.rotation.y += ang.yaw * h;
      j.head.rotation.z += ang.pitch * h - 0.15 * h;
      j.earL.rotation.z -= 0.12 * h; j.earR.rotation.z -= 0.12 * h;
      if (u > 0.3 && u < 0.4) lid(Math.sin(Math.PI * (u - 0.3) / 0.1));
    },
  };
  function lid(c) {
    for (const l of [j.lidL, j.lidR]) {
      const { open, shut } = l.userData, now = (l.rotation.x - open) / (shut - open);
      const k = Math.max(now, clamp01(c));
      l.rotation.x = open + (shut - open) * k;
      l.userData.crease.visible = k > 0.93 && !l.userData.smile.visible;
    }
  }

  update(0);
  return api;
}
