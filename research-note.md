# Split by responsibility, not by task: when multi-agent coding works

## Position

Multi-agent coding is worth it, but not mainly for speed. What a team of agents buys is clear ownership: each agent owns one part of the work, has a written list of what it must not touch, and has its work checked by an agent that did not build it. That only holds when the human plans first and settles the shared decisions before anything is split. Split by responsibility, multi-agent works. Split one task into pieces, and it breaks the way its critics say.

## The case against

Walden Yan at Cognition argues the opposite: don't build multi-agents (Yan, 2025). His example is a Flappy Bird clone split in two, one subagent building the background and pipes, another building the bird. Each fills the gaps in its brief with its own guesses, and the pieces don't match: "Actions carry implicit decisions, and conflicting decisions carry bad results." Anthropic adds a cost from its own multi-agent research system: about "15× more tokens than chats", and "most coding tasks involve fewer truly parallelizable tasks than research" (Hadfield et al., 2025).

Both are right about what they describe. But the bird and the pipes share one screen and one art style. They were never independent jobs, only one task cut in half.

## Splitting by responsibility

My project, a 3D clay town, began as one long conversation. By crit 9 everything "went through one conversation in a straight line" and it got messy. So I wrote a CLAUDE.md and split the work into fixed roles (9e3c438): `camera` owns every view, `clay` owns the models, `ui` owns buttons and text, `checker` only checks. Later, the main session was barred from editing code at all: it writes back its understanding, I approve, then it dispatches (217558b).

In the terms of Schluntz and Zhang (2024), the roles are *sectioning*, "breaking a task into independent subtasks run in parallel", while the main session works as an *orchestrator*, deciding each time which roles a request needs. A model's shape and the camera that frames it really are independent, so the agents I did run at once were ones whose work could not collide. Anthropic reached the same rule the hard way: vague delegation made subagents duplicate work and misread tasks, so each now gets "an objective, an output format, guidance on the tools and sources to use, and clear task boundaries" (Hadfield et al., 2025). That is the shape of my CLAUDE.md table: what each agent owns, what it hands back, and what it must not touch. Yan's implicit decisions, like art style, are made once in the plan and the rules, so no subagent has to guess them.

## Boundaries are found, not designed

My boundaries were not right at the start. Seasonal weather and blanket colours were built before any agent owned them; only afterwards did I add a `season` agent and redraw the line, with clay modelling seasonal props and season limited to colour (525e58d). Yan's point still bites at the edges, which is why the main session keeps the whole picture and a separate checker verifies work it did not write.

## What only a human can judge

Some checks no agent can run. Anthropic notes that "even in a world of automated evaluations, manual testing remains essential" (Hadfield et al., 2025). I go further: some judgements are not missed by automation but out of its reach. My rules say so before anything goes wrong: the checker must state that it cannot judge sound, feel or taste, and spatial tweaks go to an editor I drag myself rather than being described to an agent in words. The cat is the proof. For weeks agents rebuilt it, and each version was worse. What fixed it was not another attempt but a set of sliders I tuned myself, with the numbers copied into the code unchanged (96f789a).

## Where this is going

When Yan wrote in June 2025, Claude Code's subagents only answered well-defined questions and never wrote code. Mine write code, and some run at once. What made that work was not a better model in each agent but deciding the shared things first, giving every agent a written boundary, having someone else check the work, and keeping taste with the human. Multi-agent coding is less about parallel hands than about clear ownership.

## References

- Hadfield, J., Zhang, B., et al. (2025). *How we built our multi-agent research system*. Anthropic Engineering. https://www.anthropic.com/engineering/multi-agent-research-system
- Schluntz, E., & Zhang, B. (2024). *Building effective agents*. Anthropic Engineering. https://www.anthropic.com/engineering/building-effective-agents
- Yan, W. (2025). *Don't build multi-agents*. Cognition. https://cognition.com/blog/dont-build-multi-agents
