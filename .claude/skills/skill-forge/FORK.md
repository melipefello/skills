# Fork

Brief the user on the upstream skill, copy it verbatim, pull its dependencies, then adapt it.

1. Brief the user before any copy. Find the skill with `node scripts/peek.mjs <owner/repo> --grep "^name: <skill>$" --files` (without a given upstream, try the `KNOWN_UPSTREAMS` in `scripts/lib.mjs`), then read its files, its upstream docs page (mattpocock: `docs/<category>/<name>.md`) and `mods/*.md`. Send peek output for more than one file to the scratchpad and read it from there. Tell the user what the skill makes the agent do, which forked skills feed it and which it feeds, which skills it calls, what it adds over a plain prompt, and each mod note that removes something it relies on (to-spec dropped TDD, so implement loses its tdd step). Recommend fork or drop. Done when the user answers; on drop, stop.
2. Run `node scripts/fork.mjs <skill>`, with `--from <owner/repo>` when the upstream is given. It copies the folder verbatim, pins the newest tag (or HEAD), and commits. Without `--from` it searches the known upstreams; when it finds none or several, ask which upstream (any `owner/repo` works) and run again with `--from`. Pass `--path` when it reports several folders (cursor/plugins keeps pstack in `pstack/skills/`).
3. For each name under `deps:` that is not in the manifest, ask: fork it too, inline it, keep it, or skip? Done when every listed dependency has an answer.
   - **Fork**: step 2 only. It stays verbatim, with no interview and no note.
   - **Inline**: `node scripts/fork.mjs <skill> --from <owner/repo> --add-source <dep>`. Its text joins this skill in the adapt step; diff and update track both folders. Recommend it when this skill is a thin wrapper that only calls the dependency.
   - **Keep**: the copy already installed from elsewhere (`deps:` marks it) answers the references, which stay as they are. Recommend it for a general skill that other skills call too.
   - **Skip**: ask what replaces it, if anything (for example, a setup skill's config becomes one fixed path). The adapt step removes or replaces every reference to it.
4. Continue with [ADAPT.md](ADAPT.md) for the requested skill.
