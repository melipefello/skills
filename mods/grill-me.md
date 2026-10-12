# grill-me

Upstream: mattpocock/skills:skills/productivity/grill-me and mattpocock/skills:skills/productivity/grilling (pins in manifest.json)

## Grilling inlined
- Original: grill-me is a user-only wrapper whose body calls the Skill tool with "grilling"; grilling holds the instructions.
- Mine: one skill. grilling's body under the name grill-me.
- Why: the forwarding adds a hop and a second skill to keep in sync, with no gain; grill-with-docs, the other caller, is not used.

## Model-invoked, with grilling's description
- Original: grill-me is user-only (`disable-model-invocation: true`) with a human-facing description; grilling is model-invoked on "grill" phrases.
- Mine: grill-me takes grilling's description and is model-invoked.
- Why: other skills (1-1-prep) offer "/grill-me" and need the model to reach it; the separate grilling install is dropped, so the always-loaded cost stays the same.

## Codex metadata removed
- Original: both skills ship `agents/openai.yaml` for OpenAI Codex.
- Mine: removed.
- Why: only Claude Code is used.

## Round size capped at five
- Original: each round asks the whole frontier.
- Mine: at most five frontier questions per round, the ones that unblock the most first.
- Why: answer quality drops after five to eight questions in one go. The total number of questions stays open; only the round count grows.

## Questions an answer could make moot wait
- Original: only a question whose answer depends on another open question waits for a later round.
- Mine: a question that another answer in the same round could make moot also waits.
- Why: a discard answer early in a round made later questions in that round irrelevant after they had been answered. Upstream docs name this as a known, unguarded limit.

## Outputs before confirmation are questions and a summary
- Original: ends with a prohibition, "Do not act on it until the user confirms you have reached a shared understanding."
- Mine: states the allowed outputs: until the user confirms, only question rounds and a closing summary; files, code and plans come after.
- Why: with the prohibition, Codex wrote four coach files mid-interview and they had to be reverted (FPractice retro, 2026-10-12). A positive target holds better than a ban.

## Web research is a fact lookup
- Original: facts from "the environment (filesystem, tools, etc.)" go to a sub-agent.
- Mine: names the web (a fee, a policy, a version) as part of the environment.
- Why: the same session fetched five Steam docs inline during a round; the skill already routes facts to a sub-agent, it just did not say the web counts.
