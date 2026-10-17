---
name: run-tickets
description: Run a range of tickets one at a time through ticket-worker, commit each, and summarise; add "review" to walk Felipe through each ticket.
disable-model-invocation: true
argument-hint: <first>-<last> | all [review], e.g. 04-06
---

Tickets: `$ARGUMENTS` (inclusive), from `.scratch/reel-duel-game-design/issues/NN-*.md`.
`all` means every ticket with no report at `.scratch/reel-duel-game-design/reports/NN.md`,
in number order. This skill commits on `main` and never pushes.

## Per ticket, in order

1. **Work.** Start one `ticket-worker` agent with the ticket file path as its whole
   prompt: model `opus` at effort `medium`, or model `sonnet` for a ticket that changes
   only content data (opponents, items, build files, docs). Wait for its hand-back before
   anything else; one worker runs at a time, since one editor serves them all.
2. **Verify.** Run `pwsh tools/tick-ticket.ps1 -Ticket NN -Check`. It checks every
   criterion in the report at `.scratch/reel-duel-game-design/reports/NN.md`: each named
   test passed in a results file, each linked file exists. The worker's test run is the
   run; run no tests yourself. A criterion that changes a file under `.claude/` is yours,
   not the worker's: make the edit with the Edit tool, then add the file to the report's
   criterion line.
3. **Gate.** When a test fails, the check fails, or the report lists anything unfinished:
   stop the whole run. Report to Felipe what failed and the report's path. Leave the
   working tree as it is. A criterion the check prints as `LEFT FOR FELIPE` (evidence
   "play it") is not unfinished: the run goes on.
4. **Record.** Run `pwsh tools/tick-ticket.ps1 -Ticket NN` to tick the criteria; a "play
   it" criterion stays unticked. Commit everything in the working tree, the report
   included, as this ticket's commit, in the style of `git log`:
   `Add <summary> (ticket NN)`, with a body that describes the change and names any
   criterion left for Felipe to play.
5. Go to the next ticket.

## After the last ticket

End with one screen: one line per ticket (what a player gets), then the criteria left for
Felipe to play, then what stopped the run if anything did. Felipe is often away while this
runs and changes the game from playtests, so ask nothing per ticket.

## Review, only when the arguments say "review"

Show Felipe one ticket at a time, in order, from its report, in plain words: what a
player sees or gets, no code names, no file names.

1. **Criteria**, numbered. Each one line, ending in how it was proven: "test passed",
   "screenshot", or "play it" when only playing shows it.
2. **Decisions**, numbered on from the criteria. Each one line: what was chosen, and the
   alternative when there was one.

Felipe answers every number. Wait until each has an answer before you show the next
ticket. Write each piece of feedback for later into
`.scratch/reel-duel-game-design/feedback.md`, under the ticket it came from.
