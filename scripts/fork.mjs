// Copy one upstream skill folder into skills/<name>, verbatim, and record it in the manifest.
//
//   node scripts/fork.mjs <skill> --from <owner/repo> [--path <folder-in-repo>] [--ref <tag|branch|commit|HEAD>] [--no-commit]
//
// Default ref: the newest semver tag, or HEAD when the repo has none.
// Default path: the single folder in the repo that holds <skill>/SKILL.md.
// Prints the other skills this one refers to, one per line after "deps:".
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  ROOT, SKILLS_DIR, cleanup, copyFolder, detectDeps, die, fetchCommit, checkoutPath, findSkillPaths, git, now,
  parseArgs, readManifest, resolveTarget, shortSha, treeFiles, writeManifest,
} from "./lib.mjs";

const args = parseArgs(process.argv.slice(2), { from: "string", path: "string", ref: "string", "no-commit": "bool", help: "bool" });
if (args.help || args._.length !== 1 || !args.from) {
  console.log("usage: node scripts/fork.mjs <skill> --from <owner/repo> [--path <folder>] [--ref <ref>] [--no-commit]");
  process.exit(args.help ? 0 : 1);
}

const [skill] = args._;
const dest = join(SKILLS_DIR, skill);
const manifest = readManifest();
if (manifest.skills[skill]) die(`${skill} is already in manifest.json`);
if (existsSync(dest)) die(`${dest} already exists`);

const target = resolveTarget(args.from, { ref: args.ref });
const dir = fetchCommit(args.from, target.commit);
try {
  const files = treeFiles(dir);
  let path = args.path;
  if (!path) {
    const hits = findSkillPaths(files, skill);
    if (hits.length === 0) die(`no ${skill}/SKILL.md in ${args.from}@${target.ref}`);
    if (hits.length > 1) die(`several folders hold ${skill}/SKILL.md, pass --path:\n  ${hits.join("\n  ")}`);
    path = hits[0];
  } else if (!files.some((f) => f.startsWith(path + "/"))) die(`no folder ${path} in ${args.from}@${target.ref}`);

  copyFolder(checkoutPath(dir, path), dest);

  manifest.skills[skill] = {
    status: "tracked",
    sources: [{ repo: args.from, path, track: target.track, ref: target.ref, commit: target.commit, forkedAt: now(), updatedAt: now() }],
  };
  writeManifest(manifest);

  const message = `fork ${skill} from ${args.from}@${target.ref} (${shortSha(target.commit)})`;
  if (!args["no-commit"]) {
    git(["add", "--", dest, "manifest.json"], { cwd: ROOT });
    git(["commit", "-q", "-m", message], { cwd: ROOT });
  }

  console.log(`forked ${skill} <- ${args.from}:${path}@${target.ref} (${shortSha(target.commit)})`);
  console.log(args["no-commit"] ? "not committed" : `committed: ${message}`);
  const deps = detectDeps(dest, skill);
  console.log("deps:" + (deps.length ? "" : " none"));
  for (const d of deps) console.log(`  ${d}${manifest.skills[d] ? " (already in manifest)" : ""}`);
} finally {
  cleanup(dir);
}
