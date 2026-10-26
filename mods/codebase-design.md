# codebase-design

Upstream: mattpocock/skills:skills/engineering/codebase-design (pin in manifest.json)

## Design it twice removed
- Original: `DESIGN-IT-TWICE.md`, reached from Going deeper, starts three or more parallel sub-agents to draft radically different interfaces for one module and compares them.
- Mine: removed, with its pointer.
- Why: to-tickets reads this skill as vocabulary for its prefactor step (roadmap R3); upstream issue #449 reports a session that treated the parallel design as a process and burned 100k tokens. Moves away from the tested original: no multi-agent interface exploration.

## Codex metadata removed
- Original: `agents/openai.yaml` holds a display name and short description for Codex.
- Mine: removed.
- Why: Claude Code only. Moves away from the tested original: the skill no longer shows in Codex.
