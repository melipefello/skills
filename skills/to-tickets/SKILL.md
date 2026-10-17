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

- Each slice cuts a narrow but COMPLETE path through every layer (data, logic, presentation, tests): vertical, NOT a horizontal slice of one layer
- A completed slice is demoable on its own, and names its **proof**: one check that fails before the slice and passes after it. The ticket says what the check is
- Each slice fits the **budget**: one proof, and a diff the user can review in one sitting.
- Any prefactoring should be done first

</vertical-slice-rules>

Give each ticket its **blocking edges**: the other tickets that must complete before it can start. A ticket with no blockers can start immediately.

### 4. Quiz the user

Present the proposed breakdown as a numbered list. For each ticket, show:

- **Title**: short descriptive name
- **Blocked by**: which other tickets (if any) must complete first
- **What it delivers**: the end-to-end behaviour this ticket makes work
- **Proof**: the one check that fails before it and passes after it

When the source is a spec, list each user story and Implementation Decision that no ticket covers.

Ask the user:

- Does the granularity feel right? (too coarse / too fine)
- Are the blocking edges correct: does each ticket only depend on tickets that genuinely gate it?
- Should any tickets be merged or split further?
- For each ticket that creates a project or installs a tool: which exact version?

Iterate until the user approves the breakdown.

### 5. Write the tickets to .scratch/

Write one file per ticket under `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01` in dependency order (blockers first). Each file's "Blocked by" lists the numbers/titles it depends on. Use the per-ticket file template below: one ticket per file, never a single combined file. Write the files several at a time, one quoted heredoc per file in each command.

Work the **frontier**: any ticket whose blockers are all done. For a purely linear chain that means top to bottom.

Write each decision from the quiz into the tickets it affects. Leave the source spec unchanged.

<local-ticket-template>

# <NN>: <Ticket title>

**What to build:** the end-to-end behaviour this ticket makes work, from the user's perspective, not a layer-by-layer implementation list.

**Proof:** the one check that fails before this ticket and passes after it.

**Blocked by:** the numbers/titles of the tickets that gate this one, or "None (can start immediately)".

**Covers:** the spec's user stories and Implementation Decisions that this ticket delivers (US17, US18, Charge model). Omit without a spec.

</local-ticket-template>

Avoid specific file paths or code snippets: they go stale fast.
