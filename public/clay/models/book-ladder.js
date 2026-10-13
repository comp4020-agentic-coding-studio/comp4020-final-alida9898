// Rolling library ladder: one part `<name>` — two rails, rungs, two castor wheels at the
// feet and a hook at the top that rests on a shelf's crown. It leans back toward −Z.
// Origin: bottom-centre between the wheels. Front +Z. ~50 w; the top reaches `height`
// and sits `lean` cm behind the feet (default 230 h, 60 lean).
export function build(kit, { name = "book-ladder", height = 230, lean = 60, wood = 0xb07a50 } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const len = Math.hypot(height, lean), ang = Math.atan2(lean, height); // tilt about X
  const W = 48, m = [];
  const frame = new THREE.Group();
  for (const s of [-1, 1]) { const r = kit.roundedBox(5, len, 4, 1.8, wood); r.position.set(s * W / 2, len / 2, 0); frame.add(r); }
  for (let y = 26; y < len - 10; y += 30) { const r = kit.roundedBox(W, 3.5, 6, 1.4, wood); r.position.set(0, y, 0); frame.add(r); }
  for (const s of [-1, 1]) { // brass-ish hooks over the top
    const h = kit.roundedBox(4, 4, 10, 1.5, "mustard"); h.position.set(s * W / 2, len, -4); frame.add(h);
  }
  frame.position.y = 6; frame.rotation.x = -ang; m.push(frame);
  for (const s of [-1, 1]) {
    const wheel = kit.roundedCylinder(5, 4, 1.5, "charcoal"); wheel.rotation.z = Math.PI / 2; wheel.position.set(s * (W / 2 + 2), 5, 0); m.push(wheel);
  }
  g.add(kit.part(name, { mount: "floor", order: 1 }, ...m));
  return g;
}
