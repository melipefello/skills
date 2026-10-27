---
name: to-tickets
description: Break a plan, spec, or the current conversation into a set of tracer-bullet tickets, each declaring its blocking edges, written as one file per ticket under .scratch/.
disable-model-invocation: true
---

# To Tickets

Break a plan, spec, or conversation into a set of **tickets**: tracer-bullet vertical slices, each declaring the tickets that **block** it.

## Process

### 1. Gather context

Work from whatever is already in the conversation context. If the user passes a spec or briefs path as an argument, such as `.scratch/<feature>/spec.md` or the `briefs.md` that `/triage` writes beside it, read the whole file.

### 2. Explore the codebase (optional)

If you have not already explored the codebase, do so to understand the current state of the code.

Look for opportunities to prefactor the code to make the implementation easier. "Make the change easy, then make the easy change."

### 3. Draft vertical slices

First judge each module the work touches by its depth, with the vocabulary from the Skill tool's `codebase-design`, also when step 2 was skipped. A shallow module the work would spread across many files becomes a prefactor ticket that deepens it, early in its batch. Done when every module the work touches is named deep or shallow.

Break the work into **tracer bullet** tickets.

<vertical-slice-rules>

- Each slice cuts a narrow but COMPLETE path through every layer (data, logic, presentation, tests): vertical, NOT a horizontal slice of one layer
- A completed slice is demoable on its own: the user can see or play its behaviour the moment it lands
- Each slice fits the **budget**: a diff the user can review in one sitting, delivering one behaviour the user can name in one short clause. A What to build that lists several behaviours (new items, a new rule, a rebuilt opponent set) splits into one ticket each, in dependency order.
- Any prefactoring should be done first

</vertical-slice-rules>

Give each ticket its **blocking edges**: the other tickets that must complete before it can start. A ticket with no blockers can start immediately.

A ticket runs unattended, so every **user decision** (a pick between options, a visual choice, a name) is made in the quiz, and the ticket carries the answer. Gather what each decision needs while drafting (references, captures, a list of options). When gathering needs built work, a **research ticket** gathers it before its batch's QA ticket and its report lists the options; the ticket that needs the answer opens the next batch and names the report it waits on, so the user picks between runs.

Cut the set into **batches** of about five tickets in dependency order, and close each batch with its **QA ticket**: the one ticket that proves the batch. It names the tests to write or run, each screenshot to take and what it shows, and what the user tries to see the batch's behaviour; the project's `CLAUDE.md` names its build, test and capture commands and where captures go. A capture is for the QA worker to look at; only one that shows a defect or a choice for the user is kept beside the report. A numeric target goes in the QA ticket's checklist once the project's own tools have measured it against the shipped content. The QA ticket is blocked by every build ticket of its batch. A build ticket names no test and carries no check of its own: its worker ends on the project's quick check.

Tickets change the product and its tools. A change to the workflow (worker rules, skills, agent files) goes under **Process proposals** at the end of the breakdown, for the user to take to a retro, never inside a ticket.

### 4. Quiz the user

Present the proposed breakdown as a numbered list. Before the list, one line per module the work touches: deep, or shallow with the prefactor ticket that deepens it. For each ticket, show:

- **Title**: short descriptive name
- **Blocked by**: which other tickets (if any) must complete first
- **What it delivers**: the end-to-end behaviour this ticket makes work; for a QA ticket, its checks

When the source is a spec, write the breakdown with each ticket's Covers line to a scratch file and run `python -I <this skill's folder>/scripts/coverage.py <spec> --tickets <that file>`, with `--since <the last commit that touched the issues folder>` when the spec is a revision (`--help` prints usage). List each user story it reports and each Implementation Decision that no ticket covers.

Ask only what the tickets need from the user: each user decision with its options, each uncovered story, and each tool version.

A ticket that builds a line from the spec's Proposed section waits for the user to adopt that line in the quiz. When the user is away, write the breakdown and stop.

Iterate until the user approves the breakdown.

### 5. Write the tickets to .scratch/

Before choosing the folder, list `.scratch/`: when the conversation continues a feature that already has a folder (its `spec.md` or `issues/`), write there; create a new folder only for a new feature, and name it to the user.

Write one file per ticket under `.scratch/<feature>/issues/<NN>-<slug>.md`, numbered on from the highest number in `git ls-files .scratch/<feature>/issues`, run just before writing (from `01` when there is none), in dependency order (blockers first). Each file's "Blocked by" lists the numbers/titles it depends on. Use the per-ticket file template below: one ticket per file, never a single combined file. Write each file with the Write tool.

Write each decision from the quiz into the tickets it affects. Leave the source spec unchanged.

<local-ticket-template>

# <NN>: <Ticket title>

**Kind:** `build`, `research` or `qa`. A research ticket changes no code: its worker writes only its report, which ends with a table of at most 30 lines (each mechanic, its trigger, its effect, its format), so a later synthesis reads the tables.

**What to build:** the end-to-end behaviour this ticket makes work, from the user's perspective, not a layer-by-layer implementation list.

**Blocked by:** the numbers/titles of the tickets that gate this one, or "None (can start immediately)".

**Covers:** the spec's user stories and Implementation Decisions that this ticket delivers (US17, US18, Charge model). Omit without a spec, and on a QA ticket.

</local-ticket-template>

A QA ticket's What to build is its checks: the tests to write or run, each screenshot to take and what it shows, and what the user tries. Its Blocked by is every build ticket of its batch.

No time estimates.

Avoid specific file paths or code snippets: they go stale fast. Write exactly the template's fields.

When the source is a briefs file, move each note whose brief became a ticket from Open to Done in the feedback file beside it, with the ticket number, and delete the briefs file.

In `.scratch/<feature>/status.md`, by the layout in the run-tickets skill's Status file section, add one Order of work row per batch (Step `Run NN to MM: <the batch in a few words>`, Evidence `reports NN to MM`, Command `/run-tickets NN-MM (build)`, Blocked by the row or playtest it waits for), then append the Log line `to-tickets NN to MM: from <source>`.

Then commit the tickets and the status file (from a briefs file, with the feedback file and the deleted briefs) by the project's commit rules. Done when `git status` shows them clean.
