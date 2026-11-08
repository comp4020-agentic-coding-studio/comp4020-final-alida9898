# Split by responsibility, not by task: when multi-agent coding works

## Position

Multi-agent coding is worth it, but not mainly for speed. What a team of agents buys is clear ownership: each agent has a part of the work it owns and a written list of what it must not touch, and the work is checked by an agent that did not build it. That only holds when the human plans first and fixes the shared decisions before anything is split up. Split by responsibility, multi-agent works. Split one task into pieces, and it breaks the way its critics say.

## The case against

Walden Yan at Cognition argues the opposite: don't build multi-agents (Yan, 2025). His example is a Flappy Bird clone split into two subtasks, one agent building the background and pipes, another building the bird. Each subagent fills the gaps in its brief with its own guesses, and the pieces don't match. His principle is "Actions carry implicit decisions, and conflicting decisions carry bad results." Anthropic's account of its own multi-agent research system adds a cost: multi-agent systems use "about 15× more tokens than chats", and "most coding tasks involve fewer truly parallelizable tasks than research" (Hadfield et al., 2025).

I think both are right about what they describe. In my project I rarely ran more than four agents at once, so the "it's faster" argument was never strong. And Yan's example is one task cut in half: the bird and the pipes share one screen and one art style, so the two halves were never independent.

## Splitting by responsibility

My project, a 3D clay town, began as one long conversation. By crit 9 everything "went through one conversation in a straight line" and it got messy. So I wrote a CLAUDE.md and split the work into fixed roles (9e3c438): `camera` owns every view, `clay` owns the models, `ui` owns buttons and text, and `checker` only checks. A later rule kept the main session from editing code at all; it writes back its understanding, I approve, and only then does it dispatch (217558b). This is close to Anthropic's orchestrator-workers pattern, where "a central LLM dynamically breaks down tasks, delegates them to worker LLMs, and synthesizes their results" (Schluntz & Zhang, 2024).

The difference from Yan's example is what gets split. A model's shape and the camera angle that frames it are different jobs, and each role in my CLAUDE.md table has a "must not touch" column (clay: cameras, layout coordinates, server). The implicit decisions Yan worries about, like the art style, are made once in the plan and the rules before any agent starts, so no subagent has to guess them.

## Boundaries are found, not designed

My boundaries were not right at the start. Seasonal weather and blanket colours were built before any agent owned them, and only afterwards did I add a `season` agent and redraw the line: clay models seasonal props, season may only change colour (525e58d). Even then, frosting a windowsill plant for winter needed a new colour parameter in a clay model file. Yan's point still bites at the edges, so two things stay in place. The main session keeps the whole picture. And a separate checker verifies work it did not write. Tonight a server agent reported all 65 tests passing; the main session re-ran them and one failed when run with the rest. It went back once and came back fixed. Claude Code's own guidance is to review with a reviewer "that hasn't seen how the code was written", and warns that a reviewer "asked to find problems will always find something" (Anthropic, 2026). That is why my rule sends work back at most twice before it comes to me. The checker also says plainly when something is a matter of taste, like whether the cat looks right, and leaves that to me.

## Where this is going

When Yan wrote in June 2025, Claude Code's subagents only answered well-defined questions and never wrote code. Mine write code, and some run at the same time. What made that work was not a better model in each agent. It was deciding the shared things first, giving every agent a written boundary, and having someone else check the work. Multi-agent coding is less about parallel hands than about clear ownership.

## References

- Anthropic (2026). *Best practices for Claude Code*. https://code.claude.com/docs/en/best-practices
- Hadfield, J., Zhang, B., et al. (2025). *How we built our multi-agent research system*. Anthropic Engineering. https://www.anthropic.com/engineering/multi-agent-research-system
- Schluntz, E., & Zhang, B. (2024). *Building effective agents*. Anthropic Engineering. https://www.anthropic.com/engineering/building-effective-agents
- Yan, W. (2025). *Don't build multi-agents*. Cognition. https://cognition.com/blog/dont-build-multi-agents
