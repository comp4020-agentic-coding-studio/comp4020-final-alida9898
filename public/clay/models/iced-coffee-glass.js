// Iced coffee glass: a short glass tumbler of iced coffee with ice cubes and a striped straw.
// One part `<name>` (surface). Origin: bottom-centre. Front faces +Z. ~7.8 Ø × 14 h cm.
// opts: `coffee` (fill colour), `straw` colour.
export function build(kit, { name = "iced-coffee-glass", coffee = 0x5a3626, straw = "terracotta" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xdfeaf0, roughness: 0.2, metalness: 0, transparent: true, opacity: 0.32, depthWrite: false,
  });
  const wall = kit.lathe([[0, 0], [3.6, 0], [3.9, 12], [4.1, 13], [0, 13]], glass, { round: 0.8 }); wall.castShadow = false;
  const fill = kit.lathe([[0, 0], [3.3, 0], [3.6, 10], [0, 10]], coffee, { round: 0.6 }); fill.position.y = 0.6;
  const cubes = [[-1.3, 9.6, 0.8], [1.1, 10.4, -0.9], [0.1, 11.2, 1.2]].map(([x, y, z]) => {
    const c = kit.roundedBox(1.8, 1.8, 1.8, 0.4, 0xeaf4f6); c.position.set(x, y, z); c.rotation.y = x * 0.6; return c;
  });
  const strawMesh = kit.capsule(0.45, 15, straw); strawMesh.position.set(1, 10.5, 0); strawMesh.rotation.z = -0.22;
  g.add(kit.part(name, { mount: "surface", order: 1 }, wall, fill, ...cubes, strawMesh));
  return g;
}
