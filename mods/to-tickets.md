# to-tickets

Upstream: mattpocock/skills:skills/engineering/to-tickets (pin in manifest.json)

## Tickets saved to .scratch/, no tracker setup
- Original: publishes to the tracker configured by `/setup-matt-pocock-skills` (local files, or GitHub/Linear issues with native blocking links and the `ready-for-agent` label), points to the setup skill when no config is present, and ships an issue template for real trackers.
- Mine: always writes one file per ticket to `.scratch/<feature-slug>/issues/<NN>-<slug>.md`; step 5 is that path alone; no tracker branch, no issue template, no setup pointer. The description says where the tickets go.
- Why: tickets live as local markdown, next to the spec from to-spec; the setup skill is not used.

## Spec read from a local path
- Original: an argument can be a spec path, an issue number or a URL; the agent fetches it and reads its body and comments.
- Mine: an argument is a spec path such as `.scratch/<feature-slug>/spec.md`, read in full.
- Why: specs come from to-spec as local files; there is no issue to fetch.

## Source spec left unchanged
- Original: do not close or modify any parent issue.
- Mine: leave the source spec unchanged.
- Why: the same guard, in local terms: the spec file is the parent.

## Status line removed from the ticket template
- Original: each local ticket carries `**Status:** ready-for-agent`.
- Mine: removed; the acceptance checkboxes show when a ticket is done.
- Why: the value is triage label vocabulary; no triage step reads it. to-spec dropped the same label.

## Glossary and ADR use removed
- Original: the explore step tells the agent to use the domain glossary vocabulary in ticket titles and descriptions, and to respect ADRs.
- Mine: the explore step only reads the codebase.
- Why: the projects are self-documenting; there is no glossary or ADR layer to read.

## Neutral layer names
- Original: a vertical slice cuts through schema, API, UI and tests.
- Mine: the layers are data, logic, presentation and tests.
- Why: the work is mostly game dev and the skill stays usable outside it; the web terms map onto neither. "tests" stays as a layer: no TDD does not mean no tests.

## Wide refactor paragraph removed
- Original: wide refactors (rename a column across thousands of call sites) are the exception to vertical slicing, sequenced as expand-contract in batch tickets.
- Mine: removed.
- Why: no wide refactor is planned through this skill; a long paragraph for a case that does not come up. Moves away from the tested original: a wide refactor would be sliced vertically.

## Prototype snippet exception removed
- Original: tickets ban file paths and code snippets, except a snippet from a prototype that states a decision more precisely than prose (state machine, reducer, schema, type shape).
- Mine: removed; the ban has no exception and no longer says "in either form".
- Why: no prototypes are planned before a spec, so the exception does not fit the expected use. Matches to-spec.

## Codex metadata removed
- Original: ships `agents/openai.yaml` for OpenAI Codex.
- Mine: removed.
- Why: only Claude Code is used.

## Checks in one QA ticket per batch
- Original: a completed slice is "demoable or verifiable on its own"; the quiz list and the ticket template have no field for how to check it, and nothing groups the tickets.
- Mine: a slice is demoable on its own, and carries no check of its own. The set is cut into batches of about five tickets, each closed by a QA ticket that names the batch's tests, screenshots and what the user plays, blocked by every build ticket of the batch. The quiz shows a QA ticket's checks in place of what it delivers, and asks whether the batches are cut right. The template says what a QA ticket's What to build and Blocked by hold, and drops Covers on it.
- Why: the check belongs where the user plays, once per batch. A per-ticket scheme ran on the FGame tickets 23-42 between 14 and 18 October, first as evidence per criterion, then as one proof per ticket: the proof load took over half of each build worker's time either way. Tickets 43-48 ran with build tickets ending on the quick check and one QA ticket last, and that is what run-tickets and its worker now expect. Upstream reports that a per-ticket demo line pushes slicing toward vertical; "What it delivers" in the quiz keeps that pull.

## Size set by a budget
- Original: each slice is sized to fit in a single fresh context window.
- Mine: each slice fits the budget: a diff the user can review in one sitting. No token or time bound.
- Why: a context window is too loose a bound; each ticket should be one thing to test and read in one sitting. A 150k-token ceiling was tried from 14 to 17 October and measured no effect: the FGame tickets 23-33 ran in contexts of 200k to 410k tokens, since no agent can see a token meter. Cutting the proof load is what cut the runs.

## Acceptance criteria removed
- Original: the ticket template ends in two bare checklist lines, "Acceptance criterion 1" and "2".
- Mine: removed; nothing in the ticket is ticked.
- Why: a ticket set passed the quiz with 13 tickets whose criteria only code review could confirm ("data, not code", "matches in style", "rare"), and the checklist grew into the evidence scheme the Proof entry describes. The report from run-tickets records the result; the ticked boxes were not read.

## Spec coverage per ticket
- Original: tickets do not say which parts of the source they deliver.
- Mine: each ticket has a Covers line naming the spec's user stories and Implementation Decisions it delivers (omitted without a spec). Before the quiz, the breakdown goes to a scratch file and `scripts/coverage.py` lists each user story of the spec (of the revision, with `--since`) that no Covers line names; the quiz lists those and each uncovered Implementation Decision.
- Why: four user stories had no ticket and were found only by a review after commit; the quiz is the cheap place to catch them. The script replaces the to-tickets-review skill, which ran once after it was made; coverage was its one mechanical check.

## Workflow changes go to Process proposals
- Original: anything can become a ticket.
- Mine: tickets change the product and its tools; a change to the workflow (worker rules, skills, agent files) is listed under Process proposals at the end of the breakdown, for the user to take to a retro, never inside a ticket.
- Why: an FGame ticket's criterion asked to add a step to the worker rules; the edit was refused mid-run and stalled the run for 35 minutes, and the step was removed 14 hours later.

## Tool versions asked in the quiz
- Original: the quiz asks about granularity, blocking edges, and merges or splits.
- Mine: it also asks for the exact version of each tool a ticket installs or creates a project with.
- Why: the project-setup ticket said "a pinned editor version" without naming it.

## Quiz decisions written into the tickets
- Original: decisions made in the quiz are not written down anywhere.
- Mine: each quiz decision goes into the tickets it affects.
- Why: the user's sizing rule and other quiz answers were missing from the files, so later agents could not see them.

## User decisions made in the quiz
- Original: nothing says where a choice the user must make (a pick between options, a visual choice, a name) goes; a ticket can carry one.
- Mine: every user decision is made in the quiz and the ticket carries the answer; the agent gathers what each decision needs while drafting, and the quiz asks each one with its options. When gathering needs built work, a research ticket is the last build ticket of its batch, its report lists the options, and the ticket that needs the answer opens the next batch and names that report, so the user picks between runs.
- Why: tickets run unattended through run-tickets, so a decision left inside one is made by the worker or stops the run.

## Ticket files written with the Write tool
- Original: step 5 says to write one file per ticket, with no word on how.
- Mine: each file is written with the Write tool.
- Why: a quoted heredoc holding a long ticket body fails in this shell. Writing several files per command with heredocs was tried first, after one Write call per ticket made the write step 22 turns and 17 minutes for 22 tickets; the heredocs failed on long bodies, so Write is back. The reason clause is gone from the skill: a user-level hook on Bash now refuses long heredoc writes, so the sentence lost to auto mode's steer for nothing.
