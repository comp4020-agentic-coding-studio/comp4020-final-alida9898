// Little clay snowman: three stacked snowballs, stick arms, charcoal button-and-eye
// dots, a carrot nose, a knit scarf and a jaunty top hat — built deliberately chunky
// and a bit oversize so it reads clearly across the yard.
// One part `<name>` (floor). Origin: bottom-centre on the ground. Front faces +Z.
// ~70 Ø × 118 h cm. opts: `scarf` colour, `hat` colour.
export function build(kit, { name = "snowman", scarf = "terracotta", hat = "charcoal" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const m = [];
  const snow = 0xf7f9fb;

  const base = kit.blob(26, 23, 26, snow); base.position.y = 23; m.push(base);
  const mid = kit.blob(19, 18, 19, snow); mid.position.y = 23 + 18 + 10; m.push(mid);
  const headY = 23 + 18 + 10 + 18 + 12;
  const head = kit.blob(13.5, 13, 13.5, snow); head.position.y = headY; m.push(head);

  // stick arms poking out of the middle ball
  for (const s of [-1, 1]) {
    const arm = kit.capsule(1, 26, 0x6a4a2e);
    arm.position.set(s * 20, 54, 2);
    arm.rotation.z = s * -0.9;
    arm.rotation.x = 0.15;
    m.push(arm);
    const twig = kit.capsule(0.6, 8, 0x6a4a2e);
    twig.position.set(s * 31, 60, 2);
    twig.rotation.z = s * -1.6;
    m.push(twig);
  }

  // coal eyes + smile dots, button row down the middle ball
  const faceZ = 13.5 * 0.92;
  for (const [x, y] of [[-3.6, 2.4], [3.6, 2.4]]) {
    const eye = kit.blob(1.1, 1.1, 0.8, "charcoal"); eye.position.set(x, headY + y, faceZ); m.push(eye);
  }
  const mouthPts = [[-3.2, -2.6], [-1.3, -4], [1.3, -4], [3.2, -2.6]];
  for (const [x, y] of mouthPts) { const d = kit.blob(0.7, 0.7, 0.6, "charcoal"); d.position.set(x, headY + y, faceZ * 0.98); m.push(d); }
  for (let i = 0; i < 3; i++) {
    const btn = kit.blob(1.5, 1.5, 1, "charcoal");
    btn.position.set(0, 23 + 18 + 10 + 10 - i * 7, 19 * 0.9);
    m.push(btn);
  }

  // carrot nose
  const nose = new THREE.Mesh(new THREE.ConeGeometry(1.8, 8, 10), kit.clay(0xd9822f));
  nose.rotation.x = Math.PI / 2; nose.position.set(0, headY + 1, faceZ + 3.6); nose.castShadow = true; m.push(nose);

  // knit scarf around the neck, two tails hanging to one side
  const neckY = 23 + 18 + 10 + 18 - 2;
  const scarfRing = new THREE.Mesh(new THREE.TorusGeometry(13.6, 3, 10, 24), kit.clay(scarf));
  scarfRing.rotation.x = Math.PI / 2 - 0.1; scarfRing.position.y = neckY; m.push(scarfRing);
  for (const dz of [0, 4]) {
    const tail = kit.roundedBox(5, 20, 3, 1.4, scarf); tail.position.set(9, neckY - 12, dz); tail.rotation.z = 0.25; m.push(tail);
  }

  // jaunty top hat, tilted
  const hatGroup = new THREE.Group();
  const brim = kit.roundedCylinder(10.5, 1.4, 0.5, hat); hatGroup.add(brim);
  const crown = kit.roundedCylinder(7, 12, 0.8, hat); crown.position.y = 1.2; hatGroup.add(crown);
  const hatBand = kit.roundedCylinder(7.2, 2, 0.4, "mustard"); hatBand.position.y = 1.4; hatGroup.add(hatBand);
  hatGroup.position.set(-1.5, headY + 11.5, -1);
  hatGroup.rotation.z = 0.12;
  m.push(hatGroup);

  g.add(kit.part(name, { mount: "floor", order: 1 }, ...m));
  return g;
}
