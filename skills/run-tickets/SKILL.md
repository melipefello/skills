---
name: run-tickets
description: Run a range of tickets through ticket workers (build tickets one at a time, research tickets as a parallel frontier), commit each, and summarise; add "review" to walk the user through each ticket.
disable-model-invocation: true
argument-hint: <first>-<last> | all [review] [model=opus] [effort=medium], e.g. 04-06
---

Tickets: `$ARGUMENTS` (inclusive), from `.scratch/<feature>/issues/NN-*.md`. `<feature>`
is the one folder under `.scratch/` that has an `issues/` folder; with several, ask which
one before the first ticket. `all` means every ticket with no report at
`.scratch/<feature>/reports/NN.md`, in number order. `model=` and `effort=` set the
worker's model and effort; the defaults are `opus` and `medium`. This skill commits and
never pushes. The last ticket of a batch is its QA ticket: it runs the batch's tests and
screenshots and lists what the user plays, so build tickets carry no proof of their own.
Agent and skill files change only in a retro, between runs; an instruction the user gives
mid-run goes into the prompts of the remaining workers.

## Per ticket, in order

1. **Work.** Start one general-purpose agent at the worker's model and effort. Its prompt
   is the whole of [ticket-worker.md](ticket-worker.md), then the feature folder and the
   ticket file path. Wait for its hand-back before anything else; one build worker runs
   at a time, since build tickets share the working tree and the editor.
   **Research tickets run as a frontier**: when the next tickets in the range say "No
   code" and are blocked only by tickets already done, start all of them in one message.
   Each prompt ends with the one file that worker writes, `reports/NN.md`, stated as
   what to write (a prohibition on other files reads to the permission classifier as
   destruction and is refused). Record each one as its hand-back arrives, by its
   report's path, and go on when the whole frontier is recorded.
2. **Gate.** When the report's Check line says `failed`: stop the whole run. Report what
   failed and the report's path. Leave the working tree as it is. An Unfinished section
   with items does not stop the run: commit as usual and carry the items to the end.
3. **Record.** Commit everything in the working tree, the report included, as this
   ticket's commit (in a frontier, only the ticket's report), in the style of `git log`:
   `Add <summary> (ticket NN)`, with a body that describes the change; after a QA
   ticket, what the user plays. Then run `python -I <this skill's folder>/scripts/ticket_stats.py
   --latest --ticket NN --line` and keep its line (minutes, calls, tokens, peak context,
   errors, Unity minutes, dollars); a question about time or cost mid-run is answered from
   these lines.
4. Go to the next ticket.

## After the last ticket

When the project's `CLAUDE.md` names a code map command, run it; workers often regenerate
the map themselves, so commit it as `Refresh the code map after tickets NN to MM` only
when the working tree changed. Then end with one screen: the table that
`python -I <this skill's folder>/scripts/ticket_stats.py --latest` prints, then one line per
ticket (what a user gets), then what the QA ticket left for the user to play, then every
unfinished item by ticket, then each decision a research ticket left for the user, with
its options, then what stopped the run if anything did. Its last lines are this session's
id (the table's first line) and: "Feedback, retro and fixes: `/retro <session-id>` in a new
session; the next `/grill-me` in another." The user is often away while this runs, so ask
nothing per ticket.

## Review, only when the arguments say "review"

Show one ticket at a time, in order, from its report, in plain words: what a user sees or
gets, no code names, no file names.

1. **Check**: one line, what was shown and how.
2. **Decisions**, numbered on from the check. Each one line: what was chosen, and the
   alternative when there was one.

The user answers every number. Wait until each has an answer before you show the next
ticket. Write each piece of feedback for later into `.scratch/<feature>/feedback.md`,
under Open, as the to-spec skill defines it.
