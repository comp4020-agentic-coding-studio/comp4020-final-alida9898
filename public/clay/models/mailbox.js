// Mailbox on a wooden post: a rounded-top box, little door at the front, a terracotta flag.
// One part `<name>` (floor). Origin: bottom-centre on the ground. Front (door) faces +Z. ~110 cm tall.
export function build(kit, { name = "mailbox", color = "blue", post = "brown" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const m = [];
  const foot = kit.roundedBox(16, 4, 16, 1.5, post); foot.position.y = 2; m.push(foot);
  const p = kit.roundedBox(8, 88, 8, 2.5, post); p.position.y = 46; m.push(p);
  const arm = kit.roundedBox(14, 4, 30, 1.6, post); arm.position.set(0, 88, 0); m.push(arm);
  const body = kit.roundedBox(20, 16, 36, 3, color); body.position.set(0, 98, 0); m.push(body);
  // rounded roof: a cylinder along Z whose lower half sits inside the box
  const top = new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 36, 24), kit.clay(color));
  top.rotation.x = Math.PI / 2;
  top.position.set(0, 106, 0); top.castShadow = true; m.push(top);
  const door = kit.roundedBox(18, 22, 2, 2, "cream"); door.position.set(0, 101, 18.5); m.push(door);
  const knob = kit.blob(1.6, 1.6, 1.4, "mustard"); knob.position.set(0, 104, 20.5); m.push(knob);
  const flagPole = kit.roundedBox(2.5, 18, 2.5, 1, "terracotta"); flagPole.position.set(11.5, 106, -8); m.push(flagPole);
  const flag = kit.roundedBox(2.5, 7, 10, 1.2, "terracotta"); flag.position.set(11.5, 112, -3); m.push(flag);
  g.add(kit.part(name, { mount: "floor", order: 1 }, ...m));
  return g;
}
