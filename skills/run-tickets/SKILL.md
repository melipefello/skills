---
name: run-tickets
description: Run a range of tickets one at a time through a ticket worker, commit each, and summarise; add "review" to walk the user through each ticket.
disable-model-invocation: true
argument-hint: <first>-<last> | all [review] [model=opus] [effort=medium], e.g. 04-06
---

Tickets: `$ARGUMENTS` (inclusive), from `.scratch/<feature>/issues/NN-*.md`. `<feature>`
is the one folder under `.scratch/` that has an `issues/` folder; with several, ask which
one before the first ticket. `all` means every ticket with no report at
`.scratch/<feature>/reports/NN.md`, in number order. `model=` and `effort=` set the
worker's model and effort; the defaults are `opus` and `medium`. This skill commits and
never pushes.

## Per ticket, in order

1. **Work.** Start one general-purpose agent at the worker's model and effort. Its prompt
   is the whole of [ticket-worker.md](ticket-worker.md), then the feature folder and the
   ticket file path. Wait for its hand-back before anything else; one worker runs at a
   time.
2. **Gate.** When the report's Proof line says `failed`, or its Unfinished section lists
   anything: stop the whole run. Report what failed and the report's path. Leave the
   working tree as it is.
3. **Record.** Commit everything in the working tree, the report included, as this
   ticket's commit, in the style of `git log`: `Add <summary> (ticket NN)`, with a body
   that describes the change and names a proof left for the user.
4. Go to the next ticket.

## After the last ticket

End with one screen: one line per ticket (what a user gets), then the proofs left for the
user to run, then what stopped the run if anything did. The user is often away while this
runs, so ask nothing per ticket.

## Review, only when the arguments say "review"

Show one ticket at a time, in order, from its report, in plain words: what a user sees or
gets, no code names, no file names.

1. **Proof**: one line, what was shown and how.
2. **Decisions**, numbered on from the proof. Each one line: what was chosen, and the
   alternative when there was one.

The user answers every number. Wait until each has an answer before you show the next
ticket. Write each piece of feedback for later into `.scratch/<feature>/feedback.md`,
under the ticket it came from.
