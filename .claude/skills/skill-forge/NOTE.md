# The note: `mods/<skill>.md`

One entry per change made to the upstream skill on purpose. The update step reads the entries one by one against each new upstream version, so each entry states behaviour, and leaves exact wording to the diff.

```md
# <skill>

Upstream: <owner/repo>:<path> (pin in manifest.json)

## <short title>
- Original: <what the upstream does>
- Mine: <what this version does>
- Why: <reason>
```

One entry per hunk of `node scripts/diff.mjs <skill>`. Several hunks that serve one change share one entry. A removed part is an entry with `Mine: removed`. A skill with no changes has no note.

## Refresh

After manual edits:

1. Run `node scripts/diff.mjs <skill>`.
2. Match each hunk to an entry. A hunk with no entry gets a new one, drafted from the diff. An entry with no hunk is deleted.
3. Show the new note. Wait for the yes. Commit `note <skill>`.
