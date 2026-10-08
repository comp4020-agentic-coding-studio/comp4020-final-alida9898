// Glass tea cup on a saucer: amber tea in a pale glass, tag string over the rim,
// mint leaf on the saucer. One part `<name>` (surface). Origin: bottom-centre.
export function build(kit, { name = "glass-tea" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xdfeaf0, roughness: 0.25, metalness: 0, transparent: true, opacity: 0.38, depthWrite: false,
  });
  const saucer = kit.lathe([[0, 0], [5.8, 0], [7.8, 1.4], [7.6, 1.9], [0, 1.4]], "cream", { round: 0.5 });
  const H = 9;
  const wall = kit.lathe([[0, 0], [3.8, 0], [4.6, H], [0, H]], glass, { round: 0.8 }); wall.position.y = 1.4;
  wall.castShadow = false;
  const tea = kit.lathe([[0, 0], [3.3, 0], [4.0, H - 2.4], [0, H - 2.4]], 0xc07a2e, { round: 0.6 }); tea.position.y = 1.9;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(4.5, 0.35, 8, 40), kit.clay(0xf4f8fa, { roughness: 0.4 }));
  rim.rotation.x = Math.PI / 2; rim.position.y = 1.4 + H;
  const handle = new THREE.Mesh(new THREE.TorusGeometry(2, 0.6, 10, 20), glass); handle.position.set(-5, 6, 0);
  // tea bag string: down the front from the rim to a mustard tag
  const string = kit.capsule(0.25, 6, "white"); string.position.set(1.8, 1.4 + H - 2.4, 4.6); string.rotation.z = 0.12;
  const tag = kit.roundedBox(2.6, 3.2, 0.6, 0.4, "mustard"); tag.position.set(2.2, 1.4 + H - 6.8, 4.9);
  // mint leaf resting on the saucer front-right
  const leaf = kit.blob(3, 0.6, 1.6, "leaf"); leaf.position.set(4.6, 2.1, 4); leaf.rotation.set(0.25, -0.5, 0.15);
  const vein = kit.capsule(0.22, 4.4, 0x5d7c44); vein.rotation.z = Math.PI / 2; vein.position.set(4.6, 2.6, 4); vein.rotation.y = -0.5;
  g.add(kit.part(name, { mount: "surface", order: 1 }, saucer, tea, wall, rim, handle, string, tag, leaf, vein));
  return g;
}
