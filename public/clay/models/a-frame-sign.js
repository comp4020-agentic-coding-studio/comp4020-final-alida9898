// A-frame chalkboard sign: two wooden-framed boards leaning together, a bean
// emblem and menu lines (shapes, no text) on the front. One part `<name>` (floor).
// Origin: bottom-centre on the floor. Front faces +Z. ~46 w × 80 h cm.
export function build(kit, { name = "a-frame-sign" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const W = 46, L = 82, lean = 0.2, F = 3; // board length along slope, lean angle, frame width
  const board = (front) => {
    const b = new THREE.Group();
    const fr = (w, h, x, y) => { const m = kit.roundedBox(w, h, 3, 1.2, "brown"); m.position.set(x, y, 0); return m; };
    b.add(fr(F, L, -W / 2 + F / 2, L / 2), fr(F, L, W / 2 - F / 2, L / 2), fr(W, F, 0, L - F / 2), fr(W, F, 0, 8));
    const slate = kit.roundedBox(W - 2 * F + 0.4, L - 8 - 2 * F + 1, 1.6, 0.6, "charcoal"); slate.position.set(0, (L + 8) / 2 + 0.2 - F / 2 + 0.2, -0.2);
    b.add(slate);
    if (front) {
      const zs = 0.9;
      // bean emblem
      const bean = kit.blob(6, 8, 1, "mustard"); bean.position.set(0, L - 18, zs); bean.rotation.z = 0.35;
      const crease = kit.capsule(0.8, 12, "charcoal"); crease.position.set(0, L - 18, zs + 0.8); crease.rotation.z = 0.35;
      b.add(bean, crease);
      // menu lines: chalk dashes + mustard price dots
      const lines = [[26, 0], [20, 1], [24, 0], [17, 1]];
      lines.forEach(([w, dot], k) => {
        const y = L - 34 - k * 8.5;
        const ln = kit.roundedBox(w, 1.8, 0.6, 0.6, "cream"); ln.position.set(-W / 2 + F + 4 + w / 2, y, zs); b.add(ln);
        const pr = kit.blob(1.6, 1.6, 0.5, dot ? "terracotta" : "mustard"); pr.position.set(W / 2 - F - 5, y, zs); b.add(pr);
      });
    }
    return b;
  };
  const front = board(true); front.rotation.x = -lean; front.position.z = Math.sin(lean) * L; // apex meets the back board at z = 0
  const back = board(false); back.rotation.x = lean; back.rotation.y = Math.PI; back.position.z = -Math.sin(lean) * L;
  const hinge = kit.capsule(1.2, W - 2, "charcoal"); hinge.rotation.z = Math.PI / 2; hinge.position.y = Math.cos(lean) * L;
  g.add(kit.part(name, { mount: "floor", order: 1 }, front, back, hinge));
  return g;
}
