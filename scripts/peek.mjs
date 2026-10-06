// Read an upstream repo without forking anything: list its files, print some of them, or search them.
//
//   node scripts/peek.mjs <owner/repo> [<path>...] [--grep <regex> [--files]] [--ref <tag|branch|commit|HEAD>]
//
// No path and no --grep: list every file. A path prints that file, or every file under that folder.
// --grep: case-insensitive search over the whole repo, one "file:line:text" per hit; --files lists only the
// matching files, a cheap first pass. Default ref: the newest semver tag, or HEAD when the repo has none.
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { cleanup, die, fetchCommit, git, parseArgs, readBytes, resolveTarget, shortSha, treeFiles } from "./lib.mjs";

const args = parseArgs(process.argv.slice(2), { grep: "string", files: "bool", ref: "string", help: "bool" });
if (args.help || args._.length < 1) {
  console.log("usage: node scripts/peek.mjs <owner/repo> [<path>...] [--grep <regex> [--files]] [--ref <ref>]");
  process.exit(args.help ? 0 : 1);
}

const [repo, ...paths] = args._;
const target = resolveTarget(repo, { ref: args.ref });
const dir = fetchCommit(repo, target.commit);
try {
  git(["checkout", "-q", "FETCH_HEAD"], { cwd: dir });
  const files = treeFiles(dir);
  console.log(`== ${repo}@${target.ref} (${shortSha(target.commit)})`);
  if (!paths.length && !args.grep) console.log(files.join("\n"));

  for (const p of paths) {
    const prefix = p.replace(/\/$/, "") + "/";
    const hits = files.filter((f) => f === p || f.startsWith(prefix));
    if (!hits.length) die(`no ${p} at ${target.ref}`);
    for (const f of hits) {
      console.log(`\n=== ${f}`);
      process.stdout.write(readBytes(join(dir, f)).toString("utf8"));
    }
  }

  if (args.grep) {
    const r = spawnSync("git", ["-c", "core.quotepath=false", "grep", "-I", "-i", "-E", args.files ? "-l" : "-n", args.grep],
      { cwd: dir, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
    if (r.status > 1) die(r.stderr.trim());
    for (const line of r.stdout.split("\n").filter(Boolean)) console.log(line.length > 240 ? line.slice(0, 240) + "…" : line);
  }
} finally {
  cleanup(dir);
}
