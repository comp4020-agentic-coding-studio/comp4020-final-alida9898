// Glass iced-coffee jug: a tall glass pitcher of iced coffee with floating ice cubes and a
// cream loop handle. One part `<name>` (surface). Origin: bottom-centre. Front faces +Z.
// ~14 Ø × 22 h cm. opts: `coffee` (fill colour).
export function build(kit, { name = "iced-coffee-jug", coffee = 0x5a3626 } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xdfeaf0, roughness: 0.2, metalness: 0, transparent: true, opacity: 0.32, depthWrite: false,
  });
  const body = kit.lathe([[0, 0], [6, 0], [6.6, 2], [6.6, 18], [7.2, 19.5], [7.2, 21], [0, 21]], glass, { round: 1.2 });
  body.castShadow = false;
  const fill = kit.lathe([[0, 0], [5.6, 0], [6.1, 16.5], [0, 16.5]], coffee, { round: 1 }); fill.position.y = 1.5;
  const cubes = [[-2.6, 17.5, 1.5], [2.2, 18.3, -1.8], [0.4, 19.4, 2.2]].map(([x, y, z]) => {
    const c = kit.roundedBox(2.6, 2.6, 2.6, 0.5, 0xeaf4f6); c.position.set(x, y, z); c.rotation.y = x * 0.5; return c;
  });
  const handle = new THREE.Mesh(new THREE.TorusGeometry(6, 1.2, 10, 20, Math.PI), kit.clay("cream"));
  handle.castShadow = true; handle.position.set(-6.8, 15.5, 0); handle.rotation.z = Math.PI / 2;
  const spout = kit.lathe([[0, 0], [1.6, 0], [1.2, 1.6], [0, 2]], glass, { round: 0.4 }); spout.position.set(6.8, 19.5, 0); spout.rotation.z = -0.3; spout.castShadow = false;
  g.add(kit.part(name, { mount: "surface", order: 1 }, body, fill, ...cubes, handle, spout));
  return g;
}
