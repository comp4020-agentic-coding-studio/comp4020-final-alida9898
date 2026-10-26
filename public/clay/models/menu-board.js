// Café menu board: chunky brown frame, charcoal slate, a mustard cup emblem and short
// cream "menu" lines with price dots + a small category dot and a faint divider
// (shapes, no text). An optional small seasonal accent sits in the top-right corner.
// One part `<name>` (wall). Origin: bottom-centre, back flush with the wall (z = 0).
// Front faces +Z. Default 72 × 60 cm.
export function build(kit, { name = "menu-board", width = 72, height = 60, lines = 4, season = null } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const W = width, H = height, F = 5;
  const bar = (w, h, x, y) => { const b = kit.roundedBox(w, h, 4, 1.6, "brown"); b.position.set(x, y, 2); return b; };
  const frame = [bar(F, H, -W / 2 + F / 2, H / 2), bar(F, H, W / 2 - F / 2, H / 2), bar(W, F, 0, F / 2), bar(W, F, 0, H - F / 2)];
  const slate = kit.roundedBox(W - 2 * F + 1, H - 2 * F + 1, 2, 0.6, "charcoal"); slate.position.set(0, H / 2, 1.5);
  const zf = 3;
  // cup emblem, top centre
  const cupFace = kit.roundedBox(8, 5.5, 0.8, 1.6, "mustard"); cupFace.position.set(-1, H - F - 8, zf);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.7, 8, 16), kit.clay("mustard")); handle.position.set(4.2, H - F - 8, zf);
  const steam = [-2.5, 0.5].map((x) => { const s = kit.capsule(0.6, 4, "cream"); s.position.set(x, H - F - 2.5, zf); s.rotation.z = 0.25; return s; });
  const rows = [];
  const widths = [32, 22, 30, 18, 26, 34, 24, 28];
  const dotSizes = [2.0, 1.5, 2.3, 1.3, 1.8];
  const markers = ["leaf", "blue", "soil", "terracotta"];
  const top = H - F - 17, step = (H - 2 * F - 20) / Math.max(1, lines);
  for (let k = 0; k < lines; k++) {
    const w = widths[k % widths.length];
    const y = top - k * step;
    const ln = kit.roundedBox(w, 2.2, 0.8, 0.7, "cream"); ln.position.set(-W / 2 + F + 5 + w / 2, y, zf);
    // faint divider under the line, reading as a recessed rule rather than text
    const rule = kit.roundedBox(w * 0.75, 0.5, 0.4, 0.2, 0x3e3833); rule.position.set(-W / 2 + F + 5 + w * 0.375, y - 1.9, zf - 0.2);
    // price dot, size varies per row
    const ds = dotSizes[k % dotSizes.length];
    const dot = kit.blob(ds, ds, 0.6, k % 2 ? "terracotta" : "mustard"); dot.position.set(W / 2 - F - 6, y, zf);
    // small category marker dot, just left of the price dot
    const marker = kit.blob(0.9, 0.9, 0.5, markers[k % markers.length]); marker.position.set(W / 2 - F - 10.5, y, zf);
    rows.push(ln, rule, dot, marker);
  }
  const accent = seasonAccent(kit, THREE, season, W, H, F, zf);
  g.add(kit.part(name, { mount: "wall", order: 1 }, ...frame, slate, cupFace, handle, ...steam, ...rows, ...accent));
  return g;
}

// A small seasonal accent shape, tucked in the slate's top-right corner (clear of the
// cup emblem). Simple geometric approximations, consistent with the rest of the board.
function seasonAccent(kit, THREE, season, W, H, F, zf) {
  if (!season) return [];
  const cx = W / 2 - F - 8, cy = H - F - 6;
  if (season === "spring") {
    // tiny blossom: four pale-pink petals around a mustard centre
    const petals = [0, 1, 2, 3].map((i) => {
      const a = (i / 4) * Math.PI * 2;
      const p = kit.blob(1.1, 0.8, 0.45, 0xe9bcd0);
      p.position.set(cx + Math.cos(a) * 1.3, cy + Math.sin(a) * 1.3, zf);
      p.rotation.z = a;
      return p;
    });
    const center = kit.blob(0.7, 0.7, 0.5, "mustard"); center.position.set(cx, cy, zf + 0.2);
    return [...petals, center];
  }
  if (season === "summer") {
    // tiny sun: mustard disc with four short terracotta rays
    const disc = kit.blob(1.6, 1.6, 0.5, "mustard"); disc.position.set(cx, cy, zf);
    const rays = [0, 1, 2, 3].map((i) => {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const r = kit.capsule(0.4, 1.6, "terracotta");
      r.position.set(cx + Math.cos(a) * 2.2, cy + Math.sin(a) * 2.2, zf);
      r.rotation.z = a + Math.PI / 2;
      return r;
    });
    return [disc, ...rays];
  }
  if (season === "autumn") {
    // tiny leaf: a flattened terracotta blob with a brown stem
    const leaf = kit.blob(1.5, 1.0, 0.45, "terracotta"); leaf.position.set(cx, cy, zf); leaf.rotation.z = 0.5;
    const stem = kit.capsule(0.3, 1.6, "brown"); stem.position.set(cx - 1.5, cy - 1.0, zf); stem.rotation.z = 0.9;
    return [leaf, stem];
  }
  if (season === "winter") {
    // tiny snowflake: a pale-blue centre with three crossing capsule arms
    const center = kit.blob(0.6, 0.6, 0.45, 0xcfe3ee); center.position.set(cx, cy, zf);
    const arms = [0, 1, 2].map((i) => {
      const a = (i / 3) * Math.PI;
      const arm = kit.capsule(0.3, 3.2, 0xcfe3ee);
      arm.position.set(cx, cy, zf);
      arm.rotation.z = a;
      return arm;
    });
    return [center, ...arms];
  }
  return [];
}
