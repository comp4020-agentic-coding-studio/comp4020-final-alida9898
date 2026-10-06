# Process overview

## Stack

A plain Node.js server (`node:http`, no framework) serving static files, with
SQLite (`node:sqlite`) for the only state that needs to survive a restart:
which pairing-room a player's link belongs to, and which stickers they've
placed. The course's Fly setup gives one shared-cpu-1x machine with 256 MB and
one persistent volume — that's a tight budget for a framework's worth of
dependencies, so the only runtime dependency is `marked`, used to render this
file and README.md at `/readme/`. That scaffold is
[`7a4dc9d`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-alida9898/commit/7a4dc9db40528c8fc6058207d1dfd81666720c9b)
and
[`ef089b5`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-alida9898/commit/ef089b518755a27bb3a7a43a48f199efd54e2872).

## Design pivot: fixed positions over free placement

The core idea is a sticker-collage stress-relief toy: two paired visitors each
build half of a connected scene by sticking pre-made art into place. Partway
through, this drifted toward letting players freely drag stickers anywhere,
with automatic depth sorting deciding what sits in front of what — a more
"realistic" placement model, but it quietly reintroduced the thing the whole
premise was trying to remove: a small decision to make at every step. The fix
was to go back to one fixed, author-defined position per sticker; the
player's only job is to recognise where it goes and drop it there.

[`ffbd408`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-alida9898/commit/ffbd408c1790dfd136c17433bdf2f399de48e975)
carries this further: the player flow moved from a strict one-at-a-time step
gate to free-order placement — every remaining sticker is shown at once,
numbered only as a suggested order, placeable in any order. The persistence
model changed with it, from a single step counter to a set of placed sticker
ids per half.

## Agentic workflow

Most of this was built through iterative direction of Claude Code rather than
by hand-writing changes directly:

- Describing layout tweaks in words got slow and imprecise ("move it left a
  bit, no — put it behind the chair instead"), so instead of more prompting,
  the ask was for a small visual editor
  ([`ffbd408`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-alida9898/commit/ffbd408c1790dfd136c17433bdf2f399de48e975),
  `public/edit.html`): drag, resize, remount, and reorder stickers directly,
  saving straight into `assets/stickers.json`. Sometimes the fastest way to
  direct the work is to ask for the right interface, not a better sentence.
- Generated art that drifted off-style (wrong viewing angle, unwanted baked-in
  text) was iterated on through prompt changes where that worked, or accepted
  as a known cosmetic flaw and left rather than spending more generation
  budget chasing it.
- Several issues were caught by checking the actual result rather than taking
  the first pass: a suggested placement order that asked players to put an
  espresso machine on a counter that didn't exist yet, a CSS grid sizing bug
  that only showed up on one tall sticker, a header layout overlap from a
  language-toggle button, and a random-matchmaking gap that gave no way to
  deliberately invite a specific person to the same room — all folded into
  [`ffbd408`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-alida9898/commit/ffbd408c1790dfd136c17433bdf2f399de48e975)
  and
  [`b5d52bb`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-alida9898/commit/b5d52bbd76dae5f02a8e24f2f5803ebbea8a8555).

## Shipping

[`b5d52bb`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-alida9898/commit/b5d52bbd76dae5f02a8e24f2f5803ebbea8a8555)
renamed the app to 小镇一角 / A Corner of Town and replaced an earlier,
photorealistic town-map generation with one matching the flat sticker
illustration style. Deploy is the course's standard `flyctl deploy
--remote-only --ha=false`; the repo went public and the app went live for
crit 8, both confirmed against the live deployment (join a room, place a
sticker, reload, find it still there).
