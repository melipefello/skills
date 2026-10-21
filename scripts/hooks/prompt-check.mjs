// UserPromptSubmit hook (.claude/settings.json): tell the session what changed under it since it started.
//
//   node scripts/hooks/prompt-check.mjs < hook-input.json
//
// Compares git HEAD with the baseline session-start.mjs saved for this session_id. On new commits prints
// "Since this session started:" and their git log --oneline, then moves the baseline to HEAD. Also prints
// "Another live FSkills session: <id8>" for each other transcript of this project
// (~/.claude/projects/<project>/*.jsonl) written in the last 30 minutes, once until it goes quiet.
// Claude Code adds what it prints to the prompt's context; it prints nothing when nothing changed. Never fails:
// every error is swallowed and the exit code is always 0.
import { readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { ROOT, git } from "../lib.mjs";
import { loadState, readInput, saveState } from "./state.mjs";

if (process.argv.includes("--help")) {
  console.log("usage: node scripts/hooks/prompt-check.mjs < hook-input.json");
  process.exit(0);
}

const LIVE_MS = 30 * 60 * 1000;
const out = [];
try {
  const { session_id: id } = readInput();
  if (!id) process.exit(0);
  const state = loadState(id) ?? { head: null, live: [] };

  try {
    const head = git(["rev-parse", "HEAD"], { cwd: ROOT, timeout: 5000 });
    if (state.head && head !== state.head) {
      let log = "";
      try { log = git(["log", "--oneline", `${state.head}..${head}`], { cwd: ROOT, timeout: 5000 }); } catch {}
      if (log) out.push(`Since this session started:\n${log}`);
    }
    state.head = head;
  } catch {}

  try {
    // Claude Code names a project's folder after its path, every other character a dash: C:\F\FSkills -> C--F-FSkills.
    const dir = join(homedir(), ".claude", "projects", ROOT.replace(/[^A-Za-z0-9]/g, "-"));
    const live = readdirSync(dir)
      .filter((f) => f.endsWith(".jsonl") && f !== `${id}.jsonl`)
      .filter((f) => Date.now() - statSync(join(dir, f)).mtimeMs < LIVE_MS)
      .map((f) => f.slice(0, -".jsonl".length));
    for (const other of live) if (!state.live.includes(other)) out.push(`Another live FSkills session: ${other.slice(0, 8)}`);
    state.live = live;
  } catch {}

  saveState(id, state);
} catch {}
if (out.length) console.log(out.join("\n"));
process.exit(0);
