# Update

Carry the newest upstream version into the skill, keep his changes, and review every conflict with him.

1. Run `node scripts/update.mjs <skill> --check`. On "up to date", say so and stop. On DETACHED, run it again without `--check` so the manifest records it, report, and stop.
2. Run `node scripts/update.mjs <skill>`. Files and the manifest pin change; nothing is committed. Undo at any point with `git checkout -- skills/<skill> manifest.json`.
3. Read the report. Clean, merged, added and removed files are accepted. List them, one line each.
4. One question per conflict: every marked hunk, and every "kept yours" or "still removed" line of the report. Quote both sides and recommend a resolution from the entries in `mods/<skill>.md`. Default: upstream's new meaning with his change re-applied on top.
5. Semantic check: `git diff -- skills/<skill>` shows what upstream changed. Compare each entry of the note against it. An upstream change that contradicts an entry gets a question too, even when the text merged cleanly.
6. Resolve, remove every conflict marker, run `node scripts/diff.mjs <skill>`, and update the note: delete entries upstream now does itself, add entries for new resolutions. Show the diff and the note. Wait for the yes. Commit `update <skill> to <ref>`.
7. Offer `node scripts/install.mjs <skill> --replace`.
