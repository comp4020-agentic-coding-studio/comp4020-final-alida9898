// Glass shop door in a chunky wooden frame, with a push bar and kick panel.
// One part `<name>` (wall, order 1) — frame + leaf + glass + handle are one object.
// Origin: bottom-centre of the opening, on the floor, flush with the wall face.
// Front faces +Z (the room side). Size = the opening: `width` × `height` (default 100 × 220).
// opts: `frame` / `kick` / `handle` colours.
export function build(kit, { name = "door", width = 100, height = 220, frame = "brown", kick = "terracotta", handle = "mustard" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const W = width, H = height, F = 9; // frame bar width
  const glass = kit.clay(0xcfe2e8, { roughness: 0.35, sheen: 0.1 });
  const m = [];

  // outer frame (architrave) proud of the wall
  const jamb = (x) => { const b = kit.roundedBox(F, H + F, 8, 2.5, frame); b.position.set(x, (H + F) / 2, 4); return b; };
  const head = kit.roundedBox(W + 2 * F, F, 8, 2.5, frame); head.position.set(0, H + F / 2, 4);
  m.push(jamb(-W / 2 - F / 2), jamb(W / 2 + F / 2), head);

  // the door leaf: glass pane in a slim rail frame, solid kick panel at the bottom
  const pane = kit.roundedBox(W - 6, H - 6, 2, 1, glass); pane.position.set(0, H / 2, 2);
  const stile = (x) => { const b = kit.roundedBox(7, H - 2, 5, 2, frame); b.position.set(x, H / 2, 3.5); return b; };
  const top = kit.roundedBox(W - 4, 8, 5, 2, frame); top.position.set(0, H - 5, 3.5);
  const kp = kit.roundedBox(W - 6, 34, 5, 2.5, kick); kp.position.set(0, 19, 3.5);
  const mid = kit.roundedBox(W - 4, 5, 5, 2, frame); mid.position.set(0, 38, 3.5);
  m.push(pane, stile(-W / 2 + 4), stile(W / 2 - 4), top, kp, mid);

  // vertical brass-ish pull bar on the latch side
  const bar = kit.capsule(2, 44, handle); bar.position.set(W / 2 - 16, 105, 9);
  const post = (y) => { const p = kit.roundedBox(2.5, 2.5, 5, 1, handle); p.position.set(W / 2 - 16, y, 6.5); return p; };
  m.push(bar, post(90), post(120));

  g.add(kit.part(name, { mount: "wall", order: 1 }, ...m));
  return g;
}
