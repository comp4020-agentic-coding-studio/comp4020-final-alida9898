# Shared shops API

A shop is one café that everyone holding its link builds together. Progress
(placed items) is stored in SQLite; presence and "holding" are in memory only.

- `shop`: server id, `^[\w-]+$` (12 base64url chars).
- `client`: random per-tab id made by the browser, `^[\w-]{1,64}$`. No accounts.
- `item`: scene item id, `^[a-z0-9-]{1,64}$`. Max 300 placed per shop.

## HTTP

| Method & path | Body | Success | Errors |
|---|---|---|---|
| `POST /api/shops` | – | 200 `{ shop }` | |
| `POST /api/shops/match` | – | 200 `{ shop }` — the most recently created shop with exactly one connected visitor that isn't full, else a new one | |
| `GET /api/shops/<id>` | – | 200 `{ shop, placed: string[], present: number }` (`placed` in placement order) | 404 `{ error: "unknown_shop" }` |
| `POST /api/shops/<id>/place` | `{ item, client }` | 200 `{ placed: true }` | 400 `{ error: "bad_item" }` (or `"bad_client"`), 404 `{ error: "unknown_shop" }`, 409 `{ error: "taken" }` (already placed — first drop wins), 409 `{ error: "full" }` |
| `POST /api/shops/<id>/hold` | `{ item, client, holding: boolean }` | 204 (not stored, only broadcast) | 400 `bad_item` / `bad_client`, 404 `unknown_shop` |
| `GET /api/shops/<id>/events?client=<id>` | – | `text/event-stream` | 400 `bad_client`, 404 `unknown_shop` |
| `GET /shop/<id>` | – | `public/play.html` | 404 page |

## SSE events (`event:` name, `data:` JSON)

- `hello` `{ placed: string[], present: number }` — sent only to the new connection, first.
- `placed` `{ item, client }` — to everyone in the shop, including the placer.
- `hold` `{ item, client, holding }` — to everyone, including the holder. When a
  client's last stream closes, `holding:false` is broadcast for each item it held.
- `presence` `{ present }` — to everyone on every connect/disconnect.
  `present` = number of distinct `client` ids with an open stream.
- `: ping` comment every 20 s (ignore).

The client should reconnect on error (EventSource does this automatically) and
treat `hello.placed` as the authoritative list.

# Worlds (a town per person)

A world is one person's small town: four shops, one per `type` —
`cafe` (the real game), `flower`, `book`, `bakery`. No accounts: two
unguessable tokens decide the role. **owner** token → unlimited placing;
**guest** token → a helper with a daily quota. Shops without a world (made by
`POST /api/shops`) keep the open rules above, no quota.

- `world`: 12 base64url chars. `owner` / `guest` tokens: 24 base64url chars.
- `helper`: the guest's own stable browser id, `^[\w-]{1,64}$` (keep it in
  localStorage; quotas are counted per helper id).
- Quota, per helper, per Canberra day (`Australia/Sydney` midnight): at most
  **8** placements in each world, in at most **3** different worlds. A world
  counts as "helped" once one placement in it succeeds.
- Season by Canberra date: spring Sep–Nov, summer Dec–Feb, autumn Mar–May,
  winter Jun–Aug. Env `SEASON=<name>` pins it; outside production
  `GET /api/season?season=<name>` overrides that one response.

| Method & path | Body | Success | Errors |
|---|---|---|---|
| `POST /api/worlds` | – | 200 `{ world, owner, guest, shops: { cafe, flower, book, bakery } }` (shop ids) | |
| `GET /api/worlds/<id>?t=<token>&helper=<id>` | – | 200 `{ world, role: "owner"\|"guest", guestToken (owner only), season, shops: [{ type, shop, placed: n }], quota: { left, worldsLeft } (guest only) }`. `shops` is in the order cafe, flower, book, bakery. `helper` required for guests. | 403 `{ error: "forbidden" }` (bad/missing token), 404 `{ error: "unknown_world" }`, 400 `bad_helper` |
| `POST /api/shops/<shop>/place` (world shop) | `{ item, client, t, helper? }` (`helper` defaults to `client`) | 200 `{ placed: true }` for owner; `{ placed: true, quota: { left, worldsLeft } }` for guest (after this placement) | 403 `forbidden` (bad/missing `t`), 429 `{ error: "quota_today", quota }`, 429 `{ error: "too_many_worlds", quota }`, plus the shop errors above. 409 `taken`/`full` never use quota. |
| `GET /api/season` | – | 200 `{ season, since: "YYYY-MM-DD" }` (first day of the current season) | |
| `GET /w/<world>` | – | `public/town.html` | 404 |
| `GET /w/<world>/<type>` | – | `public/play.html` | 404 |

`quota.left` = placements left in this world today (0 if this would be a 4th
world); `quota.worldsLeft` = worlds this helper may still *start* helping today.
The page reads the token from its own link (e.g. `/w/<world>?t=<token>`) and
sends it as `t`. Hold and SSE (`/api/shops/<shop>/events`) are unchanged and need
no token; the `placed` event never carries quota.
