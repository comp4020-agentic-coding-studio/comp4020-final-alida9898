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
`cafe` (the real game), `flower`, `book`, `bakery`. Crit 10 replaced the old
owner/guest token-link identity with real accounts (`/api/auth/*`, below) and
a server-enforced permission split that follows Animal Crossing Best Friends /
Stardew farmhands / Minecraft Realms Visitor-vs-Member / Google Docs
viewer-vs-editor: **any logged-in account may view any town** (open visiting,
no friendship needed), but **only the owner or an accepted friend of the
owner may place items** in it. Shops without a world (made by `POST
/api/shops`) keep the open rules above, no quota, no login needed.

- `world`: 12 base64url chars. One world per account, created on demand.
- A session is carried in an `HttpOnly` cookie (`sid`); there is no more a
  client-chosen `helper`/`client` string that decides identity or quota —
  quota is now keyed on the logged-in account id, server-side.
- Quota, per account, per Canberra day (`Australia/Sydney` midnight): at most
  **8** placements in each world it's a friend (not owner) of, in at most
  **3** different worlds. A world counts as "helped" once one placement in it
  succeeds.
- Season by Canberra date: spring Sep–Nov, summer Dec–Feb, autumn Mar–May,
  winter Jun–Aug. Env `SEASON=<name>` pins it; outside production
  `GET /api/season?season=<name>` overrides that one response.

## Accounts & friends (`/api/auth/*`, `/api/friends/*`)

Passwords are hashed with `node:crypto` scrypt (salted per password), never
stored in the clear. See `server/auth.ts` for the hashing/cookie mechanics and
`server/accounts.ts` for the HTTP handlers.

| Method & path | Body | Success | Errors |
|---|---|---|---|
| `POST /api/auth/register` | `{ username, password }` (`username` 3–24 chars `[a-zA-Z0-9_-]`, `password` ≥ 8 chars) | 200 `{ account: { id, username } }`, sets session cookie | 400 `bad_username` / `bad_password`, 409 `taken` |
| `POST /api/auth/login` | `{ username, password }` | 200 `{ account }`, sets session cookie | 400 `bad_request`, 401 `bad_credentials` |
| `POST /api/auth/logout` | – | 200 `{ ok: true }`, clears + revokes the session | |
| `GET /api/auth/me` | – | 200 `{ account: { id, username } \| null, world? }` (`world` = this account's town id, created on first call if logged in) | |
| `GET /api/friends` | – | 200 `{ friends: [{id,username}], incoming: [...], outgoing: [...] }` | 401 `forbidden` (no session) |
| `POST /api/friends/request` | `{ username }` | 200 `{ status: "pending_out" \| "friends" }` (sending to someone who already requested you auto-accepts) | 401 `forbidden`, 400 `bad_username`, 404 `unknown_user`, 409 `{ error: "self" \| "already" }` |
| `POST /api/friends/<accountId>/accept` | – | 200 `{ ok: true }` | 401 `forbidden`, 404 `no_such_request` |
| `DELETE /api/friends/<accountId>` | – | 200 `{ ok: true }` (removes a friendship, or declines/cancels a pending request either direction) | 401 `forbidden` |
| `GET /api/friends/<accountId>/status` | – | 200 `{ status: "none"\|"pending_out"\|"pending_in"\|"friends" }` | 401 `forbidden`, 404 `unknown_user` |

Functional-only placeholder pages exercising these: `public/login.html` /
`public/login.js` (register, log in, log out) and `public/friends.html` /
`public/friends.js` (send/accept/list/remove). Unstyled, English-only — the
`ui` agent owns restyling and translating them into the bilingual pattern.

## World & shop endpoints

| Method & path | Body | Success | Errors |
|---|---|---|---|
| `POST /api/worlds` | – (requires a session) | 200 `{ world, shops: { cafe, flower, book, bakery } }` (shop ids) — idempotent: the caller's existing town, or a freshly created one | 401 `forbidden` (no session) |
| `GET /api/worlds/<id>` | – (requires a session) | 200 owner: `{ world, role: "owner", ownerName, helpers, season, note, shops }`; 200 anyone else logged in: `{ world, role: "guest", canPlace: boolean, ownerName, season, note, shops, quota? }` (`quota` present only when `canPlace`). `shops` is in the order cafe, flower, book, bakery. | 401 `forbidden` (no session), 403 `forbidden` (reserved — currently unreachable since every logged-in account can view), 404 `unknown_world` |
| `POST /api/shops/<shop>/place` (world shop) | `{ item, client, helperName? }` (requires a session; `helperName` for a friend only, ≤ 12 code points, else 400 `bad_helper_name`) | 200 `{ placed: true }` for the owner; `{ placed: true, quota: { left, worldsLeft } }` for a friend (after this placement) | 403 `forbidden` (no session, or not the owner/an accepted friend), 429 `{ error: "quota_today", quota }`, 429 `{ error: "too_many_worlds", quota }`, plus the shop errors above. 409 `taken`/`full` never use quota. |
| `PUT /api/worlds/<id>/name` | `{ name }` (owner only; trimmed; must not be empty) | 200 `{ ownerName }` | 403 `forbidden` (not the owner), 400 `{ error: "empty" }` (blank after trim), 400 `{ error: "too_long" }` (> 12 code points), 400 `bad_name`, 404 `unknown_world` |
| `GET /api/worlds/<id>/events` | – | `text/event-stream` for the town page: `hello { ownerName }` first, then `name { ownerName }` on each rename. No session needed, no presence. | 404 `unknown_world` |
| `PUT /api/worlds/<id>/note` | `{ text }` (owner only; trimmed; `""` clears) | 200 `{ note: string\|null }` | 403 `forbidden` (not the owner), 400 `{ error: "too_long" }` (> 40 code points), 400 `bad_text`, 404 `unknown_world` |
| `POST /api/shops/<shop>/requests` | `{ scope: "zone"\|"piece"\|"item", id, on: boolean }` (owner of the shop's world only) | 200 `{ requests: [{ scope, id }] }` (whole set after the change; idempotent) | 403 `forbidden`, 400 `bad_scope` / `bad_id` / `bad_on`, 400 `{ error: "no_world" }` (legacy shop), 404 `unknown_shop`, 409 `{ error: "too_many" }` (> 50 per shop) |
| `GET /api/season` | – | 200 `{ season, since: "YYYY-MM-DD" }` (first day of the current season) | |
| `GET /w/<world>` | – | `public/town.html` | 404 |
| `GET /w/<world>/<type>` | – | `public/play.html` | 404 |

`quota.left` = placements left in this world today (0 if this would be a 4th
world); `quota.worldsLeft` = worlds this account may still *start* helping
today. Every one of the above is enforced server-side from the session
cookie — the client never gets to assert its own role or account id. Hold and
SSE (`/api/shops/<shop>/events`) are unchanged and still need no session; the
`placed` event never carries quota.

## Persistent event log

Every meaningful action (register, login, friend request sent/accepted/removed,
world view, item placed, permission denied, name/note change, help-request
change) is also written to an `events` table in the same SQLite db (so it
survives past what `console.log`/`flyctl logs` can show), alongside the
existing console logging: `{ id, at, account_id, world, action, result,
detail }`. See `logEvent()` in `server/db.ts`.

**Noticeboard & help requests.** A world has one owner note (≤ 40 Unicode
code points, so each Chinese character counts once). Each world shop has a set
of help requests `{ scope, id }`: `zone` (whole zone), `piece` (a focus piece and
what sits on it), `item` (one item). `id` is a client-side scene id,
`^[a-z0-9-]{1,64}$`; the server only stores it. Requests are hints — they never
restrict placing. `GET /api/shops/<shop>` also returns `requests` for world
shops (legacy shops: field absent). Live: after a change the server sends SSE `requests { requests }`
on that shop's stream, and `note { note }` on the stream of **every** shop in
the world (no re-fetch needed).

**Names.** `GET /api/worlds/<id>` also returns `ownerName` (string, `""` =
not named yet — a new town, or one from before names; the owner page asks for a
name then, and a name once set can be changed but never cleared) to both roles, and to the **owner only** `helpers: [{ name, count }]`
— friends who gave a name and placed something in this world, most recent first,
at most 10 (`count` = their placements in this world, all time). Helper ids stay
private; guests don't see who else helped. A guest's `helperName` is stored per
world against its `helper` id (sent again → replaced; `""` → forgotten) and only
on a successful placement; `shop_items.by` already holds the helper id, so the
name joins onto every placement that helper made. Live: a rename sends SSE
`name { ownerName }` on every shop stream of the world and on the town stream.
A guest's `placed` event carries `{ item, client, guest: true, helperName }`
(`helperName` `""` if unnamed); owner placements stay `{ item, client }`.
