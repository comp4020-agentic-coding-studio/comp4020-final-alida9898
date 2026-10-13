// Collects the placeable items (objects tagged `userData.item`, see the Items
// contract in ./README.md) from the built café into a tree, and checks the
// contract. Zone files are written by several people at once, so every
// problem is a console.warn naming the id — never a crash.

/**
 * @typedef {{ id: string, parent: string|null, layer: number, label: {zh: string, en: string},
 *   focus: boolean, obj: import("three").Object3D, level: number, zone: string,
 *   scope: string|null, children: string[] }} Item
 * `scope` = the nearest focus ancestor's id (null = the zone itself): the zoom
 * level whose tray lists this item.
 */

/** @returns {Map<string, Item>} */
export function collectItems(storeys) {
  const items = new Map();
  for (const s of storeys) {
    for (const [zone, group] of Object.entries(s.zones)) {
      group.traverse((obj) => {
        const tag = obj.userData && obj.userData.item;
        if (!tag) return;
        const id = typeof tag.id === "string" && tag.id ? tag.id : null;
        if (!id) { console.warn(`[items] tagged object "${obj.name}" in zone ${zone} has no id — shown as scenery`); return; }
        if (items.has(id)) { console.warn(`[items] duplicate id ${id} (zone ${zone}) — the second one is shown as scenery`); return; }
        let label = tag.label;
        if (!label || typeof label !== "object" || (!label.zh && !label.en)) {
          console.warn(`[items] ${id}: missing label`);
          label = { zh: id, en: id };
        } else label = { zh: label.zh || label.en, en: label.en || label.zh };
        let layer = tag.layer;
        if (!Number.isInteger(layer) || layer < 1) { console.warn(`[items] ${id}: missing/invalid layer (${layer})`); layer = 0; }
        items.set(id, {
          id, parent: tag.parent ?? null, layer, label, focus: !!tag.focus, obj,
          level: s.level, zone, scope: null, children: [],
        });
      });
    }
  }
  // parents: unknown → treat as floor/wall; cycles → cut
  for (const it of items.values()) {
    if (it.parent !== null && !items.has(it.parent)) {
      console.warn(`[items] ${it.id}: unknown parent "${it.parent}" — treated as parent: null`);
      it.parent = null;
    }
  }
  for (const it of items.values()) {
    const seen = new Set([it.id]);
    for (let p = it.parent; p !== null; p = items.get(p).parent) {
      if (seen.has(p)) { console.warn(`[items] ${it.id}: parent cycle — parent cut`); it.parent = null; break; }
      seen.add(p);
    }
  }
  for (const it of items.values()) {
    if (it.parent === null) continue;
    const p = items.get(it.parent);
    p.children.push(it.id);
    if (p.zone !== it.zone || p.level !== it.level) console.warn(`[items] ${it.id}: parent ${p.id} is in another zone`);
  }
  // missing layers: one more than the parent's
  const fillLayer = (it) => {
    if (it.layer > 0) return it.layer;
    it.layer = it.parent ? fillLayer(items.get(it.parent)) + 1 : 1;
    return it.layer;
  };
  for (const it of items.values()) fillLayer(it);
  for (const it of items.values()) {
    if (it.parent && it.layer <= items.get(it.parent).layer) console.warn(`[items] ${it.id}: layer ${it.layer} is not above its parent's (${items.get(it.parent).layer})`);
    let p = it.parent;
    while (p !== null && !items.get(p).focus) p = items.get(p).parent;
    it.scope = p;
  }
  return items;
}

/**
 * Dev-only: when no zone tags anything yet, tag each zone's top-level objects
 * in memory (first = focus furniture, the rest sit on it) so the flow can be
 * tested. Returns true when it did so.
 */
export function devTagIfEmpty(storeys) {
  let any = false;
  for (const s of storeys) for (const g of Object.values(s.zones)) g.traverse((o) => { if (o.userData.item) any = true; });
  if (any) return false;
  console.info("[items] no tagged items in any zone — using dev-only fallback tags");
  for (const s of storeys) {
    for (const [zone, g] of Object.entries(s.zones)) {
      const kids = g.children.slice();
      kids.forEach((o, i) => {
        const id = `l${s.level}-${zone}-dev-${i}`;
        o.userData.item = i === 0
          ? { id, parent: null, layer: 1, focus: true, label: { zh: `${zone} 大件`, en: `${zone} big piece` } }
          : { id, parent: `l${s.level}-${zone}-dev-0`, layer: 2, label: { zh: `${zone} 小件 ${i}`, en: `${zone} small ${i}` } };
      });
    }
  }
  return true;
}
