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

## Game dev layer names
- Original: a vertical slice cuts through schema, API, UI and tests; the wide refactor example is "rename a column".
- Mine: the layers are data, game logic, presentation and tests; the example is "rename a shared field".
- Why: the work is game dev; the web terms do not map onto it. "tests" stays as a layer: no TDD does not mean no tests.

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
- Mine: each slice names its proof, the test or demo step that fails before the slice and passes after it; the quiz list and the ticket template carry a Proof line.
- Why: every ticket should come with proof that it works, readable before approval. Upstream reports that a per-ticket demo line pushes slicing toward vertical, and that criteria often pass before any work is done; "fails before" closes that.

## Size set by a budget
- Original: each slice is sized to fit in a single fresh context window.
- Mine: each slice fits the budget: one proof, and a diff the user can review in one sitting. No token or time bound.
- Why: a context window is too loose a bound; each ticket should be one thing to test and read in one sitting. A 150k-token ceiling was tried from 14 to 17 October and measured no effect: the FGame tickets 23-33 ran in contexts of 200k to 410k tokens, since no agent can see a token meter. The two-criteria rule below is what cut the runs.

## Evidence named per criterion
- Original: acceptance criteria are bare checklist lines.
- Mine: each acceptance criterion names its evidence: the test result, command output, screenshot or demo run that shows it holds; the template lines say so.
- Why: a ticket set passed the quiz with 13 tickets whose criteria only code review could confirm ("data, not code", "matches in style", "rare"); fixing it meant rewriting every ticket. Demo run, not played run, so the skill stays usable outside games.

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
- Mine: each quiz decision goes into the tickets it affects, and the template has a Sizing line with the budget or the rule the user chose.
- Why: the user's sizing rule (18–25 tickets) and other quiz answers were missing from the files, so later agents could not see them.

## Ticket files written in batches
- Original: step 5 says to write one file per ticket, with no word on how.
- Mine: the files are written several at a time, one quoted heredoc per file in each command.
- Why: one Write call per ticket made the write step 22 turns and 17 minutes for 22 tickets.

## Two criteria per ticket
- Original: each acceptance criterion names its evidence; the template lists criteria 1 and 2 open-ended.
- Mine: a ticket has at most two criteria, the proof and, for a screen change, one screenshot; the budget rule says the proof is the slice's only test, with no test per criterion and no "all tests pass" criterion.
- Why: the FGame tickets 23-33 carried 7 to 9 evidenced criteria each (tests per criterion, mockups, frame sequences, a tests.txt), and the proof load took over half of each worker's time; the retro of that run cut it back to the proof.

## The proof runs on the shipped state and measures the goal's number
- Original: the proof is the test or demo step that fails before the slice and passes after it.
- Mine: the same, plus: it runs on the shipped game state, never on a toy setup only the test can reach, and when the goal carries a number the proof measures it there.
- Why: FGame ticket 35 proved its rule on a fight of one-dot items; the shipped fights never settle, so the goal (two to three times fewer events) was missed while the proof passed.
