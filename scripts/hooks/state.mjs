// Shared by the session hooks: the hook input and the per-session state file.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const DIR = join(tmpdir(), "fskills-hooks");

/** The hook input JSON from stdin; {} when there is none. */
export function readInput() {
  try { return JSON.parse(readFileSync(0, "utf8") || "{}"); } catch { return {}; }
}

const file = (id) => join(DIR, `${String(id).replace(/[^\w-]/g, "_")}.json`);

export function loadState(id) {
  try { return JSON.parse(readFileSync(file(id), "utf8")); } catch { return null; }
}

export function saveState(id, state) {
  mkdirSync(DIR, { recursive: true });
  writeFileSync(file(id), JSON.stringify(state));
}
