# Roadmap

Planned changes to how the skills work together as a software factory. One section per item, numbered `R<n>` so commits, retros and sessions can cite it ("roadmap R1"). Numbers are never reused. Status is one of: proposed, in progress, done (with commits), dropped (with why).

Retro findings live in `docs/retro-ledger.md`; an item lands here when it reshapes the pipeline rather than fixing one run.

## R1. Orchestration as code

**Status:** proposed, 2026-10-21.

**Idea.** Move the control flow of `run-tickets` out of prose and into a script. The loop over tickets, the gate on a failed check, the research frontier, the extra QA-defect ticket, model and effort routing, and retries become code. Agents keep only the judgement steps: build a ticket, run a QA ticket, write a commit body. The script starts each agent headless (`claude -p`, or the Agent SDK), so a run needs no interactive session and can go AFK.

**Why.** Today one interactive session reads `skills/run-tickets/SKILL.md` and follows it. Every rule in it is a guideline the orchestrator may drift from, and the orchestrator's own context grows with each hand-back. A script follows its loop and gates every time, costs no tokens for the parts that are plain control flow, and is the step from a skill pipeline to a factory.

**What moves, what stays.**
- To code: ticket selection (`all`, ranges, skip tickets with a report), worker start with model and effort, reading the report's Check line, stop on `failed`, commit per ticket, `ticket_stats.py` after each commit, frontier detection for `**Kind:** research`, writing the QA-defect ticket file, the end-of-run table.
- Stays prose: `ticket-worker.md`, the QA ticket's checks, judgement on commit bodies and on what the user should try.

**Open questions.**
- Runtime: `claude -p` from a Node script (fits `scripts/`), the Agent SDK, or the Claude Code Workflow tool.
- Where the script lives: inside `skills/run-tickets/scripts/` so it ships with the skill, with `SKILL.md` reduced to "run the script and relay its result".
- Bounded retry on a failed check (one more worker with the failure in its prompt) before the run stops, instead of stopping at once.
- How the user steers mid-run, today an instruction added to the remaining workers' prompts.
- How permissions and the connectors prompt work without an interactive session.

**Sources.** Matt Pocock's Software Factories cohort and his 2026 recap (loops, ifs and routing as orchestration primitives); Anthropic, "Effective harnesses for long-running agents" (one feature per session, git and a progress file as the hand-off between fresh contexts).
