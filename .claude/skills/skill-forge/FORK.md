# Fork

Copy the upstream skill verbatim, pull its dependencies, then adapt it.

1. Ask which upstream, unless given. Known ones: `mattpocock/skills` and `cursor/plugins` (pstack lives in `pstack/skills/`). Any `owner/repo` works.
2. Run `node scripts/fork.mjs <skill> --from <owner/repo>`. It copies the folder verbatim, pins the newest tag (or HEAD), and commits. Pass `--path` when it reports several folders.
3. For each name under `deps:` that is not in the manifest, ask: fork it too, or skip? A forked dependency goes through step 2 only: it stays verbatim, with no interview and no note. Done when every listed dependency has an answer.
4. Continue with [ADAPT.md](ADAPT.md) for the requested skill.
