---
name: to-tickets-review
description: "Check the tickets from to-tickets against their spec and session: proof per ticket, spec coverage, tool versions, the user's decisions. Report only."
disable-model-invocation: true
---

Audit a ticket set from to-tickets before work starts. Each check passes or fails, and each result shows its **proof**: a quote with its file name, or a table. The gaps are the finding; change no file.

## Steps

1. **Locate.** The tickets are the argument, else the newest `.scratch/*/issues/` folder; the spec is the `spec.md` beside that folder. The decisions are the user's messages in the to-tickets session: this session by default; for an earlier session, list them with `python ~/.claude/skills/spec-review/scripts/transcript.py index <session.jsonl>` (`--help` prints usage). Done when you hold every ticket, the spec, and the session's user messages.
2. **Check** the tickets against each check below. Done when every ticket, every user story, every Implementation Decision and every user decision has a verdict.
3. **Report** in check order: pass or fail, the counts, then each failure with its quote and file. Write the coverage table to the scratchpad and give its path.

## Checks

1. **Proof.** Each ticket has a Blocked by line and a Proof: one check that fails before the ticket and passes after it. A proof fails when only code review can confirm it ("data, not code"), when it is a judgement ("matches in style"), or when it has no threshold ("rare", "priced high").
2. **Coverage.** Each user story and each Implementation Decision of the spec maps to at least one ticket that delivers it. A ticket's Covers line is a claim: confirm it against the ticket's What to build and Proof. Table: spec item, tickets, status. Status is **Covered**, **Partial** (a ticket delivers part of it) or **NO TICKET**.
3. **Versions.** A ticket that creates a project or installs a tool names its exact version: "Unity Editor 6000.3.5f2", not "a pinned editor version".
4. **Decisions.** Each decision the user made in the to-tickets session is written in the tickets it affects: each quiz answer, each Proposed spec line the user adopted. List each decision with its message and the ticket that states it.
