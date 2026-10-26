# Roadmap

Planned changes to how the skills work together as a software factory. One section per item, numbered `R<n>` so commits, retros and sessions can cite it ("roadmap R1"). Numbers are never reused. Status is one of: proposed, in progress, done (with commits), dropped (with why).

Retro findings live in `docs/retro-ledger.md`; an item lands here when it reshapes the pipeline rather than fixing one run.

## R1. Orchestration as code

**Status:** proposed, 2026-10-21. Waits for R2 to run in one batch and for a retro to judge it (brakes before accelerators, decided 2026-10-26).

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

## R2. Batch review before the QA ticket

**Status:** proposed, 2026-10-26.

**Idea.** run-tickets starts one review agent just before each QA ticket, with no ticket file of its own: the QA ticket already marks where a batch ends. The agent runs the forked `code-review` on the batch's commits, Spec axis only, on Sonnet at medium effort. It reads the batch diff, the batch's ticket files and the spec stories in their Covers lines. Its findings become one fix ticket that runs before the QA ticket, so the QA ticket tests the fixed code. The fix ticket is not reviewed again: one review pass per batch. No findings, no fix ticket.

**Why.** The Software Factories cohort names three layers of safety: automated checks, automated review, human review. The pipeline has the first (the quick check, the QA ticket) and the third (review mode, the playtest), and nothing between them. Earlier brakes failed on cost because they ran Unity in every ticket (the FGame 23 to 33 retro: 59 minutes a ticket, 56% of it waiting on Unity). A review that reads only the diff runs no Unity, and one per batch costs a fifth of one per ticket.

**Measured, not capped.** `ticket_stats.py` gives the review and its fix ticket their own rows, with minutes and dollars, so a retro sees what the brake costs and how long it holds up the run. No rule sets a fixed limit; the retro judges each brake from its rows.

**Checks as code grow from it.** A review finding that comes back at a later retro becomes a check candidate (a test, an analyzer or a hook that fails the quick check), through the retro's Automated checks category. That part needs no skill change.

**Standards.** The Standards axis stays off in runs until the project writes coding standards; they grow from retro findings.

## R3. Deep-module design in the prefactor step

**Status:** proposed, 2026-10-26.

**Idea.** Fork `codebase-design` (the deep-module vocabulary: module, interface, seam, depth). to-tickets uses it in its prefactor step, so a batch can open with prefactor tickets that deepen the modules it touches.

**Why.** Orientation reads drive ticket cost: FGame ticket 116 made 48 reads (209 KB) before its first edit and cost $5.09, against about $0.50 for each other build ticket of its batch. Deeper modules put more behaviour behind fewer files to read.

## R4. Glossary, ADRs and Wayfinder

**Status:** dropped, 2026-10-26. A glossary and ADRs (`grill-with-docs`, `domain-modeling`) wait until a retro shows an agent using the wrong term: every worker would pay to read them. Wayfinder's job, planning work bigger than one spec, is already done by research tickets and design-phase batches.
