# glossary

Upstream: mattpocock/skills:skills/engineering/domain-modeling (pin in manifest.json)

## Named glossary
- Original: the skill is `domain-modeling`, titled "Domain Modeling"; its description triggers on codebase terminology, a GLOSSARY.md, or an ADR.
- Mine: the skill is `glossary`; its description triggers on settling or renaming the project's terms, or a GLOSSARY.md.
- Why: the user types `/glossary` to start a naming session, and only the glossary half is kept.

## Decision records removed
- Original: the skill also offers ADRs (three-test bar, `ADR-FORMAT.md`, `docs/adr/` in the file trees and the lazy-creation rule, "decisions" in the intro).
- Mine: removed.
- Why: the user wants vocabulary only for now; roadmap R4 keeps a pin to bring ADRs back. Moves away from the tested original: a hard-to-reverse decision is recorded nowhere.

## One glossary per project
- Original: a `GLOSSARY-MAP.md` at the root points to one `GLOSSARY.md` per context; the skill infers which layout applies.
- Mine: one `GLOSSARY.md` at the repo root; the map and the multi-context rules are removed.
- Why: the user's projects each hold one context. Moves away from the tested original: a monorepo gets one file.

## Every session loads the glossary
- Original: skills read `GLOSSARY.md` when their own text says so; the file holds terms only.
- Mine: creating the file also adds `@GLOSSARY.md` to the project's `CLAUDE.md`, and the file opens with a fixed How to use block: use the terms in every text the user reads, match the surrounding names in code, note an `_Avoid_` name once per conversation, put a missing name under To confirm and report it, change Language on the user's word only.
- Why: the user wants conversation, build output and screen text on the same names; build agents never load this skill, and to-spec, to-tickets and pr had their glossary lines removed.

## Naming session
- Original: no mode for a project with no glossary; upstream's docs page sends that case to `/grill-with-docs` with an explicit ask and reports 50+ questions.
- Mine: invoked by name, the skill scans the texts the user reads, the user's messages in saved sessions, the docs and the code for clashes, asks one naming question per clash in rounds of five (two to four names, where each is used, a recommendation, the text changes that follow), lists single-name things for one confirmation, and closes with the text changes for the user to strike or pass on. A later run covers only To confirm entries and unsettled clashes.
- Why: the first use is a project whose names already clash across screen, chat, docs and code; the user asked for options to compare, in the shape of a grill question, and decides text changes case by case.

## A naming question left out takes the recommended name
- Original: no naming session, so no rule for a question the user leaves out.
- Mine: in a naming session, a question the user's reply leaves out takes the recommended name as the user's pick, so step 3 writes it and "Write on the user's word" holds. The first round says so once; the next round, or the close after the last round, opens with one line that names each name taken this way by its question number, so the user can reopen one.
- Why: on 2026-11-12 two naming sessions drew 9 prompts of the form "as recommended". The user, 2026-11-13: "Other than that, if I don't say something about an answer, we go with the recommended option". The rule matches grill-me's "A question left out takes the recommended answer".

## Written on the user's word
- Original: the skill updates `GLOSSARY.md` inline the moment a term is resolved, never batched.
- Mine: Language changes on the user's word only: each pick in a naming session, a confirmed list at the end of any other session, or a plain "rename it".
- Why: upstream's docs page says an unreviewed, agent-authored glossary is worse than none; a grill that is dropped then leaves no terms behind.

## Challenges fit the rounds; an avoided name gets a note
- Original: a conflicting term is called out immediately, with a question.
- Mine: in a session that asks in rounds, each challenge is a question of the next round and a thing with no term gets a naming question; an `_Avoid_` name used for the same thing gets only the one-line note.
- Why: grill-me asks in rounds of five; the user chose a short note over a stop when they type an old name.

## Entry format: code name, To confirm, coverage
- Original: an entry is the term, a definition and `_Avoid_`; the agent picks the best word; only project-specific terms.
- Mine: adds a `_Code_` line for an identifier that differs from the term, a To confirm section for names an agent picked, and a rule to cover every clash and each main thing on the user's screens; the user picks, the agent recommends.
- Why: code identifiers stay as they are (a rename costs too much), so agents need the mapping; two builds must not pick two names for one thing.

## Codex metadata removed
- Original: ships `agents/openai.yaml` for OpenAI Codex.
- Mine: removed.
- Why: only Claude Code is used. Moves away from the tested original: Codex loses the skill's metadata.
