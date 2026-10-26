---
name: run-tickets
description: Run a range of tickets through ticket workers (build tickets one at a time, research tickets as a parallel frontier), review each batch against its spec before its QA ticket, commit each, and summarise; add "review" to walk the user through each ticket.
disable-model-invocation: true
argument-hint: <first>-<last> | all [review] [model=opus] [effort=medium], e.g. 04-06
---

Tickets: `$ARGUMENTS` (inclusive), from `.scratch/<feature>/issues/NN-*.md`. `<feature>`
is the one folder under `.scratch/` that has an `issues/` folder; with several, ask which
one before the first ticket. `all` means every ticket with no report at
`.scratch/<feature>/reports/NN.md`, in number order. `model=` and `effort=` set the
worker's model and effort; the defaults are `opus` and `medium`. This skill commits and
never pushes. The last ticket of a batch is its QA ticket: it runs the batch's tests and
screenshots and lists what the user tries, so build tickets carry no proof of their own.
Agent and skill files change only in a retro, between runs; an instruction the user gives
mid-run goes into the prompts of the remaining workers.

## Before the first worker

When the prompt carries the connectors reminder (a hook adds it when the claude.ai
connectors are enabled), ask the user in one line: run anyway, or disable them first?
Start no worker until the answer.

## Per ticket, in order

1. **Work.** Start one general-purpose agent at the worker's model and effort. Its prompt
   is the whole of [ticket-worker.md](ticket-worker.md), then the feature folder and the
   ticket file path. Wait for its hand-back before anything else; one build worker runs
   at a time, since build tickets share the working tree and the editor.
   **Research tickets run as a frontier**: when the next tickets in the range say
   `**Kind:** research` and are blocked only by tickets already done, start all of them in
   one message.
   Each prompt ends with the one file that worker writes, `reports/NN.md`, stated as
   what to write (a prohibition on other files reads to the permission classifier as
   destruction and is refused). Record each one as its hand-back arrives, by its
   report's path, and go on when the whole frontier is recorded.
2. **Gate.** When the report's Check line says `failed`: stop the whole run. Report what
   failed and the report's path. Leave the working tree as it is, and record the stop in
   the status file as the end of a run does. An Unfinished section
   with items does not stop the run: commit as usual and carry the items to the end.
3. **Record.** Commit everything in the working tree, the report included, as this
   ticket's commit (in a frontier, only the ticket's report), in the style of `git log`:
   `Add <summary> (ticket NN)`, with a body that describes the change; after a QA
   ticket, what the user tries. Then run `python -I <this skill's folder>/scripts/ticket_stats.py
   --latest --ticket NN --line` and keep its line (minutes, calls, tokens, peak context,
   errors, script minutes, orientation, dollars); a question about time or cost mid-run
   is answered from these lines.
4. Go to the next ticket. When it is a batch's QA ticket (blocked by build tickets; a
   QA-defect ticket is not one), run the batch review first.

## Batch review, before each QA ticket

1. **Review.** Start one general-purpose agent on sonnet at medium effort, described
   `batch review before ticket NN` (NN: the QA ticket). Its prompt: call the Skill tool with
   `code-review` and the argument `spec`; the fixed point is the parent of the commit whose
   subject ends `(ticket MM)`, MM the batch's first build ticket; the spec is
   `.scratch/<feature>/spec.md`, its stories named in the Covers lines of the batch's ticket
   files, and those ticket files; write the review to `.scratch/<feature>/reports/NN-review.md`
   and hand back its Spec findings, or "None".
2. **Fix.** Spec findings become one ticket file, numbered after the highest number in
   `git ls-files .scratch/<feature>/issues`: `**Kind:** build`, blocked by the batch's build
   tickets, its What to build each finding with the spec line it quotes, to fix, or to reject
   under Decisions when the code already does what that line says. Run it through the steps
   above, its worker described `ticket NN review fix`, before the QA ticket; it gets no review
   of its own. With no findings, commit the review alone: `Add the review before ticket NN`.
   Done when the review is committed and its fix ticket, if any, is recorded.

## After the last ticket

When the run's QA reports list layout defects, write that list as one more ticket file,
numbered after the highest number in `git ls-files .scratch/<feature>/issues`: `**Kind:**
qa`, blocked by the QA ticket, its What to build each defect to fix and then the QA
captures the defects touched, to rerun. Run it through the steps above, and only then end
the run. This happens once per run: defects its own captures show go to the end screen as
unfinished items.

Then update the [status file](#status-file): delete the Run stopped lines earlier runs
left, add a Play line for each QA ticket that passed in this run, and a Run stopped line
when the run stopped. Append the run's Log line, its minutes and dollars from the total
row of the table below. Commit that file alone (`git commit -- <path>`): `Record tickets
NN to MM in the status file`.

End with one screen: the table that
`python -I <this skill's folder>/scripts/ticket_stats.py --latest` prints, then one line per
ticket (what a user gets), then what the QA ticket left for the user to try, then each batch review's findings and
its fix ticket, or "no findings", then every
unfinished item by ticket, then each decision a research ticket left for the user, with
its options, then every ticket file with no report, outside the range too, then what
stopped the run if anything did. Its last lines are this session's
id (the table's first line) and: "Feedback, retro and fixes: `/retro <session-id>` in a new
session; the next `/grill-me` in another." The user is often away while this runs, so ask
nothing per ticket.

## Status file

`.scratch/<feature>/status.md` tells the user what the factory waits on. A session-start
hook, `scripts/status_banner.py` wired in the user settings, prints a banner from it in
every session of the project, and `/hub` reads it to say what is next. Every step of a cycle
(`/to-spec`, `/triage`, `/to-tickets`, this skill, `/retro`) appends its Log line; create
the file when missing as:

```md
# Status

## Now

## Order of work

| # | Step | Blocked by | Evidence it is done | Command |
|---|---|---|---|---|

## Waits for you

## Log
```

- **Now**: what the project builds, its phase, the last playtest result and the next
  go/no-go, in a few lines. `/to-spec` rewrites it each time it writes the spec. It ends
  with the guide to the numbers: `Numbers: NN ticket, US<n> spec story, R<n> roadmap item,
  Q<n> grill question, D<n> grill default.`
- **Order of work**: the steps left, game and factory work in one order. Evidence is a
  report, a file or a Log line that exists once the step is done, so a done row needs no
  edit. Command is the text to type and its session: `(build)`, `(talk)`, or the folder of
  another repo. A step that can run beside the row before it says *parallel*. A playtest
  blocks rows and has no row of its own: it is done once `feedback.md` holds a note dated
  after the batch's last report. A roadmap item (`R<n>`) gets a row only when the next
  batch needs it. `/to-spec` deletes the done rows and adds one for the tickets of its
  revision; `/to-tickets` adds one per batch; any other change to the order goes in the
  commit of the work that changes it.
- **Waits for you**: one line per thing the user does next that no other file shows.
  `- Play tickets NN to MM (<date> <time>): <what to try, one clause>; the full list is
  in reports/QQ.md.` `/triage` deletes a Play line once a feedback note dated after it
  arrives. `- Run stopped at ticket NN (<date> <time>): <what failed>; reports/NN.md.`
- **Log**: one line per step, appended, never edited: `- <date> <time> <skill> <range or
  scope>: <outcome>; <what was skipped and why>`. A run's line ends `<minutes> min,
  $<dollars>`.

The banner counts the rest from the files themselves (Inbox notes, the briefs file, `[you]`
and `[own session]` notes, tickets with no report), so no step records those.

## Review, only when the arguments say "review"

Show one ticket at a time, in order, from its report, in plain words: what a user sees or
gets, no code names, no file names.

1. **Check**: one line, what was shown and how.
2. **Decisions**, numbered on from the check. Each one line: what was chosen, and the
   alternative when there was one.

The user answers every number. Wait until each has an answer before you show the next
ticket. Write each piece of feedback for later into `.scratch/<feature>/feedback.md`,
under Open, as the to-spec skill defines it.
