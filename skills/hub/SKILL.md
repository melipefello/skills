---
name: hub
description: Say what waits for the user in this project, in which session, and what to type next, from the status file, git and the open sessions.
disable-model-invocation: true
---

The hub is the project's **advisor**: one session per project, renamed `hub`, where the user asks "what's next". It reads the project and its open sessions, then says what waits, in which session, and what to type. The user types every command: this session reads and replies, and every edit, build and commit happens in the session the reply names. The project is the folder this session runs in. Its state lives in files and transcripts, so a fresh hub each day loses nothing.

Read again before every reply in this session: the other sessions move between replies.

## Read

1. **Status.** Read each `.scratch/<feature>/status.md` (layout in the run-tickets skill, section Status file). Run `python -I ~/.claude/skills/run-tickets/scripts/status_banner.py --text .` for what the files count: new feedback, briefs, decisions, tickets with no report. A status file with no Now or no Order of work section: Next names writing them in the talk session.
2. **Order of work.** Check each row's evidence against the repos as they are now. Next is the first row whose evidence is missing and whose blockers are done, plus each row marked *parallel* in the same state. Factory work comes only from rows of this order. Done when every row is known done or not done.
3. **Git.** `git status -sb` and `git log --oneline -5`. Uncommitted files belong to the busy session that is making them. A step that commits waits until the tree is clean, so it does not commit another session's work.
4. **Sessions.** Run `python -I ~/.claude/skills/hub/scripts/sessions.py`: each open session in this folder, busy or idle, its first and last prompt, and an idle session's last reply. Give each session its role:
   - **build**: `/run-tickets`, or work that builds or runs the project's editor.
   - **talk**: `/grill-me`, `/to-spec`, `/to-tickets`, `/triage`, `/retro`, or a conversation.
   - **hub**: this session.

   For each idle session, say from its last reply what it waits for: an answer, a yes, a playtest, or nothing.

## Session limit

Three sessions at most: the hub, one build, one talk. Before a step goes to a new session, check its role: an idle session of that role takes it; a busy one makes it wait ("after `<session>` finishes"); with none open, it goes to a new session of that role. A step for another repo goes to a session in that repo's folder.

## Reply

At most 10 lines, in three sections, in this order. A section with nothing in it is one line: its label and "nothing".

- **Waiting for you**: each idle session that waits on the user, by name, with what to answer; each line under Waits for you in the status file (a batch to play, a stopped run).
- **Running**: each busy session, by name, with what it runs and how long since it was last active.
- **Next**: the next steps from the order of work and the banner, each with the text to type in a code span and its session: one by name, or a new build or talk session.

Give each ticket, story and roadmap number a few words of what it is: "tickets 131 to 138, the run loop".
