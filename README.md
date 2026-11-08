# A Corner of Town / 小镇一角

Each player has their own town with four clay shops: a café, a flower shop, a
bookshop and a bakery. A shop starts empty. You step closer to a floor, then to
one corner, and drag each item to its place: the counter first, then the coffee
machine on it, then the cup. Friends can visit and help.

## What good means for this app

Good here means **asking nothing of you**. Much of a day is judgment calls, and
judgment wears out: the research on
[decision fatigue](https://en.wikipedia.org/wiki/Decision_fatigue) and
[cognitive load](https://en.wikipedia.org/wiki/Cognitive_load) describes a
limited capacity that runs down with use. This app is the opposite on purpose.
Every item has exactly one place; your only job is to notice where and set it
down. It is a little boring by design, and something gets built almost without
you meaning to.

Ian Bogost makes the same distinction in
["Video Game Zen"](https://www.gamedeveloper.com/design/persuasive-games-video-game-zen):
the games that rest the mind are not the ones that call themselves calm, but
the ones that make no demands, the way Solitaire waits for the next card.
[Dorfromantik](https://store.steampowered.com/app/1455840/Dorfromantik/) and
[Tiny Glade](https://store.steampowered.com/app/2198150/Tiny_Glade/) sit nearby,
with nothing to manage and nothing to get wrong. It is meant for the small gaps
in a day, such as waiting for an AI tool to finish, when attention is scattered
and you want to use your hands without judging anything.

Other people make it better, not busier. Friends can place a few items a day in
your town, so you come back to find it a little further along. Two people in the
same shop see each other's placements live. Seasons and weather change by
themselves, so the town is never quite the same twice, and you never have to
choose.

## What's deliberately not here

No free placement, no open-ended building, no chat, no shop, no unlocks, nothing
to collect or buy. Each would bring back a decision. Players can say only two
things: the owner can leave one short note, and can flag parts of a shop where
they want help. There is no forced tutorial, no pop-up that interrupts, and a
hint shows once, when first needed. An item is never split into parts: the
coffee machine is one item and the cup is another.

## Who can see and change what

| | Look at a town | Place items | Rename, write the note, flag help |
|---|---|---|---|
| The owner | yes | yes, no limit | yes |
| An accepted friend | yes | 8 a day in one town, 3 towns a day | no |
| Anyone else signed in | yes | no | no |
| Not signed in | no | no | no |

Looking and changing are separate, as in
[Animal Crossing](https://en.wikipedia.org/wiki/Animal_Crossing:_New_Horizons)
(tools for best friends only),
[Minecraft Realms](https://www.minecraft.net/en-us/realms) and a shared
document's "can view" and "can edit". Friendship needs both sides to accept, so
an owner always knows who can place things. The daily limit is counted per
account on the server, so a town stays mostly its owner's work.

## Enforced and judged

Some of this is **enforced** by tests in `spec/` that run against the live app:
only an accepted friend can place (`worlds.test.ts`, `accounts.test.ts`);
friendship needs both sides (`accounts.test.ts`); the 8-a-day and 3-towns
limits (`worlds.test.ts`); the first placement wins and a second is refused
(`shops.test.ts`); a placement can only name an item, never a position, and
every item has one place in the layout (`fixed-place.test.ts`).

The rest is **judged**: whether it feels calm, whether a view is easy to read,
whether the cat looks right. Those were judged by me, from screenshots of every
affected view at desktop and phone sizes, motion stepped frame by frame, and an
editor where I adjust positions and views by hand. `CLAUDE.md` tells the checking
agent to say plainly that it cannot judge taste, and to leave it to me.
