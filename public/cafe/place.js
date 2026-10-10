// Helpers handed to every zone's populate(). See public/cafe/README.md.
import * as kit from "../clay/clay.js";

/** Build a model from public/clay/models/<name>.js → THREE.Group (origin bottom-centre, front +Z). */
export async function model(name, opts = {}) {
  const mod = await import(`../clay/models/${name}.js`);
  return mod.build(kit, opts);
}

/**
 * Put `obj` at world (x, y, z) cm, turned `turn` degrees about Y
 * (0 = front faces +Z / the viewer, 90 = faces +X, -90 = faces -X, 180 = faces the back wall),
 * uniformly scaled by `scale`. `y` is the surface it rests on (0 floor, 230 loft, 95 counter top…).
 * Returns obj.
 */
export function place(obj, { x = 0, y = 0, z = 0, turn = 0, scale = 1 } = {}) {
  obj.position.set(x, y, z);
  obj.rotation.set(0, (turn * Math.PI) / 180, 0);
  obj.scale.setScalar(scale);
  return obj;
}

/** Top (max y) of an object's world bounds — for stacking things on it. */
export function topOf(obj) {
  obj.updateWorldMatrix(true, true);
  return new kit.THREE.Box3().setFromObject(obj).max.y;
}
