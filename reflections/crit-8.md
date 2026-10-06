# Crit 8 reflection

**What was the breakthrough that moved the work forward?**

Partway through, I'd drifted from the original idea — the stickers had become
freely draggable, with physics-based occlusion deciding what sat in front of
what. It looked impressive, but it didn't feel right. The whole point of this
project was supposed to be stress relief: you don't think, you just stick
things where they're meant to go. Free placement quietly reintroduced the
thing I was trying to design away — a small decision to make at every step.
Noticing that gap and pulling the design back to fixed, author-defined
positions (with occlusion still handled automatically) was the real
turning point. It meant admitting that a feature I'd already built and liked
was working against the actual goal, and cutting it rather than keeping it
because it existed.

**What did this work change about who I want to be as a software developer?**

I used to think collaborating with an AI meant describing what I wanted
clearly enough in words. This project changed that. When I needed to
reposition and re-layer a whole scene of stickers, trying to describe each
adjustment in a sentence ("move it a bit left", "no, more", "put it behind
the chair instead") was slow and imprecise — language is fuzzy, and some
things are much easier to just point at and drag. So instead I asked for a
small visual editor: I could drag, resize, and reorder stickers myself, and
it saved straight into the data file. That one extra tool paid for itself
almost immediately. It's changed how I think about working with AI going
forward — sometimes the fastest way to direct the work isn't a better
prompt, it's asking for the right interface to direct it with.
