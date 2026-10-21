"""Per-ticket time, tokens and estimated dollars of a run-tickets session.

Usage:
  python -I ticket_stats.py [<session.jsonl> | <session-id> | --latest] [options]

  <session.jsonl>   a Claude Code transcript; its subagents/ folder beside it is read too
  <session-id>      looked up in the project's transcript folder
  --latest          the newest *.jsonl in the project's transcript folder (the running session)
  --project DIR     project folder for <session-id> and --latest (default: the current folder);
                    transcripts live in ~/.claude/projects/<DIR with every non-alphanumeric char as ->
  --ticket NN       only this ticket's row
  --line            one line per row instead of the table (with --ticket: that ticket's line)
  --id              print the session id and transcript path, nothing else

Rows: one per ticket, from every subagent whose description names "ticket NN" (retro readers and
other agents that read a ticket are left out; a helper a worker starts counts toward its ticket),
then the orchestrator (the main thread from the /run-tickets prompt to the end of the turn after
the last worker) and the total.

Columns:
  start, end   local time of the first and last record
  min          wall minutes from start to end
  calls        API calls, counted once per message id
  tokens       tokens processed: input + cache read + cache creation, summed over the calls
  peak         largest context of one call
  tools, err   tool calls and failed tool calls
  script       minutes inside Bash or PowerShell calls running a test, check, capture or simulate
               .ps1 script
  orient       tool calls, and KB of their results, before the ticket's first Edit or Write; the
               orchestrator shows -
  $            estimate: per model, the session's last cost record (cost-state) shared out by
               weighted tokens (cache read x1, cache write x12.5, input x10, output x50). A model
               the cost record does not cover (a resumed session restarts the record) uses a
               fixed rate, and its dollars carry a ~.
"""
import collections, datetime, glob, json, os, re, sys

TICKET = re.compile(r'ticket\s*(\d+)', re.I)
NOT_WORKER = re.compile(r'\b(retro|mine|analy[sz]e\w*|read|reader|reading|review\w*|digest\w*)\b', re.I)
SCRIPT = re.compile(r'\b(test|check|capture|simulate)\.ps1\b', re.I)
EDITS = ('Edit', 'Write', 'MultiEdit', 'NotebookEdit')
WEIGHT = {'in': 10, 'out': 50, 'cr': 1, 'cw': 12.5}
# Dollars per million weighted tokens, used when the cost record does not cover a model.
# Opus and Fable measured on one run-tickets session (2026-10-21) from its cost record and
# transcripts; Sonnet and Haiku scaled from Opus by list price (3/5 and 1/5).
FALLBACK_RATE = {'opus': 0.396, 'fable': 0.532, 'sonnet': 0.237, 'haiku': 0.079}


def die(msg):
    print('error: ' + msg, file=sys.stderr)
    sys.exit(1)


def parse_args(argv):
    opts = {'path': None, 'latest': False, 'project': os.getcwd(), 'ticket': None, 'line': False, 'id': False}
    i = 0
    while i < len(argv):
        a = argv[i]
        if a in ('-h', '--help'):
            print(__doc__)
            sys.exit(0)
        elif a == '--latest':
            opts['latest'] = True
        elif a == '--line':
            opts['line'] = True
        elif a == '--id':
            opts['id'] = True
        elif a in ('--project', '--ticket'):
            if i + 1 >= len(argv):
                die(a + ' needs a value')
            i += 1
            opts[a[2:]] = argv[i]
        elif a.startswith('--'):
            die('unknown option ' + a)
        else:
            opts['path'] = a
        i += 1
    if opts['ticket'] is not None:
        if not opts['ticket'].isdigit():
            die('--ticket takes a number')
        opts['ticket'] = int(opts['ticket'])
    return opts


def project_dir(project):
    slug = re.sub(r'[^A-Za-z0-9]', '-', os.path.abspath(project))
    return os.path.join(os.path.expanduser('~'), '.claude', 'projects', slug)


def find_transcript(opts):
    p = opts['path']
    if p and os.path.isfile(p):
        return p
    folder = project_dir(opts['project'])
    if p:
        hits = glob.glob(os.path.join(folder, p + '*.jsonl'))
        if len(hits) == 1:
            return hits[0]
        die('%s: %s' % (p, 'no transcript in ' + folder if not hits else 'several transcripts match'))
    if opts['latest']:
        files = glob.glob(os.path.join(folder, '*.jsonl'))
        if not files:
            die('no transcript in ' + folder)
        return max(files, key=os.path.getmtime)
    die('give a transcript, a session id or --latest (--help prints usage)')


def ts_of(d):
    s = d.get('timestamp')
    if not s:
        return None
    try:
        return datetime.datetime.fromisoformat(s.replace('Z', '+00:00'))
    except ValueError:
        return None


def load(path):
    out = []
    with open(path, encoding='utf-8') as f:
        for line in f:
            try:
                out.append(json.loads(line))
            except ValueError:
                pass
    return out


def text_of(content):
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return ' '.join(p.get('text', '') for p in content if isinstance(p, dict) and p.get('type') == 'text')
    return ''


def size_of(content):
    """Bytes of a tool result's text."""
    if isinstance(content, str):
        return len(content.encode('utf-8'))
    if isinstance(content, list):
        return sum(size_of(p.get('text', '')) for p in content if isinstance(p, dict))
    return 0


class Seen:
    """Message ids and tool ids already counted: a fork's transcript repeats its parent's records."""
    def __init__(self):
        self.msgs, self.tools, self.results = set(), set(), set()


def events(recs, seen):
    """Calls (one per message id), tool uses and tool results of one transcript, each with its time."""
    calls, uses, results = [], {}, []
    for d in recs:
        t = d.get('type')
        m = d.get('message') or {}
        ts = ts_of(d)
        content = m.get('content')
        if t == 'assistant':
            mid = m.get('id') or d.get('requestId') or d.get('uuid')
            u = m.get('usage') or {}
            if mid not in seen.msgs and isinstance(u, dict) and u:
                seen.msgs.add(mid)
                tok = {'in': u.get('input_tokens') or 0, 'out': u.get('output_tokens') or 0,
                       'cr': u.get('cache_read_input_tokens') or 0, 'cw': u.get('cache_creation_input_tokens') or 0}
                calls.append({'ts': ts, 'model': m.get('model') or '?', **tok})
            if isinstance(content, list):
                for p in content:
                    if isinstance(p, dict) and p.get('type') == 'tool_use' and p.get('id') not in seen.tools:
                        seen.tools.add(p.get('id'))
                        inp = p.get('input') if isinstance(p.get('input'), dict) else {}
                        uses[p['id']] = {'ts': ts, 'name': p.get('name'), 'cmd': str(inp.get('command', ''))}
        elif t == 'user' and isinstance(content, list):
            for p in content:
                if isinstance(p, dict) and p.get('type') == 'tool_result' and p.get('tool_use_id') in uses \
                        and p.get('tool_use_id') not in seen.results:
                    seen.results.add(p['tool_use_id'])
                    results.append({'ts': ts, 'id': p['tool_use_id'], 'err': bool(p.get('is_error')),
                                    'size': size_of(p.get('content'))})
    return calls, uses, results


class Row:
    def __init__(self, label):
        self.label = label
        self.start = self.end = None
        self.calls = self.tokens = self.peak = self.tools = self.errors = 0
        self.script = 0.0
        self.results = []  # (use time, tool name, result bytes), for orient
        self.orient = None  # (calls, bytes) before the first Edit or Write
        self.weighted = collections.Counter()  # model -> weighted tokens
        self.dollars = 0.0
        self.approx = False

    def span(self, ts):
        if ts:
            self.start = ts if self.start is None or ts < self.start else self.start
            self.end = ts if self.end is None or ts > self.end else self.end

    def add(self, calls, uses, results, lo=None, hi=None):
        inside = lambda ts: ts is not None and (lo is None or ts >= lo) and (hi is None or ts <= hi)
        for c in calls:
            if not inside(c['ts']):
                continue
            self.span(c['ts'])
            self.calls += 1
            ctx = c['in'] + c['cr'] + c['cw']
            self.tokens += ctx
            self.peak = max(self.peak, ctx)
            self.weighted[c['model']] += sum(c[k] * w for k, w in WEIGHT.items())
        for r in results:
            if not inside(r['ts']):
                continue
            u = uses[r['id']]
            self.span(r['ts'])
            self.tools += 1
            self.errors += r['err']
            self.results.append((u['ts'] or r['ts'], u['name'], r['size']))
            if u['name'] in ('Bash', 'PowerShell') and SCRIPT.search(u['cmd']) and u['ts']:
                self.script += max(0.0, (r['ts'] - u['ts']).total_seconds()) / 60

    def orientation(self):
        """Tool calls and result bytes before the first Edit or Write, across the ticket's agents."""
        ordered = sorted(self.results, key=lambda x: x[0])
        first = next((ts for ts, name, _ in ordered if name in EDITS), None)
        before = [b for ts, name, b in ordered if first is None or ts < first]
        self.orient = (len(before), sum(before))


def rate_for(model, rates):
    for k, v in rates.items():
        if model.startswith(k) or k.startswith(model):
            return v, False
    for k, v in FALLBACK_RATE.items():
        if k in model:
            return v / 1e6, True
    return FALLBACK_RATE['opus'] / 1e6, True


def main():
    opts = parse_args(sys.argv[1:])
    path = find_transcript(opts)
    sid = os.path.splitext(os.path.basename(path))[0]
    if opts['id']:
        print(sid)
        print(path)
        return

    seen = Seen()
    main_recs = load(path)
    m_calls, m_uses, m_results = events(main_recs, seen)

    # Subagents, parents before children, so a fork's copied records count for its parent.
    sub_dir = os.path.join(os.path.splitext(path)[0], 'subagents')
    agents = {}
    for f in glob.glob(os.path.join(sub_dir, 'agent-*.jsonl')):
        meta = {}
        mp = f[:-len('.jsonl')] + '.meta.json'
        if os.path.exists(mp):
            try:
                with open(mp, encoding='utf-8') as fh:
                    meta = json.load(fh)
            except ValueError:
                pass
        aid = os.path.basename(f)[len('agent-'):-len('.jsonl')]
        agents[aid] = {'file': f, 'meta': meta}

    def ticket_of(aid, depth=0):
        a = agents.get(aid)
        if not a or depth > 5:
            return None
        desc = a['meta'].get('description') or ''
        m = TICKET.search(desc)
        if m and not NOT_WORKER.search(desc):
            return int(m.group(1)), bool(re.search(r'\bQA\b', desc))
        parent = a['meta'].get('parentAgentId')
        return ticket_of(parent, depth + 1) if parent else None

    rows, qa = {}, set()
    all_calls = list(m_calls)
    for aid in sorted(agents, key=lambda k: agents[k]['meta'].get('spawnDepth') or 1):
        calls, uses, results = events(load(agents[aid]['file']), seen)
        all_calls += calls
        t = ticket_of(aid)
        if t is None:
            continue
        num, is_qa = t
        if is_qa:
            qa.add(num)
        rows.setdefault(num, Row(str(num))).add(calls, uses, results)

    # Orchestrator: from the /run-tickets prompt to the end of the turn after the last worker.
    workers = [r for r in rows.values() if r.start]
    first = min((r.start for r in workers), default=None)
    last = max((r.end for r in workers), default=None)
    lo = hi = None
    for d in main_recs:
        ts = ts_of(d)
        if d.get('type') == 'user' and '<command-name>/run-tickets</command-name>' in text_of((d.get('message') or {}).get('content')):
            if ts and (first is None or ts <= first) and lo is None:
                lo = ts
        if d.get('type') == 'system' and d.get('subtype') == 'turn_duration' and ts and last and ts >= last and hi is None:
            hi = ts
    lo = lo or first
    hi = hi or last
    orch = Row('orchestrator')
    if lo and hi:
        orch.add(m_calls, m_uses, m_results, lo, hi)

    # Dollars: each model's recorded cost shared out by weighted tokens after the record's start.
    cost = None
    for d in main_recs:
        if d.get('type') == 'cost-state':
            cost = d
    rates = {}
    if cost:
        start = datetime.datetime.fromtimestamp((cost.get('startTime') or 0) / 1000, datetime.timezone.utc)
        for model, mu in (cost.get('modelUsage') or {}).items():
            w = sum(sum(c[k] * x for k, x in WEIGHT.items()) for c in all_calls
                    if c['ts'] and c['ts'] >= start and (c['model'].startswith(model) or model.startswith(c['model'])))
            if w and isinstance(mu, dict) and mu.get('costUSD'):
                rates[model] = mu['costUSD'] / w
    ordered = [rows[k] for k in sorted(rows)] + ([orch] if orch.start else [])
    for r in ordered:
        if r is not orch:
            r.orientation()
        for model, w in r.weighted.items():
            rate, approx = rate_for(model, rates)
            r.dollars += w * rate
            r.approx |= approx
    total = Row('total')
    for r in ordered:
        total.span(r.start)
        total.span(r.end)
        for k in ('calls', 'tokens', 'tools', 'errors', 'script', 'dollars'):
            setattr(total, k, getattr(total, k) + getattr(r, k))
        if r.orient:
            total.orient = tuple(a + b for a, b in zip(total.orient or (0, 0), r.orient))
        total.peak = max(total.peak, r.peak)
        total.approx |= r.approx
    for r in ordered:
        if r.label.isdigit() and int(r.label) in qa:
            r.label += ' QA'

    if opts['ticket'] is not None:
        if opts['ticket'] not in rows:
            die('no worker for ticket %d in %s' % (opts['ticket'], path))
        ordered = [rows[opts['ticket']]]
    else:
        ordered = ordered + [total]

    def local(ts):
        return ts.astimezone().strftime('%m-%d %H:%M') if ts else '-'

    def minutes(r):
        return (r.end - r.start).total_seconds() / 60 if r.start else 0.0

    def mtok(n):
        return '%.1fM' % (n / 1e6)

    def usd(r):
        return '%s$%.2f' % ('~' if r.approx else '', r.dollars)

    def orient(r, sep):
        return '%d%s%dKB' % (r.orient[0], sep, round(r.orient[1] / 1024)) if r.orient else '-'

    if opts['line']:
        for r in ordered:
            print('%s | %s-%s | %.1f min | %d calls | %s tok | peak %dK | %d tools, %d err | script %.1f min | orient %s | %s' % (
                r.label, local(r.start), local(r.end)[-5:], minutes(r), r.calls, mtok(r.tokens), r.peak // 1000,
                r.tools, r.errors, r.script, orient(r, ' calls, '), usd(r)))
        return

    title = None
    for d in main_recs:
        if d.get('type') == 'custom-title':
            title = d.get('customTitle')
    head = 'session %s%s' % (sid, ' (%s)' % title if title else '')
    if cost:
        head += ' | cost record $%.2f since %s' % (cost.get('totalCostUSD') or 0, local(
            datetime.datetime.fromtimestamp((cost.get('startTime') or 0) / 1000, datetime.timezone.utc)))
    print(head)
    print()
    print('| ticket | start | end | min | calls | tokens | peak | tools | err | script min | orient | $ |')
    print('|---|---|---|---|---|---|---|---|---|---|---|---|')
    for r in ordered:
        print('| %s | %s | %s | %.1f | %d | %s | %dK | %d | %d | %.1f | %s | %s |' % (
            r.label, local(r.start), local(r.end)[-5:], minutes(r), r.calls, mtok(r.tokens), r.peak // 1000,
            r.tools, r.errors, r.script, orient(r, ' / '), usd(r)))


if __name__ == '__main__':
    main()
