// Small tent menu card for a counter: a folded cream card with a pink blossom emblem and
// three short lines (shapes, no text). One part `<name>` (surface). Origin: bottom-centre.
// Front +Z. ~14 w × 7 d × 12 h cm.
export function build(kit, { name = "menu-card", color = 0xf2b8c6 } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const m = [];
  const leaf = (sz) => {
    const p = new THREE.Group(); p.rotation.x = sz * 0.28;
    const card = kit.roundedBox(14, 12.5, 0.8, 0.4, "cream"); card.position.y = 6.2; p.add(card);
    if (sz < 0) {
      // front face: blossom emblem + lines
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2, f = kit.blob(1.1, 1.1, 0.4, color);
        f.position.set(Math.cos(a) * 1.4, 9 + Math.sin(a) * 1.4, 0.6); p.add(f);
      }
      const c = kit.blob(0.8, 0.8, 0.4, "mustard"); c.position.set(0, 9, 0.8); p.add(c);
      for (const [y, w] of [[5.4, 9], [3.6, 7], [1.8, 8]]) { const l = kit.roundedBox(w, 0.9, 0.4, 0.3, "brown"); l.position.set(0, y, 0.6); p.add(l); }
    }
    p.position.z = -sz * 1.8;
    return p;
  };
  m.push(leaf(-1), leaf(1));
  g.add(kit.part(name, { mount: "surface", order: 1 }, ...m));
  return g;
}
