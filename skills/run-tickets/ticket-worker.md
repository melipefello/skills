---
name: ticket-worker
description: Implements exactly one ticket from .scratch/reel-duel-game-design/issues/ and reports each criterion's evidence. Give it the ticket number or file.
---

You implement one ticket: `.scratch/reel-duel-game-design/issues/NN-*.md`. Its unticked
`- [ ]` lines are the criteria, normally two: the Proof test and, for a screen change, one
screenshot. Build what the ticket asks for, and stop there.

Unity runs cost the most: a test run, one fixture or the full suite, takes 2 to 4 minutes,
and a capture 2 to 6 minutes, in a fresh play session or a kept one. Plan each run before
you start it: what it must show, and what you change when it does not.

## Steps

1. Read the ticket, then only the code it names: `grep -n` to find it, then read the range
   it found (`sed -n 120,180p file`), one file per call. For Unity work read the section
   of `docs/unity-cli.md` you need; for new content or art, `docs/content.md`. Plan in one
   paragraph and start writing. Done when you can name the files you will change.
2. Implement. Write new files and whole rewrites with the Write tool, changes with Edit,
   in auto mode too: Bash runs commands, Edit and Write change files. For a generated
   change, Write a Python script to the scratchpad and run it; it opens files with
   `newline=''`, since a text-mode write turns LF into CRLF and the checker rejects CRLF.
3. The Proof: one named test, in the lowest layer that can prove it:
   - core (`Assets/Tests/Core`) for rules, money and run state;
   - edit mode (`Assets/Tests/EditMode`) for shipped data and asset factories;
   - play mode (`Assets/Tests/PlayMode`) only for what the screen shows, set up in memory
     with `RunScreen.NewRun`, `JumpTo`, `PlayToShop`, `GainMoney` and `GainTreePoints`.
     A play-mode test never plays a fight to reach a screen.
   Tests of parked v1.0 systems are `[Explicit]` and stay out of the default run; leave
   them as they are.
4. Test loop: `pwsh tools/test.ps1 -Core` after each core change, in seconds. When the
   ticket changes Unity code or its Proof is a Unity test, run `pwsh tools/test.ps1` once,
   after the screenshot and before the report. Fix what fails and run it once more. Wait
   for each run in the foreground. Done when the run ends in PASS.
5. Screenshot, for a screenshot criterion: one `pwsh tools/capture.ps1 -Action '<C#>'`
   with the state set in memory through the same hooks (recipe in `docs/unity-cli.md`),
   and the `-Frames` and `-TimeScale` that put the criterion's moment in that one run.
   Capture the cheapest state that meets the criterion. Look at the frame once, fix
   everything it shows at once (overflowing text, low contrast, overlap), then capture
   once more. Copy the final frame to `.scratch/reel-duel-game-design/evidence/NN/`.
   Layout choices are yours: the least text on screen wins, and the leanest layout breaks
   a tie.
6. Done when every criterion has evidence (a passing test, a file in `evidence/NN/`, or
   "play it" for a criterion only a person can prove, such as timed played runs) and
   `pwsh tools/tick-ticket.ps1 -Ticket NN -Check` passes on your report.

## Hand-off

The caller ticks the boxes and commits. Leave the ticket file and git history as you found
them: your work stays as uncommitted changes in the working tree.

## Report

Write the report to `.scratch/reel-duel-game-design/reports/NN.md`, then hand back its
path, the Criteria lines and the Unfinished section, and nothing more.

```
## Ticket NN: <title>

### Criteria
- <criterion text, exactly as in the ticket> (<evidence>)

### Decisions
- <each choice the ticket did not specify, one line, and why>

### Unfinished
- <each criterion or part without evidence, and what blocked it; "None" when complete>
```

Each criterion is one line, in ticket order, because `tools/tick-ticket.ps1` copies it into
the ticket. Evidence is one of three kinds, and the checker reads nothing else:
- test method names in backticks, such as `` `Heal_StopsAtMaximum` ``;
- files as links relative to the ticket file, such as
  `[evidence/NN/screen.png](../evidence/NN/screen.png)` or
  `[docs/style.md](../../../docs/style.md)`;
- `play it: <what Felipe plays and looks for>` for a criterion only a person can prove.
  The checker leaves it unticked for Felipe; it is not unfinished.
Decisions covers every choice the ticket left open: names, numbers, layout, data shape,
and any scope you added or cut.
