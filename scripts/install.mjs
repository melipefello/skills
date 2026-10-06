// Install one skill from this folder into Claude Code, globally, with the skills CLI.
//
//   node scripts/install.mjs <skill> [--replace]
//
// --replace first removes an installed skill of the same name, whatever its origin.
// The CLI reports success even when it failed to write, so afterwards the script checks that the lock file
// records this folder as the source and that the installed copy matches skills/<skill>.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CLAUDE_SKILLS, LOCK, ROOT, SKILLS_DIR, die, installedUsers, listFiles, npxSkills, parseArgs, readBytes, readLock,
  sameBytes, samePath,
} from "./lib.mjs";

const args = parseArgs(process.argv.slice(2), { replace: "bool", help: "bool" });
if (args.help || args._.length !== 1) {
  console.log("usage: node scripts/install.mjs <skill> [--replace]");
  process.exit(args.help ? 0 : 1);
}

const [skill] = args._;
const mine = join(SKILLS_DIR, skill);
if (!existsSync(join(mine, "SKILL.md"))) die(`no skills/${skill}/SKILL.md`);

if (args.replace) npxSkills(["remove", "-g", "-s", skill, "-y"]);
npxSkills(["add", ROOT, "-g", "-a", "claude-code", "-s", skill, "-y"]);

const entry = readLock().skills?.[skill];
if (!entry || entry.sourceType !== "local" || !samePath(entry.source, ROOT)) {
  die(`${LOCK} does not record ${skill} as installed from ${ROOT}, so \`npx skills update\` would overwrite it`);
}
const installed = join(CLAUDE_SKILLS, skill);
const files = [...new Set([...listFiles(installed), ...listFiles(mine)])];
const differ = files.filter((f) => !sameBytes(readBytes(join(installed, f)), readBytes(join(mine, f))));
if (differ.length) die(`${installed} differs from skills/${skill}: ${differ.join(", ")}`);
console.log(`verified: ${installed} matches skills/${skill}, and the lock file points here`);

const users = installedUsers(skill);
if (users.length) {
  console.log(`named by: ${users.join(", ")}`);
  if (/^disable-model-invocation:\s*true/m.test(readFileSync(join(mine, "SKILL.md"), "utf8"))) {
    console.log(`warning: ${skill} is user-invoked, so these skills cannot start it`);
  }
}
