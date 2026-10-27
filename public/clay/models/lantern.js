// Little hanging lantern: a charcoal frame around pale glass panes, a warm glowing
// candle inside, and a ring handle on top. Built a touch larger than life so it reads
// as a clear silhouette perched on something. One part `<name>` (surface). Origin:
// bottom-centre, narrow footprint so it can sit along a ridge without sinking in.
// ~9 w × 17 h × 9 d cm. opts: `metal` (frame), `glow` (candle colour).
export function build(kit, { name = "lantern", metal = "charcoal", glow = 0xffc070 } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const m = [];
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xdfeaf0, roughness: 0.25, metalness: 0, transparent: true, opacity: 0.3, depthWrite: false });
  const base = kit.roundedBox(8.4, 1.6, 8.4, 0.6, metal); base.position.y = 0.8; m.push(base);
  const body = new THREE.Mesh(new THREE.BoxGeometry(7, 9, 7), glass); body.position.y = 1.6 + 4.5; body.renderOrder = 2; m.push(body);
  // corner posts
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const post = kit.roundedBox(1, 9, 1, 0.4, metal); post.position.set(sx * 3.3, 1.6 + 4.5, sz * 3.3); m.push(post);
  }
  const lid = kit.lathe([[0, 0], [5.4, 0], [5.6, 1], [1.4, 3.4], [0, 3.8]], metal, { round: 0.6 }); lid.position.y = 1.6 + 9; m.push(lid);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.4, 8, 16), kit.clay(metal)); ring.position.y = 1.6 + 9 + 3.9; ring.rotation.x = Math.PI / 2; m.push(ring);
  // warm candle glow inside, with a small emissive flame
  const glowMat = new THREE.MeshStandardMaterial({ color: glow, emissive: glow, emissiveIntensity: 0.8, roughness: 0.6 });
  const candle = kit.roundedCylinder(1.3, 3.4, 0.4, "cream"); candle.position.y = 2.2; m.push(candle);
  const flame = kit.blob(0.7, 1.1, 0.7, glowMat); flame.position.y = 2.2 + 3.4 + 0.8; flame.castShadow = false; m.push(flame);
  g.add(kit.part(name, { mount: "surface", order: 1 }, ...m));
  return g;
}
