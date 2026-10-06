// Install one skill from this folder into Claude Code, globally, with the skills CLI.
//
//   node scripts/install.mjs <skill> [--replace]
//
// --replace first removes an installed skill of the same name, whatever its origin.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT, SKILLS_DIR, die, parseArgs } from "./lib.mjs";

const args = parseArgs(process.argv.slice(2), { replace: "bool", help: "bool" });
if (args.help || args._.length !== 1) {
  console.log("usage: node scripts/install.mjs <skill> [--replace]");
  process.exit(args.help ? 0 : 1);
}

const [skill] = args._;
if (!existsSync(join(SKILLS_DIR, skill, "SKILL.md"))) die(`no skills/${skill}/SKILL.md`);

const run = (argv) => {
  console.log(`> npx ${argv.join(" ")}`);
  const r = spawnSync("npx", argv, { stdio: "inherit", shell: true, cwd: ROOT });
  if (r.status !== 0) die(`npx exited with ${r.status}`);
};

if (args.replace) run(["-y", "skills@latest", "remove", "-g", "-s", skill, "-y"]);
run(["-y", "skills@latest", "add", ROOT, "-g", "-a", "claude-code", "-s", skill, "-y"]);
