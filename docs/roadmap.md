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

**Settled in the 2026-10-26 factory grill (R5).**
- Scope: the script runs the whole chain after the decision round, not only the tickets: to-spec, to-tickets, the run, the R2 review, QA, the QA-defect ticket, the push (R11) and the retro (R10).
- Session: a fresh session started in the background with no window, so the user keeps the PC; the status file (R8) records each step and the transcript stays resumable.
- A failed check: one fresh worker makes one fix attempt with the failure in its prompt. When that fails too, skip the ticket and every ticket it blocks, finish the rest, and list the skipped tickets on the status file. The whole run no longer stops.
- Lanes: one build lane, since build tickets share one Unity editor; research tickets and work that needs no Unity run in parallel.
- Permissions: the same mode as today's runs, with the claude.ai connectors off for the chain session, so the connectors stop-and-ask cannot stall an AFK night.

**Open questions.**
- Runtime: `claude -p` from a Node script (fits `scripts/`), the Agent SDK, or the Claude Code Workflow tool.
- Where the script lives: inside `skills/run-tickets/scripts/` so it ships with the skill, with `SKILL.md` reduced to "run the script and relay its result".
- How the user steers mid-run, today an instruction added to the remaining workers' prompts.

**Sources.** Matt Pocock's Software Factories cohort and his 2026 recap (loops, ifs and routing as orchestration primitives); Anthropic, "Effective harnesses for long-running agents" (one feature per session, git and a progress file as the hand-off between fresh contexts).

## R2. Batch review before the QA ticket

**Status:** in progress, 2026-10-26: built in 2da437b (fork code-review) and b706e42 (adapt run-tickets); waits for its first batch and a retro.

**Idea.** run-tickets starts one review agent just before each QA ticket, with no ticket file of its own: the QA ticket already marks where a batch ends. The agent runs the forked `code-review` on the batch's commits, Spec axis only, on Sonnet at medium effort. It reads the batch diff, the batch's ticket files and the spec stories in their Covers lines. Its findings become one fix ticket that runs before the QA ticket, so the QA ticket tests the fixed code. The fix ticket is not reviewed again: one review pass per batch. No findings, no fix ticket.

**Why.** The Software Factories cohort names three layers of safety: automated checks, automated review, human review. The pipeline has the first (the quick check, the QA ticket) and the third (review mode, the playtest), and nothing between them. Earlier brakes failed on cost because they ran Unity in every ticket (the FGame 23 to 33 retro: 59 minutes a ticket, 56% of it waiting on Unity). A review that reads only the diff runs no Unity, and one per batch costs a fifth of one per ticket.

**Measured, not capped.** `ticket_stats.py` gives the review and its fix ticket their own rows, with minutes and dollars, so a retro sees what the brake costs and how long it holds up the run. No rule sets a fixed limit; the retro judges each brake from its rows.

**Checks as code grow from it.** A review finding that comes back at a later retro becomes a check candidate (a test, an analyzer or a hook that fails the quick check), through the retro's Automated checks category. That part needs no skill change.

**Standards.** The Standards axis stays off in runs until the project writes coding standards; they grow from retro findings.

**Confirmed in the 2026-10-26 factory grill (R5).** One review per batch, before QA. Its fix ticket follows the R1 rule for a failed check: one fix attempt, then skip.

## R3. Deep-module design in the prefactor step

**Status:** in progress, 2026-10-26: built in a10dd41 (fork codebase-design) and 0f0d497 (adapt to-tickets); waits for its first ticket breakdown and a retro.

**Idea.** Fork `codebase-design` (the deep-module vocabulary: module, interface, seam, depth). to-tickets uses it in its prefactor step, so a batch can open with prefactor tickets that deepen the modules it touches.

**Why.** Orientation reads drive ticket cost: FGame ticket 116 made 48 reads (209 KB) before its first edit and cost $5.09, against about $0.50 for each other build ticket of its batch. Deeper modules put more behaviour behind fewer files to read.

## R4. Glossary, ADRs and Wayfinder

**Status:** dropped, 2026-10-26. A glossary and ADRs (`grill-with-docs`, `domain-modeling`) wait until a retro shows an agent using the wrong term: every worker would pay to read them. Wayfinder's job, planning work bigger than one spec, is already done by research tickets and design-phase batches.

## R5. The factory cycle

**Status:** proposed, 2026-10-26. Settled in the FGame grill session 22465196; R6 to R11 are its parts, and R1 and R2 carry its answers.

**Idea.** The user keeps three touchpoints: feedback (the `fb:` prompt into `feedback.md`), one short decision round per batch, and the playtest. Everything between them runs by itself. One cycle:

1. The user runs `/factory` after a playtest (R7).
2. Triage sorts the Open feedback notes (R6). Agent-ready notes become tickets and start building at once, in the one build lane.
3. The decision round waits for the user: `/grill-me` on the notes that need the user (R9).
4. Its last answer starts the chain in a fresh background session (R1): to-spec, to-tickets with no quiz, the run, the batch review (R2), QA, the QA-defect ticket, the push (R11), the retro (R10).
5. The status file and its banner tell the user what waits: a decision round, a batch to play (R8).

**Constraints.** The factory runs on the user's PC (the Unity editor and its licence), commits on `main` with no PRs, and uses no Docker sandbox (the editor and its play-mode tests cannot run in one on Windows). No Slack or other push message: the user sees what the factory needs when they open a session (R8). No cost cap at first: the status file shows each cycle's dollars, and a cap waits for two measured cycles.

**Scope.** General: the factory and its skills live here, with no FGame or Unity names in them (`manifest.json` forbid list). FGame proves it first ("I need to prove the factory works first"); PlayableFactory uses it next.

**Order (proposed).** R1 already waits for R2 to run in one batch and for a retro (brakes before accelerators). Suggested: R2 and R6 first, proven together on a batch of agent-ready FGame tickets; then R8, R10, R11; then R9; then R1 with R7.

**Why.** The FGame process kept a human stop at every step: each skill invoked by hand, the ticket quiz, a retro pick per finding, the push held for the playtest. The user accepted the grill's recommendations in 19 of 31 rounds ("I'll only be able to tell if I like them after I test it out"), and an AFK afternoon was lost because ticket creation did not chain into the run ("this could've ran while I was afk").

## R6. Triage skill

**Status:** in progress, 2026-10-26: built in 1041162 (add triage) and 7da0b13 (adapt to-tickets); waits for the proof run and a retro.

**Idea.** A `triage` skill, called by `/factory` and runnable alone, sorts each Open note of the feedback file into one of three:
- **Agent-ready:** a bug, a layout defect or a clear ask. It becomes a ticket directly, with no spec revision, and builds at once while the decision round waits.
- **Needs the user:** a taste decision, or one that costs more than a ticket to reverse. It goes to the next decision round (R9).
- **A session of its own:** a topic the user marked so (FGame: the map rework, the gem selection, the Noita idea, the game's identity). It stays Open, out of the round, and the banner lists it.

Its first job is the existing backlog (FGame: about 40 Open notes on 2026-10-26).

**Settled, 2026-10-26 (FGame session 22465196).**
- An own skill, not a fork: Matt Pocock's `triage` (v1.3.1) works one tracker issue at a time and waits for the maintainer at each step, the opposite of an AFK batch over a file; a fork would strip most of it. Borrowed from it: the "already built" check (a note whose behaviour exists, found by the project's code map lookup, moves to Done as already built) and the agent brief format (`AGENT-BRIEF.md`) for each agent-ready note.
- Triage writes no tickets: it hands its agent-ready notes, as briefs, to `/to-tickets`, so numbering, the coverage check and the QA ticket per batch stay in one place. Until R9, the user answers the to-tickets quiz on the proof batch.
- Labels: a tag on the note's line in Open, `[you]` or `[own session]`; the feedback file keeps its layout. An agent-ready note leaves Open for Done with its ticket number once the ticket is written.
- No bug reproduction at triage: in a Unity project it costs minutes of play mode per note; the build ticket's worker reproduces first.
- The proof run: every agent-ready note of the backlog, in batches of about five with their QA tickets, by the to-tickets rules as they stand; it is also the first batch for R2 and R3.

## R7. The `/factory` command

**Status:** proposed, 2026-10-26 (R5). Needs R1, R6 and R8.

**Idea.** One user-invoked skill starts a cycle: run triage (R6), start the agent-ready tickets in the background (R1), prepare the decision round (R9), and write the status file (R8). No nightly schedule: feedback arrives in bursts after a playtest, and most nights would find nothing new.

## R8. Status file and session banner

**Status:** in progress, 2026-10-26: built, waits for its first cycle and a retro.

**Idea.** A status file per feature records each step of the cycle, what was skipped and why, each cycle's dollars (from `ticket_stats.py`), and what waits for the user: decisions to make, a batch to play with what to try, the topics kept for a session of their own. A session-start hook prints a short banner from it in any session of the project, for example "Factory: 4 decisions wait, batch 123 to 128 ready to play". Nothing interrupts the user; they see it when they come back.

**Settled, 2026-10-26.**
- Path: `.scratch/<feature>/status.md`, beside the feedback file, committed. Its layout lives in the run-tickets skill, section Status file: `## Waits for you` (a batch to play, a stopped run) and `## Log` (one appended line per step; a run's line carries its minutes and dollars).
- Counted, not recorded: the banner counts Inbox notes, the briefs file, `[you]` and `[own session]` notes and tickets with no report from the files themselves, so no step keeps those counts and none can go stale.
- Writers: triage, to-tickets, run-tickets and retro each append their Log line. run-tickets adds a Play line per passed QA ticket and a Run stopped line; triage deletes a Play line once feedback dated after it arrives.
- Hook: at user level, so every project gets it with no setup. It runs `skills/run-tickets/scripts/status_banner.py` from the installed skill, shows the banner to the user and to Claude, and prints nothing for a project with no status file or nothing waiting.
- Cycle dollars: the run's Log line until R7 groups steps into cycles.

## R9. Decision round, and to-tickets with no quiz

**Status:** proposed, 2026-10-26 (R5).

**Idea.**
- The decision round is `/grill-me` on the notes triage marked as needing the user: at most five questions, the rest waiting for the next cycle, so a round lasts minutes. Its last answer starts the chain (R1) instead of naming `/to-spec`. The retro's rule and skill candidates (R10) join the same round.
- to-tickets loses its quiz: the decision round has settled its questions, and the coverage check still runs. A ticket that turns out to need a new decision waits for the next round; the rest of the batch runs (a guessed decision got FGame tickets 70 to 73 reversed).

## R10. Retro applies tools and checks itself

**Status:** proposed, 2026-10-26 (R5).

**Idea.** The retro runs by itself after each batch, in a fresh session. It applies a project's tool and check fixes itself and records each in the project's ledger. Rule changes and every change to a file in this repo go to the next decision round, since installing a skill needs the user's yes (skill-forge). Matches the user's PlayableFactory rule: "Autofix anything that ... costs more than 3-5min, or repeats multiple times"; the ledger shows rule fixes are the ones that churn.

## R11. Push when QA passes

**Status:** proposed, 2026-10-26 (R5).

**Idea.** A batch pushes once its QA ticket passes and its QA-defect ticket is done, instead of waiting for the playtest; the playtest then only adds feedback notes. Changes run-tickets ("commits and never pushes") and FGame's `CLAUDE.md` push line together, so the two never disagree.
