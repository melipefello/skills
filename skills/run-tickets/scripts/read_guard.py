"""Claude Code PreToolUse hook: keeps subagents' reads of long files and diffs to a range.

Denies, for a call made inside a subagent (hook input carries agent_id):
  - a Read with no limit on a text file over 300 lines
  - a Read whose limit is over 150 lines
  - a Bash `sed -n 'a,bp'` (or 'a,+np') printing a span over 150 lines
  - a Bash `cat` of a text file over 300 lines
  - a Bash `git show <rev>` or `git diff <revs>` with no path filter (`-- <path>`) and no
    --stat, --name-only, --name-status, --shortstat or --numstat
A sed, cat or git command piped straight into `head -n N` / `head -N` (N <= 150) or into
grep passes: the pipe caps what it prints. The deny reason tells the agent what to do
instead; for a file under a `tool-results` folder (saved command output) it says to grep
the file. Calls in the main conversation, and any input this script cannot parse, pass
with no decision.

Wire it in a project's .claude/settings.json:
  "PreToolUse": [{"matcher": "Read|Bash", "hooks": [{"type": "command", "command": "python",
    "args": ["-I", "<path to this file>"]}]}]

Test: echo '{"agent_id":"a","tool_name":"Read","tool_input":{"file_path":"big.py"}}' | python -I read_guard.py
  echo '{"agent_id":"a","tool_name":"Bash","tool_input":{"command":"cat big.py"}}' | python -I read_guard.py
  echo '{"agent_id":"a","tool_name":"Bash","tool_input":{"command":"sed -n 1,400p big.py | head -150"}}' | python -I read_guard.py
  echo '{"agent_id":"a","tool_name":"Bash","tool_input":{"command":"git show HEAD~2"}}' | python -I read_guard.py
"""
import json, os, re, shlex, sys

MAX_WHOLE = 300   # lines a Read or a cat may take with no limit
MAX_RANGE = 150   # lines a ranged Read, a sed span or a capping head may take
REASON = 'grep -n the member, then read about 100 lines around it'
SAVED = ('it is saved command output: grep -n it for what you need, '
         'then read about 100 lines around each hit')
NOT_TEXT = ('.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.pdf', '.ipynb')
SED = re.compile(r"\bsed\s+(?:-[A-Za-z]+\s+)*-n\s*(?:-[A-Za-z]+\s+)*(['\"]?)([^'\"\s]+)\1")
SPAN = re.compile(r'(\d+)\s*,\s*(\+?)(\d+)\s*p')
SUMMARY = ('--stat', '--name-only', '--name-status', '--shortstat', '--numstat', '--no-patch', '-s')
GREPS = ('grep', 'egrep', 'fgrep', 'rg', 'wc')
BREAKS = (';', '&&', '||', '&', '(', ')')


def full_path(path, cwd):
    return path if os.path.isabs(path) else os.path.join(cwd or os.getcwd(), path)


def line_count(path, cwd):
    path = full_path(path, cwd)
    if path.lower().endswith(NOT_TEXT) or not os.path.isfile(path):
        return 0
    n = 0
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            n += chunk.count(b'\n')
    return n


def saved_output(path):
    return 'tool-results' in re.split(r'[\\/]', path)


def advice(paths):
    return SAVED if any(saved_output(p) for p in paths) else REASON


def as_int(v):
    try:
        return int(v)
    except (TypeError, ValueError):
        return None


def pipelines(command):
    """The command's pipelines, each a list of stages (word lists); heredoc bodies and
    numbered redirects (2>&1, 2>/dev/null) dropped, so a stage's ">" is its output."""
    lines, kept, i = command.split('\n'), [], 0
    while i < len(lines):
        kept.append(lines[i])
        m = re.search(r"<<-?\s*['\"]?(\w+)", lines[i])
        i += 1
        if m:
            while i < len(lines) and lines[i].strip() != m.group(1):
                i += 1
            i += 1
    text = re.sub(r'(?<![\w-])\d+>>?&?\s*[^\s;&|]+', ' ', ' ; '.join(kept))
    lexer = shlex.shlex(text, posix=True, punctuation_chars=True)
    lexer.whitespace_split = True
    result, stages, words = [], [], []
    for token in lexer:
        if token in ('|', '|&'):
            stages.append(words)
            words = []
        elif token in BREAKS:
            stages.append(words)
            result.append(stages)
            stages, words = [], []
        else:
            words.append(token)
    stages.append(words)
    result.append(stages)
    return [[s for s in p if s] for p in result if any(p)]


def cap(stage):
    """The lines a stage a command pipes into lets through: 0 for grep (it filters),
    N for head -n N, None for any other stage."""
    if not stage:
        return None
    name = os.path.basename(stage[0])
    if name in GREPS:
        return 0
    if name != 'head':
        return None
    n, args = 10, stage[1:]
    for k, w in enumerate(args):
        if w in ('-n', '--lines') and k + 1 < len(args):
            n = as_int(args[k + 1])
        elif re.fullmatch(r'-n?\d+', w):
            n = int(w.lstrip('-n'))
        elif w.startswith('--lines='):
            n = as_int(w.split('=', 1)[1])
    return n


def operands(words):
    return [w for w in words[1:] if not w.startswith('-') and w not in ('>', '>>', '<')]


def sed_denial(words, cwd, limit):
    script, files = None, []
    quiet = False
    args = words[1:]
    k = 0
    while k < len(args):
        w = args[k]
        if w in ('-e', '--expression') and k + 1 < len(args):
            script = (script or '') + ';' + args[k + 1]
            k += 1
        elif w in ('--quiet', '--silent') or (w.startswith('-') and not w.startswith('--') and 'n' in w[1:]):
            quiet = True
        elif w in ('>', '>>'):
            return None
        elif not w.startswith('-'):
            if script is None:
                script = w
            else:
                files.append(w)
        k += 1
    if not quiet or not script:
        return None
    for a, rel, b in SPAN.findall(script):
        span = int(b) + 1 if rel else int(b) - int(a) + 1
        if limit:
            span = min(span, limit)
        if span > MAX_RANGE:
            return 'sed prints %d lines (over %d): %s.' % (span, MAX_RANGE, advice(files))
    return None


def cat_denial(words, cwd, limit):
    if '>' in words or '>>' in words:
        return None
    for path in operands(words):
        n = line_count(path, cwd)
        if n > MAX_WHOLE:
            return ('cat prints the whole %d-line file (over %d): %s with Read (offset and limit), '
                    'which also lets you change it with Edit.' % (n, MAX_WHOLE, advice([path])))
    return None


def git_denial(words, cwd, limit):
    k = 1
    while k < len(words) and words[k].startswith('-'):
        k += 2 if words[k] in ('-C', '-c', '--git-dir', '--work-tree') else 1
    if k >= len(words) or words[k] not in ('show', 'diff'):
        return None
    verb, args = words[k], words[k + 1:]
    if '--' in args[:-1] or any(a.split('=')[0] in SUMMARY for a in args):
        return None
    revs = [a for a in args if not a.startswith('-')]
    if any(':' in a or os.path.exists(full_path(a, cwd)) for a in revs):
        return None
    if verb == 'diff' and not revs:
        return None
    rev = ' '.join(revs) or 'HEAD'
    return ('git %s with no path prints the whole diff: list the files with `git %s --stat %s`, '
            'then show one file at a time with `git %s %s -- <file>`.' % (verb, verb, rev, verb, rev))


def bash_denial(command, cwd):
    try:
        lines = pipelines(command)
    except ValueError:
        for m in SED.finditer(command):
            for a, rel, b in SPAN.findall(m.group(2)):
                span = int(b) + 1 if rel else int(b) - int(a) + 1
                if span > MAX_RANGE:
                    return 'sed prints %d lines (over %d): %s.' % (span, MAX_RANGE, REASON)
        return None
    for stages in lines:
        for k, words in enumerate(stages):
            limit = cap(stages[k + 1]) if k + 1 < len(stages) else None
            if limit is not None and limit <= MAX_RANGE:
                continue
            name = os.path.basename(words[0])
            check = {'sed': sed_denial, 'cat': cat_denial, 'git': git_denial}.get(name)
            reason = check and check(words, cwd, limit)
            if reason:
                return reason
    return None


def why_denied(data):
    tool = data.get('tool_name')
    inp = data.get('tool_input') or {}
    if tool == 'Read':
        path = str(inp.get('file_path') or '')
        limit = as_int(inp.get('limit'))
        if limit is not None:
            if limit > MAX_RANGE:
                return 'Read limit %d is over %d lines: %s.' % (limit, MAX_RANGE, advice([path]))
            return None
        n = line_count(path, data.get('cwd'))
        if n > MAX_WHOLE:
            return 'Read with no limit on a %d-line file (over %d): %s.' % (n, MAX_WHOLE, advice([path]))
    elif tool == 'Bash':
        return bash_denial(str(inp.get('command') or ''), data.get('cwd'))
    return None


def main():
    if len(sys.argv) > 1 and sys.argv[1] in ('-h', '--help'):
        print(__doc__)
        return
    try:
        data = json.loads(sys.stdin.buffer.read().decode('utf-8'))
        if not isinstance(data, dict) or not data.get('agent_id'):
            return
        reason = why_denied(data)
    except Exception:
        return
    if reason:
        print(json.dumps({'hookSpecificOutput': {
            'hookEventName': 'PreToolUse',
            'permissionDecision': 'deny',
            'permissionDecisionReason': reason}}))


if __name__ == '__main__':
    main()
