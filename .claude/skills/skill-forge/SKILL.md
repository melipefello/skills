---
name: skill-forge
description: Fork, adapt, update or re-note one skill of this repo from its upstream.
disable-model-invocation: true
---

Argument: one skill name. Without one, run `node scripts/status.mjs` and ask which skill.

## Ground rules

- **One user, one target.** These skills serve Felipe, on Windows 11, in Claude Code, installed with `npx skills`. Text that serves another platform, another agent or another person is dead weight: recommend its removal.
- **Battle-tested original.** Each upstream skill works as written. The goal is the original plus the smallest delta that makes it his. A removal moves away from what was tested: say so each time you recommend one.
- **Review before commit.** Show the diff and get a yes before every `git commit`.
- **Installed stays current.** After each commit that changes `skills/<skill>/`, when `~/.claude/skills/<skill>` exists and `git status` shows nothing uncommitted under `skills/<skill>/`, run `node scripts/install.mjs <skill>` without asking; add `--replace` when the lock file records another source. When the skill is not installed, offer the install.

## Route

1. Read `manifest.json`.
2. Skill absent: follow [FORK.md](FORK.md).
3. Skill present: ask which job, then follow its file.
   - Adapt again: [ADAPT.md](ADAPT.md)
   - Update from upstream: [UPDATE.md](UPDATE.md)
   - Refresh the note after manual edits: [NOTE.md](NOTE.md), section Refresh
