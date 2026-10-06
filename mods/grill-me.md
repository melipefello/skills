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
