// Chunky mug of hot chocolate: a tall swirl of whipped cream piled above the rim,
// dusted with cocoa, two mini marshmallows on top, and a cinnamon stick leaning in.
// One part `<name>` (surface). Origin: bottom-centre. Front faces +Z (handle to +X).
// opts: `color` (mug body), `band` (rim stripe or null). ~10 cm across, 17 cm tall incl. cream.
export function build(kit, { name = "hot-chocolate-mug", color = "terracotta", band = "cream" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const m = [];
  const body = kit.lathe([[0, 0], [4.6, 0], [5, 1], [5, 10.5], [4, 10.5], [4, 1.6], [0, 1.6]], color, { round: 0.8 });
  m.push(body);
  if (band) { const b = kit.lathe([[4.9, 0], [5.3, 0], [5.3, 1.7], [4.9, 1.7]], band, { round: 0.4 }); b.position.y = 7; m.push(b); }
  const handle = new THREE.Mesh(new THREE.TorusGeometry(2.9, 1.1, 10, 20), kit.clay(color));
  handle.castShadow = true; handle.position.set(6, 5.6, 0); handle.scale.set(0.9, 1.1, 1); m.push(handle);
  // cocoa fill just under the rim
  const cocoa = kit.roundedCylinder(3.6, 0.8, 0.3, 0x3a2418); cocoa.position.y = 10.4; m.push(cocoa);
  // a generous whipped-cream swirl, piled up well above the rim for a prominent top
  const swirlColors = ["white", "white", "cream"];
  const swirl = [
    [3.9, 2.4, 10.8], [3.1, 2.2, 12.9], [2.4, 2, 14.7], [1.7, 1.8, 16.1], [1, 1.6, 17.2],
  ];
  for (const [i, [r, h, y]] of swirl.entries()) {
    const seg = kit.roundedCylinder(r, h, Math.min(1.4, r * 0.4), swirlColors[i % swirlColors.length]);
    seg.position.y = y - h; m.push(seg);
  }
  const peak = kit.blob(0.9, 1.2, 0.9, "white"); peak.position.y = 18; m.push(peak);
  // cocoa dusting dots over the cream
  const r = kit.rng(9);
  for (let i = 0; i < 10; i++) {
    const a = r() * Math.PI * 2, rr = r() * 3.2;
    const dot = kit.blob(0.3, 0.14, 0.3, 0x5a3626);
    dot.position.set(Math.cos(a) * rr, 15.4 + r() * 2, Math.sin(a) * rr);
    m.push(dot);
  }
  // two mini marshmallows sitting on the cream
  for (const [x, z, c] of [[-1.6, 1.4, "cream"], [1.5, -1.2, "white"]]) {
    const mallow = kit.roundedBox(1.7, 1.5, 1.7, 0.6, c); mallow.position.set(x, 16.6, z); mallow.rotation.y = x; m.push(mallow);
  }
  // a cinnamon stick leaning out of the cream
  const stick = kit.capsule(0.35, 9, 0x8a5a3c); stick.position.set(2.6, 15, -0.6); stick.rotation.z = -0.9; stick.rotation.x = 0.2; m.push(stick);
  g.add(kit.part(name, { mount: "surface", order: 1 }, ...m));
  return g;
}
