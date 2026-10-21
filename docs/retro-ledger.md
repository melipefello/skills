# Retro ledger

One row per retro candidate. Rows are only appended; a later retro changes only the fate of an earlier row. Fates and columns are defined in `skills/retro/SKILL.md`, section The ledger.

Retro dedd2293 covered all 23 FSkills sessions from 2026-10-06 to 2026-10-21, plus the FGame runs that used these skills. Rows numbered I are improvement ideas from the same retro, outside the retro categories.

| retro | date | # | finding | decision | commit | fate |
|---|---|---|---|---|---|---|
| dedd2293 | 2026-10-21 | 1 | no command reports drift between repo, installed copies, lock and other projects; sync checks rebuilt by hand in 10 sessions [tool] | fix it | d257386, ce632dd | new |
| dedd2293 | 2026-10-21 | 2 | adapt interview asks about every keep part and about the user's own edits [structure] | ok, fix it | ce632dd | new |
| dedd2293 | 2026-10-21 | 3 | ticket worker's 100-line read rule changed nothing; orientation reads drive cost [check] | fix | 7095572, FGame 11cbf8f | new |
| dedd2293 | 2026-10-21 | 4 | forks committed before size and value known; 3 of 4 became fork+revert pairs [tool] | fix | d257386, ce632dd | new |
| dedd2293 | 2026-10-21 | 5 | FGame and Unity details leak into shared skills [check] | Fix (and fix the leaks as well) | d257386, 7095572, 4f4dae6, f696e65, 66fb949, FGame 11cbf8f | new |
| dedd2293 | 2026-10-21 | 6 | pre-commit check blocks on untracked or empty skill folders [check] | Fix | d257386 | new |
| dedd2293 | 2026-10-21 | 7 | commits from other projects bypass skill-forge; notes not linted [check] | Fix | d257386, ce632dd | new |
| dedd2293 | 2026-10-21 | 8 | FGame agents edit installed skill copies through Bash [check] | I think that's fine, and when we fix #1 this won't be a problem because I won't need to modify FSkills from external projects anymore | - | open |
| dedd2293 | 2026-10-21 | 9 | interview and retro items written in jargon despite three rules [structure] | fix | ce632dd, f696e65 | new |
| dedd2293 | 2026-10-21 | 10 | upstream reads and script output flood the context [tool] | no, because I usually don't go read files - skip | - | open |
| dedd2293 | 2026-10-21 | 11 | skill-forge takes one skill per run [structure] | Fix | ce632dd | new |
| dedd2293 | 2026-10-21 | 12 | install, push and propagate typed by the user in almost every session [rule] | Fix | ce632dd | new |
| dedd2293 | 2026-10-21 | 13 | parallel sessions do not see each other's commits [tool] | Fix | d257386 | new |
| dedd2293 | 2026-10-21 | I1 | writing-for-agents installed from upstream, outside manifest and drift checks [structure] | Let's bring writing-for-agents and replace the current installation | a4dde84 | new |
| dedd2293 | 2026-10-21 | I2 | cross-skill script calls not detected as dependencies [check] | Ok for the dependency scan | d257386 | new |
| dedd2293 | 2026-10-21 | I3 | work-catchup runs on whatever model is the saved default [rule] | Work catchup isn't ran on opus? I thought no model was specified and it would use my default | - | open |
| dedd2293 | 2026-10-21 | I4 | to-spec and to-tickets open a second folder for a continuing feature; two placeholders [rule] | not asked; applied with #5 | e89e4ee, 4f4dae6 | new |
| dedd2293 | 2026-10-21 | I5 | no trend view across run-tickets runs to judge whether fixes held [tool] | no answer | - | undecided |
| dedd2293 | 2026-10-21 | I6 | ls alias in agent shells appends / and broke a grep, staging a wrong deletion [structure] | no answer | - | undecided |
