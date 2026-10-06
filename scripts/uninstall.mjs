// Remove one skill from Claude Code, globally, with the skills CLI.
//
//   node scripts/uninstall.mjs <skill> [--force]
//
// Refuses while another installed skill names it, unless --force. Use it for a dependency that was inlined
// into a fork, once the fork is installed. Afterwards it checks that the skill left the lock file and both
// skill folders, since the CLI reports success even when it failed to write.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { AGENTS_SKILLS, CLAUDE_SKILLS, LOCK, die, installedUsers, npxSkills, parseArgs, readLock } from "./lib.mjs";

const args = parseArgs(process.argv.slice(2), { force: "bool", help: "bool" });
if (args.help || args._.length !== 1) {
  console.log("usage: node scripts/uninstall.mjs <skill> [--force]");
  process.exit(args.help ? 0 : 1);
}

const [skill] = args._;
const users = installedUsers(skill);
if (users.length && !args.force) die(`still named by: ${users.join(", ")}; pass --force to remove it anyway`);

npxSkills(["remove", "-g", "-s", skill, "-y"]);

const left = [
  readLock().skills?.[skill] ? LOCK : null,
  existsSync(join(CLAUDE_SKILLS, skill)) ? join(CLAUDE_SKILLS, skill) : null,
  existsSync(join(AGENTS_SKILLS, skill)) ? join(AGENTS_SKILLS, skill) : null,
].filter(Boolean);
if (left.length) die(`${skill} is still in: ${left.join(", ")}`);
console.log(`removed ${skill}`);
