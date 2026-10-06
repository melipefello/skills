# Adapt

Interview Felipe about the skill part by part, then edit, note and commit.

## Parts

Split every file of `skills/<skill>/` into parts: the front matter, each heading section, each numbered step, each extra file. A part is small enough to decide with one word. When `mods/<skill>.md` exists, parts it covers carry their entry and default to keep.

## Rounds

Ask in rounds of at most eight parts, in file order. For each part, quote it or sum it up in one line and recommend one of three:

- **keep** as is
- **change**, with the proposed wording
- **remove**, with what the original loses

```
❓ **P3** - **<part>**: <one-line summary or quote>

➡️ keep | change: <wording> | remove: <what is lost>
```

Before the first round, call the Skill tool with "writing-for-agents" and write every change recommendation by its rules. Recommendations follow the ground rules: text for other platforms, agents or users gets remove; wording that clashes with his global rules gets change; everything else gets keep. For a `cursor/plugins` source, first read the mirror copy at `https://raw.githubusercontent.com/backnotprop/pstack/main/skills/<skill>/SKILL.md` and reuse its Cursor-to-Claude wording in the change recommendations.

Wait for the answers after each round. Done when every part has a decision.

## Apply

1. Edit the files. Every keep part stays byte-identical, so the upstream diff stays small.
2. Run `node scripts/diff.mjs <skill>` and show the output.
3. Write `mods/<skill>.md` per [NOTE.md](NOTE.md): one entry per hunk.
4. Wait for the yes. Fix what he asks. Commit `adapt <skill>`.
5. Offer `node scripts/install.mjs <skill> --replace`. It removes any installed skill of that name, then installs this one.
