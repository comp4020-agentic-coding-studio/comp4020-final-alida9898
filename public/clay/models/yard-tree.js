// Yard tree whose crown follows the season: spring = green with pink blossom, summer =
// deep green, autumn = orange and russet, winter = bare branches with snow on top.
// One part `<name>` (floor) — scenery, not a placed item. Origin: bottom-centre of the
// trunk. Front +Z. ~300 cm tall, crown ~190 Ø. TRUNK_R = trunk radius at bird-house height.
export const TRUNK_R = 11;
export const CROWN = {
  spring: { leaves: [0x8fb86a, 0x7aa65a, 0x9cc276], dots: [0xf2b8c6, 0xf7cfd8, 0xfaf6ef] },
  summer: { leaves: [0x5f8a45, 0x52793b, 0x6b9850], dots: [] },
  autumn: { leaves: [0xd9822f, 0xc8694a, 0xe0a23a], dots: [0xb5532e] },
  winter: { leaves: [], dots: [] },
};

export function build(kit, { name = "yard-tree", season = "spring", seed = 3 } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const r = kit.rng(seed), m = [];
  const bark = 0x7a5238;
  // trunk: a gently tapering lathe, a root flare at the base
  m.push(kit.lathe([[0, 0], [20, 0], [14, 8], [TRUNK_R + 1, 30], [TRUNK_R, 120], [9, 170], [0, 170]], bark, { round: 3 }));
  // main limbs
  const limb = (len, tz, ry, y = 150, rad = 5) => {
    const p = new THREE.Group(); p.position.y = y; p.rotation.set(0, ry, tz);
    const c = kit.capsule(rad, len, bark); c.position.y = len / 2; p.add(c);
    return p;
  };
  const limbs = [limb(90, 0.55, 0.3), limb(85, -0.6, -0.4), limb(80, 0.35, 2.2, 160), limb(95, -0.25, 1.4, 165), limb(70, 0.1, 0, 165, 4.5)];
  m.push(...limbs);
  const crown = CROWN[season] || CROWN.spring;
  // crown clumps on a rough dome
  const spots = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + r() * 0.4, rad = i < 9 ? 55 + r() * 25 : 20 + r() * 20;
    spots.push([Math.cos(a) * rad, 215 + (i < 9 ? r() * 30 : 45 + r() * 25), Math.sin(a) * rad * 0.8]);
  }
  if (crown.leaves.length) {
    for (const [i, [x, y, z]] of spots.entries()) {
      const s = 34 + r() * 14;
      const c = kit.blob(s, s * 0.8, s * 0.9, crown.leaves[i % crown.leaves.length]); c.position.set(x, y, z); m.push(c);
    }
    // blossom / odd-coloured leaves dotted over the crown surface
    for (let i = 0; i < (crown.dots.length ? 40 : 0); i++) {
      const [x, y, z] = spots[i % spots.length];
      const v = new THREE.Vector3(r() - 0.5, r() * 0.9 + 0.1, r() - 0.5).normalize().multiplyScalar(36);
      const d = kit.blob(5, 4.4, 5, crown.dots[i % crown.dots.length]); d.position.set(x + v.x, y + v.y, z + v.z); m.push(d);
    }
  } else {
    // winter: bare twigs off each limb end, a cap of snow on the upper ones
    for (const [i, [x, y, z]] of spots.slice(0, 9).entries()) {
      const tw = kit.capsule(2.4, 50, bark);
      tw.position.set(x * 0.8, y - 30, z * 0.8); tw.rotation.set(r() - 0.5, 0, Math.atan2(-x, 60)); m.push(tw);
      if (i % 2 === 0) { const sn = kit.blob(9, 3, 7, "white"); sn.position.set(x * 0.8, y - 4, z * 0.8); m.push(sn); }
    }
    for (const l of limbs.slice(0, 4)) {
      const sn = kit.blob(8, 3, 8, "white"); sn.position.copy(l.position).add(new THREE.Vector3(0, 32, 0)); m.push(sn);
    }
  }
  g.add(kit.part(name, { mount: "floor", order: 1 }, ...m));
  return g;
}
