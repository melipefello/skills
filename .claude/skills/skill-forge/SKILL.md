---
name: skill-forge
description: Fork, adapt, update or re-note skills of this repo from their upstream.
argument-hint: "<skill>... | changed"
disable-model-invocation: true
---

Argument: one or more skill names, or `changed` for every skill `node scripts/drift.mjs` reports. Without one, run `node scripts/drift.mjs` and ask which skill, offering the ones it names. Call the Skill tool with "writing-for-agents" once, before the first skill. Route each skill in turn, each with its own diff, yes and commit. Done when the final reply lists, per skill: committed, installed, pushed.

## Ground rules

- **One user, one target.** These skills serve Felipe, on Windows 11, in Claude Code, installed with `npx skills`. Text that serves another platform, another agent or another person is dead weight: recommend its removal.
- **Battle-tested original.** Each upstream skill works as written. The goal is the original plus the smallest delta that makes it the user's. A removal moves away from what was tested: say so each time you recommend one.
- **Review before commit.** Show the diff and get a yes before every `git commit`. The yes also covers `git push` of FSkills and of any other repo changed in the same task. A yes given in advance counts: then show the diff in the reply that reports the commit.
- **Commit subjects.** `fork <skill>`, `adapt <skill>` (any edit under `skills/<skill>/`, with its note), `update <skill> to <ref>`, `note <skill>` (a note change with no skill edit). Each commit stages one skill's folder, its note and `manifest.json`; the commit-msg hook enforces both.
- **Installed stays current.** After each commit that changes `skills/<skill>/`, when `~/.claude/skills/<skill>` exists and `git status` shows nothing uncommitted under `skills/<skill>/`, run `node scripts/install.mjs <skill>` without asking; add `--replace` when the lock file records another source. When the skill is not installed, offer the install.

## Route

1. Read `manifest.json`.
2. Skill absent: follow [FORK.md](FORK.md).
3. Uncommitted edits by the user (pulled with `node scripts/pull.mjs`, or made by hand in `skills/`): no interview. Tracked skill: [NOTE.md](NOTE.md), section Refresh. Own skill (status `own`): show the diff once, wait for the yes, commit `adapt <skill>`.
4. Own skill, new change: adapt with [ADAPT.md](ADAPT.md) minus the upstream reads, the diff and the note.
5. Skill present: ask which job, then follow its file.
   - Adapt again: [ADAPT.md](ADAPT.md)
   - Update from upstream: [UPDATE.md](UPDATE.md); `node scripts/status.mjs` shows which pins upstream has moved past.
   - Refresh a note that lags the skill: [NOTE.md](NOTE.md), section Refresh
