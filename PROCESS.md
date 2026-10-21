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

# After crit 8

Everything above describes the sticker version shown at crit 8. The sections
below cover what changed on the way to crit 9.

## From flat stickers to 3D clay

The scene stopped being a collage of flat pictures and became a small 3D
world made of clay-looking models built in code with Three.js. It started as a
side experiment — a clay-versus-felt style comparison
([`25e963d`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-alida9898/commit/25e963d220c1f8998deb458c8c0c7ef5dd10b03b)) and a pipeline that rendered clay models back out as stickers
([`f3bce67`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-alida9898/commit/f3bce67382f4227e088c3c9afa1d6e752b28e09b)) — and then the models stayed in 3D: a two-storey café shell
([`29cb9f0`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-alida9898/commit/29cb9f03468e69f6dc6828d66920fb7120d5304f)) and a placement game where you step closer, floor by floor
and corner by corner, before placing anything ([`d0a3e93`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-alida9898/commit/d0a3e937443293e4aa8bfca13c77b13e4e784a44)).

The design rule from crit 8 carried over unchanged: every object has one fixed
place and the player makes no decisions. Two rules were added to keep the 3D
version just as calm. One item is one thing a person could pick up and carry
([`e6d01d6`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-alida9898/commit/e6d01d6c5e598ba812c812ffe7e0c48332059df6)) — a coffee machine is one piece, its cup is another, nothing
is split into parts. And small things can only be placed after zooming into
the piece they sit on, so nobody has to aim at a cup from across the room.

A grey tabby cat ([`c322a8f`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-alida9898/commit/c322a8f084f2075bb2e48dff623557c2086d163c)) is the only character, with idle motions and
its own preview page for checking them.

## From a paired room to a town of shops

The crit 8 version paired two visitors into one room. That became: each person
owns a town of four shops ([`0dd5df0`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-alida9898/commit/0dd5df090d98f826c66cf280664e18610f759e4b)), opened from a 3D street
([`ff36807`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-alida9898/commit/ff36807827d48bcf4f9f3777c74301bda25b9271)). There are still no accounts. An owner link places freely; a
guest link lets a friend help with a daily limit, so a town stays mostly its
owner's work. Two people in the same shop see each other's placements live
([`afc5634`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-alida9898/commit/afc56342f273ac7839542b7d633acf1953b9093e)).

Around that: seasons that change the sky, weather and a few seasonal items; a
noticeboard where the owner leaves one short note ([`1d12b7a`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-alida9898/commit/1d12b7aa9e2fb4694d46863f58b8b6bc4dec9f68)); and a way
for the owner to flag the parts of a shop they would like help with
([`faa5410`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-alida9898/commit/faa5410a5579dc3226e510b4a29c8e4faeb9f2fe)). A friend chooses a name or stays anonymous each time they
visit; the owner names their town once ([`f141341`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-alida9898/commit/f14134125c261d02c8317cac935218beec7b8680)).

## Working rules and fixed agent roles

With the 3D version, a single change could quietly break something elsewhere —
moving a camera for one counter changed what another view could see. So the
way of working was written down in `CLAUDE.md` ([`9e3c438`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-alida9898/commit/9e3c4387afffc33bf35a37645b70a52fd9877ff1)) and split
between fixed subagents in `.claude/agents/`, each with things it owns and
things it must not touch:

- **camera** — every view in the shops and the town: framing, occlusion,
  eye-level or top-down.
- **clay** — the models and the cat.
- **ui** — buttons, cards and text, in both languages.
- **mobile** — narrow layouts and touch gestures.
- **checker** — changes no code. It runs `pnpm check`, reads the console,
  takes the checklist screenshots and tests two tabs together, and every run
  includes the phone sizes.

A builder's work goes to the checker; a failure goes back at most twice and
then comes to me. The rules also say what the checker cannot judge — sound,
feel, whether something looks good — so those are handed to me to look at
rather than being reported as passing.

The visual editor idea from crit 8 came along too. Adding `?editor` to any
page ([`f141341`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-alida9898/commit/f14134125c261d02c8317cac935218beec7b8680)) lets me drag an item's position and size, or adjust the
current camera view, and export the numbers to a file. I fix the layout by
hand, say it is saved, and the agent applies those numbers. It only exists in
local development and never changes live data.

## What went wrong, and what was done about it

- **Views blocked by other things.** In 3D, furniture and trees could stand
  between the camera and the piece being placed. Views that show things on a
  wall or a counter were moved to eye level ([`266bf5a`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-alida9898/commit/266bf5a96b960696cdd7aec30ac9e20aeb7e1f71)), and far trees in
  the camera's way are hidden ([`e966cac`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-alida9898/commit/e966cac30908c5b0399bd9e0f6e44f88e9459a6c)). A further fix fades whatever
  stands in front of the target; the checker went through three corners on
  each floor and the yard, and reported one sign by the door that is still
  half hidden by the door frame.
- **Running out of budget mid-task.** The API allowance ran out while several
  agents were part-way through edits. What made it recoverable was a written
  handoff note listing which files were uncommitted, which agents had been
  stopped mid-work, and what was still unverified. The next session began by
  checking that note against `git status` before changing anything.
- **The main session doing the agents' work.** On resuming, the main session
  rewrote the toolbar itself instead of handing it to the ui agent. I pointed
  it out, the work was handed to the ui and mobile agents to review and
  finish, and a rule was added to `CLAUDE.md`: the main session writes its
  understanding, dispatches and sums up, and does not edit code itself.
- **Dragging did not work on a real phone.** It worked in a desktop browser.
  One cause found so far: a drag aimed diagonally at its target was being read
  as scrolling the tray, so it never started. The fix (press and hold to pick
  up, and a wider angle for a direct drag) passes with simulated touch events,
  but simulated events do not go through a real browser's gesture handling, so
  it still has to be confirmed on a phone.

## How the work is checked

- `pnpm check` runs the type check and the tests in `spec/` (46 at the time of
  writing), which cover the server rules: shops, worlds, daily help limits,
  names, help requests and the layout invariants.
- Camera changes are checked by screenshotting every affected view, including
  views outside the change.
- Motion is checked frame by frame on the cat preview page (pause / next
  frame), not from one still image.
- Interface changes are checked at desktop and phone widths, in both
  languages.
- Backups are pushed to a `clay-wip` branch. Pushing to `main` deploys to Fly,
  so that only happens when I say so.

# After crit 9

## From invite links to accounts and friends

Crit 10 asks the app to tell people apart and to check on the server what
each person may do. The old invite links could not do that: whoever held
the owner's link was the owner, and two friends with the same guest link
looked like one person, told apart only by an id the browser made up for
itself. Clearing the browser reset the daily limit.

So the rule "no login" in `CLAUDE.md` was changed, and the links were
replaced by accounts and mutual-consent friends
([`f60ca39`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-alida9898/commit/f60ca39)). The agent first argued against accounts as a break from the
calm design; I pointed out that signing in once does not ask the player to
make decisions while playing, which is what the design is about.

Before choosing permissions, a research agent looked at how Animal
Crossing, Stardew Valley, Minecraft Realms and shared documents handle
visitors. All of them separate looking from changing, so the rule became:
anyone signed in can look at a town, only an accepted friend can place
items, and the daily limit is counted per account on the server. The table
and reasons are in the README.

Server work had no owner among the five agents, so a sixth fixed agent,
**server**, was added for accounts, friends, permission checks, the
database and logging.

Friend requests reach the other person live: their Friends button shows a
red dot within a second or two, without reloading.

## Logging

Every sign-in, friend request, placement, refusal and change is written to
an `events` table in the database (time, account, town, action, result), as
well as to the server log that `flyctl logs` shows. The log lines name the
account, so two people using the app at once can be told apart from the
log alone, and the table keeps the record after the server restarts.

## What the checks caught

The checker tested with two accounts in separate sessions, and the mobile
agent at a true 390px width (by loading the page in a 390px frame, because
the browser window would not shrink that far).

- **A friend with a long username could not place anything.** The server
  checked the friend's display name against the 12-character limit meant
  for town names, while usernames may be 24. The item appeared, then
  quietly disappeared a few seconds later. It was invisible in the UI and
  was found only by testing a real friend placing with a long name. Fixed
  with a separate limit and a regression test.
- Smaller ones, all fixed: error text that did not switch language, the
  "Add as friend" shortcut not filling in the owner's username, the phone
  menu staying open behind the friends card, buttons under 44px tall, and
  old status text staying in the card after a live update.

## Views that looked crooked

Counter and table views kept a sideways angle left over from the first
camera rules. They now face the furniture square-on, looking down about
15°. Views I tune in `?editor` and export to `assets/editor/` are now read
by the game, so a saved view replaces the computed one. On the deployed
site this file is not served yet, so saved views only work locally for
now.
