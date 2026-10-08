# Clay models → stickers

Every object is a procedural Three.js model in a matte clay style. Each named
**part** of a model becomes one sticker: it is rendered alone, orthographic,
straight-on to its wall, on a transparent background, and its 2D box on the
1000×1000 half-canvas is computed from its 3D bounds. The 3D scene is the only
source of position — never hand-edit a box.

Files: `clay.js` (kit) · `models/<object>.js` (one per object) · `scene.js`
(layout) · `pipeline.js` (assembly + rendering) · `/clay-test.html` (test page).

## Units and frames

- **1 unit = 1 cm.** A wall half is 400 cm wide → 2.5 canvas px per cm.
  Floor (y = 0) lands on canvas y = 790 (`FLOOR_LINE`). A 24 cm pot is 60 px wide.
- **Model origin:** bottom-centre of the object, on the floor/surface it rests on.
  +Y up, **front faces +Z**. Keep the back near z = −depth/2.
- **World:** the room corner is the origin; interior x ∈ [−400, 0], z ∈ [0, 400].
  Left wall is the plane z = 0, right wall the plane x = 0. You never place
  things in world coords directly — `scene.js` does it per wall.

## A model module

```js
// public/clay/models/<object>.js
export function build(kit, opts = {}) {      // → THREE.Group
  const { name = "<object>" } = opts;        // name is the id prefix
  const g = new kit.THREE.Group(); g.name = name;
  g.add(kit.part(`${name}-<part>`, { mount: "floor", order: 1 }, ...meshes));
  return g;
}
```

- Every sticker is a `kit.part(id, { mount, order }, ...children)` group,
  a **direct child** of the returned group. Id: `<object>-<part>`, `[a-z0-9-]`.
  Anything not inside a part is not rendered as a sticker — so put every mesh in a part.
- `mount`: `"wall"` (hangs on wall) · `"floor"` (stands on floor) ·
  `"surface"` (sits on another thing) · `"flat"` (lies flat, e.g. rug).
- `order`: placement step within the object (1, 2, … — lower is stuck first).
- Optional `part.userData.zBias` (integer, default 0): 2D stacking nudge. 2D
  layer `z` = part's distance from the wall in cm + zBias (bigger = on top).
  Use −1 for things that sit *inside* another part (soil inside pot).
- Use only kit materials/helpers so the look stays consistent. Chunky,
  rounded, simplified — no sharp edges, no tiny detail (< ~2 cm is invisible).
- See `models/pot.js` for a complete example.

**Generators** use the same signature: `build(kit, { name, seed, count, ... })`
returns one group whose direct children are the variants as parts, ids
`<name>-0 … <name>-(count-1)`, laid out by the generator itself (e.g. a row of
books left to right, origin at the bottom-centre of the row). Use
`const r = kit.rng(seed)` for all randomness so output is deterministic.

## Kit (`clay.js`)

All sizes in cm. Meshes come back centred on their own origin unless noted,
with shadows on; position them with `.position`.

| call | gives |
|---|---|
| `kit.THREE` | three.js r170 |
| `kit.PALETTE` | `brown cream mustard blue terracotta leaf soil charcoal white` (hex) |
| `kit.clay(color, { roughness=.85, sheen=.25 })` | cached matte material; `color` = palette name or hex |
| `kit.roundedBox(w, h, d, r, color)` | rounded box |
| `kit.capsule(r, h, color)` | Y-up capsule, total height h |
| `kit.blob(rx, ry, rz, color)` | (squashed) sphere |
| `kit.lathe([[r, y], …], color, { round=1.5 })` | lathe of a profile, corners rounded; origin at profile y = 0 |
| `kit.roundedCylinder(r, h, e, color)` | cylinder with rounded edges; origin at its base |
| `kit.part(id, { mount, order }, ...children)` | sticker part group |
| `kit.rng(seed)` | deterministic `() => [0,1)` |
| `kit.lightRig({ shadows })` | standard lights (pipeline uses it; models don't) |

`color` may also be a `THREE.Material`.

## Registering in the scene

Add (or un-`todo`) an entry in `scene.js`:

```js
{ model: "armchair", wall: "right", u: 140, d: 60, y: 0, turn: 0, opts: { name: "armchair" } }
```

`u` = cm from the wall's canvas-left edge to the origin (0–400), `d` = cm out
from the wall, `y` = cm above floor (a surface's top for things sitting on it),
`turn` = degrees about Y. Placeholders for plant, armchair, coffee-machine and
books are already there with `todo: true`; remove it once the file exists.

Then open `/clay-test.html` (dev server): left is the orbitable 3D corner,
right is the 2D preview composed from the computed boxes (dashed outlines) and
the sticker sheet. The preview should look like a front view of that wall.
"Save" writes `assets/draft/clay/<id>.png` + `boxes.json` (dev only).
