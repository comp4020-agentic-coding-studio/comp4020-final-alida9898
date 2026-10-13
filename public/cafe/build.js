// Builds the café (shell + every zone's populate + bean tube) and its warm lights.
// Same steps and numbers as cafe.js, packaged so play.js can reuse them without
// touching the preview page.
import * as THREE from "three";
import * as kit from "../clay/clay.js";
import { LEVELS, levelY } from "./zones.js";
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

/**
 * @returns {{ storeys: { level, group, walls, zones: Record<string, THREE.Group> }[], tube: THREE.Group }}
 */
export async function buildCafe(scene) {
  const N = LEVELS.length;
  const storeys = [];
  for (const L of LEVELS) {
    const top = L.level === N - 1;
    const { group, walls } = await buildStorey(kit, {
      level: L.level, theme: L.theme, openings: L.openings, stairsUp: !top, top,
    });
    group.position.y = levelY(L.level);
    scene.add(group);
    const zones = {};
    for (const [id, zone] of Object.entries(L.zones)) {
      const zg = new THREE.Group(); zg.name = `zone-${id}`;
      group.add(zg);
      zones[id] = zg;
      try {
        const mod = await import(`./zones/${id}.js`);
        await mod.populate({ kit, THREE, group: zg, zone, level: L.level, model, place, topOf });
      } catch (err) {
        console.error(`zone ${id} failed to populate`, err);
      }
    }
    storeys.push({ level: L.level, group, walls, zones });
  }
  const tube = buildTube(kit, { levels: N });
  scene.add(tube);
  return { storeys, tube };
}

/**
 * Objects mounted on / standing flat against each wall of one storey (shelf, frames,
 * sill plants…): their box reaches within `near` cm of the wall plane and is thin
 * along the wall's normal. Hide them together with the wall, or they float.
 * @returns {{ left: THREE.Object3D[], right: THREE.Object3D[], back: THREE.Object3D[] }}
 */
export function wallAttached(storeyGroup, near = 35, thin = 60) {
  const out = { left: [], right: [], back: [] };
  const [x0, x1] = [-300, 300];
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
