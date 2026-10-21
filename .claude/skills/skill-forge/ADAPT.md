# Adapt

Interview the user about the parts worth changing, then edit, note and commit.

## Parts

Split every file of `skills/<skill>/` into parts: the front matter, each heading section, each numbered step, each extra file. A part is small enough to decide with one word: split a step or section by sentence when its sentences could take different answers. When `mods/<skill>.md` exists, parts it covers carry their entry and default to keep. A source added with `--add-source` has no files there yet: read its folder with `node scripts/peek.mjs <owner/repo> <path> --ref <ref>` and split its files too, after the skill's own.

Before the first round, read what upstream says about the skill outside its folder: for each source, run `node scripts/peek.mjs <owner/repo> --grep <name> --files --ref <ref>` and read the docs pages and decision records it lists (mattpocock keeps them in `docs/<category>/<name>.md` and `.out-of-scope/`). Send peek output for more than one file to the scratchpad and read it from there. Known limits and rejected requests found there shape the recommendations. Recommend for each part, per the ground rules: text for other platforms, agents or users gets remove; wording that clashes with the user's global rules gets change; everything else gets keep. Write every change by the writing-for-agents rules.

## Rounds

Round 1 opens with one line for every keep part: `Keeping P1-P4, P6-P13: name a number to reopen.` Unless the user reopens one, those are decided. Rounds hold only change and remove parts, at most five each, in file order. At most two rounds: when more than ten change and remove parts remain, stop and ask whether the skill is worth keeping.

Write each part in the words the user would say aloud. Its header is its effect (`When Claude loads this skill`, not `Front matter`); a term the user would not say aloud is replaced, never defined. Examples stay domain-neutral.

```
❓ **P3 - <effect in plain words>**
Now Claude: <what Claude does today> / After: <what Claude does with the recommendation>
(<upstream quote; for an own skill, the current text>)
➡️ change: <wording> | remove: <what is lost>
```

Wait for the answers after each round. A part left unanswered takes the recommendation: list those at the top of the next round so the user can object. Done when every part has a decision.

## Apply

1. Edit the files. Every keep part stays byte-identical, so the upstream diff stays small.
2. Run `node scripts/diff.mjs <skill>` and show the output.
3. Write `mods/<skill>.md` per [NOTE.md](NOTE.md): one entry per change.
4. Wait for the yes. Fix what the user asks. Commit `adapt <skill>`, or `fork <skill>` when the fork is still uncommitted.
5. Install per the ground rule **Installed stays current**. `--replace` removes any installed skill of that name, then installs this one. For each inlined dependency, also offer `node scripts/uninstall.mjs <dep>`.
