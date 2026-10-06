// Bring one skill up to its upstream's newest version with a 3-way merge, file by file.
//
//   node scripts/update.mjs <skill> [--check] [--ref <tag|branch|commit|HEAD>]
//
// Three versions take part: OLD (upstream at the pinned commit), NEW (upstream at the target commit)
// and MINE (skills/<skill> as it is now). For each file:
//   OLD == NEW            nothing to do
//   MINE == OLD           take NEW as is                        -> "clean"
//   all three differ      git merge-file; markers on conflict  -> "merged" or "CONFLICT"
//   upstream added a file take it                               -> "added"
//   upstream removed one  remove it if MINE == OLD, else keep   -> "removed" or "CONFLICT"
// --check prints the report and changes nothing. Without it, files and the manifest pin are
// written but nothing is committed. Undo with: git checkout -- skills/<skill> manifest.json
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import {
  SKILLS_DIR, cleanup, die, ensureDir, fetchFolder, isBinary, listFiles, now, parseArgs, readBytes, readManifest,
  resolveTarget, sameBytes, shortSha, writeManifest,
} from "./lib.mjs";

const args = parseArgs(process.argv.slice(2), { check: "bool", ref: "string", help: "bool" });
if (args.help || args._.length !== 1) {
  console.log("usage: node scripts/update.mjs <skill> [--check] [--ref <ref>]");
  process.exit(args.help ? 0 : 1);
}

const [skill] = args._;
const mineDir = join(SKILLS_DIR, skill);
const manifest = readManifest();
const entry = manifest.skills[skill];
if (!entry) die(`${skill} is not in manifest.json`);
if (!existsSync(mineDir)) die(`${mineDir} is missing`);
if (entry.sources.length > 1 && args.ref) die("--ref works with a single source only");

let exitCode = 0;
for (const source of entry.sources) {
  const target = resolveTarget(source.repo, { track: source.track, ref: args.ref });
  console.log(`\n== ${skill} <- ${source.repo}:${source.path}`);
  console.log(`pinned ${source.ref} (${shortSha(source.commit)}), newest ${target.ref} (${shortSha(target.commit)})`);
  if (target.commit === source.commit) {
    console.log("up to date");
    continue;
  }

  const old = fetchFolder(source.repo, source.commit, source.path);
  const neu = fetchFolder(source.repo, target.commit, source.path);
  try {
    if (!old.folder) die(`pinned commit has no ${source.path}; manifest is wrong`);
    if (!neu.folder) {
      console.log(`DETACHED: upstream removed ${source.path} at ${target.ref}. Your copy is kept.`);
      if (!args.check) {
        entry.status = "detached";
        source.detachedAt = now();
        source.detachedAtRef = target.ref;
        writeManifest(manifest);
      }
      continue;
    }

    const report = mergeFolders(old.folder, neu.folder, mineDir, args.check);
    printReport(report);
    if (report.conflicts.length) exitCode = 2;

    if (!args.check) {
      source.ref = target.ref;
      source.commit = target.commit;
      source.track = target.track;
      source.updatedAt = now();
      writeManifest(manifest);
      console.log(`manifest pinned to ${target.ref} (${shortSha(target.commit)}), nothing committed`);
    }
  } finally {
    cleanup(old.dir);
    cleanup(neu.dir);
  }
}
process.exit(exitCode);

function mergeFolders(oldDir, newDir, mineDir, dryRun) {
  const files = new Set([...listFiles(oldDir), ...listFiles(newDir), ...listFiles(mineDir)]);
  const report = { unchanged: [], clean: [], merged: [], added: [], removed: [], mineOnly: [], conflicts: [] };
  for (const f of [...files].sort()) {
    const o = readBytes(join(oldDir, f));
    const n = readBytes(join(newDir, f));
    const m = readBytes(join(mineDir, f));
    const minePath = join(mineDir, f);

    if (sameBytes(o, n)) { report.unchanged.push(f); continue; }            // upstream did not touch it
    if (o !== null && n === null) {                                         // upstream removed it
      if (m === null) { report.unchanged.push(f); continue; }
      if (sameBytes(m, o)) { if (!dryRun) unlinkSync(minePath); report.removed.push(f); }
      else report.conflicts.push({ file: f, kind: "upstream removed a file you changed; kept yours" });
      continue;
    }
    if (o === null && n !== null) {                                         // upstream added it
      if (m === null) { if (!dryRun) write(minePath, n); report.added.push(f); }
      else if (sameBytes(m, n)) report.unchanged.push(f);
      else report.conflicts.push({ file: f, kind: "upstream added a file you also have; kept yours" });
      continue;
    }
    // upstream changed it
    if (m === null) { report.conflicts.push({ file: f, kind: "upstream changed a file you removed; still removed" }); continue; }
    if (sameBytes(m, o)) { if (!dryRun) write(minePath, n); report.clean.push(f); continue; }
    if (sameBytes(m, n)) { report.unchanged.push(f); continue; }
    if (isBinary(o) || isBinary(n) || isBinary(m)) {
      report.conflicts.push({ file: f, kind: "binary file changed on both sides; kept yours" });
      continue;
    }
    const { text, conflicts } = mergeFile(m, o, n, f);
    if (!dryRun) write(minePath, text);
    if (conflicts > 0) report.conflicts.push({ file: f, kind: `${conflicts} conflict hunk(s) marked in the file` });
    else report.merged.push(f);
  }
  return report;
}

function mergeFile(mine, old, neu, label) {
  const dir = mkdtempSync(join(tmpdir(), "fskills-merge-"));
  try {
    const p = (name, buf) => { const q = join(dir, name); writeFileSync(q, buf); return q; };
    const argv = ["merge-file", "-p", "-L", `mine ${label}`, "-L", `upstream old ${label}`, "-L", `upstream new ${label}`,
      p("mine", mine), p("old", old), p("new", neu)];
    try {
      return { text: execFileSync("git", argv, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }), conflicts: 0 };
    } catch (e) {
      if (typeof e.status === "number" && e.status > 0 && e.stdout) return { text: e.stdout, conflicts: e.status };
      throw e;
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function write(path, data) {
  ensureDir(dirname(path));
  writeFileSync(path, data);
}

function printReport(r) {
  const line = (title, list) => { if (list.length) console.log(`${title}:\n  ${list.join("\n  ")}`); };
  line("clean (upstream change taken as is)", r.clean);
  line("merged (both sides changed, no overlap)", r.merged);
  line("added by upstream", r.added);
  line("removed by upstream", r.removed);
  if (r.conflicts.length) {
    console.log("CONFLICTS:");
    for (const c of r.conflicts) console.log(`  ${c.file}: ${c.kind}`);
  } else console.log("conflicts: none");
}
