# to-spec

Upstream: mattpocock/skills:skills/engineering/to-spec (pin in manifest.json)

## Spec saved to .scratch/, no tracker setup
- Original: publishes the spec to the issue tracker configured by `/setup-matt-pocock-skills`, applies the `ready-for-agent` label, and points to the setup skill when no config is present.
- Mine: writes the spec to `.scratch/<feature-slug>/spec.md`, creating the folder; no label; no setup pointer. The description says where the spec goes.
- Why: specs live as local markdown; the setup skill is not used. No triage or AFK agent reads the label, and upstream names the label its most-reported rough edge.

## Glossary and ADR use removed
- Original: the explore step also tells the agent to use the domain glossary vocabulary and respect ADRs.
- Mine: the explore step only reads the codebase.
- Why: the projects are self-documenting; there is no glossary or ADR layer to read.

## Test seams step removed
- Original: before writing, sketches the test seams (prefer existing, highest, fewest) and checks them with the user.
- Mine: removed; the write step becomes step 2.
- Why: no TDD for now. A different kind of verification (likely functional QA) may come later.

## Implementation decisions only when made
- Original: the section lists implementation decisions that were made.
- Mine: only decisions the user made in this conversation; the section is omitted when there are none.
- Why: the spec states what to do. A how goes in only when the user decided it, so the agent does not fill the section with an invented design.

## Prototype snippet exception removed
- Original: the Implementation Decisions section bans file paths and code snippets, except a snippet from a prototype that states a decision more precisely than prose (state machine, reducer, schema, type shape).
- Mine: removed; the ban on file paths and code snippets has no exception.
- Why: no prototypes are planned before a spec, so the exception does not fit the expected use.

## Testing Decisions section removed
- Original: the template has a Testing Decisions section (good tests, modules to test, prior art).
- Mine: removed.
- Why: follows from dropping the seams step; no test plan in the spec for now.

## Neutral implementation decision examples
- Original: the Implementation Decisions examples include schema changes and API contracts.
- Mine: data model changes and contracts between systems.
- Why: schema and API are web-dev terms; the work is mostly game dev, and the skill stays usable outside it.

## Decisions keep the user's strength
- Original: no rule on how firmly a decision is written.
- Mine: each decision is written at the strength the user gave it; "for example half" stays an example.
- Why: the spec turned the user's example into a fixed rule.

## Proposed section
- Original: agent additions sit in the same sections as user decisions.
- Mine: a Proposed section holds everything the user did not settle (names, examples, inferences, suggestions), one line each; omitted when there are none.
- Why: agent additions (a working title, framing paragraphs, its own analysis, inferred rules) sat in the spec among user decisions, with nothing to tell them apart.

## Spec checked against the conversation
- Original: the skill ends once the spec is written.
- Mine: a step 3 checks that every line traces to a user message, to a looked-up fact stated as its source states it, or sits in Proposed; each failing line is moved or fixed.
- Why: a provenance review found eleven lines with no source or firmer than their source, one a looked-up fact made bigger than the source said.

## User stories bounded to settled behaviours
- Original: the User Stories section asks for a LONG list, "extremely extensive", covering all aspects of the feature.
- Mine: one user story per behaviour the user settled in the conversation; the "extremely extensive" sentence is removed.
- Why: the FGame spec reached 109 stories (3,706 of its 8,449 words), and every later pass paid for them: the Covers lines in to-tickets, a 109-row coverage table in to-tickets-review, 27k output tokens in spec-review. The maximiser also pulled against step 3, which sends every unsourced line to Proposed. Moves away from the tested original: upstream's spec may list fewer stories than it would have.

## Codex metadata removed
- Original: ships `agents/openai.yaml` for OpenAI Codex.
- Mine: removed.
- Why: only Claude Code is used.
