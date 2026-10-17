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

## Proof named per ticket
- Original: a completed slice is "demoable or verifiable on its own"; the quiz list and the ticket template have no field for how to check it.
- Mine: each slice names its proof, one check that fails before the slice and passes after it; the quiz list and the ticket template carry a Proof line. The kind of check (a test, a screenshot, a log line, a demo) is the ticket writer's choice: the skill names none.
- Why: every ticket should come with proof that it works, readable before approval. Upstream reports that a per-ticket demo line pushes slicing toward vertical, and that criteria often pass before any work is done; "fails before" closes that. A heavier scheme ran on the FGame tickets 23-35 between 14 and 17 October (evidence named per criterion, then at most two criteria, a shipped-state rule and a reachable-screenshot rule): the proof load took over half of each worker's time, so it was cut back to the one proof with no named kinds.

## Size set by a budget
- Original: each slice is sized to fit in a single fresh context window.
- Mine: each slice fits the budget: one proof, and a diff the user can review in one sitting. No token or time bound.
- Why: a context window is too loose a bound; each ticket should be one thing to test and read in one sitting. A 150k-token ceiling was tried from 14 to 17 October and measured no effect: the FGame tickets 23-33 ran in contexts of 200k to 410k tokens, since no agent can see a token meter. Cutting the proof load is what cut the runs.

## Acceptance criteria removed
- Original: the ticket template ends in two bare checklist lines, "Acceptance criterion 1" and "2".
- Mine: removed; the Proof line is the ticket's only check, and nothing in the ticket is ticked.
- Why: a ticket set passed the quiz with 13 tickets whose criteria only code review could confirm ("data, not code", "matches in style", "rare"), and the checklist grew into the evidence scheme the Proof entry describes. The report from run-tickets records the result; the ticked boxes were not read.

## Spec coverage per ticket
- Original: tickets do not say which parts of the source they deliver.
- Mine: each ticket has a Covers line naming the spec's user stories and Implementation Decisions it delivers (omitted without a spec), and the quiz lists each user story and Implementation Decision no ticket covers.
- Why: four user stories had no ticket and were found only by a review after commit; the quiz is the cheap place to catch them.

## Tool versions asked in the quiz
- Original: the quiz asks about granularity, blocking edges, and merges or splits.
- Mine: it also asks for the exact version of each tool a ticket installs or creates a project with.
- Why: the project-setup ticket said "a pinned editor version" without naming it.

## Quiz decisions written into the tickets
- Original: decisions made in the quiz are not written down anywhere.
- Mine: each quiz decision goes into the tickets it affects.
- Why: the user's sizing rule and other quiz answers were missing from the files, so later agents could not see them; to-tickets-review checks for them.

## Ticket files written in batches
- Original: step 5 says to write one file per ticket, with no word on how.
- Mine: the files are written several at a time, one quoted heredoc per file in each command.
- Why: one Write call per ticket made the write step 22 turns and 17 minutes for 22 tickets.
