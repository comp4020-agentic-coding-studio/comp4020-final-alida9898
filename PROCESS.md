# Process

This describes the project as it stands at submission. The crit reflections in
`reflections/` record how it looked at each stage.

## Stack, and why

A plain Node.js server (`node:http`, no framework) serves static files, with
SQLite (`node:sqlite`) on the one Fly volume for everything that must survive a
restart: accounts, friendships, placed items and an `events` log
([`7a4dc9d`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-alida9898/commit/7a4dc9db40528c8fc6058207d1dfd81666720c9b),
[`ef089b5`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-alida9898/commit/ef089b518755a27bb3a7a43a48f199efd54e2872)).
The course gives one small machine with 256 MB, so I kept dependencies to almost
none; the only runtime one renders this file and the README at `/readme/`. A
framework would have cost memory and given the agents more surface to break.

Real-time updates use server-sent events rather than WebSockets. Changes only
flow one way, from the server to everyone in a shop, while placing is an
ordinary request the server checks. SSE reconnects by itself and needs no extra
library. Two people in the same shop see each other's placements within a second
([`afc5634`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-alida9898/commit/afc56342f273ac7839542b7d633acf1953b9093e)).

The 3D scene is Three.js, and every model is built in code to look like clay
rather than loaded from asset files. That keeps one consistent look across four
shops and lets an agent change a model by editing numbers, which I can review in
a diff. The cost is that taste is hard to get right through code, which became
the cat problem below.

## Design: the decisions the player never makes

The first version was a sticker collage. Partway through it drifted towards
letting players drag stickers anywhere, which quietly brought back the one thing
the premise removes: a decision at every step. I went back to one fixed place
per item, in any order
([`ffbd408`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-alida9898/commit/ffbd408c1790dfd136c17433bdf2f399de48e975)).
That rule carried into 3D: a two-storey café
([`29cb9f0`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-alida9898/commit/29cb9f03468e69f6dc6828d66920fb7120d5304f)),
stepping closer floor by floor before placing anything
([`d0a3e93`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-alida9898/commit/d0a3e937443293e4aa8bfca13c77b13e4e784a44)),
and a town of four shops per person
([`0dd5df0`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-alida9898/commit/0dd5df090d98f826c66cf280664e18610f759e4b)).

Accounts were a reversal. `CLAUDE.md` said "no login"; crit 10 required the
server to tell people apart, and invite links could not, because whoever held a
link was that person. I struck the rule through with the date and reason, and
replaced links with accounts and friends that both sides accept
([`f60ca39`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-alida9898/commit/f60ca3916bd35081278f37aa71f1fdb5a9ecb0fc)).
The agent first argued that accounts broke the calm design. I disagreed:
signing in once asks nothing of the player while playing. The permission split,
anyone can look and only friends can place, came from how Animal Crossing,
Minecraft Realms and shared documents handle visitors.

Seasons and weather follow the calendar and a random pick, never a menu
([`26d442a`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-alida9898/commit/26d442a662a6ca56edec0f233f9b0045b08f5daf),
[`facc354`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-alida9898/commit/facc354356022f0229a085285c55c8332bdf439b)),
so the town changes without asking anything.

## Agent workflow

Until crit 9 everything went through one conversation, and it got messy. A
change to one camera quietly changed what another view could see. So I wrote the
rules into `CLAUDE.md` and split the work between fixed subagents in
`.claude/agents/`, each with what it owns, what it must not touch and what it
hands back
([`9e3c438`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-alida9898/commit/9e3c4387afffc33bf35a37645b70a52fd9877ff1)).
There are now seven: camera, clay (models), season, ui, mobile, server and
checker. The main session writes back its understanding of a request, waits for
me to agree, dispatches, and sums up. It does not edit code.

I chose this over one agent with everything because the parts really are
separate: the shape of a model and the camera that frames it are different
decisions. The trade-off is cost and coordination. Each agent starts with less
context, so the shared decisions have to be written down first, and boundaries
drawn late cause trouble. My research note argues the general case.

## When the agent got it wrong, the fix went into the harness

- **The main session did the agents' work.** It rewrote the toolbar itself. I
  added a rule that it never edits code, and that every check includes phones
  ([`217558b`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-alida9898/commit/217558bc8a3b0ce2e53285da80972e052085e5dc)).
- **Agents opened tabs in my own browser.** The rule now says every agent uses
  a background headless browser, and the season agent was added in the same
  change after weather work turned out to have no owner
  ([`525e58d`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-alida9898/commit/525e58d32560353f9056b1e30fb531eb3d85a511)).
- **Bugs became tests.** A friend with a long username could not place
  anything, because the server checked it against the town-name limit. It is
  now a regression test in `spec/names.test.ts`. Clearing the browser used to
  reset the daily limit; `spec/worlds.test.ts` now proves it cannot.
- **README claims without tests.** An audit found that "one fixed place per
  item" and the `events` log had no test, and old invite-link tests
  contradicted the README. Those are now covered and labelled
  ([`08571d1`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-alida9898/commit/08571d1b8323a1af494779484b6753c57dd9d1fa)).
- **The cat.** Agents rebuilt it several times and it kept getting worse. A
  "realistic" version was thrown away before it was committed. What fixed it
  was not another prompt but sliders: I tuned the face and body myself, and the
  exported numbers went into the code unchanged
  ([`96f789a`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-alida9898/commit/96f789a8a87c6fed7a1a1f98c9465ab0838cdf49)).
  The same idea runs through `?editor`: position, size and views are adjusted
  by hand, not described in words.

## How the work is checked

`pnpm check` runs the type check and the tests in `spec/`, which hold the
claims the README makes about permissions, limits, friends and fixed places.
A builder's work goes to the checker, and to the mobile agent at 390×844; a
failure goes back at most twice and then comes to me. Motion is checked frame
by frame. The rules say what the checker cannot judge (sound, feel, whether
something looks right) so those come to me instead of being reported as
passing. Checking has its limits too: on the last night a checker reported
every test passing when one failed on a second run, and a full pre-merge check
ran too long to finish. Backups go to
`clay-wip`; pushing to `main` deploys, so it only happens when I say so.
