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
