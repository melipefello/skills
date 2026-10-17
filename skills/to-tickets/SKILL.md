---
name: to-tickets
description: Break a plan, spec, or the current conversation into a set of tracer-bullet tickets, each declaring its blocking edges, written as one file per ticket under .scratch/.
disable-model-invocation: true
---

# To Tickets

Break a plan, spec, or conversation into a set of **tickets**: tracer-bullet vertical slices, each declaring the tickets that **block** it.

## Process

### 1. Gather context

Work from whatever is already in the conversation context. If the user passes a spec path as an argument, such as `.scratch/<feature-slug>/spec.md`, read the whole file.

### 2. Explore the codebase (optional)

If you have not already explored the codebase, do so to understand the current state of the code.

Look for opportunities to prefactor the code to make the implementation easier. "Make the change easy, then make the easy change."

### 3. Draft vertical slices

Break the work into **tracer bullet** tickets.

<vertical-slice-rules>

- Each slice cuts a narrow but COMPLETE path through every layer (data, game logic, presentation, tests): vertical, NOT a horizontal slice of one layer
- A completed slice is demoable on its own, and names its **proof**: the test or demo step that fails before the slice and passes after it. The proof runs on the shipped game state (real content, a real fight, a real save), never on a toy setup that only the test can reach. When the goal carries a number ("two to three times fewer events"), the proof measures that number on the shipped state
- Each slice fits the **budget**: one proof, a diff the user can review in one sitting, and a run that stays under 150k tokens in a fresh main-agent context. The proof is the slice's only test: no test per criterion, and no "all tests pass" criterion
- Any prefactoring should be done first

</vertical-slice-rules>

Give each ticket its **blocking edges**: the other tickets that must complete before it can start. A ticket with no blockers can start immediately.

**Wide refactors are the exception to vertical slicing.** A **wide refactor** is one mechanical change (rename a shared field, retype a shared symbol) whose **blast radius** fans across the whole codebase, so a single edit breaks thousands of call sites at once and no vertical slice can land green. Don't force it into a tracer bullet; sequence it as **expand–contract**. First expand: add the new form beside the old so nothing breaks. Then migrate the call sites over in batches sized by blast radius (per package, per directory), each batch its own ticket blocked by the expand, keeping CI green batch to batch because the old form still exists. Finally contract: delete the old form once no caller remains, in a ticket blocked by every migrate batch. When even the batches can't stay green alone, keep the sequence but let them share an integration branch that all block a final integrate-and-verify ticket; green is promised only there.

### 4. Quiz the user

Present the proposed breakdown as a numbered list. For each ticket, show:

- **Title**: short descriptive name
- **Blocked by**: which other tickets (if any) must complete first
- **What it delivers**: the end-to-end behaviour this ticket makes work
- **Proof**: the test or demo step that fails before it and passes after it

When the source is a spec, list each user story and Implementation Decision that no ticket covers.

Ask the user:

- Does the granularity feel right? (too coarse / too fine)
- Are the blocking edges correct: does each ticket only depend on tickets that genuinely gate it?
- Should any tickets be merged or split further?
- For each ticket that creates a project or installs a tool: which exact version?

Iterate until the user approves the breakdown.

### 5. Write the tickets to .scratch/

Write one file per ticket under `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01` in dependency order (blockers first). Each file's "Blocked by" lists the numbers/titles it depends on. Use the per-ticket file template below: one ticket per file, never a single combined file.

Work the **frontier**: any ticket whose blockers are all done. For a purely linear chain that means top to bottom.

A ticket has two acceptance criteria at most: the proof, and, for a slice that changes a screen, one screenshot. Each criterion names its **evidence**: the test result, command output, screenshot or demo run that shows it holds. Write each decision from the quiz into the tickets it affects.

Leave the source spec unchanged.

<local-ticket-template>

# <NN>: <Ticket title>

**What to build:** the end-to-end behaviour this ticket makes work, from the user's perspective, not a layer-by-layer implementation list.

**Proof:** the test or demo step that fails before this ticket and passes after it.

**Blocked by:** the numbers/titles of the tickets that gate this one, or "None (can start immediately)".

**Covers:** the spec's user stories and Implementation Decisions that this ticket delivers (US17, US18, Charge model). Omit without a spec.

**Sizing:** the sizing rule from the quiz: the budget, or the rule the user chose.

- [ ] The proof: what the test or demo step shows, and its evidence (the test name, or the command whose output shows it)
- [ ] For a screen change only: one screenshot of the changed screen, and its evidence (the file)

</local-ticket-template>

Avoid specific file paths or code snippets: they go stale fast.
