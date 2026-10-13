// Brick bread oven: a chunky clay-brick block on a stone plinth, a domed top with a
// short chimney, an arched dark mouth with a glowing ember bed and a wooden ledge.
// One part `<name>` (floor). Origin: bottom-centre on the floor. Front faces +Z.
// Default 110 w × 80 d, ~175 h (chimney top). Ledge top at y = LEDGE_Y.
export const LEDGE_Y = 82;
export function build(kit, { name = "bakery-oven", width = 110, depth = 80 } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const W = width, D = depth, m = [];
  const brick = 0xb85c3e, brickDk = 0x9c4a32, stone = 0xcfc3b0;
  const plinth = kit.roundedBox(W, 26, D, 3, stone); plinth.position.y = 13; m.push(plinth);
  const body = kit.roundedBox(W - 6, 84, D - 6, 6, brick); body.position.y = 26 + 42; m.push(body);
  // brick courses: a few raised slabs in a darker tone on the front face
  const r = kit.rng(3);
  for (let row = 0; row < 6; row++) for (let i = 0; i < 4; i++) {
    const x = -W / 2 + 14 + i * ((W - 28) / 3) + (row % 2 ? 9 : -9);
    if (Math.abs(x) < 28 && row < 5) continue; // leave the mouth clear
    const b = kit.roundedBox(20, 9, 2, 1.2, r() < 0.5 ? brickDk : 0xc96a48);
    b.position.set(Math.max(-W / 2 + 13, Math.min(W / 2 - 13, x)), 34 + row * 13, D / 2 - 2.4); m.push(b);
  }
  const dome = kit.blob(W / 2 - 4, 30, D / 2 - 4, brick); dome.position.y = 110; m.push(dome);
  const chim = kit.roundedCylinder(9, 50, 2, brickDk); chim.position.set(W / 4, 122, -D / 6); m.push(chim);
  const cap = kit.roundedCylinder(12, 5, 2, "charcoal"); cap.position.set(W / 4, 170, -D / 6); m.push(cap);
  // arched mouth: dark recess + glowing embers
  const mouth = kit.roundedBox(50, 36, 4, 3, 0x2e2622); mouth.position.set(0, 64, D / 2 - 3.5); m.push(mouth);
  const arch = kit.blob(25, 14, 2, 0x2e2622); arch.position.set(0, 82, D / 2 - 3.5); m.push(arch);
  const archRim = kit.roundedBox(58, 5, 5, 2, stone); archRim.position.set(0, 94, D / 2 - 2); m.push(archRim);
  for (let i = 0; i < 5; i++) {
    const e = kit.blob(5 + r() * 3, 2.5, 4, i % 2 ? 0xe08a3a : 0xf0b04a);
    e.position.set(-16 + i * 8, 49, D / 2 - 4); m.push(e);
  }
  const ledge = kit.roundedBox(64, 5, 14, 2, "brown"); ledge.position.set(0, LEDGE_Y - 2.5 - 38, D / 2 + 4); m.push(ledge);
  g.add(kit.part(name, { mount: "floor", order: 1 }, ...m));
  return g;
}
