// Pile of raked fallen leaves on the ground: a low mound of overlapping blobs in warm
// autumn colours, a few loose leaves scattered just outside it. One part `<name>` (floor).
// Origin: bottom-centre of the pile. ~60 Ø × 18 h cm — a deliberately big, noticeable heap
// (bigger than ambient ground scatter) so it reads from across the yard.
export function build(kit, { name = "leaf-pile", radius = 30, colors = [0xd9822f, 0xc8694a, 0xe0a23a, 0xb5532e] } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const m = [];
  const r = kit.rng(29);
  const R = radius;

  // the mound: three overlapping squashed domes, biggest in the middle
  const mounds = [
    { x: 0, z: 0, s: R, h: R * 0.42 },
    { x: -R * 0.42, z: R * 0.18, s: R * 0.62, h: R * 0.3 },
    { x: R * 0.4, z: -R * 0.15, s: R * 0.58, h: R * 0.28 },
  ];
  for (const mo of mounds) {
    const dome = kit.blob(mo.s, mo.h, mo.s * 0.92, colors[0]);
    dome.position.set(mo.x, mo.h * 0.55, mo.z);
    m.push(dome);
  }

  // individual leaf blobs tiled over the surface so it doesn't read as a plain bump
  const n = 22;
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2, rad = r() * R * 0.95;
    const falloff = 1 - (rad / (R * 0.95)) * 0.65;
    const y = 2 + falloff * R * 0.4 + r() * 2;
    const s = 3 + r() * 2.4;
    const leaf = kit.blob(s, 0.6, s * 0.7, colors[(i + 1) % colors.length]);
    leaf.position.set(Math.sin(a) * rad, y, Math.cos(a) * rad);
    leaf.rotation.y = r() * Math.PI;
    leaf.rotation.x = (r() - 0.5) * 0.4;
    m.push(leaf);
  }

  // a few stray leaves just outside the pile, as if blown loose
  for (let i = 0; i < 4; i++) {
    const a = r() * Math.PI * 2, rad = R * 1.05 + r() * R * 0.35;
    const s = 3 + r() * 2;
    const leaf = kit.blob(s, 0.5, s * 0.7, colors[i % colors.length]);
    leaf.position.set(Math.sin(a) * rad, 0.5, Math.cos(a) * rad);
    leaf.rotation.y = r() * Math.PI;
    m.push(leaf);
  }

  g.add(kit.part(name, { mount: "floor", order: 1 }, ...m));
  return g;
}
