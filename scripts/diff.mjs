// Show how skills/<skill> differs from the upstream version it is pinned to.
//
//   node scripts/diff.mjs <skill> [--stat]
//
// This diff is the raw material of mods/<skill>.md: every hunk is a change you made on purpose,
// or one you should undo. Line endings are normalised first, so they never show up.
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { SKILLS_DIR, cleanup, die, ensureDir, fetchFolder, listFiles, parseArgs, readBytes, readManifest, shortSha } from "./lib.mjs";

const args = parseArgs(process.argv.slice(2), { stat: "bool", help: "bool" });
if (args.help || args._.length !== 1) {
  console.log("usage: node scripts/diff.mjs <skill> [--stat]");
  process.exit(args.help ? 0 : 1);
}

const [skill] = args._;
const mineDir = join(SKILLS_DIR, skill);
const entry = readManifest().skills[skill];
if (!entry) die(`${skill} is not in manifest.json`);
if (!existsSync(mineDir)) die(`${mineDir} is missing`);

let any = false;
for (const source of entry.sources) {
  const up = fetchFolder(source.repo, source.commit, source.path);
  const work = mkdtempSync(join(tmpdir(), "fskills-diff-"));
  try {
    if (!up.folder) die(`pinned commit has no ${source.path}; manifest is wrong`);
    copyNormalised(up.folder, join(work, "upstream"));
    copyNormalised(mineDir, join(work, "mine"));
    console.log(`== ${skill} vs ${source.repo}:${source.path}@${source.ref} (${shortSha(source.commit)})`);
    const r = spawnSync("git", ["-c", "core.quotepath=false", "diff", "--no-index", "--no-color",
      ...(args.stat ? ["--stat"] : []), "upstream", "mine"], { cwd: work, encoding: "utf8" });
    if (r.status === 0) console.log("identical");
    else { any = true; process.stdout.write(r.stdout); }
  } finally {
    cleanup(up.dir);
    cleanup(work);
  }
}
process.exit(any ? 1 : 0);

function copyNormalised(from, to) {
  for (const f of listFiles(from)) {
    const dest = join(to, f);
    ensureDir(dirname(dest));
    writeFileSync(dest, readBytes(join(from, f)));
  }
}
