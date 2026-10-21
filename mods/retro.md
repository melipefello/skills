# retro

Upstream: mattpocock/skills:skills/engineering/retro (pin in manifest.json)

## Any agent session, not only coding
- Original: the description and intro frame the retro around a coding session and the coding agent.
- Mine: the description says agent sessions; the intro says the agent.
- Why: sessions are often not about code, and the retro applies to them too.

## Scope chosen by the user, Claude Code log path given
- Original: reads the one session the user names, searching session logs on this machine; defaults to the current session.
- Mine: the user can name a scope (one session by id or transcript path, a project's sessions, a time window on a project or globally); the front matter carries an argument hint. The step names where Claude Code keeps session logs and how the folder slug is built, and sends subagents to read more than a few sessions. Still defaults to the current session.
- Why: retros over a project or a period are wanted, not only single sessions. Naming the path saves a disk search on every run; many sessions do not fit one context window. A session id lets the retro run in a fresh session: in the run session every later turn re-read 150-330K tokens, $8-23 per batch (FGame retro of 2026-10-21).

## Sessions start from their numbers
- Original: the agent reads the session logs as it sees fit.
- Mine: each session starts from `scripts/digest.py` (prompts, tool counts, errors, largest results, subagents); a `/run-tickets` session also from the run-tickets skill's `ticket_stats.py` table. Subagents read the transcripts of the tickets the table shows as outliers.
- Why: seven FGame retros re-derived the same numbers with 32 reader subagents and throwaway parsers (about $25), and their tables showed each worker's last context, about 70 times below the tokens it processed.

## A ledger of every candidate
- Original: each retro starts from zero.
- Mine: step 2 reads the project's `docs/retro-ledger.md` (created from the template under Reference when missing); a candidate seen before says so in its first line, and an applied fix that came back names its commit. Step 7 appends one row per candidate with the user's decision and the commit, and fills the fate of earlier rows; skipped and unanswered rows stay open and come back.
- Why: in 21 FGame retros the missing guardrail was proposed six times before it was built, a skipped dialog stall came back and cost a run five minutes, three just-skipped candidates were offered again, and one retro's findings vanished for want of an answer.

## A run is judged after the last fixes ran
- Original: any session can be reviewed at any time.
- Mine: when the scope is a ticket run and the newest retro's applied fixes have run in no ticket batch since their commit, the retro says so and stops.
- Why: two FGame retros on the same run, six minutes apart, reversed each other within 93 minutes.

## Fix kinds; a repeated rule becomes a tool or a check
- Original: no kind of fix is preferred.
- Mine: each fix is tagged tool, check, structure or rule; a rule names the number the next run's ticket table will show if it worked; when the ledger holds a rule for the same problem, the candidate becomes a tool, a check or a structure change, or is dropped.
- Why: in FGame the fixes that held were tools, checks, measurements and structure; the sentences churned (the test policy rewritten seven times in four days, the read rule four forms in eight retros, the heredoc rule re-found nine times).

## Four plain-words lines per candidate
- Original: the candidates are presented with no shape.
- Mine: numbered, no file paths or code names, four lines each (seen before, what happened, the fix and its kind, what it touches); every smaller finding as one numbered line; the list ends with "Answer each number with fix, skip, or explain", and an explain gets a plainer re-telling.
- Why: six clarification rounds in 21 FGame retros ("reexplain, no jargon, zoom out", "What's the 7min one?"), and "ask if you want them" tails that were then applied unseen.

## Picked fixes applied by one worker, then committed here
- Original: the skill ends at the presentation.
- Mine: step 6 hands the picked numbers to one general-purpose agent on opus that commits nothing; the session reviews its diff, commits, and lists each number as done, skipped or not done and why.
- Why: applying in the long run session cost more than the retro itself, and one apply turn left the core finding undone without saying so.

## Skill fixes made in FSkills in the same turn
- Original: no word on where a fix to a skill goes.
- Mine: step 6 makes a skill fix in `C:\F\FSkills\skills\<name>`; in the same turn as the project commit, a tracked skill goes through skill-forge's note Refresh (every hunk noted, the user's yes, the commit) and an own skill through its diff, the yes and an `adapt` commit; each is installed after its commit; it says when no fix touched a skill.
- Why: "propagate to FSkills" was worked out by hand four times (about ten calls each, edits made in the installed copy and copied back), once with nothing to propagate and no word saying so. Routing through skill-forge's rules keeps the review before each FSkills commit and the install after it, which the first form of this step skipped.

## A closing "You must do" list
- Original: nothing tracks an action only the user can take.
- Mine: the retro ends with "You must do:", one line per action with the exact text to paste; its ledger row stays open until the user confirms it.
- Why: the FGame permission rule for deletions was proposed on 10-15 and never added; seventeen classifier denials followed.

## Coding standards category and its reference removed
- Original: a Coding standards category adds or clarifies rules for the reviewer agent, sends mechanical violations to deterministic checks and judgement calls to `CODING_STANDARDS.md`. The reference explains why review, not implementation, enforces standards, and describes `CODING_STANDARDS.md`. The AGENTS.md category offers coding standards as a destination.
- Mine: the category, the Implementation vs Review section and the `CODING_STANDARDS.md` bullet are removed; the AGENTS.md category only offers automated checks.
- Why: no reviewer agent reads `CODING_STANDARDS.md`, and the category ties the skill to code. Moves away from the tested original: the rule that mechanical violations become checks is lost; the Automated checks category still finds missing checks.

## Every candidate tied to a session event
- Original: presents the candidates in order of severity.
- Mine: each candidate names the event in the session that prompted it; a candidate with none is dropped.
- Why: upstream docs name invented generic advice, written to fill the categories, as the skill's sharpest critique, and tell users to discard untraceable candidates. The skill text did not enforce it.

## Neutral log example
- Original: the Information access category gives teeing dev server logs as an example.
- Mine: teeing runtime logs.
- Why: a dev server is a web-dev notion; runtime logs covers game, editor and server logs alike.

## Codex metadata removed
- Original: ships `agents/openai.yaml` for OpenAI Codex.
- Mine: removed.
- Why: only Claude Code is used. Moves away from the tested original: Codex loses the skill's metadata.
