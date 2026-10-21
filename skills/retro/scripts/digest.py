"""Digest one Claude Code session transcript (and its subagents) for a retrospective.

Usage:
  python -I digest.py <session.jsonl> [options]

Options:
  --no-subagents      skip the subagents/ folder beside the transcript
  --texts             print every assistant text block in full (default: first 400 chars)
  --errors            print every tool error in full (default: first 300 chars)
  --tool NAME         print every input of tool NAME, in order, with result size and time
  --prompts           print every user prompt in full
  --top N             size of the "top" lists (default 12)

Output sections: header (title, times, cost), user prompts, tool counts, errors,
largest results, repeated inputs, longest turns, assistant texts, subagents.
"""
import json, os, sys, glob, collections, datetime

args = sys.argv[1:]
if not args or args[0] in ('-h', '--help'):
    print(__doc__); sys.exit(0)
path = args[0]
opt = set(a for a in args[1:] if a.startswith('--') and a not in ('--tool', '--top'))
tool_filter = args[args.index('--tool') + 1] if '--tool' in args else None
top_n = int(args[args.index('--top') + 1]) if '--top' in args else 12

KEEP = {'user', 'assistant', 'system', 'cost-state', 'custom-title', 'ai-title'}


def parse_ts(s):
    if not s: return None
    try:
        return datetime.datetime.fromisoformat(s.replace('Z', '+00:00'))
    except Exception:
        return None


def fmt(dt):
    return dt.astimezone().strftime('%m-%d %H:%M:%S') if dt else '?'


def result_text(part):
    c = part.get('content')
    if isinstance(c, str): return c
    if isinstance(c, list):
        return '\n'.join(p.get('text', '') for p in c if isinstance(p, dict))
    return ''


def input_snippet(name, inp, n=220):
    if not isinstance(inp, dict): return str(inp)[:n]
    if name == 'Bash' or name == 'PowerShell':
        s = inp.get('command', '')
    elif name in ('Read', 'Write', 'Edit', 'Glob', 'Grep'):
        s = ' '.join(str(inp.get(k)) for k in ('file_path', 'pattern', 'path', 'glob') if inp.get(k))
        if name == 'Edit': s += ' | old=' + str(inp.get('old_string', ''))[:60].replace('\n', ' ')
        if name == 'Write': s += ' | %d chars' % len(inp.get('content', ''))
    elif name == 'Agent':
        s = '[%s/%s] %s' % (inp.get('subagent_type'), inp.get('model'), inp.get('description', ''))
    elif name == 'Skill':
        s = inp.get('skill', '') + ' ' + str(inp.get('args', ''))
    else:
        s = json.dumps(inp)
    return s.replace('\n', ' ')[:n]


def load(path):
    recs = []
    with open(path, encoding='utf-8') as f:
        for line in f:
            try: d = json.loads(line)
            except Exception: continue
            if d.get('type') in KEEP: recs.append(d)
    return recs


def digest(path, label, is_sub=False):
    recs = load(path)
    title = None; cost = None
    prompts = []; tool_uses = {}; results = []; texts = []; turns = []
    first = last = None
    assistant_msgs = 0; models = collections.Counter(); effort = collections.Counter()
    usage = collections.Counter(); seen_ids = set()
    for d in recs:
        t = d.get('type')
        ts = parse_ts(d.get('timestamp'))
        if ts:
            first = first or ts; last = ts
        if t == 'custom-title': title = d.get('customTitle'); continue
        if t == 'ai-title': title = title or d.get('aiTitle'); continue
        if t == 'cost-state': cost = d; continue
        if t == 'system':
            if d.get('subtype') == 'turn_duration':
                turns.append((d.get('durationMs', 0), ts, d.get('messageCount')))
            continue
        m = d.get('message') or {}
        content = m.get('content')
        if t == 'assistant':
            # One API response is stored as one record per content block, each repeating
            # the message id and the usage: count both once per message id.
            mid = m.get('id') or d.get('requestId') or d.get('uuid')
            new_msg = mid not in seen_ids
            seen_ids.add(mid)
            if new_msg: assistant_msgs += 1
            if d.get('requestedModel'): models[d['requestedModel']] += 1
            if d.get('effort'): effort[str(d['effort'])] += 1
            u = m.get('usage') or {}
            if new_msg and isinstance(u, dict) and u:
                usage['in'] += u.get('input_tokens', 0) or 0
                usage['out'] += u.get('output_tokens', 0) or 0
                usage['cache_read'] += u.get('cache_read_input_tokens', 0) or 0
                usage['cache_create'] += u.get('cache_creation_input_tokens', 0) or 0
                usage['last_ctx'] = (u.get('input_tokens', 0) or 0) + (u.get('cache_read_input_tokens', 0) or 0) + (u.get('cache_creation_input_tokens', 0) or 0)
                usage['max_ctx'] = max(usage['max_ctx'], usage['last_ctx'])
            if isinstance(content, list):
                for p in content:
                    if not isinstance(p, dict): continue
                    if p['type'] == 'tool_use':
                        tool_uses[p['id']] = {'name': p['name'], 'input': p.get('input'), 'ts': ts, 'result': None}
                    elif p['type'] == 'text' and p.get('text', '').strip():
                        texts.append((ts, p['text']))
        elif t == 'user':
            if d.get('isMeta'): continue
            if isinstance(content, str):
                if content.strip(): prompts.append((ts, content))
            elif isinstance(content, list):
                for p in content:
                    if not isinstance(p, dict): continue
                    if p['type'] == 'tool_result':
                        txt = result_text(p)
                        tu = tool_uses.get(p.get('tool_use_id'))
                        err = bool(p.get('is_error'))
                        results.append({'tu': tu, 'len': len(txt), 'err': err, 'text': txt, 'ts': ts})
                        if tu is not None:
                            tu['result'] = results[-1]
                    elif p['type'] == 'text' and p.get('text', '').strip():
                        txt = p['text']
                        if txt.startswith('<system-reminder>') or txt.startswith('<command-') or txt.startswith('<local-command'): continue
                        prompts.append((ts, txt))
    dur = (last - first) if (first and last) else None
    out = []
    P = out.append
    P('=' * 100)
    P('%s  %s' % (label, os.path.basename(path)))
    P('title: %s | start %s | end %s | wall %s | assistant msgs %d | models %s | effort %s' % (
        title, fmt(first), fmt(last), str(dur).split('.')[0] if dur else '?', assistant_msgs, dict(models), dict(effort)))
    P('tokens: in %d | out %d | cache-read %d | cache-create %d | context at end %d | peak context %d' % (
        usage['in'], usage['out'], usage['cache_read'], usage['cache_create'], usage['last_ctx'], usage['max_ctx']))
    if cost:
        P('cost: $%.2f | api %s | tools %s | total %s | +%s/-%s lines' % (
            cost.get('totalCostUSD', 0), str(datetime.timedelta(milliseconds=cost.get('totalAPIDuration', 0))).split('.')[0],
            str(datetime.timedelta(milliseconds=cost.get('totalToolDuration', 0))).split('.')[0],
            str(datetime.timedelta(milliseconds=cost.get('totalDuration', 0))).split('.')[0],
            cost.get('totalLinesAdded'), cost.get('totalLinesRemoved')))
        mu = cost.get('modelUsage') or {}
        for k, v in mu.items():
            if isinstance(v, dict):
                P('  %s: in %s, out %s, cache-read %s, cache-create %s, $%.2f' % (
                    k, v.get('inputTokens'), v.get('outputTokens'), v.get('cacheReadInputTokens'), v.get('cacheCreationInputTokens'), v.get('costUSD', 0)))
    # prompts
    if not is_sub or '--prompts' in opt:
        P('-' * 40 + ' user prompts (%d)' % len(prompts))
        for ts, txt in prompts:
            lim = None if '--prompts' in opt else 300
            P('[%s] %s' % (fmt(ts), txt.replace('\n', ' ')[:lim] if lim else txt))
    # tool counts
    cnt = collections.Counter(); size = collections.Counter(); errs = collections.Counter()
    for r in results:
        name = r['tu']['name'] if r['tu'] else '?'
        cnt[name] += 1; size[name] += r['len']
        if r['err']: errs[name] += 1
    P('-' * 40 + ' tool calls: %d, result chars %d' % (sum(cnt.values()), sum(size.values())))
    for name, n in cnt.most_common():
        P('  %-14s %4d calls  %9d chars  %d errors' % (name, n, size[name], errs[name]))
    # errors
    err_list = [r for r in results if r['err']]
    P('-' * 40 + ' tool errors (%d)' % len(err_list))
    for r in err_list:
        tu = r['tu'] or {}
        lim = None if '--errors' in opt else 300
        P('[%s] %s: %s' % (fmt(r['ts']), tu.get('name'), input_snippet(tu.get('name'), tu.get('input'))))
        P('    -> ' + (r['text'].replace('\n', ' ')[:lim] if lim else r['text']))
    # largest results
    P('-' * 40 + ' largest tool results')
    for r in sorted(results, key=lambda x: -x['len'])[:top_n]:
        tu = r['tu'] or {}
        P('  %8d chars  [%s] %s: %s' % (r['len'], fmt(r['ts']), tu.get('name'), input_snippet(tu.get('name'), tu.get('input'))))
    # repeated inputs
    rep = collections.Counter()
    for tu in tool_uses.values():
        rep[(tu['name'], input_snippet(tu['name'], tu['input'], 400))] += 1
    reps = [(k, v) for k, v in rep.items() if v > 1]
    P('-' * 40 + ' repeated identical tool inputs (%d)' % len(reps))
    for (name, s), v in sorted(reps, key=lambda x: -x[1])[:top_n]:
        P('  x%d %s: %s' % (v, name, s[:200]))
    # tool durations: time from tool_use to next assistant message is not stored; use turn durations
    P('-' * 40 + ' longest turns (turn_duration)')
    for ms, ts, mc in sorted(turns, key=lambda x: -x[0])[:top_n]:
        P('  %7.1f min  ended %s  (msgs %s)' % (ms / 60000, fmt(ts), mc))
    # specific tool dump
    if tool_filter:
        P('-' * 40 + ' every %s call' % tool_filter)
        for tid, tu in tool_uses.items():
            if tu['name'] != tool_filter: continue
            r = tu['result'] or {}
            P('[%s] %s  -> %s chars%s' % (fmt(tu['ts']), input_snippet(tu['name'], tu['input'], 600), r.get('len', 0), ' ERROR' if r.get('err') else ''))
    # assistant texts
    P('-' * 40 + ' assistant texts (%d)' % len(texts))
    for ts, txt in texts:
        lim = None if '--texts' in opt else 400
        P('[%s] %s' % (fmt(ts), txt if lim is None else txt.replace('\n', ' ')[:lim]))
    return '\n'.join(out)


print(digest(path, 'SESSION'))
if '--no-subagents' not in opt:
    sub_dir = os.path.join(os.path.splitext(path)[0], 'subagents')
    files = sorted(glob.glob(os.path.join(sub_dir, 'agent-*.jsonl')), key=os.path.getmtime)
    print('\n' + '#' * 100 + '\nSUBAGENTS: %d in %s' % (len(files), sub_dir))
    for f in files:
        meta = {}
        mp = f.replace('.jsonl', '.meta.json')
        if os.path.exists(mp):
            try: meta = json.load(open(mp, encoding='utf-8'))
            except Exception: pass
        label = 'SUBAGENT [%s | %s | %s]' % (meta.get('description'), meta.get('agentType'), meta.get('model'))
        print(digest(f, label, is_sub=True))
