// Hanging OPEN sign: a cream board with a terracotta border on a cord from a wall hook,
// "OPEN" as four chunky clay shapes (no text). One part `<name>` (wall).
// Origin: bottom-centre of the board, back flush with the wall (z = 0). Front faces +Z.
// ~32 w × 30 h (incl. cord) cm.
export function build(kit, { name = "open-sign", color = "terracotta" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const W = 32, H = 15, D = 2.4;
  const board = kit.roundedBox(W, H, D, 1.6, color); board.position.set(0, H / 2, D / 2 + 0.4);
  const face = kit.roundedBox(W - 4, H - 4, 1, 0.6, "cream"); face.position.set(0, H / 2, D + 0.6);
  const zf = D + 1.3, y = H / 2;
  // O · P · E · N as rounded blocks
  const O = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.95, 10, 24), kit.clay("charcoal")); O.position.set(-9.6, y, zf);
  const Pst = kit.roundedBox(1.8, 6.4, 1, 0.5, "charcoal"); Pst.position.set(-4.6, y, zf);
  const Pb = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.8, 8, 16), kit.clay("charcoal")); Pb.position.set(-3.2, y + 1.6, zf);
  const Est = kit.roundedBox(1.8, 6.4, 1, 0.5, "charcoal"); Est.position.set(0.8, y, zf);
  const Ebars = [2.6, 0, -2.6].map((dy) => { const b = kit.roundedBox(3.6, 1.5, 1, 0.5, "charcoal"); b.position.set(2.4, y + dy, zf); return b; });
  const N1 = kit.roundedBox(1.8, 6.4, 1, 0.5, "charcoal"); N1.position.set(6.6, y, zf);
  const N2 = kit.roundedBox(1.8, 6.4, 1, 0.5, "charcoal"); N2.position.set(10.4, y, zf);
  const Nd = kit.roundedBox(1.7, 6.6, 1, 0.5, "charcoal"); Nd.position.set(8.5, y, zf); Nd.rotation.z = 0.55;
  // cord in a V up to a mustard hook
  const top = H + 11;
  const cord = (s) => { const c = kit.capsule(0.6, 14, "brown"); c.position.set(s * 6, H + 5, 1.6); c.rotation.z = s * 0.95; return c; };
  const hook = kit.blob(1.8, 1.8, 1.4, "mustard"); hook.position.set(0, top - 1, 1.4);
  g.add(kit.part(name, { mount: "wall", order: 1 }, board, face, O, Pst, Pb, Est, ...Ebars, N1, N2, Nd, cord(-1), cord(1), hook));
  return g;
}
