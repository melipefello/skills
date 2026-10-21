// Bring edits made in the installed copies (~/.claude/skills/<skill>) back into skills/<skill>.
//
//   node scripts/pull.mjs [<skill>...] [--prune] [--force]
//
// With no names: every manifest skill whose installed folder differs from skills/<skill>.
// Each installed file that differs is copied into skills/<skill>, with LF line endings. Files only in skills/<skill>
// are listed, and deleted with --prune. Then prints the git diff stat, runs check.mjs (exit 1 when it fails), and
// for a tracked skill names the note to write.
// A skill is skipped when skills/<skill> has uncommitted changes, so a pull only ever replaces committed content.
// It is also skipped when its last commit is newer than every differing installed file: then the repo is ahead and
// install.mjs is the fix. --force pulls it anyway.
import { spawnSync } from "node:child_process";
import { existsSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  CLAUDE_SKILLS, ROOT, SKILLS_DIR, die, ensureDir, git, listFiles, parseArgs, readBytes, readManifest, sameBytes,
} from "./lib.mjs";

const args = parseArgs(process.argv.slice(2), { prune: "bool", force: "bool", help: "bool" });
if (args.help) {
  console.log("usage: node scripts/pull.mjs [<skill>...] [--prune] [--force]");
  process.exit(0);
}

const manifest = readManifest();
for (const name of args._) if (!manifest.skills[name]) die(`${name} is not a skill in manifest.json`);

const files = (dir) => listFiles(dir).filter((f) => !/(^|\/)__pycache__\//.test(f));
const differing = (name) => {
  const installed = join(CLAUDE_SKILLS, name);
  const mine = join(SKILLS_DIR, name);
  const all = [...new Set([...files(installed), ...files(mine)])].sort();
  return all.filter((f) => !sameBytes(readBytes(join(installed, f)), readBytes(join(mine, f))));
};

const names = args._.length
  ? args._
  : Object.keys(manifest.skills).sort().filter((n) => existsSync(join(CLAUDE_SKILLS, n)) && differing(n).length);
if (!names.length) {
  console.log("every installed skill matches skills/");
  process.exit(0);
}

const pulled = [];
for (const name of names) {
  const installed = join(CLAUDE_SKILLS, name);
  if (!existsSync(installed)) {
    console.log(`${name}: not installed in ${CLAUDE_SKILLS}, skipped`);
    continue;
  }
  const mine = join(SKILLS_DIR, name);
  const diff = differing(name);
  if (!diff.length) {
    console.log(`${name}: matches skills/${name}`);
    continue;
  }
  if (git(["status", "--porcelain", "--", `skills/${name}`], { cwd: ROOT })) {
    console.log(`${name}: skills/${name} has uncommitted changes, skipped; commit or stash them, then pull`);
    continue;
  }
  const committed = Number(git(["log", "-1", "--format=%ct", "--", `skills/${name}`], { cwd: ROOT }) || 0) * 1000;
  const edited = Math.max(0, ...diff.map((f) => join(installed, f)).filter(existsSync).map((p) => statSync(p).mtimeMs));
  if (edited <= committed && !args.force) {
    console.log(`${name}: skills/${name} was committed after the installed copy changed, skipped; ` +
      `run node scripts/install.mjs ${name}, or pull with --force`);
    continue;
  }
  for (const f of diff) {
    const from = readBytes(join(installed, f));
    const to = join(mine, f);
    if (from === null) {
      if (args.prune) {
        rmSync(to);
        console.log(`${name}: deleted ${f} (not installed)`);
      } else console.log(`${name}: only in skills/${name}: ${f} (--prune deletes it)`);
      continue;
    }
    ensureDir(dirname(to));
    writeFileSync(to, from);
    console.log(`${name}: copied ${f}`);
  }
  pulled.push(name);
}
if (!pulled.length) process.exit(0);

for (const name of pulled) {
  const stat = git(["diff", "--stat", "--", `skills/${name}`], { cwd: ROOT });
  const untracked = git(["ls-files", "--others", "--exclude-standard", "--", `skills/${name}`], { cwd: ROOT });
  console.log(`\n== skills/${name}`);
  if (stat) console.log(stat);
  if (untracked) console.log(`new files:\n  ${untracked.split("\n").join("\n  ")}`);
}

console.log();
const check = spawnSync(process.execPath, [join(ROOT, "scripts", "check.mjs")], { stdio: "inherit", cwd: ROOT });

for (const name of pulled) {
  if (manifest.skills[name].status === "tracked") {
    console.log(`write the entries for these hunks in mods/${name}.md: node scripts/diff.mjs ${name}`);
  }
}
if (check.status !== 0) process.exit(1);
