# Shop types: how a shop is defined, and how to add one

A **shop type** (`cafe`, `flower`, `book`, `bakery`) is a definition module. The
play page (`/play.html`, `/shop/<id>`, `/w/<world>/<type>`) builds whatever the
definition describes, using the same shell, zoom, tray and live sync as the café.

- Registry: `index.js` maps type → `./<type>/index.js`. The type comes from the URL:
  `/w/<world>/<type>`, else `?type=<type>`, else `cafe`. A type that isn't registered
  yet falls back to the café (with a console note).
- Season: `season.js` (`?season=` override → `GET /api/season` → Canberra date).
- Builder: `public/cafe/build.js` → `buildShop(scene, def, season)`.

## The definition (`<type>/index.js`, default export)

```js
export default {
  name:    { zh, en },                 // breadcrumb root ("咖啡馆")
  loading: { zh, en },                 // loading line
  room:    { x: [x0, x1], z: [0, D], wall: 12 },   // interior footprint, cm
  levels:  [ { level, name, theme: { paper, wainscot }, openings: [...], zones: {...}, walkways: {...} } ],
  tube:    null,                       // the café's bean tube; leave null
  zone:    (id) => import(`./zones/${id}.js`),
  yard:    { label, box, zones, zone: (id) => import(`./yard/${id}.js`), scenery: null | (ctx) => ({ group }) },
  seasons: { spring: () => import("./seasons/spring.js"), ... },
};
```

Frame, storeys, openings, zone boxes, the populate contract and the **Items contract**
are exactly as in `public/cafe/README.md` — read it first. Differences for other shops:
`room` replaces the café's fixed 600 × 480 (origin still = centre of the back wall's inner
face, open front at z = D); the yard sits to the **right** of `room.x[1] + wall`, at ground
level, in **world** coords; yard item ids are `yard-<zone>-<thing>`.

## Adding a new shop type (one storey + yard, ~10 items)

You touch **only** `public/shops/<type>/` (+ new `public/clay/models/*.js` if you make
models — pick names prefixed with your type, e.g. `flower-bucket.js`, to avoid clashes).
The one shared line is the registry entry in `index.js` (it's pre-written and commented
out — just uncomment yours).

1. `cp -r public/shops/_template public/shops/<type>`.
2. In `<type>/index.js`: set `name`, `loading`, `room`, theme colours, openings
   (door on the RIGHT wall so it meets the yard), zones + walkways.
3. Write each zone file `zones/<zone>.js` (populate + tags). ~7 indoor items: 2–3 focus
   furniture pieces, things on them. Keep everything out of the front 60 cm.
4. Yard: `yard/<zone>.js`, ~3 items (bench, planter, sign…). Optional `scenery`
   (copy `../cafe/yard/scenery.js` for grass/path/tree that follow the season).
5. Spring decor: `seasons/spring.js` — 2–4 seasonal items into existing zones.
6. Uncomment the line in `index.js`. Check: `/play.html?shop=<id>&type=<type>`
   (make a shop with `curl -XPOST localhost:8787/api/shops`); console must be clean
   (`[items]` warnings name bad tags).

The template shows on `?type=_template` (dev only) with 3 indoor items, a bench and a
spring flower box.

## Seasons

- An item tagged `season: "spring" | "summer" | "autumn" | "winter"` in `userData.item`
  exists only in that season (not built, not listed, not placeable otherwise).
  Untagged = base, always there. Seasonal items may have base parents (locks as usual).
- Seasonal decor lives in `<type>/seasons/<season>.js` as `export const decor = [{ level,
  zone, populate }]`; the builder adds `season` to every tag those populates create.
  Ids: `<l0|yard>-<season>-<thing>` (placed ids are plain strings on the server).
- Indoors, seasonal items never change the camera framing (it's computed from base items);
  in the yard they do.
- Yard **scenery** changes by itself: tree crown, grass tint, ground scatter, a faint
  tinted light (`cafe/yard/scenery.js`).
- First visit in a new season shows a card ("春天到了，店里多了 N 件春天的小东西");
  localStorage `cafe-season-seen-v1` holds the last season seen. Seasonal tray tiles
  carry a small "新 / new" tag until placed.

### Café decor

Built — **spring** (6): `l0-spring-seedlings` (seedling tray on the back arched window's
sill), `l0-spring-blossom-vase` (cherry blossom on round table 1), `l0-spring-menu-card`
(tent card on the counter), `yard-spring-flower-box` (blooming box against the wall by
the door), `yard-spring-bird-house` (on the tree trunk), `yard-spring-watering-can` (by
the planter).

TODO (planned, not built):
- **summer**: iced-coffee jug + glasses on the counter, a paper fan on the booth table,
  a small electric fan on the sideboard upstairs; yard: striped parasol over the bench,
  a watermelon slice plate on the bench, a garden hose coiled by the planter.
- **autumn**: a pumpkin pair by the door, a bowl of chestnuts on round table 2, a maple
  leaf garland on the bean shelf; yard: a rake leaning on the fence, a leaf pile, a
  basket of apples on the bench.
- **winter**: a knitted scarf on the coat/umbrella stand, a hot-chocolate mug set on the
  counter, fairy lights along the bay window; yard: a small snowman, a sled against the
  fence, a lantern on the mailbox.

## Base café yard (5 items)

`yard-garden-fence` (low picket fence, one item), `yard-garden-bench`,
`yard-garden-planter`, `yard-garden-mailbox`, `yard-garden-lamp`. Tree, grass,
stepping-stone path and scatter are scenery.
