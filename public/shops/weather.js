// Season weather: a sky, an extended grass field with a few far-off clay trees,
// fog for depth, and a light drift of particles (petals / motes / leaves / snow).
//
//   import { createWeather } from "/shops/weather.js";
//   const weather = createWeather(scene, { season, bounds: { x: [x0, x1], z: [z0, z1] }, groundY: -1 });
//   // each frame: weather.update(dt)   ·   on teardown: weather.dispose()
//
// `bounds` is the playable area in world cm (the clay kit's units). The grass plane
// is laid just below groundY so the scene's own floor/ground sits on top; the far
// trees ring the outside of bounds; particles fall inside bounds (a bit above it).
// Sets scene.background (a gradient texture) and scene.fog — the caller should not
// render with an opaque clear colour over it. prefers-reduced-motion: no particles.
// `keepOut` ({x, z} footprint, optional): no particles drift there — pass a building so it stays dry indoors.
// `renderer`/`camera` are accepted for future use and may be omitted.
import * as kit from "/clay/clay.js";

const { THREE } = kit;

// grass matches shops/cafe/yard/scenery.js
export const WEATHER = {
  spring: { top: "#a9cbe6", bottom: "#f8eedc", fog: 0xf3ead9, grass: 0xa9c07e, crown: [0x9fbf6a, 0xf2c4d0], bits: { n: 40, colors: [0xf2b8c6, 0xf7cfd8, 0xfaf6ef], size: 4, fall: 22, sway: 30 } },
  summer: { top: "#6fb0e3", bottom: "#eaf2f0", fog: 0xe4eee8, grass: 0x8fae68, crown: [0x6f9a4e, 0x86ad5c], bits: { n: 14, colors: [0xfff4c4], size: 2, fall: 6, sway: 12 } },
  autumn: { top: "#e8b779", bottom: "#f6dcc6", fog: 0xf1dcc4, grass: 0xb5b075, crown: [0xd9822f, 0xc8694a, 0xe0a23a], bits: { n: 36, colors: [0xd9822f, 0xc8694a, 0xe0a23a, 0xb5532e], size: 6, fall: 30, sway: 40 } },
  winter: { top: "#b8c7d6", bottom: "#eef0f2", fog: 0xe8ecef, grass: 0xbcc2a8, crown: [0xe9ece8, 0x9aa88c], bits: { n: 70, colors: [0xffffff, 0xf3f1ec], size: 3, fall: 28, sway: 14 } },
};

function skyTexture(top, bottom) {
  const c = document.createElement("canvas"); c.width = 4; c.height = 256;
  const g = c.getContext("2d"), grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, top); grad.addColorStop(0.75, bottom); grad.addColorStop(1, bottom);
  g.fillStyle = grad; g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createWeather(scene, { season = "spring", bounds = { x: [-500, 500], z: [-500, 500] }, groundY = 0, keepOut = null } = {}) {
  const look = WEATHER[season] || WEATHER.spring;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const r = kit.rng(29);
  const [x0, x1] = bounds.x, [z0, z1] = bounds.z;
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, span = Math.max(x1 - x0, z1 - z0);
  const group = new THREE.Group(); group.name = "weather"; scene.add(group);
  const owned = [];   // geometries / materials / textures to dispose

  const prevBg = scene.background, prevFog = scene.fog;
  const sky = skyTexture(look.top, look.bottom); owned.push(sky);
  scene.background = sky;
  scene.fog = new THREE.Fog(look.fog, span * 2.5, span * 9);

  // ground: a wide flat grass plane, just under the scene's own floor
  const gGeo = new THREE.PlaneGeometry(span * 14, span * 14), gMat = new THREE.MeshLambertMaterial({ color: look.grass });
  owned.push(gGeo, gMat);
  const ground = new THREE.Mesh(gGeo, gMat);
  ground.rotation.x = -Math.PI / 2; ground.position.set(cx, groundY - 2, cz); ground.receiveShadow = true;
  group.add(ground);

  // far trees: instanced trunks + round crowns, in a loose ring outside bounds
  const N = 26;
  const trunkGeo = new THREE.CylinderGeometry(8, 11, 1, 8), crownGeo = new THREE.SphereGeometry(1, 14, 10);
  const trunkMat = kit.clay(0x8a6a4c), crownMat = new THREE.MeshPhysicalMaterial({ roughness: 0.85, sheen: 0.25 });
  owned.push(trunkGeo, crownGeo, crownMat);
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, N), crowns = new THREE.InstancedMesh(crownGeo, crownMat, N);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color();
  const hw = (x1 - x0) / 2, hd = (z1 - z0) / 2;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 + r() * 0.2, k = 1.35 + r() * 0.9;
    const x = cx + Math.cos(a) * (hw + span * 0.35) * k, z = cz + Math.sin(a) * (hd + span * 0.35) * k;
    const s = 0.8 + r() * 0.8, th = 90 * s, cr = 70 * s;
    m4.compose(new THREE.Vector3(x, groundY + th / 2, z), q, new THREE.Vector3(s, th, s)); trunks.setMatrixAt(i, m4);
    m4.compose(new THREE.Vector3(x, groundY + th + cr * 0.7, z), q, new THREE.Vector3(cr, cr * (0.85 + r() * 0.3), cr)); crowns.setMatrixAt(i, m4);
    crowns.setColorAt(i, col.setHex(look.crown[i % look.crown.length]));
  }
  for (const m of [trunks, crowns]) { m.castShadow = false; m.receiveShadow = true; group.add(m); }

  // particles: a handful of small flakes drifting down over bounds
  let bits = null, state = null;
  const b = look.bits, top = span * 0.55;
  if (!reduced && b) {
    const geo = season === "winter" || season === "summer" ? new THREE.SphereGeometry(1, 6, 4) : new THREE.CircleGeometry(1, 7);
    const mat = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide });
    owned.push(geo, mat);
    bits = new THREE.InstancedMesh(geo, mat, b.n); bits.castShadow = false; bits.frustumCulled = false;
    state = Array.from({ length: b.n }, (_, i) => {
      bits.setColorAt(i, col.setHex(b.colors[i % b.colors.length]));
      return { x: x0 + r() * (x1 - x0), y: groundY + r() * top, z: z0 + r() * (z1 - z0), ph: r() * 6.28, spin: (r() - 0.5) * 3, s: b.size * (0.7 + r() * 0.6), sp: 0.7 + r() * 0.6 };
    });
    group.add(bits);
  }
  const rot = new THREE.Euler(), pos = new THREE.Vector3(), scl = new THREE.Vector3();
  // keepOut: {x:[..], z:[..]} footprint (e.g. a building) where nothing should drift — it's indoors
  const inside = (x, z) => keepOut && x > keepOut.x[0] && x < keepOut.x[1] && z > keepOut.z[0] && z < keepOut.z[1];
  let t = 0;
  function update(dt = 0) {
    if (!bits) return;
    t += dt;
    for (const [i, p] of state.entries()) {
      p.y -= b.fall * p.sp * dt;
      if (p.y < groundY) { p.y = groundY + top; p.x = x0 + r() * (x1 - x0); p.z = z0 + r() * (z1 - z0); }
      pos.set(p.x + Math.sin(t * 0.7 + p.ph) * b.sway, p.y, p.z + Math.cos(t * 0.5 + p.ph) * b.sway * 0.5);
      if (inside(pos.x, pos.z)) pos.y = -1e5; // parked out of sight while over the building
      rot.set(t * p.spin + p.ph, t * p.spin * 0.6, p.ph);
      m4.compose(pos, q.setFromEuler(rot), scl.set(p.s, p.s * (season === "autumn" ? 0.7 : 1), p.s));
      bits.setMatrixAt(i, m4);
    }
    bits.instanceMatrix.needsUpdate = true;
  }
  update(0);

  return {
    group, animated: !!bits, update,
    dispose() {
      scene.remove(group);
      for (const o of owned) o.dispose();
      for (const m of [trunks, crowns, bits]) m?.dispose?.();
      if (scene.background === sky) scene.background = prevBg;
      scene.fog = prevFog;
    },
  };
}
