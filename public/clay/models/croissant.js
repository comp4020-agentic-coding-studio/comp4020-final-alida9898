// Croissant: five puffy golden segments along a crescent, fattest in the middle.
// One part `<name>` (surface). Origin: bottom-centre. Front faces +Z. ~16 × 9 cm, 6 cm tall.
export function build(kit, { name = "croissant", color = "mustard" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const P = kit.PALETTE, base = typeof color === "string" ? P[color] : color;
  const dark = new THREE.Color(base).lerp(new THREE.Color(P.brown), 0.35).getHex();
  const segs = [];
  const n = 5, arc = 2.2, Rc = 8;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1) - 0.5, a = t * arc;
    const s = 1 - Math.abs(t) * 1.1; // taper to the tips
    const b = kit.blob(2.4 + 1.6 * s, 2.0 + 1.4 * s, 2.6 + 1.6 * s, i % 2 ? dark : base);
    b.position.set(Math.sin(a) * Rc, 2.0 + 1.4 * s, -Math.cos(a) * Rc + Rc * 0.7);
    b.rotation.y = -a;
    segs.push(b);
  }
  g.add(kit.part(name, { mount: "surface", order: 1 }, ...segs));
  return g;
}
