# Status

## Now

- Builds: the software factory, these skills taking a project from feedback to a batch ready to play, with three user touchpoints: feedback, a short decision round, the playtest (R5). FGame proves it first; PlayableFactory uses it next.
- Phase: brakes before accelerators. R2 (batch review), R3 (deep-module prefactor), R6 (triage), R8 (status file and banner) and R12 (the hub) are built and wait for their proof on FGame. R10 and R11, then R9, then R1 with R7 wait for that proof.
- Last proof: FGame tickets 123 to 130 built triage's briefs (R6) with the first batch review (R2); tickets 131 to 151 ran the first prefactor ticket (131, R3), the second review with its fix ticket 150, and kept FGame's status file (R8). Retro 12e9fc38 (tickets 123 to 130) judged no roadmap item; the retro of 131 to 151 runs now in FGame.
- Next go/no-go, per item, from that retro and the run's `ticket_stats.py` rows: does a review catch defects worth its minutes and dollars (R2); do orientation reads fall against ticket 116's 48 reads and $5.09 (R3); does triage sort a playtest's feedback with no stop for the user (R6); do the banner and the hub keep the user oriented across sessions (R8, R12). A no reopens the item through `/skill-forge`.
- Numbers: NN ticket, US<n> spec story, R<n> roadmap item, Q<n> grill question, D<n> grill default.

## Order of work

| # | Step | Blocked by | Evidence it is done | Command |
|---|---|---|---|---|
| 1 | Retro of the FGame run of tickets 131 to 151: R2's second review, R3's first prefactor ticket, R8's first Log lines | - | FGame `docs/retro-ledger.md` holds the rows of the retro of run session 0d1922c8 | `/retro 0d1922c8-27a8-4a44-a35e-0f4d89ec82d7` (C:\F\FGame; running in its talk session 3e713c89 since 2026-10-27) |
| 2 | Judge R2 and R3: mark each done, or change it through `/skill-forge`, from row 1's ledger rows and the `ticket_stats.py` rows of reviews 129 and 138, fix ticket 150 and prefactor ticket 131 | 1 | `docs/roadmap.md` R2 and R3 Status not `in progress` | "Judge roadmap R2 and R3 from the FGame retro of run 0d1922c8" (talk) |
| 3 | Triage the feedback of the 131 to 138 playtest: R6's first run after a playtest, and the first triage Log line of an R8 cycle (*parallel* with 2) | Felipe's playtest of 131 to 138, done once FGame `feedback.md` holds a note dated after `reports/151.md` | a `triage` line in the Log of FGame `.scratch/reel-duel-game-design/status.md` | `/triage reel-duel-game-design` (C:\F\FGame) |
| 4 | Judge R6 and R8: mark each done, or change it through `/skill-forge` | 1, 3 | `docs/roadmap.md` R6 and R8 Status not `in progress` | "Judge roadmap R6 and R8 from FGame's triage of the 131 to 138 playtest and the retro of run 0d1922c8" (talk) |
| 5 | Delete the `/next` skills of FGame and PlayableFactory, whose Order of work now lives in their status files (R12, Next) (*parallel* with 4) | a few days of hub use, from 2026-10-29 | no `.claude/skills/next/` folder in FGame or PlayableFactory | "Delete the /next skill: the hub and status.md replace it" (C:\F\FGame, then C:\Root\Projects\PlayableFactory) |
| 6 | Judge R12 after a week of use, and decide whether the dispatcher (the hub sending commands to other sessions) becomes a roadmap item | 5; 2026-11-02 | `docs/roadmap.md` R12 Status not `in progress` | "Judge roadmap R12 after a week of hub use" (talk) |

## Waits for you

## Log
