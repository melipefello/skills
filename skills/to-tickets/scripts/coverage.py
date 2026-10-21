"""List the spec's user stories that no ticket's Covers line names.

Usage:
  python -I coverage.py <spec.md> [--stories LIST | --since REF] [--tickets PATH]

  <spec.md>        the spec; its stories are the "N. As a ..." lines under "## User Stories"
  --stories LIST   only these story numbers: "216-234" or "216,218,220-223"
  --since REF      only the stories whose line changed since git REF (the revision's stories)
  --tickets PATH   a draft breakdown file, or a ticket folder whose *.md files are read
                   (default: issues/ beside the spec)

A ticket covers a story when a Covers line names it: "US17", "US17-US19" or "US17-19".
Prints each uncovered story with its first words and exits 1, or prints "covered: N stories" and
exits 0.
"""
import glob, os, re, subprocess, sys

STORY = re.compile(r'^(\d+)\.\s+(.*)')
COVERS = re.compile(r'^[\s*#>-]*covers\b', re.I)
US = re.compile(r'US(\d+)(?:\s*[-–]\s*(?:US)?(\d+))?')


def die(msg):
    print('error: ' + msg, file=sys.stderr)
    sys.exit(2)


def numbers(text):
    out = set()
    for part in text.split(','):
        part = part.strip()
        m = re.fullmatch(r'(\d+)(?:-(\d+))?', part)
        if not m:
            die('bad story list: ' + text)
        lo = int(m.group(1))
        out.update(range(lo, int(m.group(2) or lo) + 1))
    return out


def stories(lines):
    out, inside = {}, False
    for line in lines:
        if line.startswith('## '):
            inside = line.strip() == '## User Stories'
            continue
        m = STORY.match(line) if inside else None
        if m:
            out[int(m.group(1))] = m.group(2)
    return out


def main():
    args = sys.argv[1:]
    if not args or args[0] in ('-h', '--help'):
        print(__doc__)
        sys.exit(0)
    spec, wanted, since, tickets = None, None, None, None
    i = 0
    while i < len(args):
        a = args[i]
        if a in ('--stories', '--since', '--tickets'):
            if i + 1 >= len(args):
                die(a + ' needs a value')
            i += 1
            if a == '--stories':
                wanted = numbers(args[i])
            elif a == '--since':
                since = args[i]
            else:
                tickets = args[i]
        elif a.startswith('--'):
            die('unknown option ' + a)
        else:
            spec = a
        i += 1
    if not spec or not os.path.isfile(spec):
        die('give the spec file (--help prints usage)')
    with open(spec, encoding='utf-8') as f:
        all_stories = stories(f.read().splitlines())
    if since:
        folder, name = os.path.split(os.path.abspath(spec))
        diff = subprocess.run(['git', 'diff', '-U0', since, '--', name], cwd=folder,
                              capture_output=True, text=True, encoding='utf-8')
        if diff.returncode:
            die(diff.stderr.strip())
        added = [l[1:] for l in diff.stdout.splitlines() if l.startswith('+') and not l.startswith('+++')]
        wanted = set(stories(['## User Stories'] + added))
    if wanted is None:
        wanted = set(all_stories)
    unknown = sorted(wanted - set(all_stories))
    if unknown:
        print('not in the spec: ' + ', '.join('US%d' % n for n in unknown))
    covered = set()
    target = tickets or os.path.join(os.path.dirname(os.path.abspath(spec)), 'issues')
    files = [target] if os.path.isfile(target) else glob.glob(os.path.join(target, '*.md'))
    if not files:
        die('no ticket file in ' + target)
    for t in files:
        with open(t, encoding='utf-8') as f:
            for line in f:
                if COVERS.match(line):
                    for m in US.finditer(line):
                        lo = int(m.group(1))
                        covered.update(range(lo, int(m.group(2) or lo) + 1))
    gaps = sorted(n for n in wanted if n in all_stories and n not in covered)
    for n in gaps:
        print('US%d not covered: %s' % (n, all_stories[n][:90]))
    if gaps:
        sys.exit(1)
    print('covered: %d stories' % len(wanted & set(all_stories)))


if __name__ == '__main__':
    main()
