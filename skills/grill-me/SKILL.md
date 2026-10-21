---
name: grill-me
description: Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases.
---

Interview the user relentlessly until you reach a shared understanding. Map this as a **design tree**: every decision branches into the decisions that hang off it.

When the project keeps a feedback file (`.scratch/<feature>/feedback.md`, laid out by `/to-spec`), read its Open section first: its notes are the first input to the tree.

Work the tree in **rounds**. The **frontier** is every decision whose prerequisites are already settled: the questions you can ask _now_ without guessing at answers you haven't heard yet. Sort the frontier into **questions** and **defaults**. A question is a decision where the user's goal or taste picks between options, or one that costs more than a ticket to reverse: ask at most five per round, the ones that unblock the most first, numbered, each with your recommended answer. A default is a decision that trying the result judges better than talk (a number, a count, a layout, an item list): list it after the round's questions as one numbered line, the decision and its reason. The user overrides a default by its number; an untouched default is settled. Then wait for the user's answers before the next round.

Format a round like so:

```
❓ **Q1** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>

---

❓ **Q2** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>

---

Defaults, settled unless you override one by its number:
- **D1** - <the decision>: <its reason>
- **D2** - <the decision>: <its reason>
```

Each round the user answers reshapes the tree: settled decisions push the frontier outward and unblock questions that depended on them. Recompute the frontier and ask the next round. A question whose answer depends on another question still open in this round belongs to a _later_ round, not this one. So does a question that another answer in this round could make moot. **Carry forward** every question the user leaves unanswered: it opens the next round, ahead of new questions.

Descend the tree from **role** to **content**: settle what a part of the design is _for_ before asking what fills it, and keep each recommendation at the altitude of its question. Write every question in the **settled vocabulary**: nouns the user has already agreed on, plus any new term defined inside the question itself.

Finding _facts_ is your job, never the user's. When a frontier question needs a fact from the environment (filesystem, tools, the web: a fee, a policy, a version), dispatch a sub-agent to find it; don't ask the user for anything you could look up yourself. Don't block on it: a running exploration is an unsettled prerequisite, so only the questions downstream of it wait for the sub-agent to report; ask the rest of the frontier now. The _decisions_ are the user's: put each to them and wait.

The session is done when the frontier is empty: every branch answered or settled as a default. The design tree holds what the product does and why. The spec's shape belongs to `/to-spec`, and the ticket count, order and sizing to `/to-tickets`; the user invokes both. Your outputs are question rounds and one closing summary, which writes nothing and whose last line names `/to-spec` as the next step. The summary holds only answered and settled decisions; a topic you never put in a round goes into one, never straight into the summary.
