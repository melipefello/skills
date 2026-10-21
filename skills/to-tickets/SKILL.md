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
- A completed slice is demoable on its own: the user can see or play its behaviour the moment it lands
- Each slice fits the **budget**: a diff the user can review in one sitting.
- Any prefactoring should be done first

</vertical-slice-rules>

Give each ticket its **blocking edges**: the other tickets that must complete before it can start. A ticket with no blockers can start immediately.

A ticket runs unattended, so every **user decision** (a pick between options, a visual choice, a name) is made in the quiz, and the ticket carries the answer. Gather what each decision needs while drafting (references, captures, a list of options). When gathering needs built work, a **research ticket** gathers it as the last build ticket of its batch and its report lists the options; the ticket that needs the answer opens the next batch and names the report it waits on, so the user picks between runs.

Cut the set into **batches** of about five tickets in dependency order, and close each batch with its **QA ticket**: the one ticket that proves the batch. It names the tests to write or run, each screenshot to take and what it shows, and what the user plays to see the batch's behaviour. It is blocked by every build ticket of its batch. A build ticket carries no check of its own: its worker ends on the project's quick check.

Tickets change the product and its tools. A change to the workflow (worker rules, skills, agent files) goes under **Process proposals** at the end of the breakdown, for the user to take to a retro, never inside a ticket.

### 4. Quiz the user

Present the proposed breakdown as a numbered list. For each ticket, show:

- **Title**: short descriptive name
- **Blocked by**: which other tickets (if any) must complete first
- **What it delivers**: the end-to-end behaviour this ticket makes work; for a QA ticket, its checks

When the source is a spec, write the breakdown with each ticket's Covers line to a scratch file and run `python -I <this skill's folder>/scripts/coverage.py <spec> --tickets <that file>`, with `--since <the last commit that touched the issues folder>` when the spec is a revision (`--help` prints usage). List each user story it reports and each Implementation Decision that no ticket covers.

Ask the user:

- Does the granularity feel right? (too coarse / too fine)
- Are the blocking edges correct: does each ticket only depend on tickets that genuinely gate it?
- Should any tickets be merged or split further?
- Are the batches cut right: does each QA ticket close a set the user can play as one?
- For each ticket that creates a project or installs a tool: which exact version?
- For each user decision the tickets need: the options gathered, and which one?

Iterate until the user approves the breakdown.

### 5. Write the tickets to .scratch/

Write one file per ticket under `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01` in dependency order (blockers first). Each file's "Blocked by" lists the numbers/titles it depends on. Use the per-ticket file template below: one ticket per file, never a single combined file. Write each file with the Write tool.

Work the **frontier**: any ticket whose blockers are all done. For a purely linear chain that means top to bottom.

Write each decision from the quiz into the tickets it affects. Leave the source spec unchanged.

<local-ticket-template>

# <NN>: <Ticket title>

**What to build:** the end-to-end behaviour this ticket makes work, from the user's perspective, not a layer-by-layer implementation list.

**Blocked by:** the numbers/titles of the tickets that gate this one, or "None (can start immediately)".

**Covers:** the spec's user stories and Implementation Decisions that this ticket delivers (US17, US18, Charge model). Omit without a spec, and on a QA ticket.

</local-ticket-template>

A QA ticket's What to build is its checks: the tests to write or run, each screenshot to take and what it shows, and what the user plays. Its Blocked by is every build ticket of its batch.

Avoid specific file paths or code snippets: they go stale fast.
