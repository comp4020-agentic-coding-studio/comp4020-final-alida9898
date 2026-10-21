# A Corner of Town / 小镇一角

Each player has their own town with four shops: a café, a flower shop, a
bookshop and a bakery. Everything is a 3D model that looks like clay. A shop
starts empty. You zoom in to a floor, then to one area, and drag each item to
its place — for example the counter first, then the coffee machine on it,
then the cup.

Towns are separate. Your town is yours and a friend's town is theirs; they
never merge. You sign in with a username and a password, and you can visit
anyone's town to look around. Once two people have both agreed to be
friends, each can place a few items a day in the other's town. What you
place in a friend's town stays in their town.

## What good means for this app

The starting point wasn't "let's make a cute collage game." It was noticing
how much of daily life is unavoidably uncertain, and how much of that
uncertainty gets handled by making one judgment call after another, all day.
Judgment is expensive. The psychological literature on [decision
fatigue](https://en.wikipedia.org/wiki/Decision_fatigue) (Baumeister's ego
depletion research) and cognitive load theory describes this directly: the
capacity to weigh options and make considered choices is a limited resource
that depletes with use, and the mind defaults to faster, less effortful modes
of thinking once it's spent.

So this app tries to be the opposite of that: a place where you do something
that looks a little boring on purpose, and nothing asks you to decide
anything. Every object has exactly one place it goes; your only job is to
notice where and set it down. Something gets built almost without you
meaning to build it.

Game designer Ian Bogost has written about this distinction in what he calls
["zen" games](https://www.gamedeveloper.com/design/persuasive-games-video-game-zen):
the ones that actually work as a mental rest aren't the ones that explicitly
brand themselves as meditative — he points to *Cloud* as an example that
didn't quite land — they're the ones that simply make no demands on your
time or attention, the way Solitaire patiently waits for you to place the
next card. More recent "no wrong answers" building/decorating games,
like *Dorfromantik* (which states upfront that it's designed to be
low-stress, with no timer) and *Tiny Glade*, sit in the same space: nothing
to manage, nothing to get wrong.

It's a bit like Lego, but more portable — it lives on a phone or laptop, so
it's there in the small gaps of a day: waiting for a reply, waiting for a
tool to finish a task. That last one matters specifically. Running several
AI-assisted tasks in parallel tends to scatter attention rather than rest it,
and this is meant to be something you can do with your hands and no judgment
at all, in exactly those gaps.

## What's deliberately not here

No free placement, no open-ended creation, no chat, no in-app shop, no choosing what to collect or unlock, nothing monetised. Every one of
those would reintroduce a decision — which is the one thing this app is
trying not to ask of you.

Players can only say two things to each other. The owner can leave one short
note on the town's noticeboard, and can flag parts of a shop where they want
help.

There is also no forced tutorial, no pop-up that interrupts, and no locked
input. A hint shows once, the first time it is needed, and can be skipped.

An item is never split into parts. One item is one thing a person could pick
up and carry: the coffee machine is one item and the cup is another.

## Who can see and change what

A person is an account: a username and a password. The password is stored
only as a salted hash, and signing in gives the browser a session cookie
that the server issued. Every request is checked on the server against that
session; the server never trusts a name, role or id that the page sends.

| | Look at a town | Place items | Rename the town, write the note, flag help |
|---|---|---|---|
| The owner | yes | yes, no limit | yes |
| An accepted friend | yes | yes, 8 a day in one town, 3 towns a day | no |
| Anyone else signed in | yes | no | no |
| Not signed in | no | no | no |

Why it is drawn this way:

- **Looking and changing are separate.** Visiting is how people share a
  town, so anyone signed in can look. Placing changes someone else's town,
  so it needs the owner's agreement. Animal Crossing keeps the axe and
  shovel for Best Friends, Minecraft Realms separates Visitors from Members,
  and a shared document separates "can view" from "can edit".
- **Friendship needs both sides.** A request only counts once the other
  person accepts it, so an owner always knows who can place things in their
  town.
- **The daily limit belongs to the account.** It used to be tied to an id
  the browser made up, which could be reset by clearing the browser. Now
  the server counts it per account, so a town stays mostly its owner's work.
- **It replaced invite links.** Earlier, whoever held the owner's link was
  the owner, and two friends holding the same guest link looked like one
  person. Accounts are what let the app tell people apart.

Every sign-in, friend request, placement and refusal is written to an
`events` table in the database, with the account that did it, so the record
stays after the server restarts. The same lines go to the server log.
