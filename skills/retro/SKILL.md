---
name: retro
description: "Conduct a retrospective on agent sessions."
disable-model-invocation: true
argument-hint: "[session id | transcript path | scope]"
---

The user has asked for a **retrospective**. You are suggesting improvements to the agent's **environment** to improve future runs.

## Steps

1. Call the Skill tool with `writing-for-agents` for the writing style guide.

2. Read the project's **ledger**, `docs/retro-ledger.md`: every earlier retro candidate, the user's decision, the commit and whether the fix held (create it from the template under Reference when missing). When the scope is a ticket run and the newest retro's applied fixes have run in no ticket batch since their commit, say so and stop: a fix is judged only after a run has used it. Done when you know each open row and each applied fix the run should show.

3. Read the primary sources for the scope the user specifies: one session (its id or its transcript path), a project's sessions, or a time window (last 30 days on this project, last 7 days globally). Claude Code keeps each session as `~/.claude/projects/<slug>/<session-id>.jsonl`, where the slug is the working directory with `:`, `\` and `/` replaced by `-` (`C:\F\FSkills` → `C--F-FSkills`); file modification times date them. If the user doesn't specify a scope, default to the current session. Start each session from its numbers: `python -I <this skill's folder>/scripts/digest.py <session.jsonl>` prints its prompts, tool counts, errors, largest results and subagents; for a session that ran `/run-tickets`, `python -I ~/.claude/skills/run-tickets/scripts/ticket_stats.py <session.jsonl>` prints the per-ticket table (minutes, calls, tokens, peak context, errors, Unity minutes, dollars). Both print usage with `--help`. Dispatch subagents to read the transcripts of the tickets the table shows as outliers, and of each session when there are more than a few, and report the struggles. Done when you hold each session's numbers and each outlier's struggles.

4. Look for candidates for improvement in these categories.

- **Navigation**: how easy was it for the agent to find the right files? Are there hidden dependencies between files? Would a **navigation pointer** make it easier? _Use when_ the session took a long time to find a piece of information.
- **Automated checks**: are there automated checks that could catch errors the agent made? Linting, typing, tests, filesystem linters? Read the repo's own check command first (its `package.json`/build-tool `lint`/`check` scripts, its CI workflow), so a check that already exists but sits unwired or silently broken is the finding, not a reinvention. A repo with no **guardrail** (no pre-commit hook and no CI job running its lint/typecheck/test command) is itself a finding: an un-linted repo is a standing missed opportunity, not a neutral default. _Use when_ the agent made a mistake an automated check could have caught, or the repo has no guardrail at all.
- **Global AGENTS.md**: are there any steering instructions that should be moved to automated checks instead? _Use when_ the AGENTS.md file is particularly large - in the repo OR the user's global scope.
- **Tool economy**: did the agent make expensive tool calls that could be streamlined? Is there any custom tooling (CLI's, MCP's) that is particularly token-inefficient? _Use when_ the agent made an expensive tool call.
- **No-ops**: look for instructions in steering files that don't modify the agent's behavior. _Use when_ the steering files are large and unwieldy.
- **Information access**: look for opportunities to increase the agent's access to information. Teeing runtime logs, readonly access to third-party services. _Use when_ a crucial piece of information was not available to the agent.

5. Present these candidates to the user, numbered, in order of severity, in plain words: no file paths, no code names. Each candidate names the event in the session that prompted it; drop any candidate you cannot tie to one. Tag each fix with its **kind**: tool, check, structure, or rule. A rule names the number the next run's ticket table will show if it worked. When the ledger already holds a rule for the same problem, propose a tool, a check or a structure change, or drop the candidate. A candidate matches a ledger row when it names the same problem, whatever the fix. Each candidate takes four lines:

   ```
   **N. <title>**: new | seen 3 times (10-14, 10-16, 10-19), last decision: skip | fixed in <commit>, came back: <why it did not hold>
   - Happened: <session, ticket, minutes or dollars lost>
   - Fix (<kind>): <one sentence>
   - Touches: <what applying it changes>
   ```

   List every smaller finding after them as one numbered line. End with: "Answer each number with fix, skip, or explain." Re-tell a number answered with explain in plainer words and ask it again. Done when every number has fix or skip, or the user has stopped answering.

6. Apply the numbers the user picked. Start one general-purpose agent on opus; its prompt holds each picked candidate's fix, what it touches and the user's words on it, and it changes files and commits nothing. A fix to a skill is made in `C:\F\FSkills\skills\<name>`, the source of the installed copy. Review its diff against the picks, correct what strays, then commit by the project's rules. In the same turn, for each skill fix, in `C:\F\FSkills`: a tracked skill goes through the Refresh section of `.claude/skills/skill-forge/NOTE.md` (every hunk noted, diff and note shown, the user's yes, the commit); an own skill has no note, so show its diff, wait for the yes and commit `adapt <name>`. Install each after its commit, per the ground rule **Installed stays current** in `.claude/skills/skill-forge/SKILL.md`. When no fix touched a skill, say so. Then list each number with done, skipped, or not done and why. Done when every picked number is committed or has its reason.

7. Record the retro in the ledger: one row per candidate, the decision in the user's words, the commit of each applied fix. An applied row's fate is `new`; a skipped row's is `open` and an unanswered row's `undecided`: both come back at the next retro. Fill the fate of each earlier row this retro confirmed or contradicted. Commit the ledger. End with **You must do:**, one line per action only the user can take (a setting, a credential, the machine), with the exact text to paste; its row stays `open` until the user confirms it done.

## Reference

### The ledger

`docs/retro-ledger.md` holds one table with one row per candidate of every retro. New rows follow the ledger's own header; a new ledger starts with:

```
| retro | date | # | finding | decision | commit | fate |
|---|---|---|---|---|---|---|
```

- **retro**: the first 8 characters of the reviewed session's id.
- **finding**: a few plain words, then the fix's kind in brackets.
- **decision**: the user's words.
- **fate**: `new` (applied at the last retro, not yet tested by a run); `held` (applied, not seen again); `recurred: <retro>` (applied, came back); `open` (skipped); `undecided` (no answer); `skip-recurred: <retro>` (skipped, came back); `skip-quiet` (skipped, not seen at a later retro); `reverted`, `superseded` or `moot: <commit>` (applied, then undone or made pointless); `lost` (applied, then gone with no decision).

Rows are only appended; a later retro changes only the fate of an earlier row.

### Files

You have access to several files in the repo:

- `CLAUDE.md`/`AGENTS.md`: these files are pushed to the context window of any agent working in this repo. They should be used incredibly sparingly, usually only for **navigation pointers** to other files.
- Docs: use docs as references files, pointed to by other files. Look for existing docs before writing new ones.
- Skills: use skills for docs (since their description goes into the agent's context window), or for user-invoked commands. Follow the advice in the `writing-for-agents` skill.
