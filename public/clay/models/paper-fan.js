// Folding paper fan, opened flat on a table: pleated paper wedges in two alternating
// colours, bamboo ribs along both straight edges, a charcoal rivet at the pivot.
// One part `<name>` (flat — lies on the surface it's set on). Origin: the pivot, fan
// opens toward +Z. ~34 w × 20 d cm. opts: `colors` (two alternating pleat colours).
export function build(kit, { name = "paper-fan", colors = ["terracotta", "cream"] } = {}) {
  const { THREE } = kit;
  const g = new THREE.Group(); g.name = name;
  const m = [];
  const R = 19, N = 9, A = Math.PI * 0.62; // opening angle
  const holderAt = (angle, child) => {
    const holder = new THREE.Group(); holder.add(child); holder.rotation.y = -angle; return holder;
  };
  for (let i = 0; i < N; i++) {
    const a0 = -A / 2 + (A * i) / N, a1 = -A / 2 + (A * (i + 1)) / N, am = (a0 + a1) / 2;
    const w = ((a1 - a0) * R) * 0.98;
    const pleat = kit.roundedBox(w, 0.6, R, 0.25, colors[i % colors.length]); pleat.position.z = R / 2;
    m.push(holderAt(am, pleat));
  }
  for (const edge of [-A / 2, A / 2]) {
    const rib = kit.capsule(0.5, R * 0.98, "brown"); rib.rotation.x = Math.PI / 2; rib.position.z = R * 0.49;
    m.push(holderAt(edge, rib));
  }
  const rivet = kit.blob(1.2, 1, 1.2, "charcoal"); rivet.position.y = 0.8; m.push(rivet);
  g.add(kit.part(name, { mount: "flat", order: 1 }, ...m));
  return g;
}
