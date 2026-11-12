---
name: grill-me
description: Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases.
---

Interview the user relentlessly until you reach a shared understanding. Map this as a **design tree**: every decision branches into the decisions that hang off it.

When the project keeps a feedback file (`.scratch/<feature>/feedback.md`, laid out by `/to-spec`), read its Open section first: its notes are the first input to the tree.

Work the tree in **rounds**. The **frontier** is every decision whose prerequisites are already settled: the questions you can ask _now_ without guessing at answers you haven't heard yet. Sort the frontier into **questions** and **defaults**. A question is a decision where the user holds information you lack, or could plausibly choose differently from your recommendation: ask at most five per round, the ones that unblock the most first, numbered, each with your recommended answer. The first question is how the user will use the thing. Every other decision is a default: list it once, after the questions of the round where it enters the frontier, as one plain sentence holding the decision and its reason. The user reopens a default by its number; an untouched default is settled. Then wait for the user's answers before the next round.

When the work has a screen, show a rough **mockup** before the detailed questions: once the user has said how they will use it, call the Skill tool with "prototype", and ask the next round after the user has seen the result.

Format a round like so:

```
❓ **Q1** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>

---

❓ **Q2** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>

---

Defaults, settled unless you reopen one by its number:
- **D1** - <the decision and its reason, in one plain sentence>
- **D2** - <the decision and its reason, in one plain sentence>
```

Each round the user answers reshapes the tree: settled decisions push the frontier outward and unblock questions that depended on them. Recompute the frontier and ask the next round. A question whose answer depends on another question still open in this round belongs to a _later_ round, not this one. So does a question that another answer in this round could make moot. **Carry forward** every question the user leaves unanswered: it opens the next round, ahead of new questions.

Descend the tree from **role** to **content**: settle what a part of the design is _for_ before asking what fills it, and keep each recommendation at the altitude of its question. Write every question in the **settled vocabulary**: nouns the user has already agreed on, plus any new term defined inside the question itself. When the project keeps a `GLOSSARY.md`, call the Skill tool with "glossary" before the first round: its terms open the settled vocabulary, and a thing with no term yet gets a naming question.

Finding _facts_ is your job, never the user's. When a frontier question needs a fact from the environment (filesystem, tools, the web: a fee, a policy, a version), dispatch a sub-agent to find it; don't ask the user for anything you could look up yourself. Don't block on it: a running exploration is an unsettled prerequisite, so only the questions downstream of it wait for the sub-agent to report; ask the rest of the frontier now. The _decisions_ are the user's: put each to them and wait.

The session is done when the frontier is empty: every branch answered or settled as a default. The design tree holds what the product does and why. The spec's shape belongs to `/to-spec`, and the ticket count, order and sizing to `/to-tickets`; the user invokes both. Your outputs are question rounds, the mockup, and one closing summary, which writes nothing and whose last line offers the next step: build it now when one agent can build it in one go, `/to-spec` for larger work. The summary holds only answered and settled decisions; a topic you never put in a round goes into one, never straight into the summary. With a `GLOSSARY.md`, the summary also lists the session's new terms, and you write to the glossary the ones the user confirms.
