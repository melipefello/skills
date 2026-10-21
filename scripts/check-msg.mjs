// Check a commit message against what the commit stages. The commit-msg hook runs it.
//
//   node scripts/check-msg.mjs <message-file>
//
// A commit that stages anything under skills/ or mods/ changes one skill, and its subject says which:
//   fork <skill> [from <source>]      adapt <skill>      note <skill>      update <skill> [to <ref>]
//   add <skill> [(own)]               add <source> as a source of <skill>
// <skill> is in the staged manifest.json, and only skills/<skill>/**, mods/<skill>.md and manifest.json are staged.
// A git Revert "<subject>" passes; when <subject> names a skill, the staged paths must still belong to it.
// Merge commits and commits that touch nothing under skills/ or mods/ pass.
import { existsSync, readFileSync } from "node:fs";
import { ROOT, git, parseArgs } from "./lib.mjs";

const args = parseArgs(process.argv.slice(2), { help: "bool" });
if (args.help || args._.length !== 1) {
  console.log("usage: node scripts/check-msg.mjs <message-file>");
  process.exit(args.help ? 0 : 1);
}

const SKILL = "([a-z0-9][a-z0-9-]*)";
const FORMS = [
  new RegExp(`^fork ${SKILL}(?: from .+)?$`),
  new RegExp(`^(?:adapt|note) ${SKILL}$`),
  new RegExp(`^update ${SKILL}(?: to .+)?$`),
  new RegExp(`^add ${SKILL}(?: \\(own\\))?$`),
  new RegExp(`^add .+ as a source of ${SKILL}$`),
];
const skillOf = (subject) => FORMS.map((re) => subject.match(re)).find(Boolean)?.[1] ?? null;

let merging = false;
try { merging = !!git(["rev-parse", "-q", "--verify", "MERGE_HEAD"], { cwd: ROOT }); } catch {}
if (merging) process.exit(0);

const staged = git(["-c", "core.quotepath=false", "diff", "--cached", "--name-only"], { cwd: ROOT }).split("\n").filter(Boolean);
if (!staged.some((f) => /^(skills|mods)\//.test(f))) process.exit(0);

const [file] = args._;
if (!existsSync(file)) fail(`no message file ${file}`);
const subject = readFileSync(file, "utf8").split(/\r?\n/).map((l) => l.trim()).find((l) => l && !l.startsWith("#")) ?? "";

let skill;
const revert = subject.match(/^Revert "(.*)"$/);
if (revert) {
  skill = skillOf(revert[1]);
  if (!skill) process.exit(0);
} else {
  skill = skillOf(subject);
  if (!skill) {
    fail(`this commit stages skills/ or mods/, so its subject names one skill: fork <skill> [from <source>], ` +
      `adapt <skill>, note <skill>, update <skill> [to <ref>], add <skill> [(own)], add <source> as a source of <skill>, ` +
      `or a git Revert "<subject>"; got: ${subject || "(empty)"}`);
  }
  let manifest = { skills: {} };
  try { manifest = JSON.parse(git(["show", ":manifest.json"], { cwd: ROOT })); } catch {}
  if (!manifest.skills?.[skill]) fail(`${skill} is not a skill in the staged manifest.json`);
}

const own = (f) => f === "manifest.json" || f === `mods/${skill}.md` || f.startsWith(`skills/${skill}/`);
const others = staged.filter((f) => !own(f));
if (others.length) fail(`"${subject}" changes ${skill} only, but these are staged too (commit them apart):\n  ${others.join("\n  ")}`);

function fail(msg) {
  console.error(`commit-msg: ${msg}`);
  process.exit(1);
}
