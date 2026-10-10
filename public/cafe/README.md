# The café (3D preview) — frame and how to add things

`/cafe.html` shows the whole café as a dollhouse cutaway: a stack of storeys,
each with a floor and three walls, open at the front, no roof. Look only —
no sticker gameplay here. Numbers below are copied from `zones.js`, which is
the source of truth; if they ever disagree, `zones.js` wins.

## World frame

- **1 unit = 1 cm**, +Y up.
- **Origin:** ground-floor level, centre of the back wall's inner face.
- **+X** = viewer's right, **+Z** = out through the open front toward the viewer.
- Back wall: plane z = 0. Left wall: x = −300. Right wall: x = +300. Open front: z = 480.
- Footprint (interior): x ∈ [−300, 300], z ∈ [0, 480] → 600 wide × 480 deep. Walls 12 cm thick, outside it.

## Storeys

- `STOREY_H = 300`. Storey `n` has its floor top at world **y = 300·n** (`levelY(n)`).
- Upper storeys sit on a 20 cm slab just under their floor top (y −20…0 local).
- Built now: **level 0** = ground-floor coffee bar, **level 1** = upstairs reading lounge.
  More storeys = another entry in `LEVELS` (+ zone files); `cafe.js` stacks levels 0…N−1.
- **Storey-local coords:** inside a storey, x and z are world, **y = 0 is that storey's floor**.
  Zone boxes, walkways and openings are all storey-local.
- Shell-owned (don't place on/in these): stairs along the left wall, x ∈ [−300, −210],
  z ∈ [160, 440], foot at the front (z 440), arriving upstairs at z = 160; the stairwell
  hole + railing upstairs over the same box; the copper **bean tube** at (x −20, z 50), r 30,
  through every storey — keep-out x ∈ [−65, 25], z ∈ [0, 95] on every level.

## Zones (storey-local boxes, cm)

| level | zone | x | z | notes |
|---|---|---|---|---|
| 0 | `bar` | 40…300 | 0…480 | counter front ≈ z 200, back bar + menu on back wall (z 0–50), entrance at the door (right wall, z 330–430) |
| 0 | `seating` main | −200…40 | 180…480 | 4–5 small round tables, ≥ 60 cm apart |
| 0 | `seating` nook | −300…−75 | 0…150 | one table under the back-left window |
| 1 | `lounge` main | 30…300 | 0…480 | armchair nook, bookshelf, side tables, lamp, frames, plants, cat |
| 1 | `lounge` front | −200…30 | 190…480 | |
| 1 | `brewing` | −200…30 | 0…120 | sideboard on the back wall at x −200…−70 (left of the tube), six tools on its top (y 90) |

All zones: y ∈ [0, 280]. **Walkways** (keep empty): level 0 `entry` x 180…300 z 300…460,
`barFront` x 40…300 z 215…300, `stairFoot` x −300…−170 z 440…480, `toNook` x −210…40 z 100…180;
level 1 `landing` x −300…−200 z 90…160, `toLounge` x −210…30 z 120…190.
Door → counter → tables → stairs → lounge must stay walkable.

## Your zone file

You own exactly one file, `zones/<zone-id>.js` (+ any new `../clay/models/*.js`):

```js
export async function populate({ kit, THREE, group, zone, level, model, place, topOf }) {
  const counter = await model("counter", { width: 200 });            // → THREE.Group
  group.add(place(counter, { x: 170, y: 0, z: 175, turn: 0 }));      // storey-local
  const machine = await model("coffee-machine");
  group.add(place(machine, { x: 200, y: topOf(counter), z: 168, turn: 180 }));
}
```

- `group` is already lifted to your storey; add everything to it. `zone` is the `LEVELS[n].zones[id]` entry.
- `model(name, opts)` builds `public/clay/models/<name>.js` (origin bottom-centre, front +Z).
- `place(obj, { x, y, z, turn, scale })`: `y` is the surface it rests on (0 floor, 95 counter top,
  90 sideboard top, or `topOf(thing)`); `turn` degrees about Y — 0 faces the viewer (+Z),
  180 faces the back wall, −90 faces −X (things on the right wall), 90 faces +X (left wall).
  Wall things: z = 0 on the back wall, x = ±300 on side walls.
- Keep every object's footprint inside your boxes and out of walkways / the tube / stairs.

## Making models

Follow `public/clay/README.md`: one file per object in `public/clay/models/`, kit materials and
helpers only, chunky and rounded, palette colours. **One part = one thing a person could pick
up and carry** — a table is one part, each cup on it is its own part. Ids `[a-z0-9-]`,
`<object>` / `<object>-<thing>`; pass a unique `name` when you place several of one model.
Doors and windows are models too (`door.js`, `window.js`); the shell places them from `openings`.

## Style

Warm, cosy, matte clay; calm and judgment-free. No pendant lamps, no text-heavy signage
(a short menu board is fine), nothing smaller than ~2 cm.
