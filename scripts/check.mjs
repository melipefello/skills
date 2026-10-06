// Check that the repo is consistent. The pre-commit hook runs it with --staged.
//
//   node scripts/check.mjs [--staged]
//
// Offline, for every skill: manifest.json parses; each manifest skill has skills/<name>/SKILL.md and a source;
// each folder in skills/ and each note in mods/ belongs to a manifest skill; no conflict markers in skills/.
// Online, for every skill (only the staged ones with --staged): a note exists exactly when the skill differs
// from its upstream. A network failure skips this part with a warning.
// Enable the hook once per clone: git config core.hooksPath .githooks
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  MANIFEST, MODS_DIR, ROOT, SKILLS_DIR, cleanup, fetchFolder, git, isBinary, listFiles, parseArgs, readBytes,
  readManifest, sameBytes,
} from "./lib.mjs";

const args = parseArgs(process.argv.slice(2), { staged: "bool", help: "bool" });
if (args.help) {
  console.log("usage: node scripts/check.mjs [--staged]");
  process.exit(0);
}

const problems = [];
let manifest;
try { manifest = readManifest(); } catch (e) { console.error(`error: ${MANIFEST} does not parse: ${e.message}`); process.exit(1); }
const names = Object.keys(manifest.skills);

for (const name of names) {
  if (!existsSync(join(SKILLS_DIR, name, "SKILL.md"))) problems.push(`${name}: no skills/${name}/SKILL.md`);
  if (!manifest.skills[name].sources?.length) problems.push(`${name}: no source in manifest.json`);
}
const dirs = (p) => (existsSync(p) ? readdirSync(p, { withFileTypes: true }) : []);
for (const d of dirs(SKILLS_DIR)) if (d.isDirectory() && !manifest.skills[d.name]) problems.push(`skills/${d.name}: not in manifest.json`);
for (const d of dirs(MODS_DIR)) {
  const name = d.name.replace(/\.md$/, "");
  if (!manifest.skills[name]) problems.push(`mods/${d.name}: not a skill in manifest.json`);
}
for (const name of names) {
  for (const f of listFiles(join(SKILLS_DIR, name))) {
    const buf = readBytes(join(SKILLS_DIR, name, f));
    if (!isBinary(buf) && /^(<<<<<<<|>>>>>>>)( |$)/m.test(buf.toString("utf8"))) problems.push(`skills/${name}/${f}: conflict markers`);
  }
}

for (const name of args.staged ? stagedSkills() : names) {
  const entry = manifest.skills[name];
  if (!entry || !existsSync(join(SKILLS_DIR, name))) continue;
  let differs = false;
  try {
    for (const s of entry.sources) {
      const up = fetchFolder(s.repo, s.commit, s.path);
      try { differs ||= !up.folder || !sameFolder(up.folder, join(SKILLS_DIR, name)); } finally { cleanup(up.dir); }
    }
  } catch (e) {
    console.warn(`warning: ${name}: could not reach upstream, note check skipped (${e.message.split("\n")[0]})`);
    continue;
  }
  const hasNote = existsSync(join(MODS_DIR, `${name}.md`));
  if (differs && !hasNote) problems.push(`${name}: differs from upstream but mods/${name}.md is missing`);
  if (!differs && hasNote) problems.push(`${name}: matches upstream, so mods/${name}.md should go`);
}

if (problems.length) {
  console.error(`check failed:\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.log("check passed");

function sameFolder(a, b) {
  const files = new Set([...listFiles(a), ...listFiles(b)]);
  return [...files].every((f) => sameBytes(readBytes(join(a, f)), readBytes(join(b, f))));
}

/** Skills touched by the staged change: their folder, their note, or their manifest entry. */
function stagedSkills() {
  const out = new Set();
  for (const f of git(["diff", "--cached", "--name-only"], { cwd: ROOT }).split("\n").filter(Boolean)) {
    const m = f.match(/^skills\/([^/]+)\//) || f.match(/^mods\/([^/]+)\.md$/);
    if (m) out.add(m[1]);
  }
  let before = { skills: {} };
  try { before = JSON.parse(git(["show", "HEAD:manifest.json"], { cwd: ROOT })); } catch {}
  for (const name of names) {
    if (JSON.stringify(before.skills[name]) !== JSON.stringify(manifest.skills[name])) out.add(name);
  }
  return [...out];
}
