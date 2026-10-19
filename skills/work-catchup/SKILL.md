---
name: work-catchup
description: Catch up after time away — sweeps Slack, Calendar, Asana, Notion, meeting notes and past Claude Code sessions, re-verifies every item carried over from the last recap, then writes a short action-first brief with permalinks. Use when the user says "catchup" or asks what they missed — from any project.
---

# Work Catch-up

A **brief** of what you missed since a date: what you must do, then what happened. One line per item, actions first, real permalinks. Gather deeply, write briefly.

Slack is the main source. Calendar, Asana, Notion and Gemini notes cover what Slack cannot see — a decision made in a meeting, a ticket moved with no ping.

**Read `~/Documents/slack-recaps/config.md` first.** It holds every ID, path and account this skill needs: output folder, Slack host, work email and calendar ID, Notion hubs, Asana workspace and boards, GitHub work account and org, channel hints per area, KPI bot channels. When it is missing, ask for the values and create it from [`config-template.md`](config-template.md). "The recap folder" below means the output folder it names.

## Guardrails (hold in every step)

- **Read-only everywhere.** Read, search and fetch only — in Slack, Calendar, Asana and Notion alike. Sending, replying, reacting, scheduling and editing are out of scope.
- **Sensitive content stays out of the file.** Slack DMs and Drive both surface HR, legal, personnel, compensation and personal-health material. Write at most that it exists and needs you, in neutral words (*"an HR document shared with you on 20 Jul is still unanswered"*) — no name in a title, no quote, no summary of the argument. Details belong in chat, which is not committed anywhere.
- **Asking you.** Questions go through `AskUserQuestion`. When `ToolSearch("select:AskUserQuestion")` finds nothing, ask the same questions as a short numbered list in chat and **end the turn** — wait for your answer, then continue. Say which default you would take if you just say "go".

## Owner test — what earns a place in "Do this"

Every candidate action gets an **owner** before it may enter "Do this". It is **yours** only when one of these holds:
- **Asked** — addressed to you by name, @-mention, or DM, and waiting on you.
- **Assigned** — yours in Asana, or a GitHub review request to you.
- **Committed** — your own words: a message, a self-DM, a Gemini next step with your name in brackets, a Claude-session prompt.

Everything else has another owner — someone else's task, an optional invite, an FYI, "worth a look" — and goes in its area section as one line, or nowhere. A thread stuck on a call only a tech director can make, with nobody asking you, is **unclear**: it goes to Step 8 triage, not straight into the list. So does any item whose owner you cannot name.

A vacation recap once listed others' travel, another lead's season setup and a staffing choice as your actions; the feedback was *"a lot of things that are not my responsibility, optional stuff."*

Read `preferences.md` in the recap folder (if it exists) before applying the test — it holds your standing answers from earlier triage ("Rollouts <person> runs → FYI only"), and they override the rules above.

**Subagents return owners, not actions.** When an area is handed to a subagent, ask for items as `owner | what | evidence | link`, with owner = a person, or `me (asked/assigned/committed)` plus the evidence. A prompt asking for "actions for the user" makes the subagent find some; the owner test runs here, on the merged list.

## Step 1 — Find the previous recap

The recap folder, newest `slack-recap-*.md` by mtime. Two things come out of it:

1. **The real start date.** "Since the last recap" starts where that file's window ended. Filenames overlap (`07-29-to-07-30` and `07-29-to-08-02` both exist) — trust mtime and the file's own `Covered:` line over the filename.
2. **The carry-over list.** Every item from its *Action list*, *Still open from before*, *DMs* table and *Asana* section. This list is an **input to Step 6**, to be re-verified item by item.

⚠️ **An unverified carry-over is worse than an omission.** It burns your attention on finished work and buries the real items. On 2026-08-04 a re-verification of 49 carried items found **31 that should not have been listed** — and 8 were factually wrong, not merely stale: "you never got back to him for 11 days" had been answered one hour later; "never acknowledged" was acknowledged in 43 seconds; an "unanswered for 13 days" HR item was answered the next morning.

## Step 2 — Ask two questions, then go

One `AskUserQuestion` call with both questions. After it, work alone until the Step 8 triage.

**Q1 — "Start the recap from when?"** (single select, header `Since`)
- `Since the last recap` (Recommended) — picks up where the Step 1 file ended, no gap and no overlap
- `Last Monday` — start of the current work week
- `Last 7 days`
- `Yesterday`

**Q2 — "Which areas should I cover?"** (multiSelect, header `Areas`, all five preselected)
- `Project / game channels` — the games you work on, incl. channels you were just added to
- `Team & announcements` — team, leads, announcement, portfolio channels
- `DMs, pings & saved items` — DMs, group DMs, @-mentions, threads you were tagged in, your Slack **Later / saved** list, and your **notes-to-self DM**
- `Platform & tooling` — SDK/CI/Unity/AI channels + bot digests (AB tests, KPIs, builds)
- `Calendar, Asana, Notion & meeting notes` — work calendar, the Asana boards and Notion hubs from config, and Gemini notes from meetings in the window

Ask only what is missing: if the message already gave a date or areas, skip that question. "Just go" means `Last Monday` + all five areas.

## Step 3 — Set up

1. Load the Slack tools (they are deferred):
   `ToolSearch("select:mcp__claude_ai_Slack__slack_search_public_and_private,mcp__claude_ai_Slack__slack_read_channel,mcp__claude_ai_Slack__slack_read_thread,mcp__claude_ai_Slack__slack_search_channels,mcp__claude_ai_Slack__slack_read_user_profile")`
2. `slack_read_user_profile` with no args → your `user_id` and timezone. Read them, don't assume.
3. Convert the start date to a **Unix timestamp at 00:00 in that timezone** and reuse it as `after` / `oldest` everywhere. One PowerShell line, daylight saving included:
   ```powershell
   $tz = [TimeZoneInfo]::FindSystemTimeZoneById('<timezone>'); $d = [datetime]'<YYYY-MM-DD>'
   [DateTimeOffset]::new($d, $tz.GetUtcOffset($d)).ToUnixTimeSeconds()
   ```
4. State the real window in the final doc. If "since Monday" turns out to be a day and a half, say so rather than padding.

## Step 4 — Sweep Slack

**Discovery sweep first — this is the whole trick.** Searching channels by name misses active channels. Two `slack_search_public_and_private` sweeps with `only_my_channels: true`, `sort: "timestamp"`, `channel_types: "public_channel,private_channel"`:
- `query: "has:link"` — announcements, docs, dashboards, bot posts
- `query: "is:thread"` — live discussions

Page the returned cursor until results fall before the start date. Collect every `#channel` you see, resolve its ID with `slack_search_channels`, read it. Use keyword + modifier queries throughout: a natural-language query returns one or two results and hides the rest.

**DMs and pings:** `query: "to:me"`, `sort: "timestamp"`, `response_format: "concise"`, `include_context: false` — the detailed form exceeds the token limit and gets dumped to a file. Page the cursor past the start date. Expect Google Calendar / GitHub bot noise; skip it.

**Self-DM — your notes-to-self channel.** You DM yourself reminders and links ("Remind me to talk to <person> about X", an App Store link captioned "check tomorrow morning"). Read it every run: `slack_read_channel` with `channel_id: <your user_id>` — a user ID works as a DM channel ID. Read with **no `oldest`**, so the newest come first, then:
- inside the window → each is a self-assigned action or reference; actions go straight into "Do this"
- the ~3 weeks before → check for a follow-up in Slack/Asana before listing it; older than that is archive
- `~struck through~` means you retracted it yourself — skip it. Many self-DMs also appear in `is:saved`; dedupe, and the self-DM copy wins because it carries your own wording of the action.

**Saved / "Later" list:** `query: "is:saved"`, `sort: "timestamp"`, concise, no date filter. It is a **bookmark pile, not a to-do list** — 100+ entries reaching back a year, most of it dead (old release plans, year-old candidate reviews, stale CI changelogs). Saved *inside* the window → fold into its area section. Saved *before* the window → treat anything older than ~3 weeks as archive, and call one open only after reading the underlying thread to its last message. You bookmark your own *holding* messages ("I'll get back to you", "I'll do it tomorrow") and the real answer often lands in the same thread minutes later — one saved "you're not forgotten" was carried for 13 days while the full answer sat 55 minutes below it.

Optional pass if you bookmark with a reaction: `query: "hasmy::eyes:"` (or whichever emoji you used).

**Reminders:** Slackbot `/remind` is unreachable — the connector exposes no reminders tool, `USLACKBOT` returns `channel_not_found`, and `from:slackbot` returns nothing. Treat `is:saved` as the substitute, and state the gap once in the doc's scope line.

**Channels:** `slack_read_channel`, `oldest: <ts>`, `limit: 100`, `response_format: "concise"`. Empty output means genuinely quiet — record it; a list of silent channels is useful signal.

⚠️ **`oldest` paginates FORWARD.** With `oldest` set you get the *first* page after that timestamp and nothing later, so a conversation that continued looks like it ended. **Whenever the question is "was this ever answered?", read with no `oldest`.** This is how a "still waiting on you" DM survived three recaps — with `oldest`, it stopped at the question; without it, the answer two days later was right there.

**Threads:** every parent showing `Thread: N replies` inside the window gets a `slack_read_thread`, **read to the last reply** — the channel message is usually just the question, and the decision is in the final two or three.

**Permalinks:** concise mode returns no timestamps. So pick the messages worth linking, then re-read that channel **once** in detailed mode with a tight `oldest`/`latest` window and a small `limit` to harvest the `Message TS`.

```
https://<slack host>/archives/<CHANNEL_ID>/p<ts with the dot removed>
```
`1785233021.165869` → `.../p1785233021165869`. Channel-only link: `https://<slack host>/archives/<CHANNEL_ID>`.

**Bot channels** (KPI digests, CI, GitHub, Asana — the ones config lists): report the conclusion only — rollout %, which AB tests are red, which KPIs moved, builds green or broken.

## Step 5 — Calendar, Asana, Notion, Gemini notes

Only if that area was picked. Read [`calendar-asana-notion.md`](calendar-asana-notion.md): the account map, the `calendarId` that is not the default, how Gemini notes are found, the Asana REST path in PowerShell, and the Notion search per hub. Run this alongside Steps 4 and 6 — they share no data.

⚠️ Hand any subagent that file path **verbatim**, with the config path. A subagent that goes hunting for an "Asana tool", finds none and returns `UNKNOWN` has invented a gap — it happened twice in one run while a sibling agent read the same boards fine.

## Step 6 — Re-verify every carried-over item

Take the Step 1 carry-over list and check each item **before** it may enter the document. Group items into clusters (one per project, one for people/DM follow-ups, one for ops/platform) so several are checked at once.

Search each item from the date it was **first flagged** through now — not just the current window — and give it one verdict:

| Verdict | Means | Goes in the doc as |
|---|---|---|
| `RESOLVED` | Someone did it, decided it, shipped it, or answered it | one line in "Closed since last run", then **gone forever** |
| `PROGRESSED` | Moved but unfinished | the item, rewritten down to **only the residue** |
| `STILL_OPEN` | You actively looked and found nothing since | carry it, and say where you looked |
| `STALE_DROP` | Untouched for over a week, never important, or the deadline/context has passed | one line saying **drop it**, then gone |
| `UNKNOWN` | A source was unreachable | carry it, **naming the source** — never dressed up as still-open |

**Bias hard against `STILL_OPEN`.** Absence of a Slack message is weak evidence. All of these count as resolved: a reply from **you** (check your own messages, not just the other person's); a decision by **someone else** that settles it; a closed Asana task, a merged PR, a shipped build; a later message that **supersedes** it, or a passed deadline that makes it moot; an item that **was never yours** — several carried items turned out to be someone else's task or an FYI marked "no action needed".

**Where resolutions hide** — the reason single-channel searching fails:
- **In a DM instead of the thread** — a backend route was decided in a DM while the channel thread sat dead.
- **In a different channel** — a "tell me when it's done" was answered somewhere else entirely.
- **In a meeting** — vacation coverage was settled verbally in a daily and exists only in the Gemini notes.
- **In Asana, GitHub or Notion** — a deferred feature *was* scheduled, in Asana, with no Slack message at all.

**GitHub settles "is it actually done"** — cheap and definitive when Slack is ambiguous: does the PR exist (`gh pr list --head <branch> --state all`), how far has the branch diverged, is the workflow still failing, what does the Actions variable hold. Two items were decided this way that Slack could not answer: one branch had no PR ever opened and was 94 commits behind; one workflow's counter write had never once succeeded in four months.

⚠️ **`gh` may default to a personal account** that cannot see the work org — every call then returns *"Could not resolve to a Repository"*, and two subagents once reported that as GitHub being unreachable. Use the work account from config per command, in PowerShell: `$env:GH_TOKEN = (gh auth token -u <work account>)` before the `gh` calls. This leaves the active account untouched. Hand this line to any subagent that touches GitHub.

Then run one **adversarial recheck** over everything still marked `STILL_OPEN` or `UNKNOWN`: search differently, try other channels and people, and try to *prove it was resolved*. With no evidence it stays open — but this pass is what catches the false carry-overs.

Finally, **collect the corrections.** Where a previous recap was factually wrong (not just stale), that is its own short list — it explains why your priorities were skewed. Include errors inherited from the source: one recap faithfully repeated a contradictory maintenance date because the original Slack message converted the timezone wrongly. Do the arithmetic and state the real answer.

## Step 7 — Claude Code session history

Always run this; it is local and cheap, and it is the only source that sees a session that ended with work half-done and nothing written anywhere else.

Read the data file directly: `~\.claude\history.jsonl` — one JSON line per user prompt, fields `sessionId`, `project`, `timestamp` (Unix **milliseconds**, not seconds), `display` (the prompt text).

One PowerShell pass — sessions active inside the window, oldest prompt to newest per session:

```powershell
$startMs = <window start unix seconds> * 1000L
Get-Content "$env:USERPROFILE\.claude\history.jsonl" | ConvertFrom-Json |
  Where-Object { $_.timestamp -ge $startMs -and $_.sessionId } |
  Group-Object sessionId | ForEach-Object {
    $p = $_.Group | Sort-Object timestamp
    "=== $(Split-Path $p[0].project -Leaf) | $($_.Name) ==="
    $p | ForEach-Object { $_.display }
  }
```

Widen to ~1 week before the window when hunting carry-overs — a session that died mid-task last Thursday is exactly the kind of pending item you mean.

Findings (bias to omit — most sessions completed fine):
- a session whose **last prompt is a new instruction or question** — the session may have died before the work finished. Confirm before reporting: read the **tail** of `~\.claude\projects\<project-slug>\<sessionId>.jsonl` (transcripts are huge — last ~50 lines only). `history.jsonl` holds your prompts, never the outcome.
- prompts that are **self-instructions in future tense** — "tomorrow", "later", "remind me", "continue this", "don't forget". Same treatment as self-DM reminders: verify not-yet-done, then into "Do this".
- work started in a session that **never appears in Slack/Asana/GitHub afterwards** — cross-check it like any Step 6 item; a merged PR or a Slack post means it landed.

Report at most a couple of lines: *"pending from Claude sessions: <project> — <what was left hanging>"*. If the transcript is gone, say the session existed and what it was about, nothing more.

## Step 8 — Triage with you

All sources are in. Run the owner test over the merged list, then ask about what the test cannot settle — before a line of the document is written. Items that are plainly yours, with an obvious next step, need no question.

Ask about:
- every **unclear** item (no nameable owner, or a call nobody asked you for);
- every **decision** that is yours, where the thread offers real options — give the options from the thread, so your answer goes straight into the item ("<person> ships 1.6" rather than a "Recommended:" line you must overrule).

Per item, offer: `Mine — I'll do it` · `Delegate to <person>` · `Not mine — FYI only` · `Drop`, or the decision's own options. Add `I don't know` — on that answer, take the reasonable default and say which in the item. Keep it to **≤ 8 questions**, most important first; anything past that takes the default and is marked *(defaulted)* in the document.

Then save the answers that **generalise** — a class of item, not one item — to `preferences.md` in the recap folder, one dated line each in your words (`2026-10-19 · Rollouts <person> runs → FYI only`). Create the file if missing. One-off answers stay in this run.

**Done when** every "Do this" candidate has an owner and every decision has your answer or a marked default.

## Step 9 — Write the document

Write to **`<output folder from config>\slack-recap-<start>-to-<end>.md`** — an absolute path, never the current working directory; create the folder if it is missing. Recaps routinely contain personnel and legal content, and `<cwd>` is normally a git repo that may be published. The recap folder is not a repo, not synced and not published.

⚠️ **This is a five-minute brief, not an archive.** After a 446-line recap on 2026-08-04 the feedback was *"too verbose, hard to parse"*; what you want is *"a brief of what happened and what I need to do."* Hard target: **under ~120 lines total**, however busy the window was. Gathering and re-verification stay as deep as ever — the cut is only in the writing. The evidence stays in the session; you can ask follow-ups in chat.

Rules that keep it short:
- **One bullet per item**: what happened, what (if anything) you must do, link on the words. Anything past two sentences goes behind the link.
- Flat bullets only — no sub-heading per item, no hour-by-hour timeline, no quote unless the quote *is* the decision, no commentary about the recap itself.
- Not your game and no action for you → one line at most, usually nothing. Silent channels, clean checks and reusable background knowledge → skip. Absence of news is not content.

Structure, in this order:

1. **Window + gaps** — dates covered, which sources were unavailable and why, and the re-verification score in one line ("re-checked N carried items: X closed, Y dropped, Z factually wrong"). 3–5 lines total. A gap you do not know about is worse than a gap you do.
2. **Do this** — the action list, FIRST. Only items that passed the owner test or that you claimed in triage. Numbered, banded **Today / This week / Small**, one line each: verb first, naming the person and the decision needed, deadline in **bold**, link. Include the answer where the thread already contains it, so you can reply in one line. Say why an item is listed when it is not obvious ("two checkboxes" is a different action from "two days of work"). **Gemini notes end in a "Next steps" list with an owner in brackets — every item with your name lands here.** Those are commitments you made out loud and will not remember.
3. **What happened** — one short section per area you picked, biggest thing first, **max ~6 bullets each**. Asana is one table only: tasks assigned to you, due within 3 days (subtasks included), and overdue. DMs: only rows still waiting on someone. Meetings: only ones carrying information you missed. Notion: only what changed.
4. **Still open from before** — only what survived Step 6, rewritten down to the residue. A short list is the point; leave it short.
5. **Closed since last run** — at the bottom, one line per retired or dropped item: item, what settled it, date, link. This is what lets you trust the deletions without reading them. Corrections to a factually wrong previous recap get one line each here too.

**Cross-source findings are the real value** — an Asana task assigned with no Slack ping, a decision made in a meeting and never posted back, a confirmation sent to the wrong channel. Say them inside the one bullet the item gets. Same for flags (dates that look like typos, alerts with zero replies): one line where they belong.

## Step 10 — Report in chat

The file path, one line on the real window if it was shorter or longer than you expected, then **the five things that actually matter** and **who is waiting on you**. Under ~15 lines, with the document left in the file rather than pasted here.

**One line on the re-verification score** — how many carried items were closed or dropped, and how many were factually wrong. That number is the fastest way for you to see the list is trustworthy this time.

If a source was blocked, one line at the end with the one-step fix (`/mcp` for Drive, `ASANA_ACCESS_TOKEN` for Asana) — as a to-do, not an apology.
