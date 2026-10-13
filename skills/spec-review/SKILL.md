---
name: spec-review
description: "Trace every decision in a spec to the user message that settled it (time, verbatim quote) and flag each line with no source. Saves spec-review.md beside the spec."
disable-model-invocation: true
---

Audit where each line of a spec came from: for each decision, the user message that settled it, its time, and the user's own words. Lines with no **source** are the finding.

`scripts/transcript.py` (in this skill's folder) reads the session transcripts; run it with `python`, `--help` prints usage. Its session argument defaults to the newest transcript of the current project, which is this session.

## Steps

1. **Locate.** The spec is the argument, else the newest `.scratch/*/spec.md`. The transcript is the session that held the decisions: this session by default; when the spec came from an earlier session, pick that `.jsonl` by modification time. Run `transcript.py index` on it. Done when you hold a message index `M0…Mn` with UTC times.
2. **Trace.** Split the spec into atomic decisions and give each a row: ID, decision, spec location, source (`Mn`, time), the user's words, origin, status. Use `transcript.py show Mn` for any message you need in full. Done when every line of every spec section is a row or plain exposition.
3. **Assemble** `spec-review.md` beside the spec, in this order:
   - a findings table listing every row with status Partial or NO SOURCE;
   - the message index, plus research sources (fetched pages, sub-agent reports) as `R1…Rn`;
   - the rows, grouped by spec section;
   - Superseded decisions: settled earlier, replaced later, with both sources.
4. **Verify** with `transcript.py check <review> <session> --ref <each quoted reference file>`. Each MISS is a quote of the spec or of a research source; fix every other one. Done when no MISS quotes the user.
5. **Report** the counts per status and the findings list.

## Reference

**Quotes** are verbatim, typos kept, `…` for a cut, `\"` for a quote mark inside a quote. Times are UTC, from the transcript.

**Origin** — who authored the idea:
- **Own**: the user's idea, in the user's words.
- **Adopted**: your recommendation, accepted by the user (often by restating it).
- **Mixed**: the user changed or extended a recommendation.
- **Research**: a looked-up fact, not a user decision.

**Status:**
- **Sourced**: a user message settles it.
- **Partial**: a source exists, but the spec is firmer or more specific than it ("for example half" written as "half"), or the user accepted it only indirectly.
- **NO SOURCE**: nothing in the session settles it.
- **Proposed**: listed in the spec's Proposed section, so no source is needed.
