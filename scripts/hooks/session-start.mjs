// SessionStart hook (.claude/settings.json): record this session's baseline and report drift.
//
//   node scripts/hooks/session-start.mjs < hook-input.json
//
// Reads the hook input on stdin (session_id), saves git HEAD as the session's baseline for prompt-check.mjs in
// <tmpdir>/fskills-hooks/<session_id>.json, then prints the output of drift.mjs --brief. Claude Code adds what it
// prints to the session's context; it prints nothing when all is in sync. Never fails: every error is swallowed
// and the exit code is always 0.
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { ROOT, git } from "../lib.mjs";
import { readInput, saveState } from "./state.mjs";

if (process.argv.includes("--help")) {
  console.log("usage: node scripts/hooks/session-start.mjs < hook-input.json");
  process.exit(0);
}

try {
  const { session_id: id } = readInput();
  if (id) saveState(id, { head: git(["rev-parse", "HEAD"], { cwd: ROOT, timeout: 5000 }), live: [] });
} catch {}

try {
  const r = spawnSync(process.execPath, [join(ROOT, "scripts", "drift.mjs"), "--brief"],
    { cwd: ROOT, encoding: "utf8", timeout: 15000 });
  const out = (r.stdout ?? "").trim();
  if (out) console.log(`FSkills drift (node scripts/drift.mjs):\n${out}`);
} catch {}
process.exit(0);
