"""Claude Code SessionStart hook: a short banner of what the factory waits on, per feature.

A feature takes part once `.scratch/<feature>/status.md` exists (layout in the run-tickets
skill, section Status file). For each such feature the banner lists, when there are any:
  - new notes under `### Inbox` in feedback.md                  -> /triage
  - briefs.md beside it                                          -> /to-tickets
  - Open notes tagged [you]                                      -> /grill-me
  - ticket files in issues/ with no reports/NN.md                -> /run-tickets
  - each line under `## Waits for you` in status.md (a batch to play, a stopped run)
  - each Open note tagged [own session], cut to its first words
then the last line of the status file's Log. A feature where nothing waits prints nothing.

The banner goes to the user (systemMessage) and to Claude's context (additionalContext).
The project folder is the hook input's cwd, else $CLAUDE_PROJECT_DIR, else the current
folder; .scratch is looked for there and in its parents. Never fails: any error prints
nothing and exits 0.

Wire it in the user settings (~/.claude/settings.json), so every project gets it:
  "SessionStart": [{"matcher": "startup|resume|clear", "hooks": [{"type": "command",
    "command": "python", "args": ["-I", "-c", "import os,runpy; p=os.path.expanduser(
    '~/.claude/skills/run-tickets/scripts/status_banner.py'); os.path.exists(p) and
    runpy.run_path(p, run_name='__main__')"], "timeout": 10}]}]

Test: echo '{"cwd":"C:/path/to/project"}' | python -I status_banner.py
      python -I status_banner.py --text C:/path/to/project   (the banner as plain text)
"""
import json, os, re, sys

TOPIC_WORDS = 8          # words kept of an [own session] note
INBOX_HEADER = re.compile(r'^- \(\d{4}-\d\d-\d\d \d\d:\d\d, session [^)]*\)\s*$')
TICKET = re.compile(r'^(\d+)-.*\.md$')


def read(path):
    try:
        with open(path, encoding='utf-8') as f:
            return f.read().splitlines()
    except OSError:
        return []


def section(lines, heading, level=2):
    """Lines under the first heading `heading`, up to the next heading of its level or above."""
    mark = '#' * level + ' '
    out, inside = [], False
    for line in lines:
        if re.match(r'^#{1,%d} ' % level, line):
            if inside:
                break
            inside = line.strip() == mark + heading
            continue
        if inside:
            out.append(line)
    return out


def bullets(lines):
    return [l[2:].strip() for l in lines if l.startswith('- ')]


def topic(note):
    """`[own session] <date>, <source>: <the note>` -> the note's first words."""
    text = note.split(']', 1)[-1].strip()
    text = text.split(': ', 1)[-1] if ': ' in text else text
    words = text.split()
    return ' '.join(words[:TOPIC_WORDS]) + (' ...' if len(words) > TOPIC_WORDS else '')


def waiting_tickets(folder):
    issues = os.path.join(folder, 'issues')
    reports = os.path.join(folder, 'reports')
    try:
        names = os.listdir(issues)
    except OSError:
        return []
    numbers = sorted({m.group(1) for m in map(TICKET.match, names) if m}, key=int)
    return [n for n in numbers if not os.path.exists(os.path.join(reports, n + '.md'))]


def feature_banner(folder):
    feedback = read(os.path.join(folder, 'feedback.md'))
    status = read(os.path.join(folder, 'status.md'))
    open_notes = bullets(section(feedback, 'Open'))
    inbox = [b for b in bullets(section(section(feedback, 'Open'), 'Inbox', 3))
             if not INBOX_HEADER.match('- ' + b)]
    decisions = [b for b in open_notes if b.startswith('[you]')]
    topics = [topic(b) for b in open_notes if b.startswith('[own session]')]
    tickets = waiting_tickets(folder)

    items = []
    if inbox:
        items.append(f'{len(inbox)} new feedback notes: /triage')
    if os.path.exists(os.path.join(folder, 'briefs.md')):
        items.append('briefs wait for tickets: /to-tickets')
    if decisions:
        items.append(f'{len(decisions)} decisions wait: /grill-me')
    if tickets:
        span = tickets[0] if len(tickets) == 1 else f'{tickets[0]}-{tickets[-1]}'
        items.append(f'{len(tickets)} tickets wait: /run-tickets {span}')
    items += bullets(section(status, 'Waits for you'))
    if topics:
        items.append('for a session of their own: ' + '; '.join(topics))
    if not items:
        return None
    log = bullets(section(status, 'Log'))
    if log:
        items.append('last step: ' + log[-1])
    name = os.path.basename(folder)
    return '\n'.join([f'Factory, {name}:'] + ['- ' + i for i in items])


def scratch_of(start):
    path = os.path.abspath(start)
    while True:
        if os.path.isdir(os.path.join(path, '.scratch')):
            return os.path.join(path, '.scratch')
        parent = os.path.dirname(path)
        if parent == path:
            return None
        path = parent


def banner(start):
    scratch = scratch_of(start)
    if not scratch:
        return None
    parts = []
    for name in sorted(os.listdir(scratch)):
        folder = os.path.join(scratch, name)
        if os.path.isfile(os.path.join(folder, 'status.md')):
            part = feature_banner(folder)
            if part:
                parts.append(part)
    return '\n'.join(parts) or None


def main():
    if '--help' in sys.argv:
        print(__doc__)
        return
    if '--text' in sys.argv:
        rest = sys.argv[sys.argv.index('--text') + 1:]
        print(banner(rest[0] if rest else os.getcwd()) or '(nothing waits)')
        return
    try:
        data = json.load(sys.stdin)
    except Exception:
        data = {}
    start = data.get('cwd') or os.environ.get('CLAUDE_PROJECT_DIR') or os.getcwd()
    text = banner(start)
    if text:
        print(json.dumps({
            'systemMessage': text,
            'hookSpecificOutput': {
                'hookEventName': 'SessionStart',
                'additionalContext': 'Factory status, shown to the user at session start:\n' + text,
            },
        }))


if __name__ == '__main__':
    try:
        main()
    except Exception:
        pass
    sys.exit(0)
