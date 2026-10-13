// Café menu board: chunky brown frame, charcoal slate, a mustard cup emblem and short
// cream "menu" lines with price dots (shapes, no text). One part `<name>` (wall).
// Origin: bottom-centre, back flush with the wall (z = 0). Front faces +Z. Default 72 × 60 cm.
export function build(kit, { name = "menu-board", width = 72, height = 60, lines = 4 } = {}) {
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
  const top = H - F - 17, step = (H - 2 * F - 20) / Math.max(1, lines);
  for (let k = 0; k < lines; k++) {
    const w = [32, 26, 30, 22, 28][k % 5];
    const y = top - k * step;
    const ln = kit.roundedBox(w, 2.2, 0.8, 0.7, "cream"); ln.position.set(-W / 2 + F + 5 + w / 2, y, zf);
    const dot = kit.blob(1.8, 1.8, 0.6, k % 2 ? "terracotta" : "mustard"); dot.position.set(W / 2 - F - 6, y, zf);
    rows.push(ln, dot);
  }
  g.add(kit.part(name, { mount: "wall", order: 1 }, ...frame, slate, cupFace, handle, ...steam, ...rows));
  return g;
}
