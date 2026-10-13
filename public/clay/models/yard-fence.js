// Low picket fence along a list of straight runs. One part `<name>` (floor) — the
// whole fence is one placed thing. Origin: the yard's own frame (runs are given in it).
// opts: `runs` [[x0, z0, x1, z1], …] in cm, `height` (default 62), `color`.
export function build(kit, { name = "yard-fence", runs = [[0, 0, 100, 0]], height = 62, color = "cream", post = "brown" } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const m = [], H = height;
  for (const [x0, z0, x1, z1] of runs) {
    const len = Math.hypot(x1 - x0, z1 - z0), ang = -Math.atan2(z1 - z0, x1 - x0);
    const run = new THREE.Group(); run.position.set(x0, 0, z0); run.rotation.y = ang;
    for (const y of [H * 0.32, H * 0.72]) { const r = kit.roundedBox(len, 5, 3, 1.4, post); r.position.set(len / 2, y, -2.5); run.add(r); }
    const n = Math.max(1, Math.round(len / 13));
    for (let i = 0; i <= n; i++) {
      const big = i === 0 || i === n || i % 6 === 0;
      const x = (len * i) / n;
      const p = kit.roundedBox(big ? 7 : 6, big ? H + 6 : H, big ? 7 : 2.6, big ? 2.5 : 1.2, big ? post : color);
      p.position.set(x, (big ? H + 6 : H) / 2, big ? -2.5 : 0); run.add(p);
      if (!big) { const tip = kit.blob(3, 2.6, 1.3, color); tip.position.set(x, H, 0); run.add(tip); }
    }
    m.push(run);
  }
  g.add(kit.part(name, { mount: "floor", order: 1 }, ...m));
  return g;
}
