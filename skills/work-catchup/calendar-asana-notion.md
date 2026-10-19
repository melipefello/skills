# Calendar, Asana, Notion, Gemini notes

Step 5 of `work-catchup`. Run these four in parallel — they share no data. The guardrails in `SKILL.md` hold here too: read-only, and sensitive HR/legal/personnel material never enters the file. Every ID below comes from `config.md` in the recap folder.

**Which Google account is which — verified, do not re-derive:**

| Connector | Account | Consequence |
|---|---|---|
| Google **Drive** | work | Work docs readable. This is the useful one. |
| Google **Calendar** | personal, with the work calendar shared in as `reader` | Pass `calendarId` explicitly — see below |
| **Gmail** | personal | Cannot see work mail at all. Leave it out of work searches. |

## Calendar — and the Gemini-notes trick

Load: `ToolSearch("select:mcp__claude_ai_Google_Calendar__list_events,mcp__claude_ai_Google_Calendar__list_calendars")`

⚠️ **The default calendar is the wrong one.** With no `calendarId` you get the *personal* calendar — a few personal events and nothing about work. The work calendar is a separate entry with `reader` access, its ID is the work email in config:

```
list_events  calendarId: "<work calendar ID>"
             startTime / endTime: ISO 8601 with offset, e.g. "2026-07-27T00:00:00+01:00"
             orderBy: "startTime"   pageSize: 50   timeZone: "<timezone from the Slack profile>"
```

Run `list_calendars` first if that ID ever stops resolving.

**Gemini meeting notes are found here, not in Drive.** Any meeting recorded with Gemini gets the doc attached back onto the calendar event:

```json
"attachments": [{ "fileUrl": "https://docs.google.com/document/d/<DOC_ID>/edit...", "title": "Notes by Gemini" }]
```

So scan every event in the window for an `attachments` array — that is the complete list of meeting recaps, with no Drive access needed to *find* them.

What the events themselves give, even without notes:
- Meetings you **declined or missed** that others attended — those are the recaps to chase.
- `responseStatus: "needsAction"` on your own entry — an unanswered invite.
- Ad-hoc / "Instant meeting" entries created inside the window — a sign something blew up that day.
- Attendee lists: who was pulled into what. HR or leadership on an invite is signal.
- One-to-ones that moved, and recurring meetings that were cancelled.

## Reading the Gemini docs — and why half of them fail

Load: `ToolSearch("select:mcp__claude_ai_Google_Drive__read_file_content,mcp__claude_ai_Google_Drive__search_files,mcp__claude_ai_Google_Drive__list_recent_files")`

Use `read_file_content` with the doc ID from the calendar `fileUrl`. `WebFetch` on a `docs.google.com` URL returns 403.

⚠️ **A calendar attachment does not mean you can open the doc.** Gemini notes are owned by the meeting *organiser* and shared only as far as the organiser's settings reach. In a real run, 2 of 3 attachments returned `Requested entity was not found` — meetings you attended, notes generated, never shared with you.

So: **discover via Calendar, confirm via Drive search.**

```
search_files  query: "title contains 'Notes by Gemini' and modifiedTime > '<START>T00:00:00Z'"
```

Anything the calendar advertises that this search does not return is a doc you cannot read. Report it as *"notes exist but were never shared — ask &lt;organiser&gt;"*, naming the organiser from the calendar event. That is a useful finding, not a failure.

One more call, for documents that never touched a meeting:

```
search_files  query: "modifiedTime > '<START>T00:00:00Z' and mimeType = 'application/vnd.google-apps.document'"
```

Drive search **will** surface performance plans, termination rationales, salary and career documents — apply the sensitive-content guardrail from `SKILL.md`.

## Notion — the hubs

The Notion connector is already authenticated. Config lists the hubs, one name and page ID each.

`notion-fetch` on each ID returns the hub and its child pages. The hubs change rarely — **the signal is what changed underneath them**, so follow with a scoped search per hub:

```
notion-search  query: "<what you are working on>"   page_url: "<hub id>"
               filters: { created_date_range: { start_date: "<START>" } }
```

A hub carries backlog, changelog, design and tech pages. A new child page under Tech, or a changed backlog, is the kind of thing that never gets a Slack message.

## Asana — the tracked boards

There is **no Asana MCP connector** in this workspace, and `WebFetch` on an `app.asana.com` URL returns **403**. Check once whether one now exists (`ToolSearch("+asana")`); if so, use it and skip the REST path.

⚠️ Adding Asana as a claude.ai custom connector needs the workspace admin — a dead end for a non-admin. Leave it out of the report.

**Read the token with PowerShell, not Bash.** The token is a Windows *user-scope* environment variable set with `setx`. The Bash tool inherits the environment of the running Claude Code process, so `$ASANA_ACCESS_TOKEN` is **empty in Bash** until Claude Code restarts. PowerShell reads it from the registry and works immediately:

```powershell
$t = [Environment]::GetEnvironmentVariable('ASANA_ACCESS_TOKEN','User')
$h = @{ Authorization = "Bearer $t" }
```

Keep `$t` inside the PowerShell variable: never echoed, never on a command line, never written to a file — settings files may be tracked in a public repo.

If the variable is unset, **skip Asana, do not block**, and put one line in the report pointing at `https://app.asana.com/0/my-apps` — per-user, no admin needed, for either a token or an OAuth app.

Workspace and board GIDs come from config.

`modified_since` is the catch-up filter and does the whole job. Loop all boards in one PowerShell call:

```powershell
$since  = '<START>T00:00:00Z'   # 23:00Z the previous day during summer time
$fields = 'name,completed,assignee.name,due_on,modified_at,permalink_url,memberships.section.name'
Invoke-RestMethod -Headers $h -Uri `
  "https://app.asana.com/api/1.0/tasks?project=$gid&modified_since=$since&limit=100&opt_fields=$fields"
```

Then, for each task that matters, its comments:

```powershell
Invoke-RestMethod -Headers $h -Uri `
  "https://app.asana.com/api/1.0/tasks/$taskGid/stories?opt_fields=text,created_at,created_by.name,type"
```

Filter `type == "comment"` — the rest is move/assign noise. Fetch stories only for tasks assigned to you, tasks that went overdue, or tasks whose Slack thread you already found.

⚠️ **`modified_since` on a project misses subtasks, and the real deadlines live there.** The "Version release" task on each board has ~8 subtasks (Feature Freeze, Merge, Create Production build, Submission, rollout steps), most of them yours, each with its own due date — and they appear in **no board column**. A run that skipped them missed four tasks due the next day. So for every open `Version release` / `Version Release` tree, `GET /tasks/<gid>/subtasks` explicitly. Watch for several parallel trees (6.19/6.20/6.21) with near-identical subtask names — **stale dates from old trees are what surface as overdue.**

⚠️ **Re-verifying a specific carried task (Step 6): `GET /tasks/<gid>` directly.** A `modified_since` listing cannot tell you its state — a task can be modified inside the window without being completed, and vice versa.

⚠️ **"Resolved" is not proof of a fix.** An Asana automation converts *any* completion state to "Resolved", including "Will not do", so a task can read `completed: true` because someone decided **not** to do it. Read the story trail, and check `stories` for a **comment** explaining the change — closures with zero comments are common here and mean nothing was verified.

Report, in this order:
1. **Assigned to you** and not completed — the point of the whole section. Cross-check against Slack: tasks get assigned to you with no message at all, and reassigned by DM without an @-mention.
2. **Due within the next 3 days, including subtasks** — the thing you are most likely to be blindsided by.
3. **Overdue** — `due_on` before today, `completed: false`. Filter out obvious dead test tasks, but say once that they exist.
4. Completed inside the window — one grouped line, not a list of every ticket.
5. Tasks that moved section (`memberships.section.name`) — into "Blocked", "On Hold", "In Review".

Also worth one line: whether any *human comment* was written on the boards at all. A window where every entry is a system event means decisions were made by dragging cards, with no recorded reasoning.

Use `permalink_url` verbatim for links.

## Data warehouse — deliberately not wired in

Warehouse connectors (Datawhisper) can query the data, but they are an **async job** API (submit → poll → fetch artifact), too slow for a catch-up, and the KPI bot already posts the KPI and AB digests into Slack. Read the digests instead. The warehouse is a follow-up tool for one specific numeric question the digest cannot answer — e.g. "is the payer-rate drop real or an event artefact?"
