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

## Decisions keep the user's firmness
- Original: no rule on how firmly a decision is written.
- Mine: a decision keeps the firmness the user gave it: an example stays an example, a maybe stays a maybe.
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

## Revising an existing spec in place
- Original: the skill writes a new spec; nothing covers one that exists.
- Mine: a Revising branch: the existing spec is the current design; affected stories and decisions are rewritten in place and what the revision replaces is deleted (git history is the record); story numbers are kept and deleted ones stay unused; numbers that live in data or code are named, not copied; one status line at the top; Proposed holds only this revision's open lines.
- Why: 12 of 14 FGame spec runs were revisions; each appended a dated section, so the spec grew from 23.6 KB to 135.5 KB with 66 reversed decisions, contradicted itself, and copied tuning numbers that live in code.

## The feedback file's layout
- Original: no feedback file.
- Mine: a step 4 and a Feedback file section: `feedback.md` beside the spec holds Open (one line per note; hook-filed notes arrive under an Inbox heading and are rewritten as Open lines), Next playtest and Done (with the ticket or story that closed each note, last two batches only); notes the spec settles move to Done; decisions live only in the spec.
- Why: the FGame feedback file had no owner: two sessions restructured it, run-tickets prescribed a third layout, and the grill copied its decisions into it.

## The spec committed at the end
- Original: the skill ends once the spec is written.
- Mine: a step 5 commits the spec and `feedback.md` by the project's commit rules; done when `git status` shows them clean.
- Why: some FGame to-spec runs committed by themselves and others waited for Felipe's "commit": variance from a missing step, and one of five to seven ceremony prompts per batch.

## Codex metadata removed
- Original: ships `agents/openai.yaml` for OpenAI Codex.
- Mine: removed.
- Why: only Claude Code is used.
