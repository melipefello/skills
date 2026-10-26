# code-review

Upstream: mattpocock/skills:skills/engineering/code-review (pin in manifest.json)

## No issue tracker
- Original: the skill expects `docs/agents/issue-tracker.md` (written by `setup-matt-pocock-skills`) and looks first for issue references in the commit messages, fetched through it.
- Mine: removed; the spec comes from the path passed as an argument, then from `docs/`, `specs/` or `.scratch/`, then from the user.
- Why: specs and tickets live as files under `.scratch/`, with no issue tracker. Moves away from the tested original: a repo that tracks work in GitHub issues gets no issue lookup.

## Spec axis alone
- Original: both sub-agents always run.
- Mine: the argument `spec` starts only the Spec sub-agent; the Standards block reads "not run".
- Why: run-tickets reviews each batch against its spec only (roadmap R2): the projects have no written coding standards yet, and judgement-call smells would make a fix ticket every batch.

## Sub-agents review directly
- Original: the sub-agent briefs leave delegation open.
- Mine: each brief ends with an instruction to perform the review directly, with its own reads.
- Why: upstream reports sub-agents that rediscover the skill and fan out again (one run reached 50+ agents); a run-tickets batch runs unattended.

## Codex metadata removed
- Original: `agents/openai.yaml` holds a display name and short description for Codex.
- Mine: removed.
- Why: Claude Code only. Moves away from the tested original: the skill no longer shows in Codex.
