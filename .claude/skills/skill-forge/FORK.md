# Fork

Copy the upstream skill verbatim, pull its dependencies, then adapt it.

1. Run `node scripts/fork.mjs <skill>`, with `--from <owner/repo>` when the upstream is given. It copies the folder verbatim, pins the newest tag (or HEAD), and commits. Without `--from` it searches the known upstreams; when it finds none or several, ask which upstream (any `owner/repo` works) and run again with `--from`. Pass `--path` when it reports several folders (cursor/plugins keeps pstack in `pstack/skills/`).
2. For each name under `deps:` that is not in the manifest, ask: fork it too, inline it, or skip? Done when every listed dependency has an answer.
   - **Fork**: step 1 only. It stays verbatim, with no interview and no note.
   - **Inline**: `node scripts/fork.mjs <skill> --from <owner/repo> --add-source <dep>`. Its text joins this skill in the adapt step; diff and update track both folders. Recommend it when this skill is a thin wrapper that only calls the dependency.
   - **Skip**: ask what replaces it, if anything (for example, a setup skill's config becomes one fixed path). The adapt step removes or replaces every reference to it.
3. Continue with [ADAPT.md](ADAPT.md) for the requested skill.
