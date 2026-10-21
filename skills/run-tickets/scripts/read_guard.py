"""Claude Code PreToolUse hook: keeps subagents' reads of long files to a range.

Denies, for a call made inside a subagent (hook input carries agent_id):
  - a Read with no limit on a text file over 300 lines
  - a Read whose limit is over 150 lines
  - a Bash `sed -n 'a,bp'` (or 'a,+np') printing a span over 150 lines
The deny reason tells the agent what to do instead. Calls in the main conversation, and
any input this script cannot parse, pass with no decision.

Wire it in a project's .claude/settings.json:
  "PreToolUse": [{"matcher": "Read|Bash", "hooks": [{"type": "command", "command": "python",
    "args": ["-I", "<path to this file>"]}]}]

Test: echo '{"agent_id":"a","tool_name":"Read","tool_input":{"file_path":"big.py"}}' | python -I read_guard.py
"""
import json, os, re, sys

MAX_WHOLE = 300   # lines a Read may take with no limit
MAX_RANGE = 150   # lines a ranged Read or a sed span may take
REASON = 'grep -n the member, then read about 100 lines around it'
NOT_TEXT = ('.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.pdf', '.ipynb')
SED = re.compile(r"\bsed\s+(?:-[A-Za-z]+\s+)*-n\s*(?:-[A-Za-z]+\s+)*(['\"]?)([^'\"\s]+)\1")
SPAN = re.compile(r'(\d+)\s*,\s*(\+?)(\d+)\s*p')


def line_count(path, cwd):
    if not os.path.isabs(path):
        path = os.path.join(cwd or os.getcwd(), path)
    if path.lower().endswith(NOT_TEXT) or not os.path.isfile(path):
        return 0
    n = 0
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            n += chunk.count(b'\n')
    return n


def as_int(v):
    try:
        return int(v)
    except (TypeError, ValueError):
        return None


def why_denied(data):
    tool = data.get('tool_name')
    inp = data.get('tool_input') or {}
    if tool == 'Read':
        limit = as_int(inp.get('limit'))
        if limit is not None:
            if limit > MAX_RANGE:
                return 'Read limit %d is over %d lines: %s.' % (limit, MAX_RANGE, REASON)
            return None
        n = line_count(str(inp.get('file_path') or ''), data.get('cwd'))
        if n > MAX_WHOLE:
            return 'Read with no limit on a %d-line file (over %d): %s.' % (n, MAX_WHOLE, REASON)
    elif tool == 'Bash':
        for m in SED.finditer(str(inp.get('command') or '')):
            for a, rel, b in SPAN.findall(m.group(2)):
                span = int(b) + 1 if rel else int(b) - int(a) + 1
                if span > MAX_RANGE:
                    return 'sed prints %d lines (over %d): %s.' % (span, MAX_RANGE, REASON)
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
