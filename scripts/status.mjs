// List every skill in the manifest with its pin, and whether upstream has moved on.
//
//   node scripts/status.mjs [--offline]
import { existsSync } from "node:fs";
import { join } from "node:path";
import { MODS_DIR, ROOT, SKILLS_DIR, git, parseArgs, readManifest, resolveTarget, shortSha } from "./lib.mjs";

const args = parseArgs(process.argv.slice(2), { offline: "bool", help: "bool" });
if (args.help) {
  console.log("usage: node scripts/status.mjs [--offline]");
  process.exit(0);
}

let hooks = "";
try { hooks = git(["config", "core.hooksPath"], { cwd: ROOT }); } catch {}
if (hooks !== ".githooks") console.log("warning: the pre-commit check is off; run: git config core.hooksPath .githooks");

const manifest = readManifest();
const names = Object.keys(manifest.skills).sort();
if (!names.length) {
  console.log("manifest is empty");
  process.exit(0);
}

const cache = new Map();
for (const name of names) {
  const e = manifest.skills[name];
  const folder = existsSync(join(SKILLS_DIR, name)) ? "" : "  FOLDER MISSING";
  const note = existsSync(join(MODS_DIR, `${name}.md`)) ? "note" : "no note";
  console.log(`${name}  [${e.status}, ${note}]${folder}`);
  for (const s of e.sources) {
    let upstream = "";
    if (!args.offline && e.status !== "detached") {
      const key = `${s.repo}|${s.track}`;
      if (!cache.has(key)) cache.set(key, resolveTarget(s.repo, { track: s.track }));
      const t = cache.get(key);
      upstream = t.commit === s.commit ? "  up to date" : `  newer: ${t.ref} (${shortSha(t.commit)})`;
    }
    console.log(`  ${s.repo}:${s.path} @ ${s.ref} (${shortSha(s.commit)})${upstream}`);
  }
}
