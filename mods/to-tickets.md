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
