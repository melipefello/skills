"""List the open Claude Code sessions of one project folder, for the hub skill.

Claude Code keeps one file per running session in ~/.claude/sessions/<pid>.json (its id,
folder, name, busy or idle) and the transcript in ~/.claude/projects/<folder>/<id>.jsonl,
where <folder> is the project path with every other character than a letter or digit
turned into a dash. A session counts as open while its process runs with the start time
the file records, so a file left by a crashed session is skipped.

For each open session whose folder is the project folder or inside it, prints:
  <name> (<busy|idle>, last active <N> min ago[, this session])
    first prompt: <the session's first prompt>
    last prompt:  <its latest prompt>
    last reply:   <the end of its latest reply>        (idle sessions only)
The name is the one given with /rename when there is one. A slash command shows as
`/name args`. Long text is cut: the first prompt and last prompt to their first line,
the last reply to its last REPLY_CHARS characters.

Usage: python -I sessions.py [<project folder>]      (default: the current folder)
Never fails: a session it cannot read prints with what it has.
"""
import ctypes, json, os, re, sys, time
from ctypes import wintypes

REPLY_CHARS = 600
PROMPT_CHARS = 160
COMMAND = re.compile(r'<command-name>(.*?)</command-name>', re.S)
ARGS = re.compile(r'<command-args>(.*?)</command-args>', re.S)


def running(pid, proc_start):
    """True when process `pid` runs and started at `proc_start` (a FILETIME, as a string)."""
    k = ctypes.WinDLL('kernel32', use_last_error=True)
    k.OpenProcess.restype = wintypes.HANDLE
    handle = k.OpenProcess(0x1000, False, pid)  # PROCESS_QUERY_LIMITED_INFORMATION
    if not handle:
        return False
    try:
        code = wintypes.DWORD()
        if not k.GetExitCodeProcess(handle, ctypes.byref(code)) or code.value != 259:  # STILL_ACTIVE
            return False
        if not proc_start:
            return True
        times = [wintypes.FILETIME() for _ in range(4)]
        if not k.GetProcessTimes(handle, *map(ctypes.byref, times)):
            return True
        return str((times[0].dwHighDateTime << 32) | times[0].dwLowDateTime) == str(proc_start)
    finally:
        k.CloseHandle(handle)


def inside(folder, root):
    folder, root = os.path.normcase(os.path.abspath(folder)), os.path.normcase(os.path.abspath(root))
    return folder == root or folder.startswith(root.rstrip(os.sep) + os.sep)


def prompt_text(content):
    """A user record's prompt as typed, or None for tool results and system text."""
    if isinstance(content, list):
        texts = [c.get('text', '') for c in content if isinstance(c, dict) and c.get('type') == 'text']
        if len(texts) != len(content):
            return None
        content = '\n'.join(texts)
    if not isinstance(content, str):
        return None
    m = COMMAND.search(content)
    if m:
        args = ARGS.search(content)
        return (m.group(1) + ' ' + (args.group(1) if args else '')).strip()
    if content.lstrip().startswith('<'):
        return None
    return content.strip() or None


def first_line(text):
    line = text.strip().splitlines()[0] if text.strip() else ''
    return line[:PROMPT_CHARS] + (' ...' if len(line) > PROMPT_CHARS or '\n' in text.strip() else '')


def transcript(cwd, session_id):
    """(title, first prompt, last prompt, last reply) from the session's transcript."""
    path = os.path.join(os.path.expanduser('~'), '.claude', 'projects',
                        re.sub(r'[^A-Za-z0-9]', '-', cwd), session_id + '.jsonl')
    title = first = last = reply = None
    try:
        with open(path, encoding='utf-8') as f:
            for line in f:
                try:
                    d = json.loads(line)
                except ValueError:
                    continue
                kind = d.get('type')
                if kind == 'custom-title':
                    title = d.get('customTitle') or title
                elif d.get('isSidechain') or d.get('isMeta'):
                    continue
                elif kind == 'user':
                    text = prompt_text((d.get('message') or {}).get('content'))
                    if text:
                        first = first or text
                        last = text
                elif kind == 'assistant':
                    content = (d.get('message') or {}).get('content')
                    texts = [c.get('text', '') for c in content or [] if isinstance(c, dict) and c.get('type') == 'text']
                    if any(t.strip() for t in texts):
                        reply = '\n'.join(texts).strip()
    except OSError:
        pass
    return title, first, last, reply


def sessions(root):
    folder = os.path.join(os.path.expanduser('~'), '.claude', 'sessions')
    found = []
    for name in os.listdir(folder):
        if not name.endswith('.json'):
            continue
        try:
            with open(os.path.join(folder, name), encoding='utf-8') as f:
                s = json.load(f)
        except (OSError, ValueError):
            continue
        if s.get('cwd') and inside(s['cwd'], root) and running(int(s.get('pid', 0)), s.get('procStart')):
            found.append(s)
    return sorted(found, key=lambda s: s.get('startedAt', 0))


def main():
    if '--help' in sys.argv:
        print(__doc__)
        return
    root = sys.argv[1] if len(sys.argv) > 1 else os.getcwd()
    me = os.environ.get('CLAUDE_CODE_SESSION_ID')
    out = []
    for s in sessions(root):
        title, first, last, reply = transcript(s['cwd'], s.get('sessionId', ''))
        status = s.get('status', 'unknown')
        ago = int((time.time() * 1000 - s.get('updatedAt', 0)) / 60000)
        tags = [status, f'last active {ago} min ago'] + (['this session'] if s.get('sessionId') == me else [])
        out.append(f"{title or s.get('name', s.get('sessionId', '?')[:8])} ({', '.join(tags)})")
        if first:
            out.append('  first prompt: ' + first_line(first))
        if last and last != first:
            out.append('  last prompt:  ' + first_line(last))
        if reply and status != 'busy':
            tail = reply[-REPLY_CHARS:]
            out.append('  last reply:   ' + ('... ' if len(reply) > REPLY_CHARS else '') + ' '.join(tail.split()))
    print('\n'.join(out) or f'(no open session in {root})')


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f'(sessions.py failed: {e})')
    sys.exit(0)
