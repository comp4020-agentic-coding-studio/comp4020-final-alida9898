# The café (3D preview) — frame and how to add things

`/cafe.html` shows the whole café as a dollhouse cutaway: a stack of storeys,
each with a floor and three walls, open at the front, no roof. Look only —
no sticker gameplay here. Numbers below are copied from `zones.js`, which is
the source of truth; if they ever disagree, `zones.js` wins.

Shop types, the café's yard (院子, right of the building) and seasonal items are
described in `public/shops/README.md`; the café's definition is `public/shops/cafe/index.js`,
which points back at this folder's `zones.js` + `zones/*.js`.

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
| 0 | `bar` main | 40…300 | 0…300 | **focal**: long counter x 45…295 z 122…178 (no bar chairs); bean-jar wall shelf + menu on the back wall |
| 0 | `bar` door | 180…300 | 300…420 | entrance: doormat, OPEN sign, umbrella stand, A-frame (all inside) |
| 0 | `window` bay | −300…−65 | 0…100 | bay seat under the back arched window; chalkboard on the back wall beside it |
| 0 | `window` booth | −210…−50 | 180…360 | banquette along the stair side, 1 long table, 2 backed chairs |
| 0 | `seating` mid / front | −50…40 / 40…180 | 180…360 / 330…420 | two round tables with backed chairs |
| 1 | `reading` | 25…300 | 0…200 | **focal**: armchair at the back arched window, lamp, side table |
| 1 | `lounge` | 30…300 | 200…420 | facing loveseats + coffee table, mixed bookshelf on the right wall, sill plants |
| 1 | `brewing` | −200…30 | 0…120 | slow bar: sideboard, roaster beside the tube; the one large artwork above |

All zones: y ∈ [0, 280]. **Nothing at z > 420** on any storey (the open front is 60 cm clear).
**Walkways** (keep empty): level 0 `entry` x 180…300 z 320…420, `barFront` x 40…230 z 225…300,
`toStairs` x −170…40 z 360…440, `stairFoot` x −300…−170 z 440…480, `toWindow` x −150…40 z 100…180;
level 1 `landing` x −300…−200 z 90…160, `toLounge` x −210…30 z 120…190.
Placeholders for objects without a model yet come from `placeholder.js` (`userData.placeholder = true`).
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

## Items: what the player places (contract shared by the play page and every zone file)

Every placeable thing you add in `populate` is tagged on the object you pass to `group.add`:

```js
const counter = place(await model("counter"), { x: 170, y: 0, z: 175 });
counter.userData.item = { id: "l0-bar-counter", parent: null, layer: 1,
  label: { zh: "柜台", en: "Counter" }, focus: true };
const cup = place(await model("coffee-cup", { name: "l0-bar-cup-1" }), { x: 120, y: topOf(counter), z: 170 });
cup.userData.item = { id: "l0-bar-cup-1", parent: "l0-bar-counter", layer: 2,
  label: { zh: "咖啡杯", en: "Coffee cup" } };
```

- `id`: unique across the building, `l<level>-<zone>-<thing>[-n]`.
- `parent`: the id of the item it rests on / hangs on, or `null` for things on the floor or
  walls. A child stays locked until its parent is placed. Items whose parent is a shell
  thing (wall, floor) use `null`.
- `layer`: 1 = big furniture, 2 = things on furniture, 3 = things on those (a cup on the
  machine) or decals on a board. The tray groups by layer, in order.
- `label`: short bilingual name shown in the tray.
- `focus: true`: furniture worth zooming into (counter, shelves, chalkboard, tables,
  bookshelf). The player clicks it to zoom in; the tray then lists only its descendants.
- `season` (optional): `"spring" | "summer" | "autumn" | "winter"` — only exists in that season.
- Untagged objects are scenery (always visible, not placed by the player).

Zoom hierarchy: building → storey → zone (one zone file) → focus item → its children.
Every item has exactly one fixed spot; order within an unlocked layer is free.
