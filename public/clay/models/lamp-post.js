// Garden lamp post: charcoal post on a stepped foot, a cream lantern with a mustard glow
// under a little roof. One part `<name>` (floor). Origin: bottom-centre. ~185 cm tall.
export function build(kit, { name = "lamp-post", metal = "charcoal" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const m = [];
  const foot = kit.lathe([[0, 0], [14, 0], [12, 6], [7, 10], [5, 16], [0, 16]], metal, { round: 1.5 }); m.push(foot);
  const post = kit.capsule(3.4, 150, metal); post.position.y = 88; m.push(post);
  const collar = kit.roundedCylinder(6, 4, 1.4, metal); collar.position.y = 158; m.push(collar);
  const glow = kit.clay(0xffd98f, { roughness: 0.5, sheen: 0.4 });
  const glass = kit.roundedBox(14, 18, 14, 3, glow); glass.position.y = 171; m.push(glass);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const bar = kit.roundedBox(2.4, 20, 2.4, 1, metal); bar.position.set(sx * 7.2, 171, sz * 7.2); m.push(bar);
  }
  const roof = new THREE.Mesh(new THREE.ConeGeometry(13, 9, 4), kit.clay(metal)); roof.rotation.y = Math.PI / 4; roof.position.y = 185; roof.castShadow = true; m.push(roof);
  const knob = kit.blob(2.4, 2.4, 2.4, metal); knob.position.y = 191; m.push(knob);
  g.add(kit.part(name, { mount: "floor", order: 1 }, ...m));
  return g;
}
