// Garden leaf rake, leaning against something: a long wooden handle and a fan of splayed
// metal tines at the bottom. One part `<name>` (floor). Origin: bottom-centre of the tines
// where they touch the ground, which should be set a little OUT from the wall/fence it
// leans on — positive `lean` tilts the handle's top toward -Z (back toward that surface),
// while the object's front (+Z) is the direction the tines splay open toward the room.
// ~130 cm long overall, deliberately tall so it reads leaning against a fence from across
// the yard. opts: `lean` (tilt from vertical, rad), `color`.
export function build(kit, { name = "rake", length = 130, lean = 0.22, color = "charcoal" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const m = [];
  const headW = 26, nTines = 9;

  const inner = new THREE.Group();
  // head: a shallow curved bar the tines spring from
  const head = kit.roundedBox(headW, 3, 2.4, 1, color); head.position.y = 3; inner.add(head);
  for (let i = 0; i < nTines; i++) {
    const t = i / (nTines - 1) - 0.5; // -0.5..0.5
    const x0 = t * headW;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x0 * 0.25, length * 0.14, 0),
      new THREE.Vector3(x0 * 0.7, length * 0.065, 0.6),
      new THREE.Vector3(x0, 1.2, 1),
    ]);
    const tine = new THREE.Mesh(new THREE.TubeGeometry(curve, 10, 0.55, 6), kit.clay(color));
    tine.castShadow = true; inner.add(tine);
  }
  // ferrule where handle meets head
  const ferrule = kit.roundedCylinder(1.8, 6, 0.6, 0x9ea8ab); ferrule.position.y = length * 0.17; inner.add(ferrule);
  // long wooden handle
  const handle = kit.capsule(1.6, length * 0.86, "brown"); handle.position.y = length * 0.17 + (length * 0.86) / 2; inner.add(handle);
  // grip cap at the top
  const cap = kit.blob(2.1, 2.6, 2.1, "soil"); cap.position.y = length * 0.17 + length * 0.86 + 1; inner.add(cap);

  inner.rotation.x = -lean;
  // keep the tine tips (bottom) anchored near the origin: shift up so the lowest tine point sits at y≈0
  inner.position.y = 0.4;
  m.push(inner);

  g.add(kit.part(name, { mount: "floor", order: 1 }, ...m));
  return g;
}
