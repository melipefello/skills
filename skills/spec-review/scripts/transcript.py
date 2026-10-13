"""Read Claude Code session transcripts for /spec-review.

  python transcript.py index [SESSION.jsonl]
      One line per user message: id, UTC time, preview.
  python transcript.py show ID [SESSION.jsonl]
      Full text of one message from the index (ID like M7).
  python transcript.py check REVIEW.md [SESSION.jsonl] [--ref FILE ...]
      Verify every "quote" in REVIEW.md appears verbatim in the user messages
      (or in a --ref file). Prints each miss and a count.

SESSION.jsonl defaults to the newest transcript of the current directory's
project: ~/.claude/projects/<cwd with each non-alphanumeric replaced by ->/*.jsonl.
"""
import json
import re
import sys
from pathlib import Path

SKIP_PREFIXES = ("<system-reminder>", "<local-command", "<task-notification", "Another Claude session sent a message")


def default_session():
    slug = re.sub(r"[^A-Za-z0-9]", "-", str(Path.cwd()))
    folder = Path.home() / ".claude" / "projects" / slug
    files = sorted(folder.glob("*.jsonl"), key=lambda p: p.stat().st_mtime)
    if not files:
        sys.exit(f"error: no transcripts in {folder}")
    return files[-1]


def user_messages(path):
    out = []
    for line in open(path, encoding="utf-8"):
        try:
            o = json.loads(line)
        except ValueError:
            continue
        if o.get("type") != "user":
            continue
        c = o.get("message", {}).get("content")
        if not isinstance(c, str) or c.lstrip().startswith(SKIP_PREFIXES):
            continue
        out.append((o.get("timestamp", "")[:16].replace("T", " "), c))
    return out


def norm(s):
    s = s.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')
    return re.sub(r"\s+", " ", s)


def main(argv):
    if not argv or argv[0] in ("-h", "--help"):
        print(__doc__)
        return
    cmd, rest = argv[0], argv[1:]
    refs = []
    if "--ref" in rest:
        i = rest.index("--ref")
        refs, rest = rest[i + 1:], rest[:i]
    if cmd == "index":
        session = Path(rest[0]) if rest else default_session()
        print(f"# {session}")
        for n, (t, c) in enumerate(user_messages(session)):
            print(f"M{n}\t{t} UTC\t{norm(c)[:110]}")
    elif cmd == "show":
        session = Path(rest[1]) if len(rest) > 1 else default_session()
        msgs = user_messages(session)
        n = int(rest[0].lstrip("Mm"))
        t, c = msgs[n]
        print(f"M{n} {t} UTC\n{c}")
    elif cmd == "check":
        review = Path(rest[0])
        session = Path(rest[1]) if len(rest) > 1 else default_session()
        corpus = norm(" ".join(c for _, c in user_messages(session)))
        for r in refs:
            corpus += " " + norm(Path(r).read_text(encoding="utf-8"))
        text = review.read_text(encoding="utf-8").replace('\\"', "\x00")
        total = misses = 0
        for q in re.findall(r'"([^"\n]+)"', text):
            q = norm(q.replace("\x00", '"'))
            for frag in (f.strip(" .") for f in q.split("…")):
                if len(frag) < 15:
                    continue
                total += 1
                if frag not in corpus:
                    misses += 1
                    print("MISS:", frag[:140])
        print(f"{total - misses}/{total} quote fragments found verbatim")
    else:
        sys.exit(f"error: unknown command {cmd!r}; see --help")


if __name__ == "__main__":
    main(sys.argv[1:])
