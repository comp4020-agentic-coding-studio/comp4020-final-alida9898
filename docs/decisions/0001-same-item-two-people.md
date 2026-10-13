# 1. Two people reaching for the same item: lock it while it is held, release on a timeout

Status: decided at crit 9 (October 2026). Not built yet — the app still does
what "Today" describes below.

## Context

Several people can be in the same shop at once: the owner, and friends who
came in with the guest link. Everyone sees the same tray of items. Each item
has exactly one fixed place, so two people can pick up the same item at the
same moment and both carry it to the same spot.

The question is what the app does then.

`README.md` says what good means here: nothing asks you to decide anything.
So the answer should not add a decision or an error message.

## Today

Nothing is locked, and the first drop wins. Anyone can pick up any open item.
Whoever lets go over the spot first places it. For the other person the item
simply lands in its place, and if they were still carrying it, their drag
ends without any message.

While someone is holding an item, everyone else sees it faded with a small
dot in their tray. That is only a hint: they can still pick it up. When the
person holding it closes the page or loses the connection, the server tells
everyone it has been let go.

## Options considered

**A. First drop wins, nothing is locked.** What the app does today.

**B. Lock the item while someone holds it, and release it on a timeout
(chosen).** The first person to pick an item up has it until they drop it.
Everyone else sees it faded and cannot pick it up. If the holder does nothing
for a short time, or disconnects, the item goes back to its place in the tray
and is open to everyone again.

**C. Give each person their own items.** Split the tray so each person has a
separate set and nobody can touch another person's.

## Decision

Option B.

- It is the most reasonable of the three. If someone already has an item in
  their hand, other people should not be able to take the same one.
- The usual objection to a lock is the person who picks something up and then
  walks away. A timeout answers it: when the time runs out the hold is
  dropped and the item goes back to where it was. Nothing is lost and nobody
  has to do anything.
- Most of it already exists. The server already broadcasts who is holding
  what, other people's trays already fade that item, and a disconnect already
  releases it. What is missing is refusing the pick-up, and the timeout for a
  holder who stays connected but stops moving.
- C was rejected because it means deciding who gets what, and it stops a
  friend from helping with whatever is left.

## Why it is not built yet

Placement and live sync are the part the crit depends on, and what is there
now has been checked with two people in the same shop. Changing how holding
works the night before, without time to test it on real phones, risked
breaking the one thing that has to work. It is planned for the week after.

## What this costs

- You can want an item and have to wait for it. Under A you never wait.
- The timeout length is a guess. Too short and it drops an item out of the
  hand of someone who is just slow; too long and an abandoned item blocks
  everyone else.
- The server has to keep track of time for each hold, which it does not do
  today.
- Until it is built, the costs of A remain: your drag can end without
  explanation when someone else drops the same item first, and two people can
  spend effort on the same item.

## Where it lives

- `server/shops.ts` — holds are kept in memory per shop and released when a
  connection closes. The timeout would go here.
- `server/db.ts` — placing an item that is already placed returns `taken`.
- `public/play.js` — the faded tile and dot for an item someone else holds;
  `landRemote` ends a drag when the same item arrives from someone else.
- `server/SHOPS.md` — the contract for `place`, `hold` and the live events.
