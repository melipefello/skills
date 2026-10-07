# retro

Upstream: mattpocock/skills:skills/engineering/retro (pin in manifest.json)

## Any agent session, not only coding
- Original: the description and intro frame the retro around a coding session and the coding agent.
- Mine: the description says agent sessions; the intro says the agent.
- Why: sessions are often not about code, and the retro applies to them too.

## Scope chosen by the user, Claude Code log path given
- Original: reads the one session the user names, searching session logs on this machine; defaults to the current session.
- Mine: the user can name a scope (one session, a project's sessions, a time window on a project or globally). The step names where Claude Code keeps session logs and how the folder slug is built, and sends subagents to read more than a few sessions. Still defaults to the current session.
- Why: retros over a project or a period are wanted, not only single sessions. Naming the path saves a disk search on every run; many sessions do not fit one context window.

## Coding standards category and its reference removed
- Original: a Coding standards category adds or clarifies rules for the reviewer agent, sends mechanical violations to deterministic checks and judgement calls to `CODING_STANDARDS.md`. The reference explains why review, not implementation, enforces standards, and describes `CODING_STANDARDS.md`. The AGENTS.md category offers coding standards as a destination.
- Mine: the category, the Implementation vs Review section and the `CODING_STANDARDS.md` bullet are removed; the AGENTS.md category only offers automated checks.
- Why: no reviewer agent reads `CODING_STANDARDS.md`, and the category ties the skill to code. The rule that mechanical violations become checks is lost; the Automated checks category still finds missing checks.

## Every candidate tied to a session event
- Original: presents the candidates in order of severity.
- Mine: each candidate names the event in the session that prompted it; a candidate with none is dropped.
- Why: upstream docs name invented generic advice, written to fill the categories, as the skill's sharpest critique, and tell users to discard untraceable candidates. The skill text did not enforce it.

## Codex metadata removed
- Original: ships `agents/openai.yaml` for OpenAI Codex.
- Mine: removed.
- Why: only Claude Code is used.
