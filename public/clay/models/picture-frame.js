// Framed picture for a wall: one part `<name>` (chunky frame + mat + simple clay art).
// Origin: bottom-centre of the frame, back flush with the wall. Front +Z.
// opts: `width`, `height`, `frame`, `mat`, `art` ("hills" | "cup" | "sun"), `colors` [a, b, c].
export function build(kit, { name = "picture-frame", width = 40, height = 50, frame = "brown", mat = "cream", art = "hills", colors = ["leaf", "blue", "mustard"] } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const W = width, H = height, F = 4.5;
  const m = [];
  const back = kit.roundedBox(W, H, 2.5, 1, mat); back.position.set(0, H / 2, 1.25); m.push(back);
  for (const s of [-1, 1]) {
    const v = kit.roundedBox(F, H, 4, 1.6, frame); v.position.set(s * (W / 2 - F / 2), H / 2, 2); m.push(v);
    const h = kit.roundedBox(W, F, 4, 1.6, frame); h.position.set(0, H / 2 + s * (H / 2 - F / 2), 2); m.push(h);
  }
  const iw = W - 2 * F - 4, ih = H - 2 * F - 4, cy = H / 2, z = 3;
  const [a, b, c] = colors;
  const bg = kit.roundedBox(iw, ih, 0.6, 0.3, art === "cup" ? "white" : b); bg.position.set(0, cy, 2.8); m.push(bg);
  if (art === "hills") {
    const h1 = kit.blob(iw * 0.45, ih * 0.22, 0.8, a); h1.position.set(-iw * 0.15, cy - ih * 0.32, z);
    const h2 = kit.blob(iw * 0.4, ih * 0.16, 0.9, new THREE.Color(kit.PALETTE[a] ?? a).multiplyScalar(0.8).getHex()); h2.position.set(iw * 0.2, cy - ih * 0.36, z + 0.3);
    const sun = kit.blob(ih * 0.1, ih * 0.1, 0.8, c); sun.position.set(iw * 0.22, cy + ih * 0.2, z);
    m.push(h1, h2, sun);
  } else if (art === "cup") {
    const cup = kit.roundedBox(iw * 0.45, ih * 0.32, 1, 2, a); cup.position.set(-iw * 0.04, cy - ih * 0.1, z);
    const hd = new THREE.Mesh(new THREE.TorusGeometry(ih * 0.08, 1.1, 8, 16), kit.clay(a)); hd.position.set(iw * 0.24, cy - ih * 0.08, z);
    const sau = kit.roundedBox(iw * 0.65, 2.2, 1, 1, c); sau.position.set(0, cy - ih * 0.28, z);
    m.push(cup, hd, sau);
    for (const dx of [-0.12, 0.06]) { const st = kit.capsule(1.1, ih * 0.18, b); st.position.set(iw * dx, cy + ih * 0.2, z); st.rotation.z = 0.2; m.push(st); }
  } else {
    const sun = kit.blob(iw * 0.26, iw * 0.26, 0.8, a); sun.position.set(0, cy + ih * 0.05, z); m.push(sun);
    const band = kit.roundedBox(iw, ih * 0.22, 1, 0.5, c); band.position.set(0, cy - ih * 0.36, z + 0.2); m.push(band);
  }
  g.add(kit.part(name, { mount: "wall", order: 1 }, ...m));
  return g;
}
