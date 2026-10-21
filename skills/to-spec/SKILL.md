---
name: to-spec
description: "Turn the current conversation into a spec and save it under .scratch/: no interview, just synthesis of what you've already discussed."
disable-model-invocation: true
---

Take the current conversation context and codebase understanding and produce a spec. Do NOT interview the user; just synthesize what you already know.

## Process

1. Explore the repo to understand the current state of the codebase, if you haven't already.

2. Write the spec using the `spec-template` below to `.scratch/<feature-slug>/spec.md`, creating the folder if needed. A decision keeps the firmness the user gave it: an example stays an example, a maybe stays a maybe.

   **Revising.** When the spec exists, it is the current design. Rewrite each affected story and decision in place under its heading, and delete what the revision replaces: git history is the record. A story keeps its number, and a deleted number stays unused. Numbers and timings that live in data or code are named, not copied. Replace the one status line at the top: the revision, the date, the batch it feeds. Proposed holds only this revision's unsettled lines.

3. Check the spec against the conversation. Every line traces to a user message or to a fact you looked up, stated as its source states it; any other line sits in `## Proposed`. Move or fix each line that is misplaced.

4. Update the **feedback file** beside the spec, when there is one, by the layout below. Done when every Open note this spec settles has moved to Done with its story number.

5. Commit the spec (and feedback.md) by the project's commit rules. Done when `git status` shows them clean.

## Feedback file

`.scratch/<feature-slug>/feedback.md` has three sections:

- `## Open`: one line per note: date, source, the note. Notes filed by a hook arrive under `### Inbox` inside Open; rewrite each as an Open line.
- `## Next playtest`: the user's own checks for the next play.
- `## Done`: one line per closed note: the note, then the ticket or story that closed it. Delete Done lines older than the last two batches.

Decisions live only in the spec.

<spec-template>

## Problem Statement

The problem that the user is facing, from the user's perspective.

## Solution

The solution to the problem, from the user's perspective.

## User Stories

A numbered list of user stories, one per behaviour the user settled in the conversation. Each user story should be in the format of:

1. As an <actor>, I want a <feature>, so that <benefit>

<user-story-example>
1. As a mobile bank customer, I want to see balance on my accounts, so that I can make better informed decisions about my spending
</user-story-example>

## Implementation Decisions

A list of the implementation decisions the user made in this conversation. Omit this section when there are none. This can include:

- The modules that will be built/modified
- The interfaces of those modules that will be modified
- Technical clarifications from the developer
- Architectural decisions
- Data model changes
- Contracts between systems
- Specific interactions

Do NOT include specific file paths or code snippets. They may end up being outdated very quickly.

## Out of Scope

A description of the things that are out of scope for this spec.

## Proposed

Everything in the spec the user did not settle: names, examples, inferences, and your own suggestions, one line each. Omit this section when there are none.

## Further Notes

Any further notes about the feature.

</spec-template>
