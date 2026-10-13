// Chalk drawing decal for a chalkboard: thin flat strokes, slightly rough chalk.
// One part `<name>` (flat, lies on the board face). `kind`: cup | price | star | special | heart | croissant.
// Origin: centre of the drawing, back face at z = 0, front +Z. About 14–30 cm across.
export function build(kit, { name = "chalk-decal", kind = "star", color = "white" } = {}) {
  const { THREE } = kit;
  const hex = { white: 0xf2efe6, pink: 0xf2c4c0, yellow: 0xf3dc8e, blue: 0xbcd4e6, green: 0xc8e0b0 }[color] ?? color;
  const mat = kit.clay(hex, { roughness: 1, sheen: 0 });
  const r = kit.rng(kind.length * 7 + 1);
  const m = [];
  const W = 0.9; // stroke half-width
  const seg = (x1, y1, x2, y2, w = W) => {
    const len = Math.hypot(x2 - x1, y2 - y1);
    const c = new THREE.Mesh(new THREE.CapsuleGeometry(w, Math.max(len, 0.01), 3, 6), mat);
    c.scale.z = 0.35; // flatten onto the board
    c.position.set((x1 + x2) / 2 + (r() - 0.5) * 0.3, (y1 + y2) / 2 + (r() - 0.5) * 0.3, w * 0.35);
    c.rotation.z = Math.atan2(y2 - y1, x2 - x1) - Math.PI / 2;
    m.push(c);
  };
  const poly = (pts, w) => { for (let i = 1; i < pts.length; i++) seg(...pts[i - 1], ...pts[i], w); };
  const arc = (cx, cy, rx, ry, a0, a1, n = 10, w) => {
    const pts = [];
    for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
    poly(pts, w);
  };
  const PI = Math.PI;
  if (kind === "cup") {
    poly([[-6, 5], [-5, -5], [5, -5], [6, 5]]);
    seg(-7, 5, 7, 5);
    arc(7.5, 1, 3, 3, PI / 2, -PI / 2, 6);
    seg(-9, -7.5, 9, -7.5);
    for (const x of [-3, 0.5, 4]) arc(x, 9, 1.2, 2.2, -PI / 2, PI / 2, 4, 0.6); // steam
  } else if (kind === "price") {
    poly([[-9, 4], [4, 4], [9, 0], [4, -4], [-9, -4], [-9, 4]]); // tag shape
    // "$" as an S curve with a bar, "4" as three strokes
    arc(-4.6, 1, 1.6, 1.2, 0, PI * 1.5, 6, 0.6); arc(-4.6, -1.4, 1.6, 1.2, PI / 2, -PI, 6, 0.6);
    seg(-4.6, -3.2, -4.6, 3.2, 0.5);
    poly([[1.6, 2.8], [-0.6, -0.6], [2.8, -0.6]], 0.6); seg(2, 1.2, 2, -2.8, 0.6);
  } else if (kind === "star") {
    const pts = [];
    for (let i = 0; i <= 10; i++) { const a = PI / 2 + (i * PI) / 5; const rr = i % 2 ? 3 : 7; pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
    poly(pts);
  } else if (kind === "special") {
    // "Today's special": two lines of chalk scribble with an underline flourish
    const line = (y, x0, x1) => {
      const pts = []; let x = x0;
      while (x < x1) { pts.push([x, y + (pts.length % 2 ? 1.6 : -1.2) + (r() - 0.5)]); x += 1.6 + r() * 1.2; }
      poly(pts, 0.55);
    };
    line(4, -15, -1); line(4, 2, 15); line(-2, -11, 11);
    arc(0, -4, 15, 2.5, PI + 0.3, 2 * PI - 0.3, 12, 0.6);
  } else if (kind === "heart") {
    arc(-2.8, 1.5, 3, 3, 0, PI, 7); arc(2.8, 1.5, 3, 3, 0, PI, 7);
    seg(-5.8, 1.5, 0, -6); seg(5.8, 1.5, 0, -6);
  } else if (kind === "croissant") {
    arc(0, -2, 9, 7, 0.25, PI - 0.25, 12); arc(0, -2, 6, 3.5, 0.4, PI - 0.4, 10);
    seg(-8.7, -0.3, -5.5, -0.9); seg(8.7, -0.3, 5.5, -0.9);
    for (const a of [1.0, 1.57, 2.14]) seg(Math.cos(a) * 6, -2 + Math.sin(a) * 3.5, Math.cos(a) * 9, -2 + Math.sin(a) * 7, 0.6);
  } else throw new Error(`chalk-decal: unknown kind ${kind}`);
  const g = new THREE.Group(); g.name = name;
  g.add(kit.part(name, { mount: "flat", order: 1 }, ...m));
  return g;
}
