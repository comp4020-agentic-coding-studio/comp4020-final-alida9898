// Builds a shop (shell + every zone's populate + bean tube + optional yard + the
// season's decor) and its warm lights. The shop TYPE is a definition from
// public/shops/ (see public/shops/README.md); with no definition it builds the café.
import * as THREE from "three";
import * as kit from "../clay/clay.js";
import { levelY } from "./zones.js";
import { buildStorey } from "./storey.js";
import { buildTube } from "./tube.js";
import { model, place, topOf } from "./place.js";

/** Warm soft light rig copied from cafe.js. Returns the shadow-casting key light. */
export function addLights(scene) {
  scene.add(new THREE.HemisphereLight(0xfff4e6, 0xb89a80, 1.25));
  const key = new THREE.DirectionalLight(0xffe9cc, 2.1);
  key.position.set(-350, 1000, 1000);
  key.target.position.set(0, 250, 200);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -600, right: 600, top: 700, bottom: -500, near: 100, far: 2200 });
  key.shadow.radius = 5;
  key.shadow.bias = -0.0006;
  key.shadow.normalBias = 1.5;
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight(0xe8eeff, 0.5);
  fill.position.set(700, 300, 600);
  scene.add(fill);
  const glow = new THREE.PointLight(0xffc98a, 0.9, 1200, 1.2);
  glow.position.set(0, 420, 320);
  scene.add(glow);
  return key;
}

/** Tag every item under `group` with `season` (seasonal decor files may leave it out). */
function markSeason(group, season, before) {
  group.traverse((o) => {
    if (before.has(o)) return;
    const t = o.userData && o.userData.item;
    if (t && !t.season) t.season = season;
  });
}

/** Remove tagged items of another season (a zone file may tag them directly). */
function dropOtherSeasons(group, season) {
  const out = [];
  group.traverse((o) => { const s = o.userData?.item?.season; if (s && s !== season) out.push(o); });
  for (const o of out) o.parent?.remove(o);
}

/**
 * @param def     shop-type definition (public/shops/<type>/index.js default export)
 * @param season  "spring" | "summer" | "autumn" | "winter" (null: no seasonal things at all)
 * @returns {{ storeys: { level, group, walls, zones }[], tube: THREE.Group|null,
 *   yard: { level: "yard", group, walls: null, zones, scenery }|null }}
 */
export async function buildShop(scene, def, season = null) {
  if (!def) def = (await import("../shops/cafe/index.js")).default;
  const { levels, room } = def;
  const N = levels.length;
  const storeys = [];
  const ctx = (group, zone, level) => ({ kit, THREE, group, zone, level, model, place, topOf, season });
  for (const L of levels) {
    const top = L.level === N - 1;
    const { group, walls } = await buildStorey(kit, {
      level: L.level, theme: L.theme, openings: L.openings, stairsUp: !top && L.stairsUp !== false, top, room,
    });
    group.position.y = levelY(L.level);
    scene.add(group);
    const zones = {};
    for (const [id, zone] of Object.entries(L.zones)) {
      const zg = new THREE.Group(); zg.name = `zone-${id}`;
      group.add(zg);
      zones[id] = zg;
      try {
        const mod = await def.zone(id);
        await mod.populate(ctx(zg, zone, L.level));
      } catch (err) {
        console.error(`zone ${id} failed to populate`, err);
      }
    }
    storeys.push({ level: L.level, group, walls, zones });
  }
  const tube = def.tube ? buildTube(kit, { levels: N }) : null;
  if (tube) scene.add(tube);

  // the yard: ground-level area beside the building, its own zones, plus seasonal scenery
  let yard = null;
  if (def.yard) {
    const Y = def.yard;
    const group = new THREE.Group(); group.name = "yard";
    scene.add(group);
    const zones = {};
    for (const [id, zone] of Object.entries(Y.zones)) {
      const zg = new THREE.Group(); zg.name = `zone-${id}`;
      group.add(zg);
      zones[id] = zg;
      try {
        const mod = await Y.zone(id);
        await mod.populate(ctx(zg, zone, "yard"));
      } catch (err) {
        console.error(`yard zone ${id} failed to populate`, err);
      }
    }
    let scenery = null;
    try {
      if (Y.scenery) { scenery = await Y.scenery({ kit, THREE, model, place, season: season || "summer" }); group.add(scenery.group); }
      else {
        // no scenery of its own: a plain patch of grass so the yard isn't floating
        const [x0, x1] = Y.box.x, [z0, z1] = Y.box.z;
        const grass = kit.roundedBox(x1 - x0 + 12, 6, z1 - z0, 2, 0xa9c07e);
        grass.position.set((x0 + x1) / 2 + 6, -3, (z0 + z1) / 2); grass.castShadow = false; grass.receiveShadow = true;
        group.add(grass);
      }
    } catch (err) {
      console.error("yard scenery failed", err);
    }
    yard = { level: "yard", group, walls: null, zones, scenery };
  }

  // the season's decor, added into existing zones
  const loader = season && def.seasons && def.seasons[season];
  if (loader) {
    try {
      const { decor = [] } = await loader();
      for (const d of decor) {
        const area = d.level === "yard" ? yard : storeys.find((s) => s.level === d.level);
        const zg = area && area.zones[d.zone];
        if (!zg) { console.warn(`[season] ${season} decor for unknown zone ${d.level}/${d.zone}`); continue; }
        const before = new Set(); zg.traverse((o) => before.add(o));
        try {
          await d.populate(ctx(zg, null, d.level));
          markSeason(zg, season, before);
        } catch (err) {
          console.error(`[season] ${season} decor for ${d.zone} failed`, err);
        }
      }
    } catch (err) {
      console.error(`[season] ${season} decor failed to load`, err);
    }
  }
  for (const s of [...storeys, ...(yard ? [yard] : [])]) dropOtherSeasons(s.group, season);
  return { storeys, tube, yard };
}

/** The café, as before (kept for anything still importing it). */
export async function buildCafe(scene, season = null) {
  return buildShop(scene, null, season);
}

/**
 * Objects mounted on / standing flat against each wall of one storey (shelf, frames,
 * sill plants…): their box reaches within `near` cm of the wall plane and is thin
 * along the wall's normal. Hide them together with the wall, or they float.
 * @returns {{ left: THREE.Object3D[], right: THREE.Object3D[], back: THREE.Object3D[] }}
 */
export function wallAttached(storeyGroup, near = 35, thin = 60, room = { x: [-300, 300] }) {
  const out = { left: [], right: [], back: [] };
  const [x0, x1] = room.x;
  for (const zg of storeyGroup.children) {
    if (!zg.name.startsWith("zone-")) continue;
    for (const o of zg.children) {
      const b = new THREE.Box3().setFromObject(o);
      if (b.isEmpty()) continue;
      const sx = b.max.x - b.min.x, sz = b.max.z - b.min.z;
      if (b.max.x > x1 - near && sx < thin) out.right.push(o);
      else if (b.min.x < x0 + near && sx < thin) out.left.push(o);
      else if (b.min.z < near && sz < thin) out.back.push(o);
    }
  }
  return out;
}
