Felipe's personal skills. Each folder in `skills/` is a fork of one or more upstream skill folders, pinned in `manifest.json`, with the changes made on purpose listed in `mods/<skill>.md`. A skill with status `own` has no upstream and no note.

Touch a skill only through `/skill-forge <skill>...`. It routes to fork, adapt, update or note refresh, and runs the scripts in `scripts/` (each prints usage with `--help`). Commit subjects follow its ground rule **Commit subjects**; the commit-msg hook rejects others.

Roadmap: `docs/roadmap.md` holds planned changes to how the skills run together, as items `R<n>`. Read it when a change reshapes the pipeline or a prompt cites an item.

Edits made in `~/.claude/skills` come back with `node scripts/pull.mjs`; then refresh each tracked skill's note per `.claude/skills/skill-forge/NOTE.md` and commit `adapt <skill>`.
