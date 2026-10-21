// Show how skills/<skill> differs from the upstream version it is pinned to, then every line the
// uncommitted change removes from it.
//
//   node scripts/diff.mjs <skill> [--stat] [--ref <commit>]
//
// This diff is the raw material of mods/<skill>.md: every hunk is a change you made on purpose,
// or one you should undo. Line endings are normalised first, so they never show up. An own skill has
// no upstream, so only the second part prints.
//
// "Rules removed" lists each line deleted since HEAD (or --ref), except lines whose text still stands
// in the file (a rewrapped paragraph). A rewrite can drop a rule nobody meant to drop: each one listed
// moves somewhere on purpose, or comes back.
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import {
  ROOT, SKILLS_DIR, cleanup, die, ensureDir, fetchFolder, listFiles, parseArgs, readBytes, readManifest, shortSha,
} from "./lib.mjs";

const args = parseArgs(process.argv.slice(2), { stat: "bool", ref: "string", help: "bool" });
if (args.help || args._.length !== 1) {
  console.log("usage: node scripts/diff.mjs <skill> [--stat] [--ref <commit>]");
  process.exit(args.help ? 0 : 1);
}

const [skill] = args._;
const mineDir = join(SKILLS_DIR, skill);
const entry = readManifest().skills[skill];
if (!entry) die(`${skill} is not in manifest.json`);
if (!existsSync(mineDir)) die(`${mineDir} is missing`);

if (entry.status === "own") console.log(`== ${skill} is an own skill: no upstream to diff against`);
else {
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
      else process.stdout.write(r.stdout);
    } finally {
      cleanup(up.dir);
      cleanup(work);
    }
  }
}

printRemoved(args.ref || "HEAD");

function copyNormalised(from, to) {
  for (const f of listFiles(from)) {
    const dest = join(to, f);
    ensureDir(dirname(dest));
    writeFileSync(dest, readBytes(join(from, f)));
  }
}

function printRemoved(ref) {
  const r = spawnSync("git", ["-c", "core.quotepath=false", "diff", "--no-color", "-U0", ref, "--", `skills/${skill}`],
    { cwd: ROOT, encoding: "utf8" });
  if (r.status !== 0) die(`git diff ${ref} failed: ${r.stderr.trim()}`);
  const flat = (s) => s.replace(/\s+/g, " ").trim();
  const current = new Map();
  const removed = [];
  let file = null;
  for (const line of r.stdout.split("\n")) {
    const head = line.match(/^diff --git a\/(.*) b\/(.*)$/);
    if (head) {
      file = head[2];
      if (!current.has(file)) {
        const buf = readBytes(join(ROOT, file));
        current.set(file, buf ? flat(buf.toString("utf8")) : "");
      }
      continue;
    }
    if (line.startsWith("---") || !line.startsWith("-") || !flat(line.slice(1))) continue;
    if (stillStands(flat(line.slice(1)), current.get(file))) continue;
    removed.push(`  ${file}: ${line.slice(1).trim()}`);
  }
  console.log(`\n== Rules removed since ${ref}: say where each one now lives`);
  console.log(removed.length ? removed.join("\n") : "  none");
}

/** A deleted line still stands when each of its phrases of three words or more is still in the file. */
function stillStands(text, file) {
  const phrases = text.split(/[.:;,!?](?:\s+|$)/).map((s) => s.trim()).filter((s) => s.split(" ").length >= 3);
  return (phrases.length ? phrases : [text]).every((p) => file.includes(p));
}
