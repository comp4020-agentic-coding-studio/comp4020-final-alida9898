// Shop sign on a post: a rounded cream board with a big clay flower emblem (no text),
// a little leaf garland along the top, on a wooden post with a stone foot. One part
// `<name>` (floor). Origin: bottom-centre. Front +Z. ~64 w × 140 h.
export function build(kit, { name = "flower-sign" } = {}) {
  const g = new kit.THREE.Group(); g.name = name;
  const m = [];
  const foot = kit.blob(14, 4, 12, 0xbdb3a2); foot.position.y = 4; m.push(foot);
  const post = kit.roundedBox(7, 100, 7, 2, "brown"); post.position.y = 54; m.push(post);
  const board = kit.roundedBox(64, 42, 5, 6, "cream"); board.position.set(0, 112, 4); m.push(board);
  const frame = kit.roundedBox(68, 46, 3, 7, 0xb07a52); frame.position.set(0, 112, 1); m.push(frame);
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; const p = kit.blob(6, 6, 2, 0xe07a8a); p.position.set(Math.cos(a) * 7, 112 + Math.sin(a) * 7, 7.5); m.push(p); }
  const eye = kit.blob(4, 4, 2.4, "mustard"); eye.position.set(0, 112, 9); m.push(eye);
  for (let i = 0; i < 7; i++) { const l = kit.blob(4, 2, 2.4, i % 2 ? "leaf" : 0x6a8a4c); l.position.set(-27 + i * 9, 136, 4); l.rotation.z = i % 2 ? 0.4 : -0.4; m.push(l); }
  g.add(kit.part(name, { mount: "floor", order: 1 }, ...m));
  return g;
}
