// Check that the repo is consistent. The pre-commit hook runs it with --staged.
//
//   node scripts/check.mjs [--staged]
//
// Offline, for every skill: manifest.json parses; each manifest skill has skills/<name>/SKILL.md and a source (own skills have none);
// each folder in skills/ and each note in mods/ belongs to a manifest skill; no conflict markers in skills/;
// every "## " entry in mods/*.md has "- Original:", "- Mine:" and "- Why:" lines; no line in skills/ holds a word from
// the manifest's "forbid" list (case-insensitive, whole words) unless the line also holds the marker forbid-ok.
// With --staged, the skill folders are those in the index and the forbid scan reads the staged files only; without it,
// folders that hold no files are skipped.
// Online, for every skill (only the staged ones with --staged): a note exists exactly when the skill differs
// from its upstream. A network failure skips this part with a warning.
// Enable the hook once per clone: git config core.hooksPath .githooks
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  MANIFEST, MODS_DIR, ROOT, SKILLS_DIR, cleanup, differingFiles, fetchFolder, git, isBinary, listFiles, parseArgs,
  readBytes, readManifest,
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
  if (manifest.skills[name].status !== "own" && !manifest.skills[name].sources?.length) problems.push(`${name}: no source in manifest.json`);
}
const dirs = (p) => (existsSync(p) ? readdirSync(p, { withFileTypes: true }) : []);
// Untracked or empty folders never block a commit: --staged reads the folder list from the index.
const folders = args.staged
  ? [...new Set(lines(git(["-c", "core.quotepath=false", "ls-files", "--", "skills/"], { cwd: ROOT })).map((f) => f.split("/")[1]))]
  : dirs(SKILLS_DIR).filter((d) => d.isDirectory() && listFiles(join(SKILLS_DIR, d.name)).length).map((d) => d.name);
for (const name of folders) if (!manifest.skills[name]) problems.push(`skills/${name}: not in manifest.json`);
for (const d of dirs(MODS_DIR)) {
  const name = d.name.replace(/\.md$/, "");
  if (!manifest.skills[name]) problems.push(`mods/${d.name}: not a skill in manifest.json`);
  else if (d.isFile()) lintNote(d.name);
}
for (const name of names) {
  for (const f of listFiles(join(SKILLS_DIR, name))) {
    const buf = readBytes(join(SKILLS_DIR, name, f));
    if (!isBinary(buf) && /^(<<<<<<<|>>>>>>>)( |$)/m.test(buf.toString("utf8"))) problems.push(`skills/${name}/${f}: conflict markers`);
  }
}
checkForbidden();

for (const name of args.staged ? stagedSkills() : names) {
  const entry = manifest.skills[name];
  if (!entry || !existsSync(join(SKILLS_DIR, name))) continue;
  let differs = false;
  try {
    for (const s of entry.sources) {
      const up = fetchFolder(s.repo, s.commit, s.path);
      try { differs ||= !up.folder || differingFiles(up.folder, join(SKILLS_DIR, name)).length > 0; } finally { cleanup(up.dir); }
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

function lines(s) {
  return s.split("\n").filter(Boolean);
}

/** Each "## " entry of a note names the original, the change and the reason. */
function lintNote(file) {
  const text = readFileSync(join(MODS_DIR, file), "utf8").replaceAll("\r\n", "\n");
  for (const entry of text.split(/^(?=## )/m).filter((e) => e.startsWith("## "))) {
    const title = entry.split("\n")[0].slice(3).trim();
    const missing = ["Original", "Mine", "Why"].filter((k) => !new RegExp(`^- ${k}:`, "m").test(entry));
    if (missing.length) problems.push(`mods/${file}: "${title}" has no ${missing.map((k) => `- ${k}:`).join(", ")} line`);
  }
}

/** Words from manifest.forbid in skills/: in the staged files with --staged, else in every file. */
function checkForbidden() {
  const words = manifest.forbid ?? [];
  if (!words.length) return;
  const escape = (w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const res = words.map((w) => [w, new RegExp(`(?<![\\w])${escape(w)}(?![\\w])`, "i")]);
  const files = args.staged
    ? lines(git(["-c", "core.quotepath=false", "diff", "--cached", "--name-only", "--diff-filter=ACMR", "--", "skills/"], { cwd: ROOT }))
    : listFiles(SKILLS_DIR).map((f) => `skills/${f}`);
  for (const f of files) {
    const buf = args.staged
      ? execFileSync("git", ["show", `:${f}`], { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 })
      : readBytes(join(ROOT, f));
    if (!buf || isBinary(buf)) continue;
    buf.toString("utf8").split("\n").forEach((line, i) => {
      if (line.includes("forbid-ok")) return;
      for (const [w, re] of res) if (re.test(line)) problems.push(`${f}:${i + 1}: forbidden word "${w}"`);
    });
  }
}

/** Skills touched by the staged change: their folder, their note, or their manifest entry. */
function stagedSkills() {
  const out = new Set();
  for (const f of lines(git(["diff", "--cached", "--name-only"], { cwd: ROOT }))) {
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
