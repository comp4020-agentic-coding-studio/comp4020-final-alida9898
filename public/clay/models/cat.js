// Chunky clay cat lying in a loaf, for the bay window seat. One part `<name>` (surface).
// Origin: bottom-centre of the loaf (where it rests on the cushion). Front faces +Z;
// the head sits at the +X end, turned slightly toward the viewer. ~30 cm long.
// opts: `coat` — a key of COATS (default "tabby") or a coat object.
//
// Named joints (for animation; found with getObjectByName):
//   cat-body · cat-head · cat-ear-l/-r · cat-eyelid-l/-r · cat-mouth
//   cat-tail-0 … cat-tail-4 (chain, 4 = tip) · cat-leg-fl/-fr (front paws) · cat-leg-back
// The whole rig hangs off `cat-rig`, which the jump moves.

export const COATS = {
  tabby: { label: ["橘猫", "Orange tabby"], base: 0xe0995a, stripe: 0xb8693a, belly: 0xf3e3c8, nose: 0xd98c8c, ear: 0xe8b5a0, eye: 0x3a2e28, paws: null, patches: null },
  calico: {
    label: ["三花", "Calico"], base: 0xf6efe3, stripe: null, belly: 0xf6efe3, nose: 0xd98c8c, ear: 0xe8b5a0, eye: 0x3a2e28, paws: null,
    patches: [[0xd98a4a, -6, 14, 3, 7, 5, 7], [0x4a4440, 4, 15, -3, 6, 4.5, 6], [0xd98a4a, 0, 7, 8, 4, 3.5, 3]],
    headPatch: [0x4a4440, -2.5, 3.5, 2],
  },
  black: { label: ["黑猫", "Black"], base: 0x3d3835, stripe: null, belly: 0x4d4642, nose: 0x6b5450, ear: 0x6b5450, eye: 0xc9a43a, paws: null, patches: null },
  tuxedo: { label: ["奶牛猫", "Tuxedo"], base: 0x3d3835, stripe: null, belly: 0xf6efe3, nose: 0xd98c8c, ear: 0x8a6a64, eye: 0x7a9a5a, paws: 0xf6efe3, patches: null },
};

export function build(kit, opts = {}) {
  const { THREE } = kit;
  const { name = "cat" } = opts;
  const coat = typeof opts.coat === "object" ? opts.coat : COATS[opts.coat || "tabby"];
  const pivot = (n, x = 0, y = 0, z = 0) => { const p = new THREE.Group(); p.name = n; p.position.set(x, y, z); return p; };

  const g = new THREE.Group(); g.name = name;
  const rig = pivot("cat-rig");

  // ---- body: one loaf blob, pivot at its base so breathing grows upward ----
  const body = pivot("cat-body");
  const torso = kit.blob(13, 9, 10, coat.base); torso.position.y = 9;
  const chest = kit.blob(6, 6, 4, coat.belly); chest.position.set(9, 7, 6.5);
  body.add(torso, chest);
  if (coat.stripe) {
    for (const x of [-7, -2.5, 2]) {
      const f = Math.sqrt(1 - (x / 13) ** 2);
      const ring = kit.blob(1.3, 9 * f + 0.15, 10 * f + 0.15, coat.stripe);
      ring.position.set(x, 9, 0);
      body.add(ring);
    }
  }
  for (const [c, x, y, z, rx, ry, rz] of coat.patches || []) {
    const p = kit.blob(rx, ry, rz, c); p.position.set(x, y, z); p.scale.multiplyScalar(0.85); body.add(p);
  }
  const haunch = kit.blob(6.5, 5.5, 3, coat.base); haunch.position.set(-6, 6, 7.5);
  body.add(haunch);
  rig.add(body);

  // ---- legs ----
  const legBack = pivot("cat-leg-back", -3, 1.6, 9);
  legBack.add(kit.blob(3.4, 1.6, 2.4, coat.paws ?? coat.base));
  const legFL = pivot("cat-leg-fl", 11, 1.8, 6.5);
  const legFR = pivot("cat-leg-fr", 11.5, 1.8, 1.5);
  for (const leg of [legFL, legFR]) { const paw = kit.blob(3.6, 1.9, 2.3, coat.paws ?? coat.base); paw.position.x = 1.5; leg.add(paw); }
  rig.add(legBack, legFL, legFR);

  // ---- head: pivot at the neck ----
  const head = pivot("cat-head", 9, 13, 2);
  head.rotation.y = 0.35;
  const skull = kit.blob(7.5, 6.6, 6.8, coat.base); skull.position.set(2, 4.5, 1);
  const muzzle = kit.blob(3.4, 2.4, 2, coat.belly); muzzle.position.set(2, 2.6, 7);
  const nose = kit.blob(0.9, 0.65, 0.6, coat.nose); nose.position.set(2, 3.9, 8.8);
  const mouth = kit.blob(1.4, 1.3, 0.6, 0x9a4a4a); mouth.name = "cat-mouth"; mouth.position.set(2, 1.6, 8.1); mouth.scale.set(0.01, 0.01, 0.01);
  head.add(skull, muzzle, nose, mouth);
  if (coat.stripe) {
    for (const dx of [-1.6, 1.6]) { const s = kit.blob(0.8, 2, 1, coat.stripe); s.position.set(2 + dx, 9, 5.6); s.rotation.x = -0.5; head.add(s); }
  }
  if (coat.headPatch) { const [c, x, y, z] = coat.headPatch; const p = kit.blob(4, 3.5, 4.5, c); p.position.set(2 + x, 4.5 + y, 1 + z); head.add(p); }
  for (const [side, dx] of [["l", -2.6], ["r", 2.6]]) {
    const eye = kit.blob(0.95, 1.1, 0.5, coat.eye); eye.position.set(2 + dx, 5.4, 7.2);
    const lid = pivot(`cat-eyelid-${side}`, 2 + dx, 6.6, 7.05);
    const lidMesh = kit.blob(1.3, 1.3, 0.75, coat.base); lidMesh.position.y = -1.2; lid.add(lidMesh);
    lid.scale.y = 0.08;                                         // 0.08 open … 1 closed
    head.add(eye, lid);
    const ear = pivot(`cat-ear-${side}`, 2 + dx * 1.45, 9.3, 0.5);
    ear.rotation.z = -Math.sign(dx) * 0.28;
    const outer = new THREE.Mesh(new THREE.ConeGeometry(2.6, 4.6, 20), kit.clay(coat.base)); outer.castShadow = true; outer.position.y = 1.8;
    const inner = new THREE.Mesh(new THREE.ConeGeometry(1.5, 3, 16), kit.clay(coat.ear)); inner.position.set(0, 1.4, 1.25); inner.rotation.x = -0.12;
    ear.add(outer, inner);
    head.add(ear);
  }
  rig.add(head);

  // ---- tail: 5-segment chain curling from the rump around to the front ----
  let parent = rig;
  const segLen = 5.2, curl = 0.38;
  for (let i = 0; i < 5; i++) {
    const seg = pivot(`cat-tail-${i}`, i === 0 ? -12.5 : segLen, i === 0 ? 2.2 : 0, i === 0 ? 1 : 0);
    seg.rotation.y = i === 0 ? -Math.PI / 2 - 0.1 : curl;
    const r = 1.9 - i * 0.12;
    const m = kit.capsule(r, segLen + r * 2, coat.stripe && i % 2 === 1 ? coat.stripe : coat.base);
    m.rotation.z = Math.PI / 2; m.position.x = segLen / 2;
    seg.add(m);
    parent.add(seg); parent = seg;
  }

  g.add(kit.part(name, { mount: "surface", order: 1 }, rig));
  g.userData.coat = coat;
  return g;
}

// ---------------------------------------------------------------------------
// Animation. Every frame the joints reset to their rest pose, then breathing and
// each running motion add small offsets. All motions are slow and small.

const ease = (u) => u * u * (3 - 2 * u);
const clamp01 = (u) => Math.min(1, Math.max(0, u));
/** 0 → 1 → 0 over u ∈ [0,1], holding at 1 between `a` and `b`. */
const hold = (u, a = 0.3, b = 0.7) => (u < a ? ease(u / a) : u > b ? ease((1 - u) / (1 - b)) : 1);

const DUR = { flick: 2.6, ear: 0.9, blink: 0.7, squint: 2.4, stretch: 7, lookUp: 4.5, jump: 2.4 };

/**
 * createCatAnimator(cat, { reduced, speed, amplitude, idle })
 * → { update(dt), play(name, arg), speed, amplitude, idle }
 * names: "breathe" (no-op, always on) · "flick" · "ear" · "blink" · "squint" · "stretch" ·
 *        "lookUp" (arg: THREE.Vector3 world point) · "jump" (arg: {x,y,z} start offset in cat space)
 * Poses (continuous, blended over ~0.4 s): api.setPose("loaf" | "walk" | "sit").
 *   walk — stands up, legs alternate, small body bob, tail up; the caller moves the cat
 *          (it walks toward its own +X, head first) and sets api.gaitRate (steps/s, default 1.6).
 *   sit  — haunches down, chest and head up, tail curled; now and then licks a paw.
 */
export function createCatAnimator(cat, { reduced = false, speed = 1, amplitude = 1, idle = true } = {}) {
  const J = (n) => cat.getObjectByName(n);
  const j = {
    rig: J("cat-rig"), body: J("cat-body"), head: J("cat-head"), mouth: J("cat-mouth"),
    earL: J("cat-ear-l"), earR: J("cat-ear-r"), lidL: J("cat-eyelid-l"), lidR: J("cat-eyelid-r"),
    legFL: J("cat-leg-fl"), legFR: J("cat-leg-fr"), legBack: J("cat-leg-back"),
    tail: [0, 1, 2, 3, 4].map((i) => J(`cat-tail-${i}`)),
  };
  const rest = new Map();
  for (const o of Object.values(j).flat()) rest.set(o, { p: o.position.clone(), r: o.rotation.clone(), s: o.scale.clone() });

  const active = new Map();             // name → { t, dur, arg }
  const rand = Math.random;
  const timers = { flick: 3 + rand() * 4, ear: 6 + rand() * 8, blink: 3 + rand() * 4, stretch: 60 + rand() * 60 };
  let clock = 0, phase = 0, lick = 0, lickTimer = 4 + rand() * 4;
  const pose = { walk: 0, sit: 0 }, poseTarget = { walk: 0, sit: 0 };
  const api = { speed, amplitude, idle, reduced, update, play, setPose, gaitRate: 1.6 };

  function setPose(name) {
    if (!["loaf", "walk", "sit"].includes(name)) throw new Error(`cat: unknown pose ${name}`);
    poseTarget.walk = name === "walk" ? 1 : 0;
    poseTarget.sit = name === "sit" ? 1 : 0;
  }

  function play(name, arg) {
    if (name === "breathe") return;
    if (!(name in DUR)) throw new Error(`cat: unknown motion ${name}`);
    if (api.reduced && (name === "jump" || name === "stretch")) return;   // big moves off
    if (name === "lookUp" && arg) arg = lookAngles(arg);
    if (name === "jump" && active.has("jump")) return;
    active.set(name, { t: 0, dur: DUR[name], arg });
  }

  function lookAngles(world) {
    // Target in the head's parent frame → yaw/pitch relative to the rest pose.
    const local = j.head.parent.worldToLocal(world.clone());
    const d = local.sub(rest.get(j.head).p);
    const yaw = Math.atan2(d.x, d.z) - rest.get(j.head).r.y;
    const pitch = Math.atan2(d.y, Math.hypot(d.x, d.z));
    const c = (v, m) => Math.max(-m, Math.min(m, v));
    return { yaw: c(yaw, 0.9), pitch: c(pitch, 0.5) };
  }

  function update(dt) {
    dt = Math.min(dt, 0.1) * api.speed;
    clock += dt;
    const A = api.amplitude;

    if (api.idle && !api.reduced && !active.has("jump")) {
      for (const k of Object.keys(timers)) {
        timers[k] -= dt;
        if (timers[k] <= 0) {
          if (!active.has("stretch") && !active.has("lookUp")) play(k === "blink" && rand() < 0.3 ? "squint" : k);
          timers[k] = k === "stretch" ? 60 + rand() * 60 : k === "flick" ? 3 + rand() * 5 : k === "ear" ? 6 + rand() * 10 : 3 + rand() * 5;
        }
      }
    }

    for (const [o, s] of rest) { o.position.copy(s.p); o.rotation.copy(s.r); o.scale.copy(s.s); }

    // 1. breathing — always on (≈ 4 s per breath)
    const br = Math.sin(clock * Math.PI * 2 / 4) * (api.reduced ? 0.4 : 1) * A;
    j.body.scale.y *= 1 + 0.025 * br;
    j.body.scale.z *= 1 + 0.012 * br;
    j.head.position.y += 0.2 * br;
    j.tail[0].position.y += 0.05 * br;

    // poses: blend toward the target, then lay walk / sit on top of breathing
    for (const k of ["walk", "sit"]) {
      const d = poseTarget[k] - pose[k];
      pose[k] += Math.sign(d) * Math.min(Math.abs(d), dt / 0.4);
    }
    if (pose.walk > 0) {
      phase += dt * api.gaitRate * Math.PI * 2 * pose.walk;
      walkPose(ease(pose.walk), A);
    }
    if (pose.sit > 0) {
      lickTimer -= dt;
      if (lickTimer <= 0 && pose.sit >= 1 && !api.reduced) { lick = 0.0001; lickTimer = 6 + rand() * 6; }
      if (lick > 0) { lick += dt / 2.8; if (lick >= 1) lick = 0; }
      sitPose(ease(pose.sit), A, lick);
    }

    for (const [name, a] of active) {
      a.t += dt;
      const u = clamp01(a.t / a.dur);
      MOTIONS[name](u, A, a.arg);
      if (a.t >= a.dur) active.delete(name);
    }
  }

  const MOTIONS = {
    // 2. tail tip: lift a little and sway twice, slowing down
    flick(u, A) {
      const env = Math.sin(Math.PI * u);
      const sway = Math.sin(u * Math.PI * 4) * env;
      j.tail[3].rotation.z += 0.25 * env * A;
      j.tail[3].rotation.y += 0.25 * sway * A;
      j.tail[4].rotation.y += 0.55 * sway * A;
      j.tail[4].rotation.z += 0.2 * env * A;
    },
    // 3. one ear flicks back and returns
    ear(u, A) {
      const e = Math.sin(Math.PI * u) * Math.exp(-2 * u) * 2;
      j.earR.rotation.x -= 0.5 * e * A;
      j.earR.rotation.z += 0.25 * e * A;
    },
    // 4. blink (quick) / squint (slow, half-closed — a cat "slow blink")
    blink(u) { lid(Math.sin(Math.PI * u)); },
    squint(u) { lid(0.75 * hold(u, 0.35, 0.65)); },
    // 5. stretch forward + yawn, then curl back
    stretch(u, A) {
      const s = hold(u, 0.25, 0.6);                     // reach out
      const y = hold(clamp01((u - 0.2) / 0.45), 0.3, 0.6); // yawn inside the stretch
      for (const leg of [j.legFL, j.legFR]) { leg.position.x += 7 * s * A; }
      j.body.scale.x *= 1 + 0.12 * s * A;
      j.body.scale.y *= 1 - 0.1 * s * A;
      j.body.position.x += 1.5 * s * A;
      j.head.position.x += 3 * s * A;
      j.head.position.y -= 1.5 * s * A;
      j.head.rotation.x -= 0.45 * y * A;                // tip the chin up
      j.mouth.scale.setScalar(0.01 + y * A);
      lid(0.85 * y);
      j.earL.rotation.x += 0.3 * y * A; j.earR.rotation.x += 0.3 * y * A;
      j.tail[2].rotation.z += 0.35 * s * A; j.tail[3].rotation.z += 0.25 * s * A;
      j.legBack.position.x -= 2 * s * A;
    },
    // 6. look up toward a world point, then settle back
    lookUp(u, A, ang = { yaw: 0.2, pitch: 0.45 }) {
      const h = hold(u, 0.22, 0.7);
      j.head.position.y += 2.2 * h * A;
      j.head.rotation.y += ang.yaw * h;
      j.head.rotation.x -= ang.pitch * h;
      j.earL.rotation.x -= 0.15 * h; j.earR.rotation.x -= 0.15 * h;   // ears perk forward
      if (u > 0.3 && u < 0.4) lid(Math.sin(Math.PI * (u - 0.3) / 0.1));
    },
    // 7. jump up from the floor in an arc, land, knead down into the loaf
    jump(u, A, from = { x: -45, y: -42, z: 25 }) {
      const fly = clamp01((u - 0.15) / 0.4);           // 0.15–0.55 airborne
      const crouch = u < 0.15 ? hold(u / 0.15, 0.6, 1) : 0;
      const land = u > 0.55 ? hold((u - 0.55) / 0.45, 0.15, 0.4) : 0;
      const k = ease(fly);
      j.rig.position.x += from.x * (1 - k);
      j.rig.position.z += from.z * (1 - k);
      j.rig.position.y += from.y * (1 - k) + Math.sin(Math.PI * fly) * 22;
      j.rig.rotation.z += Math.sin(Math.PI * fly) * 0.35 - Math.sin(Math.PI * clamp01(fly * 2)) * 0.15 * (fly < 0.5 ? 1 : 0);
      const stand = u < 0.55 ? 1 : 1 - ease(clamp01((u - 0.55) / 0.3)); // standing body until it settles
      j.body.position.y += 6 * stand;
      j.body.scale.y *= 1 - 0.15 * crouch - 0.12 * land;
      j.body.scale.x *= 1 + 0.12 * Math.sin(Math.PI * fly) + 0.05 * land;
      j.head.position.y += 5 * stand;
      for (const leg of [j.legFL, j.legFR, j.legBack]) leg.position.y += 3 * stand;
      j.legFL.position.x += 5 * Math.sin(Math.PI * fly); j.legFR.position.x += 5 * Math.sin(Math.PI * fly);
      j.legBack.position.x -= 6 * Math.sin(Math.PI * fly);
      j.tail[0].rotation.z += 0.7 * stand; j.tail[1].rotation.y -= 0.3 * stand;
      void A;
    },
  };

  function walkPose(w, A) {
    const s = Math.sin(phase), c = Math.cos(phase);
    j.body.position.y += (6 + 0.5 * Math.abs(c)) * w;   // stand up, bob twice per stride
    j.body.rotation.x += 0.03 * s * w * A;
    j.head.position.y += (6 + 0.4 * Math.abs(c)) * w;
    j.head.rotation.y -= 0.3 * w;                        // look where it's going
    j.head.rotation.x += 0.05 * s * w;
    // legs: stretch the paws into legs, swing front pair in opposition, back follows
    for (const [leg, ph] of [[j.legFL, 0], [j.legFR, Math.PI], [j.legBack, Math.PI / 2]]) {
      const sw = Math.sin(phase + ph);
      leg.position.y += 2.4 * w + Math.max(0, Math.cos(phase + ph)) * 1.4 * w;
      leg.scale.y *= 1 + 1.4 * w;
      leg.position.x += 2.6 * sw * w * A;
    }
    j.legFR.position.z -= 1 * w;
    j.legBack.position.z -= 4 * w;
    j.tail[0].rotation.z += 1.1 * w;                     // tail up, tip curls
    j.tail[0].rotation.y += 0.6 * w;
    for (const t of j.tail.slice(1)) t.rotation.y -= 0.32 * w;
    j.tail[3].rotation.z += 0.2 * w; j.tail[4].rotation.z += 0.35 * w + 0.12 * s * w;
  }

  function sitPose(w, A, lk) {
    j.body.rotation.z += 0.32 * w;                       // chest up, rump down
    j.body.position.x -= 3 * w;
    j.body.scale.x *= 1 - 0.12 * w;
    j.head.position.y += 5 * w;
    j.head.position.x -= 3 * w;
    j.head.rotation.y -= 0.2 * w;
    j.legFL.position.x -= 3 * w; j.legFR.position.x -= 3 * w;
    j.legFL.position.y += 1.2 * w; j.legFR.position.y += 1.2 * w;
    j.legFL.scale.y *= 1 + 1.2 * w; j.legFR.scale.y *= 1 + 1.2 * w;
    if (lk > 0) {                                        // lift a paw, dip the head to it
      const h = hold(lk, 0.25, 0.75), lap = Math.sin(lk * Math.PI * 10) * h;
      j.legFL.position.y += 5 * h * A; j.legFL.position.x += 1 * h; j.legFL.rotation.z += 0.8 * h;
      j.head.rotation.x += 0.35 * h + 0.06 * lap; j.head.rotation.y += 0.25 * h;
      j.mouth.scale.setScalar(0.01 + 0.4 * Math.max(0, lap));
      lid(0.6 * h);
    }
  }

  function lid(c) {
    for (const l of [j.lidL, j.lidR]) l.scale.y = Math.max(l.scale.y, 0.08 + 0.92 * clamp01(c));
  }

  return api;
}
