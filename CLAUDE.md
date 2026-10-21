Felipe's personal skills. Each folder in `skills/` is a fork of one or more upstream skill folders, pinned in `manifest.json`, with the changes made on purpose listed in `mods/<skill>.md`. A skill with status `own` has no upstream and no note.

Touch a skill only through `/skill-forge <skill>`. It routes to fork, adapt, update or note refresh, and runs the scripts in `scripts/` (each prints usage with `--help`).
