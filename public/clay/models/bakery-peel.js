// Wooden bread peel: a long handle with a wide flat paddle, leaning back at a slight
// angle (paddle down). One part `<name>` (floor). Origin: bottom-centre. ~30 w × 150 h cm.
export function build(kit, { name = "bakery-peel" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const lean = new THREE.Group();
  const paddle = kit.roundedBox(30, 36, 2.5, 6, 0xc99a63); paddle.position.y = 18; lean.add(paddle);
  const handle = kit.capsule(2.2, 118, 0xb3824f); handle.position.y = 36 + 56; lean.add(handle);
  const knob = kit.blob(3.2, 3.2, 3.2, "brown"); knob.position.y = 150; lean.add(knob);
  lean.rotation.x = -0.12; lean.position.z = 4;
  g.add(kit.part(name, { mount: "floor", order: 1 }, lean));
  return g;
}
