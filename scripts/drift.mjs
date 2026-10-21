// Report where the repo, the installed skills and the lock file have drifted apart. Read-only and offline.
//
//   node scripts/drift.mjs [--brief] [<skill>...]
//
// One line per problem, for every manifest skill or only the named ones:
//   installed copy (~/.claude/skills/<skill>) differs from skills/<skill>, and which side is newer;
//   lock entry whose source is not this folder, or that has no installed folder (any lock entry, with no names);
//   uncommitted or untracked files under skills/ or mods/;
//   local commits ahead of origin/main (the last fetched state; nothing is fetched);
//   commits to skills/<skill> after the last commit to mods/<skill>.md, for a skill with an upstream;
//   shadow copies: C:/F/*/.claude/skills/<skill> or C:/F/*/.claude/agents/<skill>*.md, and ~/.claude/skills/.trash.
// Without --brief, the first line names the lock file read and the exit code is 1 when there are problems.
// --brief prints only problems, names the lock file only on a lock problem, and always exits 0.
import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  AGENTS_SKILLS, CLAUDE_SKILLS, LOCK, ROOT, SKILLS_DIR, die, differingFiles, git, installedIsNewer, parseArgs, readLock,
  readManifest, samePath,
} from "./lib.mjs";

const args = parseArgs(process.argv.slice(2), { brief: "bool", help: "bool" });
if (args.help) {
  console.log("usage: node scripts/drift.mjs [--brief] [<skill>...]");
  process.exit(0);
}

const manifest = readManifest();
for (const name of args._) if (!manifest.skills[name]) die(`${name} is not a skill in manifest.json`);
const names = args._.length ? args._ : Object.keys(manifest.skills).sort();
const problems = [];
let lockProblem = false;
const run = (what, fn) => { try { fn(); } catch (e) { problems.push(`could not check ${what}: ${e.message.split("\n")[0]}`); } };

// Installed copies
run("installed copies", () => {
  for (const name of names) {
    const installed = join(CLAUDE_SKILLS, name);
    if (!existsSync(installed)) { problems.push(`${name}: not installed in ${CLAUDE_SKILLS}`); continue; }
    const diff = differingFiles(installed, join(SKILLS_DIR, name));
    if (!diff.length) continue;
    const side = installedIsNewer(name, diff)
      ? "installed copy is newer: node scripts/pull.mjs"
      : "skills/ is newer: node scripts/install.mjs";
    problems.push(`${name}: installed copy differs from skills/${name} (${diff.join(", ")}); ${side} ${name}`);
  }
});

// Lock file
run("the lock file", () => {
  const lock = readLock().skills ?? {};
  const lockLine = (msg) => { lockProblem = true; problems.push(msg); };
  for (const name of names) {
    const e = lock[name];
    if (!e) lockLine(`${name}: not in the lock file`);
    else if (e.sourceType !== "local" || !samePath(e.source, ROOT)) {
      lockLine(`${name}: lock source is ${e.source}, not ${ROOT}; npx skills update would overwrite it`);
    }
  }
  for (const [name, e] of Object.entries(lock)) {
    if (args._.length && !args._.includes(name)) continue;
    if (!existsSync(join(CLAUDE_SKILLS, name)) && !existsSync(join(AGENTS_SKILLS, name))) {
      lockLine(`${name}: in the lock file (from ${e.source}) but installed in neither ${CLAUDE_SKILLS} nor ${AGENTS_SKILLS}`);
    }
  }
});

// Working tree
run("uncommitted files", () => {
  const paths = args._.length ? args._.flatMap((n) => [`skills/${n}`, `mods/${n}.md`]) : ["skills", "mods"];
  const status = git(["-c", "core.quotepath=false", "status", "--porcelain", "--untracked-files=all", "--", ...paths], { cwd: ROOT });
  // git() trims, so the first line may have lost the space of its " M" code.
  for (const [, code, path] of status.split("\n").filter(Boolean).map((l) => l.trimStart().match(/^(\S+)\s+(.*)$/))) {
    problems.push(`${path}: ${code === "??" ? "untracked" : "uncommitted"}`);
  }
});

run("commits ahead of origin/main", () => {
  let ahead;
  try { ahead = git(["log", "--format=%h %s", "origin/main..HEAD"], { cwd: ROOT }); } catch { return; }
  for (const c of ahead.split("\n").filter(Boolean)) problems.push(`not pushed: ${c}`);
});

// Notes behind their skill
run("notes", () => {
  for (const name of names) {
    if (manifest.skills[name].status === "own") continue;
    const last = (path) => git(["log", "-1", "--format=%H", "--", path], { cwd: ROOT });
    const noted = last(`mods/${name}.md`)
      || git(["log", "--reverse", "--format=%H", "--", `skills/${name}`], { cwd: ROOT }).split("\n")[0];
    if (!noted) continue;
    const after = git(["log", "--format=%h %s", `${noted}..HEAD`, "--", `skills/${name}`], { cwd: ROOT });
    for (const c of after.split("\n").filter(Boolean)) problems.push(`${name}: mods/${name}.md predates ${c}`);
  }
});

// Shadow copies
run("shadow copies", () => {
  const workspace = dirname(ROOT);
  const list = (p) => { try { return readdirSync(p); } catch { return []; } };
  for (const project of list(workspace)) {
    const base = join(workspace, project, ".claude");
    for (const s of list(join(base, "skills"))) if (names.includes(s)) problems.push(`shadow copy: ${join(base, "skills", s)}`);
    for (const a of list(join(base, "agents"))) {
      // <skill>.md, <skill>-worker.md; not prompt.md for pr
      if (a.endsWith(".md") && names.some((n) => a.startsWith(n) && /^[-_.]/.test(a.slice(n.length)))) problems.push(`shadow copy: ${join(base, "agents", a)}`);
    }
  }
  const trash = join(CLAUDE_SKILLS, ".trash");
  if (existsSync(trash)) problems.push(`leftover: ${trash} (${list(trash).length} entries)`);
});

if (!args.brief || lockProblem) console.log(`lock: ${LOCK}`);
for (const p of problems) console.log(p);
process.exit(problems.length && !args.brief ? 1 : 0);
