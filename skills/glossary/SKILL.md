---
name: glossary
description: Build and sharpen a project's glossary. Use when the user wants to settle or rename the project's terms, or when writing or editing a GLOSSARY.md.
---

# Glossary

Actively build and sharpen the project's domain model as you design. This is the *active* discipline: challenging terms, inventing edge-case scenarios, and writing each term into the glossary on the user's word. (Merely *reading* `GLOSSARY.md` for vocabulary is not this skill: that's a one-line habit any skill can do. This skill is for when you're changing the model, not just consuming it.)

The user picks every term: you find the names in use, recommend one, and write what they choose. Invoked by name, run a **naming session**; loaded by another skill, follow **During the session**.

## File structure

One `GLOSSARY.md` per project, at the repo root. Create it lazily: when the first term is resolved, and add the line `@GLOSSARY.md` to the project's `CLAUDE.md` so every session and sub-agent loads it.

## Naming session

A naming session settles the names a project already uses. A **clash** is one thing with several names, or one name for several things.

1. **Scan.** Dispatch sub-agents to list, for each thing, every name in use on each surface: the texts the user reads (labels, buttons, headings, messages), the user's own messages in the project's saved Claude Code sessions (`~/.claude/projects/<project-slug>/*.jsonl`), the docs and specs, and the code identifiers. Done when every thing the user sees on a screen has its names listed by surface. When `GLOSSARY.md` exists, keep only its To confirm entries and the clashes it leaves unsettled.
2. **Ask.** Rounds of at most five naming questions, one clash each, in this order: To confirm entries, clashes in the texts the user reads, the other clashes. Offer two to four names per clash: the names in use first, then at most two new ones. A question the user's reply leaves out takes the recommended name as the user's pick: say so once, in the first round, and open the next round, or the close after the last round, with one line that names each name taken this way by its question number, so the user can reopen one. Close the last round with the things that have a single name, as one list the user confirms or edits. Done when every clash and every To confirm entry has the user's pick.
3. **Write** each term the moment the user picks it. Code identifiers keep their names: one that differs from the term goes on the entry's `_Code_` line.
4. **Close** with the list of text changes that follow from the picks; the user strikes the ones to leave. Offer the next step for the rest: build now when one agent can do it in one go, `/to-tickets` for more.

Format a naming question like so:

```
❓ **Q1** - **<the clash in plain words>**: <what each name means today, and a scenario where the clash misleads>

- (a) <name>: <where it is used today, or "new">
- (b) <name>: <where it is used today, or "new">
- Or type your own.

➡️ <the name you recommend>. Text changes: <the texts the user reads that would change, or "none">.
```

## During the session

In a session that asks in rounds, each move below is a question of the next round, and a thing with no term gets a naming question.

### Challenge against the glossary

When the user uses a term that conflicts with the existing language in `GLOSSARY.md`, call it out immediately. "Your glossary defines 'cancellation' as X, but you seem to mean Y. Which is it?" For an `_Avoid_` name used for the same thing, the one-line note from the file's own How to use block is enough.

### Sharpen fuzzy language

When the user uses vague or overloaded terms, propose a precise canonical term. "You're saying 'account': do you mean the Customer or the User? Those are different things."

### Discuss concrete scenarios

When domain relationships are being discussed, stress-test them with specific scenarios. Invent scenarios that probe edge cases and force the user to be precise about the boundaries between concepts.

### Cross-reference with code

When the user states how something works, check whether the code agrees. If you find a contradiction, surface it: "Your code cancels entire Orders, but you just said partial cancellation is possible. Which is right?"

### Write on the user's word

The Language section of `GLOSSARY.md` changes on the user's word only. In a naming session that word is each pick. In any other session, collect the new and renamed terms, show them as one list at the end, and write the ones the user confirms. A plain "rename it" from the user is their word too: update the entry then. Use the format in [GLOSSARY-FORMAT.md](./GLOSSARY-FORMAT.md).

`GLOSSARY.md` should be totally devoid of implementation details. Do not treat `GLOSSARY.md` as a spec, a scratch pad, or a repository for implementation decisions. It is a glossary and nothing else.
