---
name: triage
description: Sort the Open notes of a feature's feedback file into agent-ready briefs for /to-tickets, decisions for the user, and topics kept for a session of their own.
disable-model-invocation: true
argument-hint: [<feature>]
---

Sort every untagged note in the Open section of `.scratch/<feature>/feedback.md` (laid out by `/to-spec`) into one of three **buckets**, and hand the agent-ready notes to `/to-tickets` as **briefs**. The run is unattended: sort from the note, the spec and the code, and leave every choice the user would care about to the user.

`<feature>` is the argument, or the one folder under `.scratch/` that has a `feedback.md`; with several, ask which one. When `.scratch/<feature>/briefs.md` exists, its briefs still wait for `/to-tickets`: name that command and stop.

## Buckets

- **Agent-ready**: a bug, a layout defect or a clear ask that leaves no choice the user would care about. It becomes a brief; its note stays untagged in Open until `/to-tickets` writes its ticket and moves it to Done.
- **Needs the user** (`[you]`): a decision where the user's goal or taste picks between options, one that costs more than a ticket to reverse, or one that changes a decision in the spec. It waits for the next decision round. A note you are unsure of goes here: a guessed decision gets its tickets reversed.
- **A session of its own** (`[own session]`): a topic whose note says it gets a session of its own. It stays in Open, out of the decision round.

A tag opens the note's line, after the bullet: `- [you] <date>, <source>: <the note>`.

## Process

1. **Read.** In `.scratch/<feature>/status.md`, delete each Play line under Waits for you dated before a note under `### Inbox`: the user has played that batch. Rewrite each note under `### Inbox` as an Open line (date, source, the note) and remove the Inbox heading. Read the spec beside the feedback file, and the project's `CLAUDE.md` for its code lookup (a code map, an index) and its commit rules. Done when Open holds only Open lines.
2. **Already built.** For each untagged note, look up the behaviour it asks for with the project's code lookup, by concept as well as by the note's wording. When the code already does what the note asks, move the note to Done as `<the note>: already built (<where, by type or member name>)`. Done when every untagged note has been looked up.
3. **Sort** each remaining untagged note into its bucket. Several notes about one change share one brief. Judge each note from its text, the spec and the code; the build ticket's worker reproduces a bug first. Done when every untagged note in Open is agent-ready and every other note carries its tag.
4. **Brief.** Write `.scratch/<feature>/briefs.md`: one brief per agent-ready change, by the template below. Done when every agent-ready note is quoted in exactly one brief.
5. **Commit** the feedback file, the briefs and the status file by the project's commit rules, after appending triage's Log line to the status file (the count per bucket and the already built count), by the layout in the run-tickets skill's Status file section. Done when `git status` shows them clean.
6. **Report** in chat: the count per bucket, one line per brief, and each `[own session]` topic. Name `/grill-me` for the `[you]` notes, and end on `/to-tickets .scratch/<feature>/briefs.md`.

## Brief template

A brief stays true while the code moves: it states behaviour and names interfaces, never file paths or line numbers. The worker explores the code fresh and picks the implementation.

```md
## B<n>: <the change in one line>

**Notes:** each Open line this brief closes, verbatim.
**Category:** bug or enhancement.
**Current behaviour:** what happens now; for a bug, the broken behaviour.
**Desired behaviour:** what happens once the work is done, with its edge cases.
**Key interfaces:** the types, members, assets or settings to look at, by name.
**Check:** what the QA ticket or the user sees once it works.
**Out of scope:** the adjacent changes this brief leaves alone.
```
