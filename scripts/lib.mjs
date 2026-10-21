// Shared helpers for the skill scripts. No dependencies beyond Node and git.
import { execFileSync, spawnSync } from "node:child_process";
import {
  cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST = join(ROOT, "manifest.json");
export const SKILLS_DIR = join(ROOT, "skills");
export const MODS_DIR = join(ROOT, "mods");
export const LOCK = join(homedir(), ".agents", ".skill-lock.json");
export const AGENTS_SKILLS = join(homedir(), ".agents", "skills");
export const CLAUDE_SKILLS = join(homedir(), ".claude", "skills");
// Searched in order by fork.mjs when --from is absent.
export const KNOWN_UPSTREAMS = ["mattpocock/skills", "cursor/plugins"];

export function git(args, opts = {}) {
  return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts }).trim();
}

export function die(msg) {
  console.error(`error: ${msg}`);
  process.exit(1);
}

/** spec: { flagName: "bool" | "string" } */
export function parseArgs(argv, spec = {}) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const name = a.slice(2);
      if (!(name in spec)) die(`unknown option --${name}`);
      if (spec[name] === "bool") out[name] = true;
      else {
        out[name] = argv[++i];
        if (out[name] === undefined) die(`--${name} needs a value`);
      }
    } else out._.push(a);
  }
  return out;
}

export function readManifest() {
  if (!existsSync(MANIFEST)) return { version: 1, skills: {} };
  return JSON.parse(readFileSync(MANIFEST, "utf8"));
}

export function writeManifest(m) {
  writeFileSync(MANIFEST, JSON.stringify(m, null, 2) + "\n");
}

export function repoUrl(repo) {
  if (/^https?:\/\//.test(repo)) return repo;
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) die(`repo must be owner/name or a URL: ${repo}`);
  return `https://github.com/${repo}.git`;
}

const SEMVER_TAG = /^v?(\d+)\.(\d+)\.(\d+)$/;

/** Tags, branch heads and HEAD of a remote. Tags are peeled to the commit they point at. */
export function lsRemote(repo) {
  const url = repoUrl(repo);
  const lines = git(["ls-remote", url]).split("\n").filter(Boolean);
  const tags = new Map();
  const heads = new Map();
  let head = null;
  for (const line of lines) {
    const [sha, ref] = line.split("\t");
    if (ref === "HEAD") head = sha;
    else if (ref.startsWith("refs/tags/")) {
      const peeled = ref.endsWith("^{}");
      const name = ref.slice("refs/tags/".length).replace(/\^\{\}$/, "");
      if (peeled || !tags.has(name)) tags.set(name, sha);
    } else if (ref.startsWith("refs/heads/")) heads.set(ref.slice("refs/heads/".length), sha);
  }
  return { url, head, tags, heads };
}

export function latestSemverTag(tags) {
  let best = null;
  for (const [name, sha] of tags) {
    const m = name.match(SEMVER_TAG);
    if (!m) continue;
    const v = m.slice(1, 4).map(Number);
    if (!best || compareVersions(v, best.v) > 0) best = { name, sha, v };
  }
  return best ? { name: best.name, sha: best.sha } : null;
}

function compareVersions(a, b) {
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
}

/**
 * Resolve the commit a source should point at.
 * track "tags": the newest semver tag. track "head": the default branch tip.
 * ref: an explicit tag, branch or commit, which overrides track.
 */
export function resolveTarget(repo, { track, ref } = {}) {
  const remote = lsRemote(repo);
  if (ref) {
    if (/^[0-9a-f]{40}$/.test(ref)) return { ref, commit: ref, track: "head" };
    if (ref === "HEAD") return { ref: "HEAD", commit: remote.head, track: "head" };
    if (remote.tags.has(ref)) return { ref, commit: remote.tags.get(ref), track: "tags" };
    if (remote.heads.has(ref)) return { ref, commit: remote.heads.get(ref), track: "head" };
    die(`ref not found on ${repo}: ${ref}`);
  }
  if (track === "head") return { ref: "HEAD", commit: remote.head, track: "head" };
  const tag = latestSemverTag(remote.tags);
  if (tag) return { ref: tag.name, commit: tag.sha, track: "tags" };
  if (track === "tags") die(`${repo} has no semver tags`);
  return { ref: "HEAD", commit: remote.head, track: "head" };
}

// One fetch per repo@commit per process: cleanup() spares these dirs and the exit handler removes them.
const fetched = new Map();
const sparse = new Map();
process.on("exit", () => { for (const dir of fetched.values()) try { rmSync(dir, { recursive: true, force: true }); } catch {} });

/** Blobless, depth-1 fetch of one commit into a temp dir, once per process. Returns the dir. */
export function fetchCommit(repo, commit) {
  const key = `${repo}@${commit}`;
  if (!fetched.has(key)) fetched.set(key, fetchNew(repo, commit));
  return fetched.get(key);
}

function fetchNew(repo, commit) {
  const dir = mkdtempSync(join(tmpdir(), "fskills-"));
  git(["init", "-q"], { cwd: dir });
  // A global core.autocrlf=true would check files out with CRLF; keep upstream bytes as they are.
  git(["config", "core.autocrlf", "false"], { cwd: dir });
  git(["remote", "add", "origin", repoUrl(repo)], { cwd: dir });
  git(["fetch", "-q", "--depth", "1", "--filter=blob:none", "origin", commit], { cwd: dir });
  return dir;
}

/** All file paths at the fetched commit (needs no blobs). */
export function treeFiles(dir) {
  return git(["ls-tree", "-r", "--name-only", "FETCH_HEAD"], { cwd: dir }).split("\n").filter(Boolean);
}

/** Check out one sub-path of the fetched commit; paths checked out before stay. Returns the absolute path of that folder. */
export function checkoutPath(dir, path) {
  if (!sparse.has(dir)) sparse.set(dir, new Set());
  sparse.get(dir).add(path);
  git(["sparse-checkout", "set", "--no-cone", ...sparse.get(dir)], { cwd: dir });
  git(["checkout", "-q", "FETCH_HEAD"], { cwd: dir });
  return join(dir, ...path.split("/"));
}

/** Fetch one folder of a repo at a commit. folder is null when the path is absent at that commit. */
export function fetchFolder(repo, commit, path) {
  const dir = fetchCommit(repo, commit);
  const files = treeFiles(dir);
  if (!files.some((f) => f.startsWith(path + "/"))) return { dir, folder: null, files };
  return { dir, folder: checkoutPath(dir, path), files };
}

/** Folders in an upstream tree that hold <skill>/SKILL.md. */
export function findSkillPaths(files, skill) {
  return files
    .filter((f) => f.endsWith(`/${skill}/SKILL.md`) || f === `${skill}/SKILL.md`)
    .map((f) => f.slice(0, -"/SKILL.md".length));
}

/** Recursive list of files under dir, as posix-relative paths. */
export function listFiles(dir, base = dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === ".git") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...listFiles(p, base));
    else out.push(relative(base, p).replaceAll("\\", "/"));
  }
  return out.sort();
}

// Never part of a skill: no comparison counts these files.
const IGNORED = /(^|\/)__pycache__\//;

/** The files of a skill folder that count, as posix-relative paths. */
export function skillFiles(dir) {
  return listFiles(dir).filter((f) => !IGNORED.test(f));
}

/** Files that differ between two skill folders, a file missing on one side included. */
export function differingFiles(a, b) {
  const all = [...new Set([...skillFiles(a), ...skillFiles(b)])].sort();
  return all.filter((f) => !sameBytes(readBytes(join(a, f)), readBytes(join(b, f))));
}

/**
 * Whether the installed copy changed after skills/<name> was last committed: some differing installed file is
 * newer than that commit. diff comes from differingFiles(installed, mine).
 */
export function installedIsNewer(name, diff) {
  const installed = join(CLAUDE_SKILLS, name);
  const committed = Number(git(["log", "-1", "--format=%ct", "--", `skills/${name}`], { cwd: ROOT }) || 0) * 1000;
  const edited = Math.max(0, ...diff.map((f) => join(installed, f)).filter(existsSync).map((p) => statSync(p).mtimeMs));
  return edited > committed;
}

/** File contents with CRLF turned into LF, so line endings never count as a change. Binary files pass through. */
export function readBytes(p) {
  if (!existsSync(p)) return null;
  const buf = readFileSync(p);
  if (isBinary(buf)) return buf;
  return Buffer.from(buf.toString("utf8").replaceAll("\r\n", "\n"), "utf8");
}

export function sameBytes(a, b) {
  if (a === null || b === null) return a === b;
  return a.equals(b);
}

export function isBinary(buf) {
  if (!buf) return false;
  const n = Math.min(buf.length, 8000);
  for (let i = 0; i < n; i++) if (buf[i] === 0) return true;
  return false;
}

export function ensureDir(p) {
  mkdirSync(p, { recursive: true });
}

export function copyFolder(from, to) {
  rmSync(to, { recursive: true, force: true });
  cpSync(from, to, { recursive: true });
}

/**
 * Names of other skills a skill folder refers to. known() keeps only real skills: the patterns also match
 * prose such as "`package.json`/build-tool". A path into another skill's folder counts in any text file, the
 * other patterns only in md, txt, yaml and json files.
 */
export function detectDeps(skillDir, self, known = () => true) {
  const names = new Set();
  for (const f of skillFiles(skillDir)) {
    const buf = readBytes(join(skillDir, f));
    if (isBinary(buf)) continue;
    const text = buf.toString("utf8");
    // ~/.claude/skills/<b>/scripts/x.py, skills/<b>/REFERENCE.md
    for (const m of text.matchAll(/skills\/([a-z0-9][a-z0-9-]*)\/(?:scripts|[A-Za-z0-9_-]+\.(?:md|py|mjs))/g)) names.add(m[1]);
    if (!/\.(md|txt|yaml|yml|json)$/i.test(f)) continue;
    for (const line of text.split("\n")) {
      if (!/skill tool/i.test(line)) continue;
      for (const m of line.matchAll(/["`]([a-z0-9][a-z0-9-]*)["`]/g)) names.add(m[1]);
    }
    for (const m of text.matchAll(/(?:^|[\s(`])\/([a-z][a-z0-9-]+)(?=[\s`),.]|$)/gm)) names.add(m[1]);
    for (const m of text.matchAll(/skills\/(?:[a-z0-9-]+\/)?([a-z0-9][a-z0-9-]*)\/SKILL\.md/g)) names.add(m[1]);
  }
  names.delete(self);
  return [...names].filter(known).sort();
}

/**
 * Run the skills CLI from ROOT. Its exit code is no signal: it exits 0 even when a step fails, and on Windows
 * npx can crash on exit (a libuv assertion) after the step succeeded. So callers check the result themselves.
 * On Windows it cannot overwrite a hidden file (EPERM), and the lock file can end up hidden: unhide it first.
 */
export function npxSkills(argv) {
  if (process.platform === "win32" && existsSync(LOCK)) spawnSync("attrib", ["-H", LOCK]);
  console.log(`> npx skills ${argv.join(" ")}`);
  // One command string: shell:true with an args array is deprecated (DEP0190), as the args go unescaped.
  const r = spawnSync(shellCommand(["npx", "-y", "skills@latest", ...argv]), { stdio: "inherit", shell: true, cwd: ROOT });
  if (r.status !== 0) console.log(`warning: npx exited with ${r.status}; checking the result instead`);
}

/** argv as one command line for the platform shell (cmd.exe or sh), each word quoted when it needs it. */
export function shellCommand(argv) {
  return argv.map((a) => {
    if (/^[\w@+=:,./\\-]+$/.test(a)) return a;
    if (process.platform !== "win32") return `'${a.replaceAll("'", "'\\''")}'`;
    if (/["%^&|<>!]/.test(a)) die(`cannot pass ${a} to cmd.exe`);
    return `"${a}"`;
  }).join(" ");
}

export function readLock() {
  return existsSync(LOCK) ? JSON.parse(readFileSync(LOCK, "utf8")) : { skills: {} };
}

export function samePath(a, b) {
  const norm = (p) => resolve(p).toLowerCase();
  return process.platform === "win32" ? norm(a) === norm(b) : resolve(a) === resolve(b);
}

/** Skills installed for Claude Code whose text names <skill>. */
export function installedUsers(skill) {
  if (!existsSync(CLAUDE_SKILLS)) return [];
  return readdirSync(CLAUDE_SKILLS)
    .filter((name) => name !== skill && existsSync(join(CLAUDE_SKILLS, name, "SKILL.md")))
    .filter((name) => detectDeps(join(CLAUDE_SKILLS, name), name).includes(skill))
    .sort();
}

export function shortSha(sha) {
  return sha.slice(0, 7);
}

export function now() {
  return new Date().toISOString();
}

/** Remove a temp dir. A dir from fetchCommit stays until exit, for the next caller of the same commit. */
export function cleanup(dir) {
  if ([...fetched.values()].includes(dir)) return;
  try { rmSync(dir, { recursive: true, force: true }); } catch {}
}
