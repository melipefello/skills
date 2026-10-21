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

## Unanswered questions carry forward
- Original: no rule for a question the user leaves unanswered.
- Mine: every unanswered question opens the next round, ahead of new questions.
- Why: a question the user skipped was never asked again; its topic reached the spec only through the agent's closing summary.

## Questions descend from role to content, in settled vocabulary
- Original: no rule on the level of a question or on the words it uses.
- Mine: settle what a part of the design is for before asking what fills it, keep each recommendation at the level of its question, and use only agreed nouns plus terms the question itself defines.
- Why: questions jumped to concrete content before the role of that part was settled, and used nouns the user had not agreed on; the user corrected this three times in one session, and each correction cost a round.

## Outputs are question rounds and one summary; spec and tickets belong to their skills
- Original: ends with a prohibition, "Do not act on it until the user confirms you have reached a shared understanding."
- Mine: the design tree holds what the product does and why; the spec's shape belongs to `/to-spec` and the ticket count, order and sizing to `/to-tickets`, both invoked by the user. The only outputs are question rounds and one closing summary, which writes nothing and whose last line names `/to-spec` as the next step.
- Why: with the prohibition, Codex wrote four coach files mid-interview and they had to be reverted (FPractice retro, 2026-10-12). Later, "files, code and plans come after that confirmation" invited the grill to plan the spec, the tickets and the feedback file: the user restated the boundary in seven FGame sessions, and one grill absorbed a `/to-spec`.

## Summary holds only answered and settled decisions
- Original: no closing summary is named.
- Mine: the closing summary holds only answered decisions and settled defaults; a topic never put in a round goes into one first.
- Why: topics never asked about appeared in the agent's closing summary as if settled; the user pasted the summary back, and the spec then treated them as decisions.

## Questions and defaults
- Original: every frontier decision is asked; the session is done when every branch is visited, nothing left silently assumed.
- Mine: the frontier splits into questions (the user's goal or taste picks, or reversing costs more than a ticket), asked as before, and defaults (a number, a count, a layout, an item list), listed after the questions as numbered D lines with their reasons. The user overrides a default by its number; an untouched one is settled. Done when every branch is answered or settled as a default.
- Why: in FGame 19 of 31 grill rounds were "go with recommendations"; about 90% of 124 recommendations went through unchanged, and the content-level ones were reversed 36 hours later with four of eleven tickets. The user: "I'll only be able to tell if I like them after I test it out."

## The feedback file's Open section comes first
- Original: no input besides the conversation.
- Mine: when the project keeps `.scratch/<feature>/feedback.md` (laid out by `/to-spec`), its Open section is read first.
- Why: seven of nine FGame grills began with the user typing "Read feedback.md".

## Web research is a fact lookup
- Original: facts from "the environment (filesystem, tools, etc.)" go to a sub-agent.
- Mine: names the web (a fee, a policy, a version) as part of the environment.
- Why: the same session fetched five Steam docs inline during a round; the skill already routes facts to a sub-agent, it just did not say the web counts.
