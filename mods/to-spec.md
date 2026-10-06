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

## Testing Decisions section removed
- Original: the template has a Testing Decisions section (good tests, modules to test, prior art).
- Mine: removed.
- Why: follows from dropping the seams step; no test plan in the spec for now.

## Codex metadata removed
- Original: ships `agents/openai.yaml` for OpenAI Codex.
- Mine: removed.
- Why: only Claude Code is used.
