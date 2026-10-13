// Garden bench: slatted wooden seat + back on two chunky charcoal side frames.
// One part `<name>` (floor). Origin: bottom-centre on the ground. Front faces +Z.
// ~120 w × 48 d × 82 h cm, seat top at y = SEAT_Y.
export const SEAT_Y = 44;

export function build(kit, { name = "garden-bench", width = 120, wood = "brown", metal = "charcoal" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const W = width, m = [];
  const slat = new THREE.Color(kit.PALETTE[wood]).multiplyScalar(1.18).getHex();
  // seat: four slats front to back
  for (let i = 0; i < 4; i++) {
    const s = kit.roundedBox(W, 3.5, 9, 1.4, i % 2 ? slat : wood);
    s.position.set(0, SEAT_Y - 1.75, -15 + i * 10.5); m.push(s);
  }
  // back: three slats, leaning back a little
  const back = new THREE.Group();
  for (let i = 0; i < 3; i++) { const s = kit.roundedBox(W, 8, 3, 1.3, i % 2 ? wood : slat); s.position.set(0, 8 + i * 11, 0); back.add(s); }
  back.position.set(0, SEAT_Y + 2, -20); back.rotation.x = -0.16; m.push(back);
  // side frames: front leg, back leg rising into the back support, arm rest
  for (const sx of [-1, 1]) {
    const x = sx * (W / 2 - 8);
    const fl = kit.roundedBox(5, SEAT_Y, 5, 2, metal); fl.position.set(x, SEAT_Y / 2, 16); m.push(fl);
    const bl = kit.roundedBox(5, SEAT_Y + 36, 5, 2, metal); bl.position.set(x, (SEAT_Y + 36) / 2, -21); bl.rotation.x = -0.1; m.push(bl);
    const rail = kit.roundedBox(5, 4, 42, 2, metal); rail.position.set(x, SEAT_Y - 5, -2); m.push(rail);
    const arm = kit.roundedBox(7, 4, 40, 2, wood); arm.position.set(sx * (W / 2 - 4), SEAT_Y + 18, -2); m.push(arm);
    const ap = kit.roundedBox(4, 18, 4, 1.6, metal); ap.position.set(sx * (W / 2 - 4), SEAT_Y + 9, 15); m.push(ap);
  }
  g.add(kit.part(name, { mount: "floor", order: 1 }, ...m));
  return g;
}
