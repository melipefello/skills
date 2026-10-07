// Copy one upstream skill folder into skills/<name>, verbatim, and record it in the manifest.
//
//   node scripts/fork.mjs <skill> [--from <owner/repo>] [--path <folder-in-repo>] [--ref <tag|branch|commit|HEAD>] [--no-commit]
//   node scripts/fork.mjs <skill> [--from <owner/repo>] --add-source <upstream-skill> [--path <folder>] [--ref <ref>] [--no-commit]
//
// Without --from, searches KNOWN_UPSTREAMS (lib.mjs) at their default refs and uses the one repo that holds the skill.
// Default ref: the newest semver tag, or HEAD when the repo has none.
// Default path: the single folder in the repo that holds <skill>/SKILL.md (or <upstream-skill>/SKILL.md).
// --add-source inlines a dependency: it pins <upstream-skill> as one more source of the already forked <skill>
// and copies nothing. Its text joins the skill during the adapt step; diff and update then track both folders.
// Prints the other skills the copied (or added) folder refers to, one per line after "deps:".
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  KNOWN_UPSTREAMS, ROOT, SKILLS_DIR, cleanup, copyFolder, detectDeps, die, fetchCommit, checkoutPath, findSkillPaths, git, now,
  parseArgs, readManifest, resolveTarget, shortSha, treeFiles, writeManifest, listFiles,
} from "./lib.mjs";

const args = parseArgs(process.argv.slice(2), {
  from: "string", path: "string", ref: "string", "add-source": "string", "no-commit": "bool", help: "bool",
});
if (args.help || args._.length !== 1) {
  console.log("usage: node scripts/fork.mjs <skill> [--from <owner/repo>] [--add-source <upstream-skill>] [--path <folder>] [--ref <ref>] [--no-commit]");
  process.exit(args.help ? 0 : 1);
}

const [skill] = args._;
const adding = args["add-source"];
const lookup = adding ?? skill;
const dest = join(SKILLS_DIR, skill);
const manifest = readManifest();
if (adding) {
  if (!manifest.skills[skill]) die(`${skill} is not in manifest.json; fork it first`);
} else {
  if (manifest.skills[skill]) die(`${skill} is already in manifest.json`);
  if (existsSync(dest)) die(`${dest} already exists`);
}

if (args.ref && !args.from) die("--ref needs --from");
let from = args.from, target, dir;
if (from) {
  target = resolveTarget(from, { ref: args.ref });
  dir = fetchCommit(from, target.commit);
} else ({ from, target, dir } = searchUpstreams(lookup));
try {
  const files = treeFiles(dir);
  let path = args.path;
  if (!path) {
    const hits = findSkillPaths(files, lookup);
    if (hits.length === 0) die(`no ${lookup}/SKILL.md in ${from}@${target.ref}`);
    if (hits.length > 1) die(`several folders hold ${lookup}/SKILL.md, pass --path:\n  ${hits.join("\n  ")}`);
    path = hits[0];
  } else if (!files.some((f) => f.startsWith(path + "/"))) die(`no folder ${path} in ${from}@${target.ref}`);

  const folder = checkoutPath(dir, path);
  const source = { repo: from, path, track: target.track, ref: target.ref, commit: target.commit, forkedAt: now(), updatedAt: now() };
  let message;
  if (adding) {
    const entry = manifest.skills[skill];
    if (entry.sources.some((s) => s.repo === from && s.path === path)) die(`${path} is already a source of ${skill}`);
    entry.sources.push(source);
    message = `add ${from}:${path}@${target.ref} (${shortSha(target.commit)}) as a source of ${skill}`;
  } else {
    copyFolder(folder, dest);
    manifest.skills[skill] = { status: "tracked", sources: [source] };
    message = `fork ${skill} from ${from}@${target.ref} (${shortSha(target.commit)})`;
  }
  writeManifest(manifest);

  if (!args["no-commit"]) {
    git(["add", "--", ...(adding ? [] : [dest]), "manifest.json"], { cwd: ROOT });
    git(["commit", "-q", "-m", message], { cwd: ROOT });
  }

  if (adding) {
    console.log(`added source ${from}:${path}@${target.ref} (${shortSha(target.commit)}) to ${skill}`);
    console.log(`files: ${listFiles(folder).join(", ")}`);
    console.log(`read them: node scripts/peek.mjs ${from} ${path} --ref ${target.ref}`);
  } else console.log(`forked ${skill} <- ${from}:${path}@${target.ref} (${shortSha(target.commit)})`);
  console.log(args["no-commit"] ? "not committed" : `committed: ${message}`);
  const deps = detectDeps(adding ? folder : dest, lookup).filter((d) => d !== skill);
  console.log("deps:" + (deps.length ? "" : " none"));
  for (const d of deps) console.log(`  ${d}${manifest.skills[d] ? " (already in manifest)" : ""}`);
} finally {
  cleanup(dir);
}

function searchUpstreams(name) {
  const found = [];
  for (const repo of KNOWN_UPSTREAMS) {
    const target = resolveTarget(repo);
    const dir = fetchCommit(repo, target.commit);
    if (findSkillPaths(treeFiles(dir), name).length) found.push({ from: repo, target, dir });
    else cleanup(dir);
  }
  if (found.length === 1) return found[0];
  for (const f of found) cleanup(f.dir);
  if (!found.length) die(`no ${name}/SKILL.md in ${KNOWN_UPSTREAMS.join(", ")}; pass --from <owner/repo>`);
  die(`${name} is in several upstreams, pass --from: ${found.map((f) => f.from).join(", ")}`);
}
